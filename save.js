const SaveManager = {
    key: 'flipTheSwitchSave',
    
    save() {
        // Add a timestamp to the state right before saving
        state.lastSaved = Date.now();
        localStorage.setItem(this.key, JSON.stringify(state));
    },

    load() {
        const data = localStorage.getItem(this.key);
        if (!data) return; // No save file found

        const savedState = JSON.parse(data);
        
        // Merge saved data into our current state safely
        for (let key in savedState) {
            if (typeof savedState[key] === 'object' && !Array.isArray(savedState[key]) && state[key]) {
                Object.assign(state[key], savedState[key]);
            } else {
                state[key] = savedState[key];
            }
        }

        // Ensure the game doesn't load into a tripped breaker
        state.breakerTripped = false;

        // Calculate Offline Progress
        const now = Date.now();
        const lastSaved = savedState.lastSaved || now;
        const secondsPassed = Math.min(28800, (now - lastSaved) / 1000); // Cap at 8 hours (28800 seconds)
        
        const autoWps = getAutoPower();
        const offlineEarnings = autoWps * secondsPassed;

        // If they earned something while away, show the popup
        if (offlineEarnings > 0) {
            state.watts += offlineEarnings;
            state.totalWatts += offlineEarnings;
            this.showOfflinePopup(secondsPassed, offlineEarnings);
        }

        // Update the UI immediately with loaded stats
        updateUI();
    },

    showOfflinePopup(seconds, earnings) {
        // Create a popup dynamically so we don't have to touch index.html
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

        // Calculate time string
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

        // Add event listener to close popup
        document.getElementById('collect-btn').addEventListener('click', () => {
            popup.remove();
        });
    },

    initSaveLoop() {
        // Save every 15 seconds
        setInterval(() => this.save(), 15000);
        
        // Save right when the user closes the tab/window
        window.addEventListener('beforeunload', () => this.save());
    }
};
