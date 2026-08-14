:root {
    --bg-color: #425e8c; --bg-stripes: #375079; --panel-color: #000000;
    --accent: #ffdf00; --text: #ffffff; --text-dim: #cccccc;
    --danger: #ff3333; --safe: #33ff33;
}

body {
    margin: 0; padding: 0; background-color: var(--bg-color);
    background-image: repeating-linear-gradient(45deg, var(--bg-color), var(--bg-color) 20px, var(--bg-stripes) 20px, var(--bg-stripes) 40px);
    color: var(--text); font-family: 'Press Start 2P', cursive;
    height: 100vh; overflow: hidden; image-rendering: pixelated; -webkit-font-smoothing: none;
}

/* Screen Shake for Explosion */
body.shake {
    animation: bigShake 0.5s ease-in-out;
}
@keyframes bigShake {
    0% { transform: translate(0, 0) rotate(0deg); }
    20% { transform: translate(-10px, 10px) rotate(-2deg); }
    40% { transform: translate(10px, -10px) rotate(2deg); }
    60% { transform: translate(-10px, -10px) rotate(-1deg); }
    80% { transform: translate(10px, 10px) rotate(1deg); }
    100% { transform: translate(0, 0) rotate(0deg); }
}

#vignette {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    pointer-events: none; box-shadow: inset 0 0 200px rgba(0,0,0,0);
    transition: box-shadow 0.2s; z-index: 999;
}

#elec-drop-container { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 50; }
.elec-drop {
    position: absolute; width: 30px; height: 30px; background: #00ffff;
    border: 2px solid #fff; border-radius: 50%; box-shadow: 0 0 15px #00ffff, 0 0 30px #00ffff;
    cursor: pointer; pointer-events: auto; animation: pulse 0.5s infinite alternate, fall 3s linear forwards;
}
.elec-drop.golden {
    width: 50px; height: 50px; background: #ffd700; border-color: #fff;
    box-shadow: 0 0 25px #ffd700, 0 0 50px #ffae00; animation: pulse 0.3s infinite alternate, fall 5s linear forwards;
}
@keyframes pulse { from { transform: scale(1); } to { transform: scale(1.2); } }
@keyframes fall { from { top: -50px; } to { top: 110%; } }

/* Multi-Layer Explosion */
#explosion-overlay {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    pointer-events: none; z-index: 2000; opacity: 0;
}
#explosion-overlay.active { opacity: 1; }

#exp-flash {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    width: 100%; height: 100%; background: #fff; opacity: 0;
}
#explosion-overlay.active #exp-flash {
    animation: flash 0.4s ease-out forwards;
}
@keyframes flash {
    0% { opacity: 1; }
    100% { opacity: 0; }
}

#exp-core {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0);
    width: 300px; height: 300px; border-radius: 50%;
    background: radial-gradient(circle, #fff 0%, #ffdf00 20%, #ff8c00 50%, #ff3333 80%, transparent 100%);
    filter: blur(10px);
}
#explosion-overlay.active #exp-core {
    animation: coreExpand 1.5s ease-out forwards;
}
@keyframes coreExpand {
    0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
    30% { transform: translate(-50%, -50%) scale(3); opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(8); opacity: 0; }
}

#exp-shockwave {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0);
    width: 200px; height: 200px; border-radius: 50%;
    border: 10px solid #fff; box-shadow: 0 0 50px #ffdf00;
}
#explosion-overlay.active #exp-shockwave {
    animation: shockwave 1s ease-out forwards;
}
@keyframes shockwave {
    0% { transform: translate(-50%, -50%) scale(0); opacity: 1; border-width: 20px; }
    100% { transform: translate(-50%, -50%) scale(15); opacity: 0; border-width: 1px; }
}

.view {
    display: none; flex-direction: column; align-items: center; justify-content: flex-start;
    width: 100%; height: 100vh; padding: 40px 20px 20px 20px; box-sizing: border-box; overflow-y: auto;
}
.view.active { display: flex; }
#view-game { justify-content: center; }

#daily-reward-container { position: fixed; top: 20px; right: 20px; z-index: 1000; display: none; }
#daily-reward-btn {
    background: #00ffff; color: #000; border: 2px solid #fff; padding: 10px 15px;
    font-family: 'Press Start 2P', cursive; font-size: 0.7rem; cursor: pointer;
    box-shadow: 0 0 10px #00ffff; animation: pulse 1s infinite alternate;
}
#daily-reward-btn:hover { background: #fff; }

#stats-container { text-align: center; margin-bottom: 30px; text-shadow: 2px 2px 0px #000; z-index: 2; }
#watts-display { font-size: 2.5rem; color: var(--accent); margin-bottom: 10px; }
#watts-per-sec { font-size: 1rem; color: var(--text-dim); }
#capacitors-display { font-size: 0.8rem; color: #00ffff; margin-top: 10px; display: none; }

#menu-buttons { display: flex; gap: 20px; margin-bottom: 40px; z-index: 2; }
.menu-btn { background: #000; color: #fff; border: 2px solid #fff; padding: 10px 15px; font-family: 'Press Start 2P', cursive; font-size: 0.8rem; cursor: pointer; }
.menu-btn:hover { background: #fff; color: #000; }

#lightning-container { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 350px; height: 350px; z-index: 0; pointer-events: none; }
#lightning-bolt { width: 100%; height: 100%; fill: var(--accent); opacity: 0.6; animation: spin 6s linear infinite, shine 1.5s ease-in-out infinite alternate; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes shine { 0% { filter: drop-shadow(0 0 10px rgba(255, 223, 0, 0.5)); opacity: 0.4; } 100% { filter: drop-shadow(0 0 30px rgba(255, 255, 0, 1)); opacity: 0.8; } }

#switch-container { position: relative; width: 120px; height: 180px; cursor: pointer; z-index: 2; perspective: 200px; }
#switch-plate {
    position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 100px; height: 160px;
    background: #f0f0f0; border: 4px solid #000; box-shadow: 6px 6px 0px #000;
    display: flex; flex-direction: column; align-items: center; justify-content: space-between;
    padding: 12px 0; box-sizing: border-box; border-radius: 4px; background-size: cover; background-position: center;
}
.screw { width: 10px; height: 10px; background: #b0b0b0; border: 2px solid #000; border-radius: 50%; position: relative; z-index: 3; }
.screw::after { content: ''; position: absolute; top: 50%; left: 50%; width: 6px; height: 2px; background: #000; transform: translate(-50%, -50%) rotate(45deg); }
#switch-rocker {
    width: 50px; height: 80px; background: #444; border: 3px solid #000; border-radius: 4px;
    transition: transform 0.1s ease-out, filter 0.1s, box-shadow 0.1s;
    transform: perspective(150px) rotateX(25deg); box-shadow: 0 4px 4px rgba(0,0,0,0.4);
    position: relative; background-size: cover; background-position: center; filter: brightness(0.6);
}

#heat-container { width: 200px; height: 20px; background: #000; border: 2px solid #fff; margin-top: 40px; overflow: hidden; position: relative; z-index: 2; }
#heat-bar { height: 100%; width: 0%; background: #ff3333; }

.float-text { position: absolute; font-size: 1rem; color: var(--accent); text-shadow: 2px 2px 0px #000; pointer-events: none; animation: floatUp 1s ease-out forwards; z-index: 10; }
.float-text.crit { color: #ff00ff; font-size: 1.5rem; text-shadow: 2px 2px 0px #fff, -2px -2px 0px #fff; }
.float-text.elec { color: #00ffff; font-size: 1.2rem; text-shadow: 2px 2px 0px #000; }
@keyframes floatUp { 0% { transform: translateY(0) scale(1); opacity: 1; } 100% { transform: translateY(-80px) scale(1.2); opacity: 0; } }

#breaker-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); display: none; flex-direction: column; align-items: center; justify-content: center; z-index: 100; }
#breaker-overlay h2 { color: var(--danger); font-size: 1.5rem; margin-bottom: 20px; text-align: center; }
#reboot-bar { width: 200px; height: 20px; background: #333; margin-top: 15px; border: 2px solid #fff; overflow: hidden; }
#reboot-fill { width: 0%; height: 100%; background: var(--accent); }

#prestige-container { margin-top: 40px; text-align: center; padding: 20px; border: 2px solid #555; background: rgba(0,0,0,0.6); width: 260px; z-index: 2; }
#prestige-info { font-size: 0.7rem; color: #00ffff; line-height: 1.8; margin-bottom: 15px; }
#prestige-btn { width: 100%; padding: 12px; background: #000; color: #00ffff; border: 2px solid #00ffff; font-family: 'Press Start 2P', cursive; font-size: 0.8rem; cursor: pointer; }
#prestige-btn:disabled { border-color: #555; color: #555; cursor: not-allowed; }
#prestige-btn:hover:not(:disabled) { background: #00ffff; color: #000; }

.page-container { background: rgba(0, 0, 0, 0.85); border: 4px solid #000; box-shadow: 6px 6px 0px #000; width: 90%; max-width: 600px; padding: 30px; box-sizing: border-box; }
.page-title { font-size: 1.5rem; color: var(--accent); border-bottom: 4px solid #444; padding-bottom: 15px; margin-bottom: 25px; text-align: center; }
.back-btn { background: transparent; border: none; color: var(--text-dim); font-family: 'Press Start 2P', cursive; font-size: 0.8rem; cursor: pointer; margin-bottom: 30px; text-decoration: underline; }
.back-btn:hover { color: var(--accent); }

.upgrade-card { background: #1a1a1a; padding: 15px; border: 2px solid #444; margin-bottom: 15px; cursor: pointer; transition: transform 0.1s ease, border-color 0.1s, background 0.1s; }
.upgrade-card:hover { transform: scale(1.03); border-color: var(--accent); background: #222; }
.upgrade-card.disabled { opacity: 0.5; cursor: not-allowed; }
.upgrade-card.disabled:hover { transform: scale(1); }
.upg-name { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 0.9rem; }
.upg-info { color: #aaa; font-size: 0.7rem; margin-bottom: 3px; }

.achv-card { background: #1a1a1a; padding: 15px; border: 2px solid #444; margin-bottom: 15px; display: flex; align-items: center; gap: 15px; transition: transform 0.1s ease, border-color 0.1s, background 0.1s; }
.achv-card:hover { transform: scale(1.03); border-color: var(--accent); background: #222; }
.achv-card.unlocked { border-color: var(--accent); background: #222; }
.achv-icon { width: 40px; height: 40px; background: #333; border: 2px solid #000; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: #555; }
.achv-card.unlocked .achv-icon { background: var(--accent); color: #000; }
.achv-text h3 { margin: 0 0 5px 0; font-size: 0.9rem; color: #fff; }
.achv-card.unlocked .achv-text h3 { color: var(--accent); }
.achv-text p { margin: 0; font-size: 0.7rem; color: #888; }

/* Rebirth Tree Styles */
#view-rebirth { background: #000; padding: 0; justify-content: center; align-items: center; position: relative; }
#rebirth-header { position: fixed; top: 20px; left: 20px; z-index: 10; }
#rebirth-header h2 { border: none; margin: 0; }
#rebirth-caps-display { color: #00ffff; font-size: 0.8rem; margin-top: 10px; }

#rebirth-tree-wrapper { position: relative; width: 1400px; height: 1400px; }
#tree-svg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; pointer-events: none; }
.tree-line { stroke: #444; stroke-width: 2; stroke-dasharray: 5; }
.tree-line.active { stroke: #ffdf00; stroke-width: 3; }

#rebirth-tree-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 2; }
.tree-node {
    position: absolute; width: 40px; height: 40px; border-radius: 50%;
    transform: translate(-50%, -50%); cursor: pointer; border: 2px solid #000;
    display: flex; align-items: center; justify-content: center; font-size: 0.6rem; color: #000;
    transition: transform 0.1s; box-shadow: 0 0 5px rgba(0,0,0,0.5);
}
.tree-node:hover { transform: translate(-50%, -50%) scale(1.2); }
.tree-node.locked { background: #222; border-color: #444; cursor: not-allowed; opacity: 0.3; }
.tree-node.available { background: #444; border-color: #fff; animation: pulse 1s infinite alternate; }
.tree-node.purchased { background: #ffdf00; border-color: #fff; box-shadow: 0 0 15px #ffdf00; }

.tree-tooltip {
    position: absolute; bottom: 45px; left: 50%; transform: translateX(-50%);
    background: #000; color: #fff; border: 1px solid #fff; padding: 5px;
    font-size: 0.6rem; white-space: nowrap; display: none; z-index: 20;
}
.tree-node:hover .tree-tooltip { display: block; }

#rebirth-finish-btn {
    position: fixed; bottom: 20px; right: 20px; padding: 15px 30px;
    background: #00ffff; color: #000; border: 2px solid #fff; font-family: 'Press Start 2P', cursive;
    font-size: 0.8rem; cursor: pointer; z-index: 10;
}
#rebirth-finish-btn:hover { background: #fff; }

/* Endgame Styles */
.endgame-card { background: #1a1a1a; padding: 15px; border: 2px solid #444; margin-bottom: 15px; display: flex; align-items: center; gap: 15px; }
.endgame-card.completed { border-color: #00ffff; background: #001a1a; }
.endgame-icon { width: 40px; height: 40px; background: #333; border: 2px solid #000; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: #555; }
.endgame-card.completed .endgame-icon { background: #00ffff; color: #000; }
.endgame-text h3 { margin: 0 0 5px 0; font-size: 0.9rem; color: #fff; }
.endgame-card.completed .endgame-text h3 { color: #00ffff; }
.endgame-text p { margin: 0; font-size: 0.7rem; color: #888; }
