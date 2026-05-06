import { type InventoryItem } from '../types';

export const HM_REQUIREMENTS = {
  cut:       { badge: 'CASCADE',  move: 'CORTAR' },
  fly:       { badge: 'THUNDER',  move: 'VUELO' },
  surf:      { badge: 'SOUL',     move: 'SURF' },
  strength:  { badge: 'RAINBOW',  move: 'FUERZA' },
  flash:     { badge: 'BOULDER',  move: 'DESTELLO' },
} as const;
export const HM_MOVE_MAP: Record<string, string> = {
  HM01_CUT:      'CORTAR',
  HM02_FLY:      'VUELO',
  HM03_SURF:     'SURF',
  HM04_STRENGTH: 'FUERZA',
  HM05_FLASH:    'DESTELLO',
};
export const ITEMS_DATABASE: Record<string, InventoryItem> = {
  OAK_PARCEL:    { id: 'OAK_PARCEL',    name: 'PAQUETE OAK',   description: 'Un paquete para el Prof. Oak.',        icon: '📦', type: 'key_item' },
  TOWN_MAP:      { id: 'TOWN_MAP',      name: 'MAPA CIUDAD',   description: 'Mapa de la región Kanto.',              icon: '🗺️', type: 'key_item' },
  HM01_CUT:      { id: 'HM01_CUT',      name: 'MO01 CORTAR',   description: 'Enseña CORTAR a un POKÉMON.',           icon: '✂️', type: 'key_item' },
  HM04_STRENGTH: { id: 'HM04_STRENGTH', name: 'MO04 FUERZA',   description: 'Enseña FUERZA a un POKÉMON.',           icon: '💪', type: 'key_item' },
  SILPH_SCOPE:   { id: 'SILPH_SCOPE',   name: 'ALCANCE SILPH', description: 'Revela a los POKÉMON fantasma.',        icon: '🔭', type: 'key_item' },
  POKE_FLUTE:    { id: 'POKE_FLUTE',    name: 'FLAUTA POKé',   description: 'Despierta a los POKÉMON dormidos.',     icon: '🎵', type: 'key_item' },
   SS_TICKET:     { id: 'SS_TICKET',     name: 'BILLETE SS',    description: 'Billete de embarque para el SS ANNE.',  icon: '🎫', type: 'key_item' },
   HM03_SURF:     { id: 'HM03_SURF',     name: 'MO03 SURF',     description: 'Enseña SURF a un POKÉMON.',              icon: '🌊', type: 'key_item' },
   HM02_FLY:      { id: 'HM02_FLY',      name: 'MO02 VUELO',    description: 'Enseña VUELO a un POKÉMON.',              icon: '🕊️', type: 'key_item' },
   HM05_FLASH:    { id: 'HM05_FLASH',    name: 'MO05 DESTELLO', description: 'Enseña DESTELLO a un POKÉMON.',           icon: '💡', type: 'key_item' },
   FRESH_WATER:   { id: 'FRESH_WATER',   name: 'AGUA FRESCA',  description: 'Agua mineral muy refrescante.',           icon: '🥤', type: 'key_item' },
   POKEBALL: { id: 'POKEBALL', name: 'POKÉ BALL', description: 'Sirve para atrapar Pokémon salvajes.', icon: '🔴', type: 'pokeball' },
  
  // Healing Items
  POTION: { id: 'POTION', name: 'POCIÓN', description: 'Restaura 20 PS.', icon: '🧪', type: 'potion', effect: { healHp: 20 } },
  SUPER_POTION: { id: 'SUPER_POTION', name: 'SÚPER POCIÓN', description: 'Restaura 50 PS.', icon: '🧪', type: 'potion', effect: { healHp: 50 } },
  HYPER_POTION: { id: 'HYPER_POTION', name: 'HIPER POCIÓN', description: 'Restaura 200 PS.', icon: '🧪', type: 'potion', effect: { healHp: 200 } },
  MAX_POTION: { id: 'MAX_POTION', name: 'POCIÓN MÁXIMA', description: 'Restaura todos los PS.', icon: '🧪', type: 'potion', effect: { healHp: 9999 } },
  FULL_RESTORE: { id: 'FULL_RESTORE', name: 'RESTAURAR TODO', description: 'Restaura todos los PS y cura estados.', icon: '✨', type: 'potion', effect: { healHp: 9999, cureStatus: 'all' } },
  
  // Status Healing Items
  ANTIDOTE: { id: 'ANTIDOTE', name: 'ANTÍDOTO', description: 'Cura el envenenamiento.', icon: '💊', type: 'status_heal', effect: { cureStatus: 'poison' } },
  AWAKENING: { id: 'AWAKENING', name: 'DESPERTAR', description: 'Despierta a un Pokémon dormido.', icon: '☕', type: 'status_heal', effect: { cureStatus: 'sleep' } },
  BURN_HEAL: { id: 'BURN_HEAL', name: 'ANTIQUEMAR', description: 'Cura las quemaduras.', icon: '🩹', type: 'status_heal', effect: { cureStatus: 'burn' } },
  ICE_HEAL: { id: 'ICE_HEAL', name: 'ANTIHIELO', description: 'Descongela a un Pokémon.', icon: '🔥', type: 'status_heal', effect: { cureStatus: 'frozen' } },
  PARALYZE_HEAL: { id: 'PARALYZE_HEAL', name: 'ANTIPARALIZADOR', description: 'Cura la parálisis.', icon: '⚡', type: 'status_heal', effect: { cureStatus: 'paralyzed' } },
  FULL_HEAL: { id: 'FULL_HEAL', name: 'CURA TOTAL', description: 'Cura cualquier problema de estado.', icon: '🌟', type: 'status_heal', effect: { cureStatus: 'all' } },
  
  // Revives
  REVIVE: { id: 'REVIVE', name: 'REVIVIR', description: 'Revive a un Pokémon con la mitad de PS.', icon: '💎', type: 'revive', effect: { revive: true, reviveHpPercent: 50 } },
  MAX_REVIVE: { id: 'MAX_REVIVE', name: 'MAX REVIVIR', description: 'Revive a un Pokémon con todos sus PS.', icon: '💎', type: 'revive', effect: { revive: true, reviveHpPercent: 100 } },
};
export const SHOP_PRICES: Record<string, number> = { 
  POTION: 200, 
  POKEBALL: 200,
  ANTIDOTE: 100,
  PARALYZE_HEAL: 200,
  BURN_HEAL: 250
};
