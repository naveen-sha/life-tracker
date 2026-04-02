document.addEventListener('DOMContentLoaded', function() {
    const storage = window.HabitTrackerStorage;
    const profile = storage.getCurrentProfile();
    const habitInput = document.getElementById('habit-input');
    const categorySelect = document.getElementById('category-select');
    const sortSelect = document.getElementById('sort-select');
    const addHabitBtn = document.getElementById('add-habit-btn');
    const habitsList = document.getElementById('habits-list');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const totalHabitsEl = document.getElementById('total-habits');
    const longestStreakEl = document.getElementById('longest-streak');
    const totalCompletionsEl = document.getElementById('total-completions');
    const todayCompletionsEl = document.getElementById('today-completions');
    const motivationQuoteEl = document.getElementById('motivation-quote');
    const searchInput = document.getElementById('search-input');
    const achievementsList = document.getElementById('achievements-list');
    const dailyTipEl = document.getElementById('daily-tip');
    const weeklySummaryEl = document.getElementById('weekly-summary');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebarClose = document.getElementById('sidebar-close');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const navMenu = document.querySelector('.nav-menu');
    const suggestionChipsEl = document.getElementById('suggestion-chips');
    const dashboardWelcomeEl = document.getElementById('dashboard-welcome');
    const dashboardSubtitleEl = document.getElementById('dashboard-subtitle');
    const achievementProgressTextEl = document.getElementById('achievement-progress-text');
    const achievementProgressBarEl = document.getElementById('achievement-progress-bar');
    const heroProgressCopyEl = document.getElementById('hero-progress-copy');
    const focusHabitCardEl = document.getElementById('focus-habit-card');
    const nextAchievementsEl = document.getElementById('next-achievements');
    const categoryHighlightsEl = document.getElementById('category-highlights');
    const liveDateTimeEl = document.getElementById('live-datetime');
    const liveDateCopyEl = document.getElementById('live-date-copy');

    let habits = HabitTrackerData.normalizeHabits(profile.habits || []);
    let darkMode = profile.darkMode;
    let categories = profile.categories || HabitTrackerData.DEFAULT_CATEGORIES;
    let progressChart = null;

    function saveHabits() {
        storage.saveHabits(habits);
    }

    function saveCategories() {
        storage.saveCategories(categories);
    }

    function toggleDarkMode() {
        darkMode = !darkMode;
        document.body.classList.toggle('dark-mode', darkMode);
        storage.setDarkMode(darkMode);
        darkModeToggle.innerHTML = darkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }

    function updateCategorySelect() {
        categorySelect.innerHTML = '';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    }

    function updateLiveDateTime() {
        const now = new Date();
        liveDateTimeEl.textContent = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        liveDateCopyEl.textContent = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    function sortHabits(habitsToSort) {
        const mode = sortSelect.value;
        const sorted = [...habitsToSort];

        if (mode === 'streak') {
            sorted.sort((a, b) => b.streak - a.streak || b.history.length - a.history.length);
        } else if (mode === 'recent') {
            sorted.sort((a, b) => b.history.length - a.history.length || b.streak - a.streak);
        } else if (mode === 'name') {
            sorted.sort((a, b) => a.name.localeCompare(b.name));
        } else {
            sorted.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
        }

        return sorted;
    }

    function refreshAll() {
        renderHabits();
        renderChart();
        updateStats();
        renderAchievements();
        updateWeeklySummary();
        renderHero();
        renderFocusHabit();
        renderNextAchievements();
        renderCategoryHighlights();
    }

    function handleHabitToggle(habit, checked) {
        habit.completedToday = checked;
        const today = HabitTrackerData.getTodayString();

        if (checked) {
            if (!habit.history.includes(today)) {
                habit.history.push(today);
                habit.streak += 1;

                if (typeof confetti === 'function') {
                    confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 }
                    });
                }
            }
        } else {
            const index = habit.history.indexOf(today);
            if (index > -1) {
                habit.history.splice(index, 1);
            }
            habit.streak = Math.max(0, habit.streak - 1);
        }

        saveHabits();
        refreshAll();
    }

    function deleteHabit(habit) {
        habits = habits.filter(item => item !== habit);
        saveHabits();
        refreshAll();
    }

    function createHabitCard(habit) {
        const habitItem = document.createElement('div');
        habitItem.className = 'habit-item';

        const last30Rate = HabitTrackerData.getHabitCompletionRate(habit, 30);
        const level = HabitTrackerData.getHabitLevel(habit);
        const last7Days = HabitTrackerData.getLastNDays(7);

        habitItem.innerHTML = `
            <div class="habit-header">
                <div>
                    <span class="habit-name">${habit.name}</span>
                    <div class="habit-meta-row">
                        <span class="habit-tag">${habit.category}</span>
                        <span class="habit-tag">${level}</span>
                        <span class="habit-tag">${last30Rate.percentage}% in 30 days</span>
                    </div>
                </div>
                <div class="habit-actions">
                    <label class="checkbox-wrap">
                        <input type="checkbox" class="checkbox" ${habit.completedToday ? 'checked' : ''}>
                    </label>
                    <div class="streak-container">
                        <span class="streak">🔥 ${habit.streak}</span>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width:${Math.min((habit.streak / 30) * 100, 100)}%"></div>
                        </div>
                    </div>
                    <button class="delete-btn"><i class="fas fa-trash"></i> Delete</button>
                </div>
            </div>
        `;

        const checkbox = habitItem.querySelector('.checkbox');
        const deleteBtn = habitItem.querySelector('.delete-btn');

        checkbox.addEventListener('change', () => handleHabitToggle(habit, checkbox.checked));
        deleteBtn.addEventListener('click', () => deleteHabit(habit));

        const progressTable = document.createElement('table');
        progressTable.className = 'progress-table';
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');

        const headerRow = document.createElement('tr');
        last7Days.forEach(day => {
            const th = document.createElement('th');
            th.textContent = HabitTrackerData.getDateLabel(day, { weekday: 'short' });
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);

        const dataRow = document.createElement('tr');
        last7Days.forEach(day => {
            const td = document.createElement('td');
            if (habit.history.includes(day)) {
                td.innerHTML = '<i class="fas fa-check-circle"></i>';
                td.className = 'completed';
            } else {
                td.innerHTML = '<i class="far fa-circle"></i>';
                td.className = 'not-completed';
            }
            dataRow.appendChild(td);
        });
        tbody.appendChild(dataRow);
        progressTable.appendChild(thead);
        progressTable.appendChild(tbody);
        habitItem.appendChild(progressTable);

        return habitItem;
    }

    function renderHabits(filteredHabits) {
        const habitsToRender = sortHabits(filteredHabits || habits);
        habitsList.innerHTML = '';

        if (!habitsToRender.length) {
            habitsList.innerHTML = '<div class="empty-state-card">No habits match right now. Try adding one or clear the search.</div>';
            return;
        }

        const grouped = habitsToRender.reduce((acc, habit) => {
            if (!acc[habit.category]) {
                acc[habit.category] = [];
            }
            acc[habit.category].push(habit);
            return acc;
        }, {});

        Object.keys(grouped).forEach(category => {
            const section = document.createElement('div');
            section.className = 'category-section';
            section.innerHTML = `<h2 class="category-title">${category}</h2>`;
            grouped[category].forEach(habit => section.appendChild(createHabitCard(habit)));
            habitsList.appendChild(section);
        });
    }

    function updateStats() {
        const metrics = HabitTrackerData.getMetrics(habits);
        totalHabitsEl.textContent = metrics.totalHabits;
        longestStreakEl.textContent = metrics.longestStreak;
        totalCompletionsEl.textContent = metrics.totalCompletions;
        todayCompletionsEl.textContent = metrics.todayCompletions;
        motivationQuoteEl.textContent = HabitTrackerData.QUOTES[Math.floor(Math.random() * HabitTrackerData.QUOTES.length)];
    }

    function renderChart() {
        const ctx = document.getElementById('progressChart').getContext('2d');
        const trend = HabitTrackerData.getMonthlyTrend(habits);

        if (progressChart) {
            progressChart.destroy();
        }

        progressChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: trend.map(item => item.label),
                datasets: [{
                    label: 'Daily Completions',
                    data: trend.map(item => item.completions),
                    backgroundColor: 'rgba(0, 123, 255, 0.18)',
                    borderColor: 'rgba(0, 123, 255, 1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.35
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    function renderAchievements() {
        const achievements = HabitTrackerData.getAchievementStatus(habits);
        achievementsList.innerHTML = '';

        achievements.forEach(achievement => {
            const achievementEl = document.createElement('div');
            achievementEl.className = `achievement${achievement.unlocked ? ' unlocked' : ''}`;
            achievementEl.innerHTML = `
                <i class="${achievement.icon} achievement-icon"></i>
                <div class="achievement-text">
                    <strong>${achievement.name}</strong>
                    <small>${achievement.description}</small>
                    <div class="mini-progress-bar"><span style="width:${achievement.percentage}%"></span></div>
                </div>
                <span class="achievement-value">${achievement.current}/${achievement.target}</span>
            `;
            achievementsList.appendChild(achievementEl);
        });
    }

    function updateWeeklySummary() {
        const weekly = HabitTrackerData.getWeeklyHabitSummary(habits);
        weeklySummaryEl.innerHTML = '';

        if (!weekly.length) {
            weeklySummaryEl.innerHTML = '<div class="mini-message-card">Your weekly summary will appear after you add habits.</div>';
            return;
        }

        weekly.slice(0, 6).forEach(habit => {
            const summaryItem = document.createElement('div');
            summaryItem.className = 'weekly-summary-item';
            summaryItem.innerHTML = `
                <span class="habit-name">${habit.name}</span>
                <span class="progress">${habit.completedDays}/7 (${habit.percentage}%)</span>
            `;
            weeklySummaryEl.appendChild(summaryItem);
        });
    }

    function updateDailyTip() {
        const today = HabitTrackerData.getTodayString();
        const lastTipUpdate = storage.getMeta('lastTipUpdate');

        if (lastTipUpdate !== today) {
            const randomTip = HabitTrackerData.DAILY_TIPS[Math.floor(Math.random() * HabitTrackerData.DAILY_TIPS.length)];
            dailyTipEl.textContent = randomTip;
            storage.setMeta('lastTipUpdate', today);
        } else {
            dailyTipEl.textContent = dailyTipEl.textContent || HabitTrackerData.DAILY_TIPS[0];
        }
    }

    function renderHero() {
        const metrics = HabitTrackerData.getMetrics(habits);
        const achievements = HabitTrackerData.getAchievementStatus(habits);
        const unlocked = achievements.filter(item => item.unlocked).length;
        const completionPercent = achievements.length ? Math.round((unlocked / achievements.length) * 100) : 0;
        const next = HabitTrackerData.getNextAchievements(habits, 1)[0];

        if (!metrics.totalHabits) {
            dashboardWelcomeEl.textContent = 'Your streak story starts here';
            dashboardSubtitleEl.textContent = 'Add a habit and start building a routine you can actually keep for the whole year.';
        } else if (metrics.weeklyCompletionRate >= 70) {
            dashboardWelcomeEl.textContent = 'You are in a strong rhythm';
            dashboardSubtitleEl.textContent = `You have completed ${metrics.weeklyCompletionRate}% of this week’s habit slots. Keep that energy going.`;
        } else {
            dashboardWelcomeEl.textContent = 'Small check-ins will move this fast';
            dashboardSubtitleEl.textContent = `You have ${metrics.totalCompletions} total completions so far. Today is a good day to push the streak forward.`;
        }

        achievementProgressTextEl.textContent = `${unlocked} of ${achievements.length} unlocked`;
        achievementProgressBarEl.style.width = `${completionPercent}%`;
        heroProgressCopyEl.textContent = next
            ? `${next.name} is next: ${next.current}/${next.target}`
            : 'Everything is unlocked. Set a bigger challenge next.';
    }

    function renderFocusHabit() {
        const bestHabit = HabitTrackerData.getMetrics(habits).bestHabit;

        if (!bestHabit) {
            focusHabitCardEl.innerHTML = '<div class="mini-message-card">Your focus habit will appear once you start tracking.</div>';
            return;
        }

        const monthlyRate = HabitTrackerData.getHabitCompletionRate(bestHabit, 30);
        focusHabitCardEl.innerHTML = `
            <div class="focus-card">
                <strong>${bestHabit.name}</strong>
                <p>${bestHabit.category} is currently your strongest habit.</p>
                <div class="summary-row-card">
                    <div>
                        <strong>${bestHabit.streak} day streak</strong>
                        <p>${monthlyRate.completed}/30 completions this month</p>
                    </div>
                    <span>${HabitTrackerData.getHabitLevel(bestHabit)}</span>
                </div>
            </div>
        `;
    }

    function renderNextAchievements() {
        const nextItems = HabitTrackerData.getNextAchievements(habits, 3);
        nextAchievementsEl.innerHTML = '';

        if (!nextItems.length) {
            nextAchievementsEl.innerHTML = '<div class="mini-message-card">No locked achievements left. You cleared the board.</div>';
            return;
        }

        nextItems.forEach(item => {
            const card = document.createElement('div');
            card.className = 'mini-progress-card';
            card.innerHTML = `
                <div class="mini-progress-header">
                    <div>
                        <strong>${item.name}</strong>
                        <p>${item.description}</p>
                    </div>
                    <span>${item.current}/${item.target}</span>
                </div>
                <div class="mini-progress-bar"><span style="width:${item.percentage}%"></span></div>
            `;
            nextAchievementsEl.appendChild(card);
        });
    }

    function renderCategoryHighlights() {
        const entries = Object.entries(HabitTrackerData.getCategoryBreakdown(habits));
        categoryHighlightsEl.innerHTML = '';

        if (!entries.length) {
            categoryHighlightsEl.innerHTML = '<div class="mini-message-card">Category highlights will appear after you add habits.</div>';
            return;
        }

        entries.sort((a, b) => b[1].completions - a[1].completions).slice(0, 4).forEach(([name, data]) => {
            const card = document.createElement('div');
            card.className = 'summary-row-card';
            card.innerHTML = `
                <div>
                    <strong>${name}</strong>
                    <p>${data.habits} habits</p>
                </div>
                <span>${data.completions} wins</span>
            `;
            categoryHighlightsEl.appendChild(card);
        });
    }

    function filterHabits(searchTerm) {
        const filtered = habits.filter(habit =>
            habit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            habit.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
        renderHabits(filtered);
    }

    function addHabit(name, category) {
        const habitName = name.trim();
        if (!habitName) {
            return;
        }

        habits.push({
            name: habitName,
            category: category || categorySelect.value,
            streak: 0,
            completedToday: false,
            history: []
        });

        saveHabits();
        refreshAll();
    }

    function renderSuggestionChips() {
        suggestionChipsEl.innerHTML = '';

        HabitTrackerData.getSuggestions(categories).forEach(suggestion => {
            const button = document.createElement('button');
            button.className = 'suggestion-chip';
            button.textContent = suggestion;
            button.addEventListener('click', () => {
                habitInput.value = suggestion;
                habitInput.focus();
            });
            suggestionChipsEl.appendChild(button);
        });
    }

    function toggleMobileMenu() {
        navMenu.classList.toggle('mobile-open');
    }

    function closeMobileMenu() {
        navMenu.classList.remove('mobile-open');
    }

    function toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('mobile-open');
        sidebarOverlay.classList.toggle('active');
        document.body.style.overflow = sidebar.classList.contains('mobile-open') ? 'hidden' : '';
    }

    function closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.remove('mobile-open');
        sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    addHabitBtn.addEventListener('click', function() {
        addHabit(habitInput.value, categorySelect.value);
        habitInput.value = '';
    });

    habitInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            addHabit(habitInput.value, categorySelect.value);
            habitInput.value = '';
        }
    });

    darkModeToggle.addEventListener('click', toggleDarkMode);
    sortSelect.addEventListener('change', () => renderHabits());
    searchInput.addEventListener('input', function() {
        filterHabits(this.value);
    });

    sidebarToggle.addEventListener('click', function() {
        toggleMobileMenu();
        toggleSidebar();
    });

    if (sidebarClose) {
        sidebarClose.addEventListener('click', function() {
            closeMobileMenu();
            closeSidebar();
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function() {
            closeMobileMenu();
            closeSidebar();
        });
    }

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            closeMobileMenu();
            closeSidebar();
        });
    });

    const today = HabitTrackerData.getTodayString();
    const lastReset = storage.getMeta('lastReset');
    if (lastReset !== today) {
        habits.forEach(habit => {
            habit.completedToday = false;
        });
        storage.setMeta('lastReset', today);
        saveHabits();
    }

    saveCategories();
    document.body.classList.toggle('dark-mode', darkMode);
    darkModeToggle.innerHTML = darkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    updateCategorySelect();
    updateLiveDateTime();
    setInterval(updateLiveDateTime, 1000);
    updateDailyTip();
    renderSuggestionChips();
    refreshAll();
});
