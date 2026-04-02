document.addEventListener('DOMContentLoaded', function() {
    const storage = window.HabitTrackerStorage;
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
    const activeProfileNameEl = document.getElementById('active-profile-name');
    const activeProfileMetaEl = document.getElementById('active-profile-meta');
    const activeProfileCountEl = document.getElementById('active-profile-count');
    const profileNameInput = document.getElementById('profile-name-input');
    const createProfileBtn = document.getElementById('create-profile-btn');
    const profilesListEl = document.getElementById('profiles-list');

    let profile = storage.getCurrentProfile();
    let habits = profile.habits || [];
    let darkMode = profile.darkMode;
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
        darkModeToggle.innerHTML = darkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
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
        darkMode = profile.darkMode;
        categories = profile.categories || storage.DEFAULT_CATEGORIES;
        settings = profile.settings || { ...storage.DEFAULT_SETTINGS };
    }

    function renderProfiles() {
        refreshProfileState();
        activeProfileNameEl.textContent = profile.name;
        activeProfileMetaEl.textContent = `Last login: ${formatLoginDate(profile.lastLoginAt)}. Progress stays saved for each profile on this device.`;
        activeProfileCountEl.textContent = `${habits.length} habits`;

        profilesListEl.innerHTML = '';
        storage.listProfiles().forEach(item => {
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
                    <button class="btn-danger profile-delete-btn" data-profile-id="${item.id}" ${storage.listProfiles().length === 1 ? 'disabled' : ''}>
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
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
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

    themeSelect.addEventListener('change', function() {
        settings.theme = this.value;
        if (settings.theme === 'dark') {
            document.body.classList.add('dark-mode');
            darkMode = true;
        } else if (settings.theme === 'light') {
            document.body.classList.remove('dark-mode');
            darkMode = false;
        } else {
            // Auto theme based on system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.body.classList.toggle('dark-mode', prefersDark);
            darkMode = prefersDark;
        }
        storage.setDarkMode(darkMode);
        darkModeToggle.innerHTML = darkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
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

    profileNameInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            createProfileBtn.click();
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

    darkModeToggle.addEventListener('click', toggleDarkMode);

    // Initialize
    document.body.classList.toggle('dark-mode', darkMode);
    darkModeToggle.innerHTML = darkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    themeSelect.value = settings.theme;
    reminderToggle.checked = settings.reminders;
    reminderTime.value = settings.reminderTime;
    renderProfiles();
    renderCategories();
});
