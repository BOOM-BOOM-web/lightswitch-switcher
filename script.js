// --- SAVE MANAGER ---
const SaveManager = {
    key: 'flipTheSwitch_v2',
    save() {
        state.lastSaved = Date.now();
        localStorage.setItem(this.key, JSON.stringify(state));
    },
    load() {
        const data = localStorage.getItem(this.key);
        if (!data) return;
        try {
            const savedState = JSON.parse(data);
            for (let key in savedState) {
                if (typeof savedState[key] === 'object' && !Array.isArray(savedState[key]) && state[key]) {
                    Object.assign(state[key], savedState[key]);
                } else {
                    state[key] = savedState[key];
                }
            }
            state.breakerTripped = false;
            state.isRebirthing = false;

            // Re-apply switch textures and toggle state after loading save
            applySwitchVisuals();
            let rockerEl = document.getElementById('switch-rocker');
            if (state.isOn) {
                rockerEl.style.transform = "perspective(150px) rotateX(-25deg)";
                rockerEl.style.filter = "brightness(1.3)"; 
                let power = getClickPower();
                let glowIntensity = Math.min(80, Math.log10(power + 1) * 20);
                rockerEl.style.boxShadow = `0 0 ${glowIntensity}px ${glowIntensity/2}px rgba(255, 223, 0, 0.8)`;
            } else {
                rockerEl.style.transform = "perspective(150px) rotateX(25deg)";
                rockerEl.style.filter = "brightness(0.6)"; 
                rockerEl.style.boxShadow = "0 4px 4px rgba(0,0,0,0.4)";
            }

            const now = Date.now();
            const lastSaved = savedState.lastSaved || now;
            const secondsPassed = Math.min(28800, (now - lastSaved) / 1000);
            const autoWps = getAutoPower();
            const offlineEarnings = autoWps * secondsPassed;

            if (offlineEarnings > 0) {
                state.watts += offlineEarnings;
                state.totalWatts += offlineEarnings;
                this.showOfflinePopup(secondsPassed, offlineEarnings);
            }
            updateUI();
        } catch(e) {
            console.error("Save file corrupted, resetting.", e);
            localStorage.removeItem(this.key);
        }
    },
    showOfflinePopup(seconds, earnings) {
        const popup = document.createElement('div');
        popup.style.position = 'fixed';
        popup.style.top = '50%';
        popup.style.left = '50%';
        popup.style.transform = 'translate(-50%, -50%)';
        popup.style.background = '#000';
        popup.style.border = '4px solid #ffdf00';
        popup.style.boxShadow = '6px 6px 0px #000';
        popup.style.padding = '30px';
        popup.style.zIndex = '1000';
        popup.style.textAlign = 'center';
        popup.style.color = '#fff';
        popup.style.fontFamily = "'Press Start 2P', cursive";
        popup.style.maxWidth = '90%';
        popup.style.boxSizing = 'border-box';

        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        let timeStr = '';
        if (hours > 0) timeStr += `${hours}h `;
        if (mins > 0 || hours > 0) timeStr += `${mins}m `;
        timeStr += `${secs}s`;

        popup.innerHTML = `
            <h2 style="color:#ffdf00; font-size: 1.2rem; margin-bottom: 20px;">WELCOME BACK</h2>
            <p style="font-size: 0.7rem; color: #cccccc; margin-bottom: 15px;">You were away for:<br><span style="color:#fff; font-size: 0.9rem;">${timeStr}</span></p>
            <p style="font-size: 0.8rem; color:#00ffff; margin-bottom: 25px;">Your grid produced:<br><span style="font-size: 1.1rem;">${formatNumber(earnings)} W</span></p>
            <button id="collect-btn" style="background:#ffdf00; color:#000; border:none; padding:12px 20px; font-family:inherit; font-size:0.8rem; cursor:pointer;">COLLECT</button>
        `;
        document.body.appendChild(popup);
        document.getElementById('collect-btn').addEventListener('click', () => {
            popup.remove();
        });
    },
    initSaveLoop() {
        setInterval(() => this.save(), 15000);
        window.addEventListener('beforeunload', () => this.save());
    }
};

// --- SOUND SYSTEM ---
let clickSound = document.getElementById('audio-click');
let paySound = document.getElementById('audio-pay');
let sirenSound = document.getElementById('audio-siren');
let musicSound = document.getElementById('audio-music');
let pageClickSound = document.getElementById('audio-pageclick');
let jackpotSound = document.getElementById('audio-jackpot');
let hoverSound = document.getElementById('audio-hover');

if (clickSound) clickSound.volume = 0.3;
if (paySound) paySound.volume = 1.0; 
if (sirenSound) sirenSound.volume = 0.6;
if (musicSound) musicSound.volume = 0.2; 
if (pageClickSound) pageClickSound.volume = 0.6;
if (jackpotSound) jackpotSound.volume = 0.8;
if (hoverSound) hoverSound.volume = 0.4;

function playClick() { if (!clickSound) return; try { clickSound.currentTime = 0; clickSound.play().catch(e=>{}); } catch(e){} }
function playPay() { if (!paySound) return; try { paySound.currentTime = 0; paySound.play().catch(e=>{}); } catch(e){} }
function playSiren() { if (!sirenSound) return; try { sirenSound.currentTime = 0; sirenSound.play().catch(e=>{}); } catch(e){} }
function playPageClick() { if (!pageClickSound) return; try { pageClickSound.currentTime = 0; pageClickSound.play().catch(e=>{}); } catch(e){} }
function playJackpot() { if (!jackpotSound) return; try { jackpotSound.currentTime = 0; jackpotSound.play().catch(e=>{}); } catch(e){} }
function playHover() { if (!hoverSound) return; try { hoverSound.currentTime = 0; hoverSound.play().catch(e=>{}); } catch(e){} }

function playExplosion() {
    try {
        let exp = new Audio('sounds/explosion.mp3');
        exp.volume = 0.8;
        exp.play().catch(e=>{});
    } catch(e){}
}

function startMusic() { if (musicSound && musicSound.paused) { musicSound.play().catch(e=>{}); } }
document.body.addEventListener('click', startMusic, { once: true });

// --- SWITCH MATERIAL TIERS ---
const switchTiers = [
    { name: "Basic", cost: 0, mult: 1, texture: "none", color: "#444" },
    { name: "Copper", cost: 1000, mult: 3, texture: "textures/copper.jpeg", color: "#b87333" },
    { name: "Iron", cost: 25000, mult: 10, texture: "textures/iron.jpeg", color: "#dddddd" },
    { name: "Gold", cost: 500000, mult: 50, texture: "textures/gold.jpeg", color: "#ffd700" },
    { name: "Diamond", cost: 10000000, mult: 250, texture: "none", color: "#00ffff" },
    { name: "Dark Matter", cost: 250000000, mult: 1500, texture: "textures/darkmatter.jpeg", color: "#8a2be2" }
];

function applySwitchVisuals() {
    let tier = switchTiers[state.switchTier];
    let plate = document.getElementById('switch-plate');
    let rocker = document.getElementById('switch-rocker');
    if (tier.texture !== "none") {
        plate.style.backgroundImage = `url('${tier.texture}')`;
        rocker.style.backgroundImage = `url('${tier.texture}')`;
        plate.style.backgroundColor = 'transparent'; rocker.style.backgroundColor = 'transparent';
    } else {
        plate.style.backgroundImage = 'none'; rocker.style.backgroundImage = 'none';
        plate.style.backgroundColor = '#f0f0f0'; rocker.style.backgroundColor = tier.color;
    }
}

// --- GAME STATE ---
const state = {
    watts: 0, totalWatts: 0, heat: 0, isOn: true, breakerTripped: false,
    capacitors: 0, switchTier: 0, overdriveActive: false, lastDailyClaim: 0,
    isRebirthing: false, endgameUnlocked: false,
    upgrades: {
        click: { level: 0, baseCost: 10, rate: 1.15, value: 1 },
        voltage: { level: 0, baseCost: 5000, rate: 1.6, value: 5 },        
        surge: { level: 0, baseCost: 500, rate: 1.3, value: 0.01 },
        overcharge: { level: 0, baseCost: 20000, rate: 2.0, value: 5 },    
        thermoGen: { level: 0, baseCost: 50000, rate: 1.8, value: 0.01 },  
        servo: { level: 0, baseCost: 10000, rate: 1.7, value: 0.05 },      
        cooling: { level: 0, baseCost: 100, rate: 1.5, value: 2 },
        liquid: { level: 0, baseCost: 2000, rate: 1.6, value: 0.2 },
        thermal: { level: 0, baseCost: 800, rate: 1.4, value: 0.5 },
        auto: { level: 0, baseCost: 50, rate: 1.2, value: 2 },
        quantum: { level: 0, baseCost: 5000, rate: 1.8, value: 1 },
        solar: { level: 0, baseCost: 1000, rate: 1.25, value: 50 },
        flux: { level: 0, baseCost: 100000, rate: 1.9, value: 10 },
        plasma: { level: 0, baseCost: 500000, rate: 1.85, value: 500 },
        fusion: { level: 0, baseCost: 2000000, rate: 2.1, value: 3 },
        antimatter: { level: 0, baseCost: 10000000, rate: 2.5, value: 0.05 },
        entangler: { level: 0, baseCost: 50000000, rate: 3.0, value: 2 },
        darkEnergy: { level: 0, baseCost: 200000000, rate: 2.2, value: 10000 },
        singularity: { level: 0, baseCost: 1000000000, rate: 2.8, value: 100 },
        neutronium: { level: 0, baseCost: 5000000000, rate: 2.0, value: 0.5 },
        cryo: { level: 0, baseCost: 20000000000, rate: 1.9, value: 5.0 },
        infinity: { level: 0, baseCost: 100000000000, rate: 2.5, value: 0.10 }
    },
    achievements: {
        first_flick: { name: "First Flick", desc: "Generate your first Watt.", unlocked: false },
        heat_50: { name: "Warm to the Touch", desc: "Reach 50% heat.", unlocked: false },
        trip_1: { name: "Blackout", desc: "Trip the breaker for the first time.", unlocked: false },
        auto_1: { name: "Automation", desc: "Buy your first Auto-Flicker AI.", unlocked: false },
        total_1k: { name: "Tycoon", desc: "Reach 1,000 Total Watts.", unlocked: false },
        total_1m: { name: "Millionaire", desc: "Reach 1,000,000 Total Watts.", unlocked: false },
        prestige_1: { name: "Capacitor", desc: "Overload the grid for the first time.", unlocked: false }
    },
    endgame: {
        titan: { name: "Titan", desc: "Reach 1 Trillion Total Watts.", mult: 2, completed: false },
        cosmic: { name: "Cosmic", desc: "Reach 1 Quadrillion Total Watts.", mult: 5, completed: false },
        infinity: { name: "Infinity", desc: "Reach 1 Quintillion Total Watts.", mult: 50, completed: false }
    },
    rebirthTree: {} 
};

// --- REBIRTH TREE GENERATION ---
const treeNodes = [];
for(let i=0; i<100; i++) {
    let tier = Math.floor(i / 10);
    let reqs = [];
    if (i % 10 !== 0) reqs.push(i - 1);
    if (tier > 0) reqs.push(i - 10);
    let cost = 1 + tier;
    let effect = (i === 99) ? 1000 : (1 + tier * 0.01); 
    treeNodes.push({ id: i, tier, reqs, cost, effect });
}

function getTreeNodeColor(tier) {
    const colors = ['#ffdf00', '#00ffff', '#ff3333', '#ff8c00', '#8a2be2', '#33ff33', '#ff00ff', '#00ff00', '#0000ff', '#ffffff'];
    return colors[tier % colors.length];
}

function getRebirthMult() {
    let mult = 1;
    for(let id in state.rebirthTree) {
        let node = treeNodes[id];
        if (node) mult *= node.effect;
    }
    return mult;
}

function renderRebirthTree() {
    const container = document.getElementById('rebirth-tree-container');
    const svg = document.getElementById('tree-svg');
    container.innerHTML = '';
    svg.innerHTML = '';
    document.getElementById('rebirth-caps-display').innerText = `Capacitors: ${state.capacitors}`;

    treeNodes.forEach(node => {
        let isPurchased = state.rebirthTree[node.id] !== undefined;
        let isAvailable = node.reqs.every(reqId => state.rebirthTree[reqId] !== undefined);
        
        let div = document.createElement('div');
        div.classList.add('tree-node');
        div.style.left = `${(node.id % 10) * 120 + 60}px`;
        div.style.top = `${Math.floor(node.id / 10) * 120 + 60}px`;
        
        if (isPurchased) {
            div.classList.add('purchased');
            div.style.backgroundColor = getTreeNodeColor(node.tier);
        } else if (isAvailable) {
            div.classList.add('available');
            div.style.backgroundColor = getTreeNodeColor(node.tier);
            div.onclick = () => buyTreeNode(node.id);
        } else {
            div.classList.add('locked');
        }
        
        let tooltip = document.createElement('span');
        tooltip.classList.add('tree-tooltip');
        let effectText = node.id === 99 ? `x${node.effect} ALL` : `+${(node.effect - 1) * 100}% ALL`;
        tooltip.innerText = `Node ${node.id + 1}\nCost: ${node.cost} Cap\nEffect: ${effectText}`;
        div.appendChild(tooltip);
        
        container.appendChild(div);
        
        node.reqs.forEach(reqId => {
            if (state.rebirthTree[reqId] !== undefined) {
                let line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                let p1x = (reqId % 10) * 120 + 60;
                let p1y = Math.floor(reqId / 10) * 120 + 60;
                let p2x = (node.id % 10) * 120 + 60;
                let p2y = Math.floor(node.id / 10) * 120 + 60;
                line.setAttribute('x1', p1x); line.setAttribute('y1', p1y);
                line.setAttribute('x2', p2x); line.setAttribute('y2', p2y);
                line.setAttribute('class', 'tree-line active');
                svg.appendChild(line);
            }
        });
    });
}

function buyTreeNode(id) {
    let node = treeNodes[id];
    if (state.rebirthTree[id] === undefined && state.capacitors >= node.cost) {
        state.capacitors -= node.cost;
        state.rebirthTree[id] = true;
        playPay();
        renderRebirthTree();
        updateUI();
    }
}

function finishRebirth() {
    playPageClick();
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-game').classList.add('active');
    state.isRebirthing = false;
    state.overdriveActive = true;
    applySwitchVisuals();
    updateUI();
    createFloatingText(`OVERDRIVE ACTIVE!`, false, true);
    setTimeout(() => { state.overdriveActive = false; }, 120000);
}

// --- VIEW SYSTEM ---
function switchView(viewId) {
    if (state.isRebirthing) return; 
    playPageClick();
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    if(viewId === 'view-achvmt') renderAchievements();
    if(viewId === 'view-endgame') renderEndgame();
}

// --- MATH FUNCTIONS ---
function getCost(upgKey) { let upg = state.upgrades[upgKey]; return Math.ceil(upg.baseCost * Math.pow(upg.rate, upg.level)); }
function getAchievementMult() { let count = 0; for (const key in state.achievements) { if (state.achievements[key].unlocked) count++; } return 1 + (count * 0.01); }
function getEndgameMult() { let mult = 1; for (const key in state.endgame) { if (state.endgame[key].completed) mult *= state.endgame[key].mult; } return mult; }

function getClickPower() {
    let base = state.upgrades.click.value * (state.upgrades.click.level + 1);
    let voltMult = 1 + (state.upgrades.voltage.level * state.upgrades.voltage.value); 
    let fluxMult = 1 + (state.upgrades.flux.level * state.upgrades.flux.value);
    let singularityMult = 1 + (state.upgrades.singularity.level * state.upgrades.singularity.value);
    let thermoMult = 1 + (state.heat * state.upgrades.thermoGen.level * state.upgrades.thermoGen.value); 
    let tierMult = switchTiers[state.switchTier].mult;
    let prestigeMult = 1 + (state.capacitors * 0.1);
    let achvMult = getAchievementMult();
    let endgameMult = getEndgameMult();
    let rebirthMult = getRebirthMult();
    let entanglerMult = Math.pow(state.upgrades.entangler.value, state.upgrades.entangler.level);
    let overdriveMult = state.overdriveActive ? 2 : 1;
    
    return base * voltMult * fluxMult * singularityMult * thermoMult * tierMult * prestigeMult * achvMult * endgameMult * rebirthMult * entanglerMult * overdriveMult;
}

function getCritChance() {
    let base = state.upgrades.surge.level * state.upgrades.surge.value;
    let antiMatter = state.upgrades.antimatter.level * state.upgrades.antimatter.value;
    return Math.min(0.95, base + antiMatter);
}

function getCritMult() { return 10 + (state.upgrades.overcharge.level * state.upgrades.overcharge.value); }

function getHeatPerClick() {
    let baseHeat = 2; let reduction = Math.pow(0.9, state.upgrades.cooling.level);
    let flatReduction = (state.upgrades.liquid.level * state.upgrades.liquid.value) + (state.upgrades.neutronium.level * state.upgrades.neutronium.value);
    return Math.max(0, (baseHeat * reduction) - flatReduction);
}

function getHeatDecayPerSec() { return 0.5 + (state.upgrades.thermal.level * state.upgrades.thermal.value) + (state.upgrades.cryo.level * state.upgrades.cryo.value); }

function getAutoPower() {
    let autoBase = state.upgrades.auto.value * state.upgrades.auto.level;
    let quantumMult = 1 + state.upgrades.quantum.level;
    let fusionMult = 1 + (state.upgrades.fusion.level * state.upgrades.fusion.value);
    let solarBase = state.upgrades.solar.value * state.upgrades.solar.level;
    let plasmaBase = state.upgrades.plasma.value * state.upgrades.plasma.level;
    let darkEnergyBase = state.upgrades.darkEnergy.value * state.upgrades.darkEnergy.level;
    let tierMult = switchTiers[state.switchTier].mult;
    let prestigeMult = 1 + (state.capacitors * 0.1);
    let achvMult = getAchievementMult();
    let endgameMult = getEndgameMult();
    let rebirthMult = getRebirthMult();
    let entanglerMult = Math.pow(state.upgrades.entangler.value, state.upgrades.entangler.level);
    let overdriveMult = state.overdriveActive ? 2 : 1;
    
    let servoConversion = getClickPower() * ((state.upgrades.servo.level * state.upgrades.servo.value) + (state.upgrades.infinity.level * state.upgrades.infinity.value));
    
    return ((autoBase * quantumMult * fusionMult) + solarBase + plasmaBase + darkEnergyBase + servoConversion) * tierMult * prestigeMult * achvMult * endgameMult * rebirthMult * entanglerMult * overdriveMult;
}

function getPrestigeGain() { if (state.totalWatts < 1000000) return 0; return Math.floor(Math.sqrt(state.totalWatts / 1000000)); }

// --- DAILY REWARD ---
function checkDailyReward() {
    const now = Date.now(); const twentyFourHours = 24 * 60 * 60 * 1000;
    document.getElementById('daily-reward-container').style.display = (now - state.lastDailyClaim >= twentyFourHours) ? 'block' : 'none';
}
function claimDaily() {
    state.lastDailyClaim = Date.now();
    document.getElementById('daily-reward-container').style.display = 'none';
    let reward = getAutoPower() * 7200; if (reward < 1000) reward = 1000;
    state.watts += reward; state.totalWatts += reward; playJackpot();
    createFloatingText(`DAILY BONUS: +${formatNumber(reward)} W`, false, true);
}

// --- ELECTRICITY DROPS ---
function spawnElecDrop() {
    if (state.breakerTripped || state.isRebirthing) return;
    const drop = document.createElement('div'); drop.classList.add('elec-drop');
    let isGolden = Math.random() < 0.10;
    if (isGolden) { drop.classList.add('golden'); playJackpot(); }
    drop.style.left = `${Math.random() * 90 + 5}%`;
    drop.addEventListener('click', () => {
        let bonus = isGolden ? getAutoPower() * 3600 : (getClickPower() * 10) + (getAutoPower() * 20);
        state.watts += bonus; state.totalWatts += bonus; drop.remove(); playPay(); 
        createFloatingText(`+${formatNumber(bonus)} W`, false, true);
    });
    document.getElementById('elec-drop-container').appendChild(drop);
    setTimeout(() => { if (drop.parentNode) drop.remove(); }, isGolden ? 5000 : 3000);
}

// --- ACTIONS ---
function toggleSwitch(isAuto = false) {
    if (state.breakerTripped || state.isRebirthing) return;
    state.isOn = !state.isOn;
    let rockerEl = document.getElementById('switch-rocker'); let boltEl = document.getElementById('lightning-bolt');
    if (state.isOn) {
        if(!isAuto) playClick();
        rockerEl.style.transform = "perspective(150px) rotateX(-25deg)"; rockerEl.style.filter = "brightness(1.3)"; 
        let power = getClickPower();
        let glowIntensity = Math.min(80, Math.log10(power + 1) * 20);
        rockerEl.style.boxShadow = `0 0 ${glowIntensity}px ${glowIntensity/2}px rgba(255, 223, 0, 0.8)`;
        boltEl.style.opacity = 0.9; setTimeout(() => boltEl.style.opacity = 0.6, 100);
        if(!isAuto) {
            let isCrit = Math.random() < getCritChance(); if (isCrit) power *= getCritMult(); 
            state.watts += power; state.totalWatts += power; state.heat += getHeatPerClick();
            if (state.heat >= 100) { state.heat = 100; tripBreaker(); }
            createFloatingText(`+${formatNumber(power)} W`, isCrit);
        }
    } else {
        if(!isAuto) playClick();
        rockerEl.style.transform = "perspective(150px) rotateX(25deg)"; rockerEl.style.filter = "brightness(0.6)"; 
        rockerEl.style.boxShadow = "0 4px 4px rgba(0,0,0,0.4)";
    }
}

function buyUpgrade(key) {
    if (key === 'switchTier') {
        let nextTier = state.switchTier + 1; if (nextTier >= switchTiers.length) return; 
        let cost = switchTiers[nextTier].cost;
        if (state.watts >= cost) { playPay(); state.watts -= cost; state.switchTier = nextTier; applySwitchVisuals(); updateUI(); }
    } else {
        let cost = getCost(key);
        if (state.watts >= cost) { playPay(); state.watts -= cost; state.upgrades[key].level++; updateUI(); }
    }
}

function tripBreaker() {
    state.breakerTripped = true; state.heat = 0; playSiren();
    document.getElementById('breaker-overlay').style.display = 'flex';
    document.getElementById('lightning-bolt').style.opacity = 0; 
    document.getElementById('switch-rocker').style.boxShadow = "none"; 
    let rebootTime = 0;
    const rebootInterval = setInterval(() => {
        rebootTime += 100; let pct = (rebootTime / 5000) * 100;
        document.getElementById('reboot-fill').style.width = `${pct}%`;
        if (rebootTime >= 5000) {
            clearInterval(rebootInterval);
            document.getElementById('reboot-fill').style.width = '0%';
            document.getElementById('breaker-overlay').style.display = 'none';
            document.getElementById('lightning-bolt').style.opacity = 0.6; 
            state.breakerTripped = false; state.isOn = false; toggleSwitch(true); 
        }
    }, 100);
}

// --- PRESTIGE / REBIRTH ---
function doPrestige() {
    let gain = getPrestigeGain(); if (gain < 1) return;
    state.isRebirthing = true;
    
    let overlay = document.getElementById('explosion-overlay');
    overlay.classList.add('active');
    document.body.classList.add('shake');
    playExplosion();
    
    state.watts = 0; state.totalWatts = 0; state.heat = 0; state.switchTier = 0; 
    for (const key in state.upgrades) { state.upgrades[key].level = 0; }
    updateUI(); 

    setTimeout(() => {
        overlay.classList.remove('active');
        document.body.classList.remove('shake');
        state.capacitors += gain; 
        
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById('view-rebirth').classList.add('active');
        applySwitchVisuals(); renderRebirthTree(); updateUI();
    }, 1500);
}

// --- ENDGAME ---
function checkEndgame() {
    let changed = false;
    if (state.switchTier >= 5 && !state.endgameUnlocked) {
        state.endgameUnlocked = true;
        document.getElementById('endgame-btn').style.display = 'block';
    }
    if (state.totalWatts >= 1e12 && !state.endgame.titan.completed) { state.endgame.titan.completed = true; changed = true; }
    if (state.totalWatts >= 1e15 && !state.endgame.cosmic.completed) { state.endgame.cosmic.completed = true; changed = true; }
    if (state.totalWatts >= 1e18 && !state.endgame.infinity.completed) { state.endgame.infinity.completed = true; changed = true; }

    if (changed && document.getElementById('view-endgame').classList.contains('active')) renderEndgame();
}

function renderEndgame() {
    const listEl = document.getElementById('endgame-list');
    listEl.innerHTML = '';
    for (const key in state.endgame) {
        let c = state.endgame[key];
        let card = document.createElement('div'); card.classList.add('endgame-card');
        if (c.completed) card.classList.add('completed');
        let icon = c.completed ? '★' : '?';
        card.innerHTML = `<div class="endgame-icon">${icon}</div><div class="endgame-text"><h3>${c.name}</h3><p>${c.desc} (Reward: x${c.mult} Prod)</p></div>`;
        listEl.appendChild(card);
    }
}

// --- ACHIEVEMENTS ---
function checkAchievements() {
    let unlocked = false; let a = state.achievements;
    if (state.totalWatts >= 1 && !a.first_flick.unlocked) { a.first_flick.unlocked = true; unlocked = true; }
    if (state.heat >= 50 && !a.heat_50.unlocked) { a.heat_50.unlocked = true; unlocked = true; }
    if (state.breakerTripped && !a.trip_1.unlocked) { a.trip_1.unlocked = true; unlocked = true; }
    if (state.upgrades.auto.level >= 1 && !a.auto_1.unlocked) { a.auto_1.unlocked = true; unlocked = true; }
    if (state.totalWatts >= 1000 && !a.total_1k.unlocked) { a.total_1k.unlocked = true; unlocked = true; }
    if (state.totalWatts >= 1000000 && !a.total_1m.unlocked) { a.total_1m.unlocked = true; unlocked = true; }
    if (state.capacitors >= 1 && !a.prestige_1.unlocked) { a.prestige_1.unlocked = true; unlocked = true; }
    if (unlocked && document.getElementById('view-achvmt').classList.contains('active')) renderAchievements();
}

function renderAchievements() {
    const listEl = document.getElementById('achv-list'); listEl.innerHTML = '';
    for (const key in state.achievements) {
        let achv = state.achievements[key];
        let card = document.createElement('div'); card.classList.add('achv-card');
        if (achv.unlocked) card.classList.add('unlocked');
        card.onmouseenter = playHover;
        let icon = achv.unlocked ? '★' : '?';
        card.innerHTML = `<div class="achv-icon">${icon}</div><div class="achv-text"><h3>${achv.name}</h3><p>${achv.desc}</p></div>`;
        listEl.appendChild(card);
    }
}

// --- UI UPDATES ---
function formatNumber(num) {
    if (num < 1000) return num.toFixed(0);
    const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
    const tier = Math.floor(Math.log10(num) / 3);
    const scaled = num / Math.pow(10, tier * 3);
    return scaled.toFixed(2) + suffixes[tier];
}

function createFloatingText(text, isCrit = false, isElec = false) {
    const el = document.createElement('div'); el.classList.add('float-text');
    if (isCrit) el.classList.add('crit'); if (isElec) el.classList.add('elec');
    el.innerText = text; el.style.left = `${Math.random() * 60 - 30}px`;
    document.getElementById('float-container').appendChild(el);
    setTimeout(() => el.remove(), 1000);
}

function updateUI() {
    document.getElementById('watts-display').innerText = `${formatNumber(state.watts)} W`;
    document.getElementById('watts-per-sec').innerText = `per second: ${formatNumber(getAutoPower())}${state.overdriveActive ? ' (OVERDRIVE)' : ''}`;
    document.getElementById('capacitors-display').innerText = `${state.capacitors} Capacitors`;
    document.getElementById('prestige-bonus').innerText = `${state.capacitors * 10}%`;
    
    document.getElementById('heat-bar').style.width = `${state.heat}%`;
    let vignetteOpacity = Math.max(0, (state.heat - 50) / 50);
    document.getElementById('vignette').style.boxShadow = `inset 0 0 200px rgba(255, 0, 0, ${vignetteOpacity})`;

    let nextTier = state.switchTier + 1;
    let tierNameEl = document.getElementById('switchTier-name'); let tierCostEl = document.getElementById('switchTier-cost');
    let tierCard = document.querySelector(`.upgrade-card[onclick="buyUpgrade('switchTier')"]`);

    if (nextTier < switchTiers.length) {
        if(tierNameEl) tierNameEl.innerText = switchTiers[nextTier].name;
        if(tierCostEl) tierCostEl.innerText = formatNumber(switchTiers[nextTier].cost);
        if(tierCard) { if (state.watts >= switchTiers[nextTier].cost) tierCard.classList.remove('disabled'); else tierCard.classList.add('disabled'); }
    } else {
        if(tierNameEl) tierNameEl.innerText = "MAX";
        if(tierCostEl) tierCostEl.innerText = "---";
        if(tierCard) { tierCard.classList.add('disabled'); tierCard.style.opacity = "0.5"; }
    }

    for (const key in state.upgrades) {
        let cost = getCost(key);
        let levelEl = document.getElementById(`${key}-level`); let costEl = document.getElementById(`${key}-cost`);
        let card = document.querySelector(`.upgrade-card[onclick="buyUpgrade('${key}')"]`);
        if (levelEl) levelEl.innerText = state.upgrades[key].level;
        if (costEl) costEl.innerText = formatNumber(cost);
        if (card) { if (state.watts >= cost) card.classList.remove('disabled'); else card.classList.add('disabled'); }
    }

    let pGain = getPrestigeGain();
    document.getElementById('prestige-gain').innerText = pGain;
    let pBtn = document.getElementById('prestige-btn');
    if (pGain >= 1) { pBtn.disabled = false; pBtn.innerText = `OVERLOAD (+${pGain})`; } 
    else { pBtn.disabled = true; pBtn.innerText = `OVERLOAD`; }

    checkAchievements();
    checkEndgame();
    checkDailyReward();
}

// --- GAME LOOP ---
setInterval(() => {
    if (state.breakerTripped || state.isRebirthing) return;
    state.heat = Math.max(0, state.heat - (getHeatDecayPerSec() * 0.1));
    let autoWps = getAutoPower();
    if (autoWps > 0) {
        state.watts += autoWps * 0.1; state.totalWatts += autoWps * 0.1;
        let autoHeatGen = (state.upgrades.auto.value * state.upgrades.auto.level) * 0.05; 
        state.heat += autoHeatGen * 0.1; 
        if (state.heat >= 100) tripBreaker();
    }
    updateUI();
}, 100);

setInterval(() => { if (Math.random() < 0.25) spawnElecDrop(); }, 15000);

// Init
applySwitchVisuals(); 
toggleSwitch(true); 
updateUI();
SaveManager.load();
SaveManager.initSaveLoop();
