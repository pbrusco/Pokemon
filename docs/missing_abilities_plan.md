# Plan de Habilidades Faltantes (Missing Abilities)

Estado actual y plan de implementación para HMs y habilidades de campo.

---

## Resumen

| HM / Habilidad | Item | Objeto en mapa | Movimiento | Medalla | Lógica | Movimiento | Pipeline | **Overall** |
|---|---|---|---|---|---|---|---|---|
| **Cut** | SI | SI (Ruta 25) | SI (CORTAR) | SI (CASCADA) | SI | N/A | NO | **PARCIAL** |
| **Surf** | SI | SI (Vermilion) | SI (SURF) | SI (ALMA) | SOLO-DIÁLOGO | **NO** | NO | **STUB** |
| **Strength** | SI | **NO** | SI (FUERZA) | SI (ARCOIRIS) | SI | N/A | NO | **PARCIAL** |
| **Flash** | NO | NO | SI (DESTELLO) | NO | NO | NO | NO | **NO IMPL** |
| **Fly** | NO | NO | NO | NO | NO | NO | NO | **NO IMPL** |
| **Ledge Jump** | N/A | N/A | N/A | N/A | N/A | SI | **NO** | **PARCIAL** |
| **Rock Smash** | NO | NO | NO | NO | NO | NO | NO | **NO IMPL** |
| **Waterfall** | NO | NO | SI (CASCADA) | NO | NO | NO | NO | **NO IMPL** |

---

## Bloqueadores transversales (Cross-cutting blockers)

### 1. HM Teaching flow
No existe UI ni lógica para enseñar un HM a un Pokémon desde el inventario. El `description` del ítem dice "Enseña X a un POKÉMON" pero no hace nada al usarlo. Los movimientos HM solo pueden asignarse manualmente vía `makePokemon()` o el debug API.

### 2. FireRed metatile bridge es grueso
`bridge.ts` y `multiZoneBridge.ts` convierten todo a `'wall'` o `'path'/'floor'`. Ninguno de los ~240 metatile behaviors de FireRed está mapeado a los tipos ricos de `Tile` (`cut_tree`, `boulder`, `water`, `ledge_*`, `grass`, `sign`). TODO.md línea 25 lo menciona explícitamente.

### 3. No hay persistencia de mutaciones HM
Cuando Cut limpia un árbol o Strength mueve una roca, la mutación modifica el array `worldMaps.tiles` en memoria. No se persiste en el save — los obstáculos reaparecerían al recargar.

### 4. No hay estado de habilidades en gameStore
No existen variables como `isSurfing`, `surfPokemon`, `strengthActive`, `flashUsed`, `flyDestinations` en el estado persistido.

### 5. No hay fases dedicadas para habilidades de campo
El `GamePhase` FSM no tiene fases SURF, CUT, STRENGTH, o FLY. Todas las habilidades se ejecutan como side effects durante EXPLORING.

---

## Plan paso a paso

### Fase 1 — Pipeline: Bridge fino de metatile behaviors

**Objetivo:** Que _todos_ los mapas del pipeline FireRed tengan tipos de tile ricos (`water`, `grass`, `cut_tree`, `boulder`, `ledge_*`, `sign`), no solo `path`/`wall`.

**Tareas:**
1. Definir mappings completos de `metatile_behavior` → `Tile.type` en una tabla (ver abajo).
2. Modificar `multiZoneBridge.ts` (Kanto overworld) y `bridge.ts` (interiores) para consumir el `behavior` grid del stitcher y asignar tipos ricos.
3. Agregar tests de pipeline que validen que ciertas zonas tienen los tipos esperados (ej: Pallet Town tiene `water` en la costa, `grass` en la ruta, Route 22 tiene `ledge_down`).

**Mapping behavior → Tile.type:**

| Behavior(s) | Tile.type | walkable |
|---|---|---|
| `MB_NORMAL (0x00)`, otros no listados | `path` (outdoor) / `floor` (indoor) | true |
| `MB_TALL_GRASS (0x02)` | `grass` | true |
| `MB_POND_WATER (0x10)`, `MB_FAST_WATER (0x11)`, `MB_DEEP_WATER (0x12)`, `MB_WATERFALL (0x13)`, `MB_OCEAN_WATER (0x15)`, `MB_PUDDLE (0x16)`, `MB_SHALLOW_WATER (0x17)`, `MB_UNUSED_WATER (0x1A)`, `MB_CYCLING_ROAD_WATER (0x1B)` | `water` | false |
| `MB_JUMP_EAST`, `MB_JUMP_WEST`, `MB_JUMP_NORTH`, `MB_JUMP_SOUTH` | `ledge_left`, `ledge_right`, `ledge_up`, `ledge_down` | true* |
| `MB_STRENGTH_BUTTON (0x20)` | `boulder` | false |
| Cualquier behavior con collision≠0 **y** sin tipo especial | `wall` | false |

> \* Ledge tiles son `walkable: true` porque el movement engine maneja el salto direccional.

**Nota sobre `cut_tree` y `sign`:** Estos no tienen behaviors dedicados en FireRed — son objetos script-driven (`object_event` con script `EventScript_CutTree`). Deben resolverse desde los `object_events` del map.json de FireRed, no desde metatile behaviors. Esto requiere que el stitcher/pipeline cruce los object_events con sus coordenadas para inyectar el tipo correcto en esas celdas.

---

### Fase 2 — HM Teaching flow

**Objetivo:** Poder enseñar un HM a un Pokémon desde el inventario.

**Tareas:**
1. En `useInteractionEngine.ts` (o un hook nuevo), manejar el "uso" de ítems key_item tipo HM:
   - Mostrar diálogo "¿Enseñar [MOVIMIENTO] a un POKÉMON?"
   - Listar Pokémon del equipo que pueden aprender el movimiento (excluir los que ya lo tienen, reemplazar cuarto movimiento si hay 4)
   - Al seleccionar, asignar el movimiento. Si ya tiene 4, preguntar cuál olvidar (diálogo de confirmación Sí/No).
2. Persistir: los movimientos ya son parte de `playerTeam` en el store, así que se guardan automáticamente.
3. Tests unitarios para enseñar HM a Pokémon con 1/2/3/4 movimientos.

---

### Fase 3 — Surf

**Objetivo:** Navegar sobre agua con SURF.

**Tareas:**
1. **Estado en gameStore:** Agregar `isSurfing: boolean`, `surfPokemonId: string | null`.
2. **Interacción (A sobre agua):**
   - Si no hay medalla ALMA → diálogo actual.
   - Si hay medalla pero ningún Pokémon con SURF → "Ningún POKÉMON sabe SURF."
   - Si hay Pokémon con SURF → confirmación Sí/No "¿Usar SURF?".
   - Al aceptar → set `isSurfing = true`, guardar `surfPokemonId`.
3. **Movement engine:** Cuando `isSurfing === true`, tratar tiles `type: 'water'` como `walkable: true` (sobrescribir en el check de walkability). Al salir del agua (pisar tile no-water), resetear `isSurfing = false`. También bloquear entrada a interiores mientras se surfea (no se puede entrar a edificios desde el agua).
4. **Renderer:** Cambiar sprite del jugador a un sprite de surf (silueta sobre agua, o usar el mismo sprite con un efecto). La música cambia a `'surf'` (`45 Surf.ogg`).
5. **Encounters:** Usar tablas de encuentros acuáticos (`water_mons` en lugar de `land_mons`) cuando `isSurfing === true`. Ya existen en `src/data/firered/wildEncounters.generated.ts`.
6. **Edge cases:**
   - No se puede surfear sin un Pokémon en el equipo (aunque tenga SURF en la PC).
   - Al surfear y el Pokémon que conoce SURF se desmaya, ¿se cancela surf? (En los juegos originales no — surf persiste aunque el Pokémon se debilite. Implementar igual).
   - Warps/transiciones: al entrar a un interior, `isSurfing` debe resetearse.

---

### Fase 4 — Persistencia de mutaciones de mapa

**Objetivo:** Que los árboles cortados y rocas movidas no reaparezcan al recargar.

**Tareas:**
1. Agregar `modifiedTiles: Record<string, Tile>` al `GameSaveState` (key = `"mapId:x:y"`).
2. Al mutar un tile (Cut tree, Strength boulder, o cualquier HM futura), guardar la mutación en `modifiedTiles`.
3. Al cargar el mapa en `mapData`, hacer merge: para cada celda en `modifiedTiles` que corresponda al mapa actual, sobrescribir el tile del pipeline con el modificado.
4. En `gameStore.resetGame()`, limpiar `modifiedTiles`.

---

### Fase 5 — Flash

**Objetivo:** Oscurecer cuevas hasta usar DESTELLO.

**Tareas:**
1. **Ítem:** Crear `HM05_FLASH` en `ITEMS_DATABASE`, `HM_MOVE_MAP`, `HM_REQUIREMENTS.flash = { badge: 'BOULDER', move: 'DESTELLO' }`.
2. **Tile type:** Agregar `'dark'` al union de `Tile.type` (o reusar `'cave'`). El bridge de interiores asigna `'cave'` a mapas tipo caverna.
3. **Renderer:** Si el mapa es tipo cueva y `flashActive !== true`, aplicar un overlay oscuro (canvas con `globalAlpha` bajo, o un div negro semi-transparente) que cubra todo menos un radio de ~3 tiles alrededor del jugador.
4. **Interacción:** Usar DESTELLO desde el menú de Pokémon (campo) → toggle `flashActive`. Diálogo: "¡DESTELLO iluminó la cueva!".
5. **Persistencia:** `flashActive` en el store, persiste en el save.
6. **Mapas afectados:** Rock Tunnel (`ROCK_TUNNEL_1F`), Mt. Moon (`MT_MOON_1F`, `MT_MOON_B1F`, `MT_MOON_B2F`), Victory Road (`VICTORY_ROAD_*F`), Cerulean Cave, Seafoam Islands.

---

### Fase 6 — Fly

**Objetivo:** Volar entre ciudades visitadas.

**Tareas:**
1. **Ítem:** Crear `HM02_FLY` en `ITEMS_DATABASE`, `HM_MOVE_MAP['HM02_FLY'] = 'VUELO'`. Agregar `VUELO` a `MOVES`. `HM_REQUIREMENTS.fly = { badge: 'THUNDER', move: 'VUELO' }`.
2. **Colocación:** El HM02_FLY se obtiene en la Ruta 16 (después de cortar el árbol, en la casa de la chica que lo da). Agregar a `npcDatabase.ts`.
3. **Interacción:** Desde el menú de equipo Pokémon, opción "VUELO" si un Pokémon lo conoce. Abre un submenú con ciudades visitadas (las que tienen Pokémon Center). Al seleccionar, transición de vuelo (animación o fade) y teletransporte al Centro Pokémon de esa ciudad.
4. **Estado:** `visitedTowns: string[]` en el store. Se agrega una ciudad al entrar a su Pokémon Center por primera vez.
5. **Diálogo:** "¿A dónde quieres volar?" → lista de ciudades.

---

### Fase 7 — Strength (colocación del ítem)

**Objetivo:** Poner HM04_STRENGTH en el mundo y completar la mecánica.

**Tareas:**
1. Colocar `HM04_STRENGTH` como ground item en su ubicación canónica (Ruta 15, o donde corresponda en FireRed — en FRLG se obtiene del Warden en la Ruta 15 después de devolverle su dentadura).
2. Conectar con la lógica de interacción ya existente para `boulder` (Fase 1 ya habrá hecho que los boulders del pipeline tengan `type: 'boulder'` en lugar de `'wall'`).

---

### Fase 8 — Waterfall (post-game, baja prioridad)

**Objetivo:** Subir cascadas con CASCADA.

**Tareas:**
1. **Ítem:** `HM07_WATERFALL`, `HM_MOVE_MAP`, `HM_REQUIREMENTS.waterfall`.
2. **Tile type:** `'waterfall'` en la unión de `Tile.type`. El bridge asigna tiles con `MB_WATERFALL` a este tipo.
3. **Movement:** Al interactuar con un tile `waterfall` desde abajo, si el Pokémon líder conoce CASCADA, el jugador "sube" la cascada (animación + movimiento hacia arriba).
4. Solo relevante para Sevii Islands (post-game).

---

## Orden de prioridad

1. **Fase 1 — Pipeline bridge fino** (desbloquea todo lo demás para el overworld FireRed)
2. **Fase 2 — HM Teaching flow** (necesario para usar cualquier HM)
3. **Fase 3 — Surf** (la mecánica de campo más icónica)
4. **Fase 4 — Persistencia de mutaciones** (evita regresiones)
5. **Fase 5 — Flash** (habilidad simple, mejora la experiencia en cuevas)
6. **Fase 6 — Fly** (QoL importante para late-game)
7. **Fase 7 — Strength completion** (colocación del ítem)
8. **Fase 8 — Waterfall** (post-game, baja prioridad)

---

## Notas adicionales

- **Ledge jumping** ya funciona en el movement engine pero solo en mapas hand-authored con tipo `ledge_*`. La Fase 1 lo arregla para todos los mapas del pipeline.
- **Rock Smash** se omite deliberadamente — es mecánica de Sevii Islands post-game y no es necesaria para la experiencia Kanto principal.
- **Badge gates** ya están implementadas correctamente con NPCs de guardia. No requieren cambios.
- Las **mochilas y bolsas** (ítems clave vs objetos normales) están implementadas. Los HM son `key_item`.
