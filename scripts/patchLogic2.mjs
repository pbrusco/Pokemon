import fs from 'fs';

let appStr = fs.readFileSync('src/App.tsx', 'utf8');

// Fix 1: Make Menu independent in handleKeyDown
appStr = appStr.replace(
  `    const handleKeyDown = (e: KeyboardEvent) => {
      if (isBattle) {
        if (e.key === 'Escape') setIsBattle(false);
        return;
      }

      if (dialogue) {
        if (!isLocked.current && (e.key === 'Enter' || e.key === ' ' || e.key === 'z')) setDialogue(null);
        return;
      }

      switch (e.key) {
        case 'ArrowUp': pressedKeys.current.add('up'); break;
        case 'ArrowDown': pressedKeys.current.add('down'); break;
        case 'ArrowLeft': pressedKeys.current.add('left'); break;
        case 'ArrowRight': pressedKeys.current.add('right'); break;
        case 'z': case 'Enter': case ' ': handleAction(); break;
        case 'x': case 'Shift': case 'Escape': setShowMenu(prev => !prev); break;
      }
    };`,
  `    const handleKeyDown = (e: KeyboardEvent) => {
      // Independent menu toggle
      if (e.key === 'x' || e.key === 'Shift' || e.key === 'Escape') {
        setShowMenu(prev => !prev);
        return;
      }

      if (isBattle) return;

      if (dialogue) {
        if (!isLocked.current && (e.key === 'Enter' || e.key === ' ' || e.key === 'z')) setDialogue(null);
        return;
      }

      switch (e.key) {
        case 'ArrowUp': pressedKeys.current.add('up'); break;
        case 'ArrowDown': pressedKeys.current.add('down'); break;
        case 'ArrowLeft': pressedKeys.current.add('left'); break;
        case 'ArrowRight': pressedKeys.current.add('right'); break;
        case 'z': case 'Enter': case ' ': handleAction(); break;
      }
    };`
);


// Fix 2: B button opens menu too!
appStr = appStr.replace(
  `onPointerDown={(e) => { e.preventDefault(); /* B button logic */ }}`,
  `onPointerDown={(e) => { e.preventDefault(); setShowMenu(prev => !prev); }}`
);


// Fix 3: Lock on Battle Transition
// Let's replace setShowBattleTransition(true); globally with:
// setShowBattleTransition(true);\n        isLocked.current = true;
appStr = appStr.replace(/setShowBattleTransition\(true\);/g, "setShowBattleTransition(true);\n        isLocked.current = true;");


// Fix 4: Unlock on Battle Transition completion
appStr = appStr.replace(
  `          <BattleTransition onComplete={() => {
            setShowBattleTransition(false);
            setIsBattle(true);
          }} />`,
  `          <BattleTransition onComplete={() => {
            setShowBattleTransition(false);
            setIsBattle(true);
            isLocked.current = false;
          }} />`
);

fs.writeFileSync('src/App.tsx', appStr);
console.log("App.tsx patched successfully for battle transitions & independent menu!");
