import fs from 'fs';

// 1. Patch BattleScreen.tsx
let battleScreen = fs.readFileSync('src/components/BattleScreen.tsx', 'utf8');

// The line <div className="grid grid-cols-2 gap-4">
battleScreen = battleScreen.replace(
  '<div className="grid grid-cols-2 gap-4">',
  '<div className={`grid grid-cols-2 gap-4 ${playerAnim !== \'idle\' || enemyAnim !== \'idle\' || projectile ? \'pointer-events-none opacity-50\' : \'\'}`}>'
);

fs.writeFileSync('src/components/BattleScreen.tsx', battleScreen);
console.log("BattleScreen patched successfully");

// 2. Patch App.tsx
let appStr = fs.readFileSync('src/App.tsx', 'utf8');

// Insert isLocked ref
appStr = appStr.replace('const moveTimeout = useRef<NodeJS.Timeout | null>(null);', 
  'const moveTimeout = useRef<NodeJS.Timeout | null>(null);\n  const isLocked = useRef(false);');

// Add isLocked to gameState
appStr = appStr.replace(
  'isMoving, dialogue, isBattle, direction, playerPos,',
  'isMoving, dialogue, isBattle, isLocked: isLocked.current, direction, playerPos,'
);

// handleMove lock check
appStr = appStr.replace(
  'if (isMoving || dialogue || isBattle) return;',
  'if (isMoving || dialogue || isBattle || isLocked) return;'
);

// handleAction lock check
appStr = appStr.replace(
  'const { playerPos, direction, currentMap, npcs, items } = gameState.current;',
  'const { playerPos, direction, currentMap, npcs, items, isLocked } = gameState.current;\n    if (isLocked) return;'
);

// Oak interaction fix
// There are two setTimeouts in App.tsx that need isLocked.current = true;
appStr = appStr.replace(
  'setStoryStep(\'OAK_STOPPED\');\n      setTimeout(() => {',
  'setStoryStep(\'OAK_STOPPED\');\n      isLocked.current = true;\n      setTimeout(() => {\n        isLocked.current = false;'
);

// Trainer interaction fix
appStr = appStr.replace(
  'setDialogue(npc.dialogue || "¡Vamos a luchar!");\n      setTimeout(() => {\n        setDialogue(null);',
  'setDialogue(npc.dialogue || "¡Vamos a luchar!");\n      isLocked.current = true;\n      setTimeout(() => {\n        isLocked.current = false;\n        setDialogue(null);'
);

// handleKeyDown interaction fix (don't clear dialogue if locked)
appStr = appStr.replace(
  '      if (dialogue) {\n        if (e.key === \'Enter\' || e.key === \' \' || e.key === \'z\') setDialogue(null);\n        return;\n      }',
  '      if (dialogue) {\n        if (!isLocked.current && (e.key === \'Enter\' || e.key === \' \' || e.key === \'z\')) setDialogue(null);\n        return;\n      }'
);

// Fix Player Sprite Direction
// Search for: backgroundPositionY: direction === 'down' ? '0%' : direction === 'up' ? '33.333%' : direction === 'left' ? '66.666%' : '100%',
appStr = appStr.replace(
  /backgroundPositionY: direction === 'down' \? '0%' : direction === 'up' \? '33\.333%' : direction === 'left' \? '66\.666%' : '100%',/g,
  `backgroundPositionY: direction === 'down' ? '0%' : direction === 'up' ? '33.333%' : '66.666%',\n            transform: direction === 'right' ? 'scaleX(-1)' : 'none',`
);

fs.writeFileSync('src/App.tsx', appStr);
console.log("App.tsx patched successfully");
