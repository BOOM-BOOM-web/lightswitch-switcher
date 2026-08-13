// --- SOUND SYSTEM ---
// Make sure you have a folder named "sounds" in the same directory as your index.html
// Put "buttonclick.mp3" and "paying.mp3" inside that folder.

let clickSound = new Audio('sounds/buttonclick.mp3');
clickSound.volume = 0.3; // Lower volume so it's not deafening on rapid clicks

let paySound = new Audio('sounds/paying.mp3');
paySound.volume = 0.5;

function playClick() {
    // Reset the audio to the beginning so rapid clicks play a fresh sound each time
    clickSound.currentTime = 0; 
    clickSound.play().catch(e => console.warn("Audio play blocked until user interacts."));
}

function playPay() {
    paySound.currentTime = 0;
    paySound.play().catch(e => console.warn("Audio play blocked until user interacts."));
}

// --- GAME STATE ---
const state = {
    watts: 0,
    totalWatts: 0,
    heat: 0,
    isOn: true,
    breakerTripped: false,
    capacitors: 0,
    upgrades: {
        click: { level: 0, baseCost: 10, rate: 1.15, value: 1 },       // Click Power
        surge: { level: 0, baseCost: 500, rate: 1.3, value: 0.01 },     // Crit Chance
        cooling: { level: 0, baseCost: 100, rate: 1.5, value: 2 },      // % Heat Reduction
        liquid: { level: 0, baseCost: 2000, rate: 1.6, value: 0.2 },    // Flat Heat Reduction
        thermal: { level: 0, baseCost: 800, rate: 1.4, value: 0.5 },    // Heat Decay/sec
        auto: { level: 0, baseCost: 50, rate: 1.2, value: 2 },          // Passive W/s
        quantum: { level: 0, baseCost: 5000, rate: 1.8, value: 1 },     // Auto Multiplier
        solar: { level: 0, baseCost: 1000, rate: 1.25, value: 50 }      // Flat Passive W/s
    },
    achievements: {
        first_flick: { name: "First Flick", desc: "Generate your first Watt.", unlocked: false },
        heat_50: { name: "Warm to the Touch", desc: "Reach 50% heat.", unlocked: false },
        trip_1: { name: "Blackout", desc: "Trip the breaker for the first time.", unlocked: false },
        auto_1: { name: "Automation", desc: "Buy your first Auto-Flicker AI.", unlocked: false },
        total_1k: { name: "Tycoon", desc: "Reach 1,000 Total Watts.", unlocked: false },
        total_1m: { name: "Millionaire", desc: "Reach 1,000,000 Total Watts.", unlocked: false },
        prestige_1: { name: "Capacitor", desc: "Overload the grid for the first time.", unlocked: false }
    }
};

// --- VIEW SYSTEM ---
function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    if(viewId === 'view-achvmt') renderAchievements();
}

// --- MATH FUNCTIONS ---
function getCost(upgKey) {
    let upg = state.upgrades[upgKey];
    return Math.ceil(upg.baseCost * Math.pow(upg.rate, upg.level));
}

function getClickPower() {
    let base = state.upgrades.click.value * (state.upgrades.click.level + 1);
    let prestigeMult = 1 + (state.capacitors * 0.1);
    return base * prestigeMult;
}

function getCritChance() {
    return Math.min(0.75, state.upgrades.surge.level * state.upgrades.surge.value); // Cap at 75%
}

function getHeatPerClick() {
    let baseHeat = 2;
    let reduction = Math.pow(0.9, state.upgrades.cooling.level); // -10% per level
    let flatReduction = state.upgrades.liquid.level * state.upgrades.liquid.value; // -0.2 flat per level
    return Math.max(0, (baseHeat * reduction) - flatReduction);
}

function getHeatDecayPerSec() {
    return 0.5 + (state.upgrades.thermal.level * state.upgrades.thermal.value);
}

function getAutoPower() {
    let autoBase = state.upgrades.auto.value * state.upgrades.auto.level;
    let quantumMult = 1 + state.upgrades.quantum.level; // x2, x3, x4...
    let solarBase = state.upgrades.solar.value * state.upgrades.solar.level;
    let prestigeMult = 1 + (state.capacitors * 0.1);
    
    return ((autoBase * quantumMult) + solarBase) * prestigeMult;
}

function getPrestigeGain() {
    if (state.totalWatts < 1000000) return 0;
    return Math.floor(Math.sqrt(state.totalWatts / 1000000));
}

// --- ACTIONS ---
function toggleSwitch(isAuto = false) {
    if (state.breakerTripped) return;

    state.isOn = !state.isOn;
    
    let rockerEl = document.getElementById('switch-rocker');
    let boltEl = document.getElementById('lightning-bolt');
    
    if (state.isOn) {
        // Play the clicking sound! (Only on manual clicks to save sanity)
        if(!isAuto) playClick();
        
        rockerEl.style.transform = "perspective(150px) rotateX(-25deg)";
        rockerEl.style.background = "#ffdf00"; 
        
        let power = getClickPower();
        let glowIntensity = Math.min(80, Math.log10(power + 1) * 20);
        rockerEl.style.boxShadow = `0 0 ${glowIntensity}px ${glowIntensity/2}px rgba(255, 223, 0, 0.8)`;

        boltEl.style.opacity = 0.9;
        setTimeout(() => boltEl.style.opacity = 0.6, 100);

        if(!isAuto) {
            // Calculate Crit
            let isCrit = Math.random() < getCritChance();
            if (isCrit) {
                power *= 10;
            }

            state.watts += power;
            state.totalWatts += power;

            state.heat += getHeatPerClick();
            if (state.heat >= 100) {
                state.heat = 100;
                tripBreaker();
            }

            createFloatingText(`+${formatNumber(power)} W`, isCrit);
        }
    } else {
        if(!isAuto) playClick();
        
        rockerEl.style.transform = "perspective(150px) rotateX(25deg)";
        rockerEl.style.background = "#444"; 
        rockerEl.style.boxShadow = "0 4px 4px rgba(0,0,0,0.4)";
    }
}

function buyUpgrade(key) {
    let cost = getCost(key);
    if (state.watts >= cost) {
        // Play the paying sound!
        playPay();
        
        state.watts -= cost;
        state.upgrades[key].level++;
        updateUI();
    }
}

function tripBreaker() {
    state.breakerTripped = true;
    state.heat = 0;
    document.getElementById('breaker-overlay').style.display = 'flex';
    document.getElementById('lightning-bolt').style.opacity = 0; 
    document.getElementById('switch-rocker').style.boxShadow = "none"; 
    
    let rebootTime = 0;
    const rebootInterval = setInterval(() => {
        rebootTime += 100;
        let pct = (rebootTime / 5000) * 100;
        document.getElementById('reboot-fill').style.width = `${pct}%`;
        if (rebootTime >= 5000) {
            clearInterval(rebootInterval);
            document.getElementById('reboot-fill').style.width = '0%';
            document.getElementById('breaker-overlay').style.display = 'none';
            document.getElementById('lightning-bolt').style.opacity = 0.6; 
            state.breakerTripped = false;
            state.isOn = false; 
            toggleSwitch(true); 
        }
    }, 100);
}

function doPrestige() {
    let gain = getPrestigeGain();
    if (gain < 1) return;
    
    state.capacitors += gain;
    state.watts = 0;
    state.totalWatts = 0;
    state.heat = 0;
    // Reset all upgrades
    for (const key in state.upgrades) {
        state.upgrades[key].level = 0;
    }
    
    document.getElementById('capacitors-display').style.display = 'block';
    updateUI();
}

// --- ACHIEVEMENTS ---
function checkAchievements() {
    let unlocked = false;
    let a = state.achievements;

    if (state.totalWatts >= 1 && !a.first_flick.unlocked) { a.first_flick.unlocked = true; unlocked = true; }
    if (state.heat >= 50 && !a.heat_50.unlocked) { a.heat_50.unlocked = true; unlocked = true; }
    if (state.breakerTripped && !a.trip_1.unlocked) { a.trip_1.unlocked = true; unlocked = true; }
    if (state.upgrades.auto.level >= 1 && !a.auto_1.unlocked) { a.auto_1.unlocked = true; unlocked = true; }
    if (state.totalWatts >= 1000 && !a.total_1k.unlocked) { a.total_1k.unlocked = true; unlocked = true; }
    if (state.totalWatts >= 1000000 && !a.total_1m.unlocked) { a.total_1m.unlocked = true; unlocked = true; }
    if (state.capacitors >= 1 && !a.prestige_1.unlocked) { a.prestige_1.unlocked = true; unlocked = true; }

    if (unlocked && document.getElementById('view-achvmt').classList.contains('active')) {
        renderAchievements();
    }
}

function renderAchievements() {
    const listEl = document.getElementById('achv-list');
    listEl.innerHTML = '';
    
    for (const key in state.achievements) {
        let achv = state.achievements[key];
        let card = document.createElement('div');
        card.classList.add('achv-card');
        if (achv.unlocked) card.classList.add('unlocked');

        let icon = achv.unlocked ? '★' : '?';
        
        card.innerHTML = `
            <div class="achv-icon">${icon}</div>
            <div class="achv-text">
                <h3>${achv.name}</h3>
                <p>${achv.desc}</p>
            </div>
        `;
        listEl.appendChild(card);
    }
}

// --- UI UPDATES ---
function formatNumber(num) {
    if (num < 1000) return num.toFixed(0);
    const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi'];
    const tier = Math.floor(Math.log10(num) / 3);
    const scaled = num / Math.pow(10, tier * 3);
    return scaled.toFixed(2) + suffixes[tier];
}

function createFloatingText(text, isCrit = false) {
    const el = document.createElement('div');
    el.classList.add('float-text');
    if (isCrit) el.classList.add('crit');
    el.innerText = text;
    el.style.left = `${Math.random() * 60 - 30}px`;
    document.getElementById('float-container').appendChild(el);
    setTimeout(() => el.remove(), 1000);
}

function updateUI() {
    document.getElementById('watts-display').innerText = `${formatNumber(state.watts)} W`;
    
    let autoWps = getAutoPower();
    document.getElementById('watts-per-sec').innerText = `per second: ${formatNumber(autoWps)}`;
    document.getElementById('capacitors-display').innerText = `${state.capacitors} Capacitors`;
    document.getElementById('prestige-bonus').innerText = `${state.capacitors * 10}%`;
    
    document.getElementById('heat-bar').style.width = `${state.heat}%`;
    let vignetteOpacity = Math.max(0, (state.heat - 50) / 50);
    document.getElementById('vignette').style.boxShadow = `inset 0 0 200px rgba(255, 0, 0, ${vignetteOpacity})`;

    // Loop through ALL upgrades and update their specific DOM elements
    for (const key in state.upgrades) {
        let cost = getCost(key);
        let levelEl = document.getElementById(`${key}-level`);
        let costEl = document.getElementById(`${key}-cost`);
        let card = document.querySelector(`.upgrade-card[onclick="buyUpgrade('${key}')"]`);

        if (levelEl) levelEl.innerText = state.upgrades[key].level;
        if (costEl) costEl.innerText = formatNumber(cost);
        
        if (card) {
            if (state.watts >= cost) card.classList.remove('disabled');
            else card.classList.add('disabled');
        }
    }

    let pGain = getPrestigeGain();
    document.getElementById('prestige-gain').innerText = pGain;
    let pBtn = document.getElementById('prestige-btn');
    if (pGain >= 1) {
        pBtn.disabled = false;
        pBtn.innerText = `OVERLOAD (+${pGain})`;
    } else {
        pBtn.disabled = true;
        pBtn.innerText = `OVERLOAD`;
    }

    checkAchievements();
}

// --- GAME LOOP ---
setInterval(() => {
    if (state.breakerTripped) return;

    // Dynamic heat decay based on Thermal Paste upgrade (0.1s interval)
    state.heat = Math.max(0, state.heat - (getHeatDecayPerSec() * 0.1));
    
    let autoWps = getAutoPower();
    if (autoWps > 0) {
        state.watts += autoWps * 0.1; 
        state.totalWatts += autoWps * 0.1;
        
        // Only the Auto-Flicker generates heat, Solar Panels do not
        let autoHeatGen = (state.upgrades.auto.value * state.upgrades.auto.level) * 0.05; 
        state.heat += autoHeatGen * 0.1; 
        if (state.heat >= 100) tripBreaker();
    }
    
    updateUI();
}, 100);

// Init
toggleSwitch(true); 
updateUI();
