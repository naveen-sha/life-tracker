document.addEventListener('DOMContentLoaded', function() {
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

    let habits = JSON.parse(localStorage.getItem('habits')) || [];
    let darkMode = localStorage.getItem('darkMode') === 'true';
    let categories = JSON.parse(localStorage.getItem('categories')) || ['General', 'Health', 'Productivity', 'Learning'];
    let settings = JSON.parse(localStorage.getItem('settings')) || {
        theme: 'light',
        reminders: false,
        reminderTime: '09:00'
    };

    function saveSettings() {
        localStorage.setItem('settings', JSON.stringify(settings));
        localStorage.setItem('categories', JSON.stringify(categories));
    }

    function toggleDarkMode() {
        darkMode = !darkMode;
        document.body.classList.toggle('dark-mode', darkMode);
        localStorage.setItem('darkMode', darkMode);
        darkModeToggle.innerHTML = darkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        settings.theme = darkMode ? 'dark' : 'light';
        themeSelect.value = settings.theme;
        saveSettings();
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
        const data = {
            habits: habits,
            categories: categories,
            settings: settings
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'habit-tracker-data.json';
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
                    if (confirm('This will replace all your current data. Are you sure?')) {
                        habits = data.habits || [];
                        categories = data.categories || ['General', 'Health', 'Productivity', 'Learning'];
                        settings = data.settings || { theme: 'light', reminders: false, reminderTime: '09:00' };
                        localStorage.setItem('habits', JSON.stringify(habits));
                        localStorage.setItem('categories', JSON.stringify(categories));
                        localStorage.setItem('settings', JSON.stringify(settings));
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
        if (confirm('This will delete all your habits and settings. This action cannot be undone. Are you sure?')) {
            localStorage.clear();
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
        localStorage.setItem('darkMode', darkMode);
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
    renderCategories();
});