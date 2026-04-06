import fs from 'fs';

let appStr = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Fix Pokecenter y: 16 -> y: 15
appStr = appStr.replace(
  "{ id: 'to_viridian', type: 'teleport', position: { x: 10, y: 16 }, direction: 'down', targetMap: 'VIRIDIAN_CITY', targetPos: { x: 7, y: 9 } }",
  "{ id: 'to_viridian', type: 'teleport', position: { x: 10, y: 15 }, direction: 'down', targetMap: 'VIRIDIAN_CITY', targetPos: { x: 7, y: 9 } }"
);

// 2. Fix Pokemart y: 16 -> y: 15
appStr = appStr.replace(
  "{ id: 'to_viridian', type: 'teleport', position: { x: 10, y: 16 }, direction: 'down', targetMap: 'VIRIDIAN_CITY', targetPos: { x: 14, y: 9 } }",
  "{ id: 'to_viridian', type: 'teleport', position: { x: 10, y: 15 }, direction: 'down', targetMap: 'VIRIDIAN_CITY', targetPos: { x: 14, y: 9 } }"
);

// 3. Speed up Player Movement in App.tsx (250ms -> 150ms)
appStr = appStr.replace(
  "moveTimeout.current = setTimeout(() => {\n        setIsMoving(false);\n      }, 250);",
  "moveTimeout.current = setTimeout(() => {\n        setIsMoving(false);\n      }, 150);"
);

// 4. Speed up Joystick tick in App.tsx
appStr = appStr.replace(
  "const interval = setInterval(() => {\n      if (pressedKeys.current.size > 0) {\n        const currentKeys = Array.from(pressedKeys.current);\n        const dir = currentKeys[currentKeys.length - 1];\n        handleMove(dir);\n      }\n    }, 100);",
  `const interval = setInterval(() => {\n      if (pressedKeys.current.size > 0) {\n        const currentKeys = Array.from(pressedKeys.current);\n        const dir = currentKeys[currentKeys.length - 1];\n        handleMove(dir);\n      }\n    }, 60);`
);

fs.writeFileSync('src/App.tsx', appStr);
console.log("App.tsx patched movement speeds and teleports!");
