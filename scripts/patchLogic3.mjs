import fs from 'fs';

let appStr = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add State
appStr = appStr.replace(
  "const [storyStep, setStoryStep] = useState<'START' | 'OAK_STOPPED' | 'IN_LAB' | 'PICKED_STARTER' | 'RIVAL_BATTLE' | 'EXPLORING'>('START');",
  "const [storyStep, setStoryStep] = useState<'START' | 'OAK_STOPPED' | 'IN_LAB' | 'PICKED_STARTER' | 'RIVAL_BATTLE' | 'EXPLORING'>('START');\n  const [lastHealLocation, setLastHealLocation] = useState<{map: string, pos: Position}>({ map: 'PALLET_TOWN', pos: { x: 7, y: 11 } });"
);

// 2. Load State
appStr = appStr.replace(
  "setStoryStep(data.storyStep);",
  "setStoryStep(data.storyStep);\n        if (data.lastHealLocation) setLastHealLocation(data.lastHealLocation);"
);

// 3. Save State
appStr = appStr.replace(
  "hasParcel,\n        storyStep",
  "hasParcel,\n        storyStep,\n        lastHealLocation"
);

appStr = appStr.replace(
  "hasParcel, storyStep]);",
  "hasParcel, storyStep, lastHealLocation]);"
);

// 4. Update on Heal
appStr = appStr.replace(
  "setPlayerTeam(prev => prev.map(p => ({ ...p, hp: p.maxHp, status: 'none' })));",
  "setPlayerTeam(prev => prev.map(p => ({ ...p, hp: p.maxHp, status: 'none' })));\n          setLastHealLocation({ map: currentMap, pos: playerPos });"
);

// 5. Use when Fainting
appStr = appStr.replace(
  "setPlayerPos({ x: 10, y: 10 });\n                setCurrentMap('PALLET_TOWN');",
  "setPlayerPos(lastHealLocation.pos);\n                setCurrentMap(lastHealLocation.map);"
);

// Also we should ensure my gameState logic didn't break.
fs.writeFileSync('src/App.tsx', appStr);
console.log("App.tsx patched successfully for Pokemon Death White Out!");
