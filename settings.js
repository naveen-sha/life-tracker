document.addEventListener('DOMContentLoaded', function() {
    const storage = window.HabitTrackerStorage;
    const ui = window.HabitTrackerUI || {};
    const cloud = window.HabitTrackerCloud;

    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const themeSelect = document.getElementById('theme-select');
    const categoriesListEl = document.getElementById('categories-list');
    const newCategoryInput = document.getElementById('new-category-input');
    const addCategoryBtn = document.getElementById('add-category-btn');
    const exportDataBtn = document.getElementById('export-data-btn');
    const importDataBtn = document.getElementById('import-data-btn');
    const clearDataBtn = document.getElementById('clear-data-btn');
    const reminderToggle = document.getElementById('reminder-toggle');
    const reminderTime = document.getElementById('reminder-time');
    const soundEffectsToggle = document.getElementById('sound-effects-toggle');
    const alarmSoundToggle = document.getElementById('alarm-sound-toggle');
    const alarmToneSelect = document.getElementById('alarm-tone-select');
    const reminderSnoozeMinutesSelect = document.getElementById('reminder-snooze-minutes');
    const testAlarmBtn = document.getElementById('test-alarm-btn');
    const activeProfileNameEl = document.getElementById('active-profile-name');
    const activeProfileMetaEl = document.getElementById('active-profile-meta');
    const activeProfileCountEl = document.getElementById('active-profile-count');
    const profileNameInput = document.getElementById('profile-name-input');
    const createProfileBtn = document.getElementById('create-profile-btn');
    const renameProfileInput = document.getElementById('rename-profile-input');
    const renameProfileBtn = document.getElementById('rename-profile-btn');
    const profilesListEl = document.getElementById('profiles-list');

    const cloudUserStatusEl = document.getElementById('cloud-user-status');
    const cloudSyncStatusEl = document.getElementById('cloud-sync-status');
    const cloudReadyChipEl = document.getElementById('cloud-ready-chip');
    const googleLoginBtn = document.getElementById('google-login-btn');
    const cloudSyncBtn = document.getElementById('cloud-sync-btn');
    const cloudPullBtn = document.getElementById('cloud-pull-btn');
    const restoreBackupBtn = document.getElementById('restore-backup-btn');
    const googleLogoutBtn = document.getElementById('google-logout-btn');

    let profile = storage.getCurrentProfile();
    let habits = profile.habits || [];
    let darkMode = typeof ui.resolveDarkMode === 'function' ? ui.resolveDarkMode(profile) : profile.darkMode;
    let categories = profile.categories || storage.DEFAULT_CATEGORIES;
    let settings = profile.settings || { ...storage.DEFAULT_SETTINGS };

    function saveSettings() {
        storage.saveSettings(settings);
        storage.saveCategories(categories);
    }

    function toggleDarkMode() {
        darkMode = !darkMode;
        document.body.classList.toggle('dark-mode', darkMode);
        storage.setDarkMode(darkMode);
        if (typeof ui.renderThemeToggleIcon === 'function') {
            ui.renderThemeToggleIcon(darkModeToggle, darkMode);
        } else {
            darkModeToggle.innerHTML = darkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        }
        settings.theme = darkMode ? 'dark' : 'light';
        themeSelect.value = settings.theme;
        saveSettings();
    }

    function formatLoginDate(value) {
        if (!value) {
            return 'No recent login';
        }

        return new Date(value).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    }

    function refreshProfileState() {
        profile = storage.getCurrentProfile();
        habits = profile.habits || [];
        darkMode = typeof ui.resolveDarkMode === 'function' ? ui.resolveDarkMode(profile) : profile.darkMode;
        categories = profile.categories || storage.DEFAULT_CATEGORIES;
        settings = profile.settings || { ...storage.DEFAULT_SETTINGS };
    }

    function renderProfiles() {
        refreshProfileState();
        activeProfileNameEl.textContent = profile.name;
        activeProfileMetaEl.textContent = `Last login: ${formatLoginDate(profile.lastLoginAt)}. Progress stays saved for each profile on this device.`;
        activeProfileCountEl.textContent = `${habits.length} habits`;
        renameProfileInput.value = profile.name;

        const profiles = storage.listProfiles();

        profilesListEl.innerHTML = '';
        profiles.forEach(item => {
            const card = document.createElement('div');
            card.className = `profile-item${item.active ? ' active' : ''}`;
            card.innerHTML = `
                <div>
                    <strong>${item.name}</strong>
                    <p>${item.habitsCount} habits · ${item.totalCompletions} completions</p>
                    <small>Last login: ${formatLoginDate(item.lastLoginAt)}</small>
                </div>
                <div class="profile-actions">
                    <button class="btn-secondary profile-switch-btn" data-profile-id="${item.id}" ${item.active ? 'disabled' : ''}>
                        ${item.active ? 'Current' : 'Login'}
                    </button>
                    <button class="btn-danger profile-delete-btn" data-profile-id="${item.id}" ${profiles.length === 1 ? 'disabled' : ''}>
                        Delete
                    </button>
                </div>
            `;
            profilesListEl.appendChild(card);
        });
    }

    function renderCategories() {
        categoriesListEl.innerHTML = '';
        categories.forEach((category, index) => {
            const categoryItem = document.createElement('div');
            categoryItem.className = 'category-item';
            categoryItem.innerHTML = `
                <span>${category}</span>
                <button onclick="removeCategory(${index})"><i class="fas fa-trash"></i></button>
            `;
            categoriesListEl.appendChild(categoryItem);
        });
    }

    window.removeCategory = function(index) {
        if (categories.length > 1) {
            categories.splice(index, 1);
            saveSettings();
            renderCategories();
        } else {
            alert('You must have at least one category.');
        }
    };

    function exportData() {
        const data = storage.exportCurrentProfile();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${profile.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'life-tracker'}-profile.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = function(e) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = function(evt) {
                try {
                    const data = JSON.parse(evt.target.result);
                    if (confirm(`This will replace the data for ${profile.name}. Continue?`)) {
                        storage.importIntoCurrentProfile(data);
                        location.reload();
                    }
                } catch (error) {
                    alert('Invalid file format.');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    function clearData() {
        if (confirm(`This will delete all habits and settings for ${profile.name}. This cannot be undone. Continue?`)) {
            storage.clearCurrentProfileData();
            location.reload();
        }
    }

    function setCloudStatus(text) {
        cloudSyncStatusEl.textContent = text;
    }

    function ensureCloudAvailable() {
        return cloud && typeof cloud.isReady === 'function' && cloud.isReady();
    }

    function renderCloudState() {
        const cloudReady = ensureCloudAvailable();
        const user = cloudReady ? cloud.getCurrentUser() : null;

        cloudReadyChipEl.textContent = cloudReady ? 'Cloud ready' : 'Cloud unavailable';
        cloudUserStatusEl.textContent = user ? (user.email || 'Connected') : 'Not connected';

        googleLoginBtn.disabled = !cloudReady || Boolean(user);
        cloudSyncBtn.disabled = !cloudReady || !user;
        cloudPullBtn.disabled = !cloudReady || !user;
        restoreBackupBtn.disabled = !cloud || typeof cloud.restoreLatestBackup !== 'function';
        googleLogoutBtn.disabled = !cloudReady || !user;

        if (!cloudReady) {
            setCloudStatus('Set your Firebase config in firebase-config.js to enable Gmail sync.');
            return;
        }

        if (!user) {
            setCloudStatus('Sign in with Google to sync this profile across devices.');
            return;
        }

        setCloudStatus('Connected. Your data can sync across devices with this Google account.');
    }

    themeSelect.addEventListener('change', function() {
        settings.theme = this.value;
        if (settings.theme === 'dark') {
            document.body.classList.add('dark-mode');
            darkMode = true;
        } else if (settings.theme === 'light') {
            document.body.classList.remove('dark-mode');
            darkMode = false;
        } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.body.classList.toggle('dark-mode', prefersDark);
            darkMode = prefersDark;
        }

        storage.setDarkMode(darkMode);
        if (typeof ui.renderThemeToggleIcon === 'function') {
            ui.renderThemeToggleIcon(darkModeToggle, darkMode);
        } else {
            darkModeToggle.innerHTML = darkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        }
        saveSettings();
    });

    addCategoryBtn.addEventListener('click', function() {
        const newCategory = newCategoryInput.value.trim();
        if (newCategory && !categories.includes(newCategory)) {
            categories.push(newCategory);
            newCategoryInput.value = '';
            saveSettings();
            renderCategories();
        }
    });

    createProfileBtn.addEventListener('click', function() {
        const name = profileNameInput.value.trim();
        if (!name) {
            return;
        }

        try {
            storage.createProfile(name);
            location.reload();
        } catch (error) {
            alert(error.message);
        }
    });

    renameProfileBtn.addEventListener('click', function() {
        const name = renameProfileInput.value.trim();
        if (!name) {
            return;
        }

        try {
            storage.renameCurrentProfile(name);
            renderProfiles();
            setCloudStatus('Current profile renamed.');
        } catch (error) {
            alert(error.message);
        }
    });

    profileNameInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            createProfileBtn.click();
        }
    });

    renameProfileInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            renameProfileBtn.click();
        }
    });

    profilesListEl.addEventListener('click', function(event) {
        const switchBtn = event.target.closest('.profile-switch-btn');
        const deleteBtn = event.target.closest('.profile-delete-btn');

        if (switchBtn) {
            storage.switchProfile(switchBtn.dataset.profileId);
            location.reload();
            return;
        }

        if (deleteBtn) {
            const targetId = deleteBtn.dataset.profileId;
            const targetProfile = storage.listProfiles().find(item => item.id === targetId);
            if (targetProfile && confirm(`Delete ${targetProfile.name}? Their saved progress on this device will be removed.`)) {
                storage.deleteProfile(targetId);
                location.reload();
            }
        }
    });

    googleLoginBtn.addEventListener('click', async function() {
        if (!ensureCloudAvailable()) {
            setCloudStatus('Cloud sync is not configured yet.');
            return;
        }

        try {
            setCloudStatus('Connecting to Google account...');
            await cloud.signInWithGoogle();
            setCloudStatus('Signed in and sync completed.');
            renderCloudState();
            location.reload();
        } catch (error) {
            setCloudStatus('Google login failed. Check popup permissions and Firebase config.');
        }
    });

    cloudSyncBtn.addEventListener('click', async function() {
        if (!ensureCloudAvailable()) {
            setCloudStatus('Cloud sync is not configured yet.');
            return;
        }

        try {
            setCloudStatus('Syncing local data to cloud...');
            const result = await cloud.sync();
            setCloudStatus(`Sync complete: ${result.status}.`);
            if (String(result.status).startsWith('pulled')) {
                location.reload();
            }
        } catch (error) {
            setCloudStatus('Sync failed. Please try again.');
        }
    });

    cloudPullBtn.addEventListener('click', async function() {
        if (!ensureCloudAvailable()) {
            setCloudStatus('Cloud sync is not configured yet.');
            return;
        }

        try {
            setCloudStatus('Pulling latest cloud data...');
            const result = await cloud.pullCloudToLocal();
            setCloudStatus(`Cloud pull result: ${result.status}.`);
            if (result.status === 'pulled') {
                location.reload();
            } else if (result.status === 'protected-local') {
                setCloudStatus('Pull skipped to protect richer local progress. Use Sync Now to push your local data.');
            }
        } catch (error) {
            setCloudStatus('Cloud pull failed. Please try again.');
        }
    });

    restoreBackupBtn.addEventListener('click', function() {
        if (!cloud || typeof cloud.restoreLatestBackup !== 'function') {
            setCloudStatus('Backup restore is unavailable.');
            return;
        }

        const result = cloud.restoreLatestBackup();
        if (result.status === 'restored') {
            setCloudStatus(`Backup restored (${result.reason || 'unknown source'}). Reloading...`);
            location.reload();
        } else {
            setCloudStatus('No local backup snapshot found yet.');
        }
    });

    googleLogoutBtn.addEventListener('click', async function() {
        if (!ensureCloudAvailable()) {
            setCloudStatus('Cloud sync is not configured yet.');
            return;
        }

        try {
            await cloud.signOut();
            setCloudStatus('Logged out from Google account.');
            renderCloudState();
        } catch (error) {
            setCloudStatus('Logout failed. Please try again.');
        }
    });

    exportDataBtn.addEventListener('click', exportData);
    importDataBtn.addEventListener('click', importData);
    clearDataBtn.addEventListener('click', clearData);

    reminderToggle.addEventListener('change', function() {
        settings.reminders = this.checked;
        saveSettings();
    });

    reminderTime.addEventListener('change', function() {
        settings.reminderTime = this.value;
        saveSettings();
    });

    soundEffectsToggle.addEventListener('change', function() {
        settings.soundEffects = this.checked;
        saveSettings();
    });

    alarmSoundToggle.addEventListener('change', function() {
        settings.alarmSound = this.checked;
        saveSettings();
    });

    alarmToneSelect.addEventListener('change', function() {
        settings.alarmTone = this.value;
        saveSettings();
    });

    reminderSnoozeMinutesSelect.addEventListener('change', function() {
        settings.reminderSnoozeMinutes = Number(this.value) || 5;
        saveSettings();
    });

    testAlarmBtn.addEventListener('click', function() {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                const ctx = new AudioCtx();
                const o = ctx.createOscillator();
                const g = ctx.createGain();
                if (settings.alarmTone === 'beep') {
                    o.type = 'square';
                    o.frequency.setValueAtTime(720, ctx.currentTime);
                    o.frequency.exponentialRampToValueAtTime(940, ctx.currentTime + 0.35);
                } else if (settings.alarmTone === 'nova') {
                    o.type = 'sawtooth';
                    o.frequency.setValueAtTime(380, ctx.currentTime);
                    o.frequency.exponentialRampToValueAtTime(1020, ctx.currentTime + 0.42);
                } else if (settings.alarmTone === 'orbit') {
                    o.type = 'triangle';
                    o.frequency.setValueAtTime(560, ctx.currentTime);
                    o.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.18);
                    o.frequency.exponentialRampToValueAtTime(860, ctx.currentTime + 0.5);
                } else if (settings.alarmTone === 'zen') {
                    o.type = 'sine';
                    o.frequency.setValueAtTime(340, ctx.currentTime);
                    o.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + 0.6);
                } else if (settings.alarmTone === 'alert-x') {
                    o.type = 'square';
                    o.frequency.setValueAtTime(960, ctx.currentTime);
                    o.frequency.exponentialRampToValueAtTime(680, ctx.currentTime + 0.2);
                    o.frequency.exponentialRampToValueAtTime(1120, ctx.currentTime + 0.45);
                } else if (settings.alarmTone === 'pulse') {
                    o.type = 'triangle';
                    o.frequency.setValueAtTime(440, ctx.currentTime);
                    o.frequency.exponentialRampToValueAtTime(760, ctx.currentTime + 0.55);
                } else {
                    o.type = 'sine';
                    o.frequency.setValueAtTime(540, ctx.currentTime);
                    o.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.45);
                }
                g.gain.setValueAtTime(0.001, ctx.currentTime);
                g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.05);
                g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.62);
                o.connect(g);
                g.connect(ctx.destination);
                o.start();
                o.stop(ctx.currentTime + 0.65);
            }
            setCloudStatus('Alarm test played.');
        } catch (error) {
            setCloudStatus('Could not play alarm sound in this browser.');
        }
    });

    darkModeToggle.addEventListener('click', toggleDarkMode);

    window.addEventListener('life-tracker-auth-changed', renderCloudState);
    window.addEventListener('life-tracker-store-replaced', function() {
        refreshProfileState();
        renderProfiles();
        renderCategories();
    });

    document.body.classList.toggle('dark-mode', darkMode);
    if (typeof ui.renderThemeToggleIcon === 'function') {
        ui.renderThemeToggleIcon(darkModeToggle, darkMode);
    } else {
        darkModeToggle.innerHTML = darkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }
    themeSelect.value = settings.theme;
    reminderToggle.checked = settings.reminders;
    reminderTime.value = settings.reminderTime;
    soundEffectsToggle.checked = settings.soundEffects !== false;
    alarmSoundToggle.checked = settings.alarmSound !== false;
    alarmToneSelect.value = settings.alarmTone || 'chime';
    reminderSnoozeMinutesSelect.value = String(settings.reminderSnoozeMinutes || 5);
    renderProfiles();
    renderCategories();
    renderCloudState();
});
