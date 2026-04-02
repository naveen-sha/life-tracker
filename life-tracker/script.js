document.addEventListener('DOMContentLoaded', function() {
    const habitInput = document.getElementById('habit-input');
    const categorySelect = document.getElementById('category-select');
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

    let habits = JSON.parse(localStorage.getItem('habits')) || [];
    let darkMode = localStorage.getItem('darkMode') === 'true';
    let categories = JSON.parse(localStorage.getItem('categories')) || ['General', 'Health', 'Productivity', 'Learning'];

    const quotes = [
        "\"The journey of a thousand miles begins with a single step.\" - Lao Tzu",
        "\"Success is not final, failure is not fatal: It is the courage to continue that counts.\" - Winston Churchill",
        "\"Don't watch the clock; do what it does. Keep going.\" - Sam Levenson",
        "\"The only way to do great work is to love what you do.\" - Steve Jobs",
        "\"Believe you can and you're halfway there.\" - Theodore Roosevelt"
    ];

    const achievements = [
        { id: 'first-habit', name: 'First Steps', description: 'Create your first habit', icon: 'fas fa-seedling', condition: () => habits.length >= 1 },
        { id: 'week-streak', name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: 'fas fa-fire', condition: () => habits.some(h => h.streak >= 7) },
        { id: 'month-streak', name: 'Month Master', description: 'Maintain a 30-day streak', icon: 'fas fa-crown', condition: () => habits.some(h => h.streak >= 30) },
        { id: 'five-habits', name: 'Habit Collector', description: 'Create 5 habits', icon: 'fas fa-th-list', condition: () => habits.length >= 5 },
        { id: 'perfect-week', name: 'Perfect Week', description: 'Complete all habits for 7 days', icon: 'fas fa-star', condition: () => {
            const last7Days = getLast7Days();
            return habits.length > 0 && habits.every(habit => last7Days.every(day => habit.history.includes(day)));
        }},
        { id: 'hundred-completions', name: 'Century Club', description: 'Reach 100 total completions', icon: 'fas fa-trophy', condition: () => habits.reduce((sum, h) => sum + h.history.length, 0) >= 100 }
    ];

    const dailyTips = [
        "Start small! Focus on building one habit at a time.",
        "Consistency beats perfection. Better to do a little every day than a lot once a week.",
        "Track your progress visually to stay motivated.",
        "Reward yourself when you reach milestones.",
        "If you miss a day, get back on track immediately - don't let it become two days.",
        "Share your goals with friends for accountability.",
        "Set specific times for your habits to make them routine.",
        "Review your progress weekly and adjust as needed."
    ];

    function saveHabits() {
        localStorage.setItem('habits', JSON.stringify(habits));
    }

    function toggleDarkMode() {
        darkMode = !darkMode;
        document.body.classList.toggle('dark-mode', darkMode);
        localStorage.setItem('darkMode', darkMode);
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

    function getLast7Days() {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push(date.toDateString());
        }
        return days;
    }

    function updateStats() {
        const totalHabits = habits.length;
        const longestStreak = habits.reduce((max, habit) => Math.max(max, habit.streak), 0);
        const totalCompletions = habits.reduce((sum, habit) => sum + habit.history.length, 0);
        const today = new Date().toDateString();
        const todayCompletions = habits.reduce((sum, habit) => sum + (habit.history.includes(today) ? 1 : 0), 0);

        totalHabitsEl.textContent = totalHabits;
        longestStreakEl.textContent = longestStreak;
        totalCompletionsEl.textContent = totalCompletions;
        todayCompletionsEl.textContent = todayCompletions;

        motivationQuoteEl.textContent = quotes[Math.floor(Math.random() * quotes.length)];
    }

    function renderHabits(filteredHabits = null) {
        const habitsToRender = filteredHabits || habits;
        habitsList.innerHTML = '';
        const categoriesObj = {};
        const last7Days = getLast7Days();

        habitsToRender.forEach(habit => {
            if (!categoriesObj[habit.category]) {
                categoriesObj[habit.category] = [];
            }
            categoriesObj[habit.category].push(habit);
        });

        for (const category in categoriesObj) {
            const categorySection = document.createElement('div');
            categorySection.className = 'category-section';

            const categoryTitle = document.createElement('h2');
            categoryTitle.className = 'category-title';
            categoryTitle.textContent = category;
            categorySection.appendChild(categoryTitle);

            categoriesObj[category].forEach((habit) => {
                const habitItem = document.createElement('div');
                habitItem.className = 'habit-item';

                const habitHeader = document.createElement('div');
                habitHeader.className = 'habit-header';

                const habitName = document.createElement('span');
                habitName.className = 'habit-name';
                habitName.textContent = habit.name;

                const habitActions = document.createElement('div');
                habitActions.className = 'habit-actions';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'checkbox';
                checkbox.checked = habit.completedToday;
                checkbox.addEventListener('change', () => {
                    habit.completedToday = checkbox.checked;
                    const today = new Date().toDateString();
                    if (checkbox.checked) {
                        if (!habit.history.includes(today)) {
                            habit.history.push(today);
                            habit.streak++;
                            confetti({
                                particleCount: 100,
                                spread: 70,
                                origin: { y: 0.6 }
                            });
                        }
                    } else {
                        const index = habit.history.indexOf(today);
                        if (index > -1) {
                            habit.history.splice(index, 1);
                            habit.streak = Math.max(0, habit.streak - 1);
                        }
                    }
                    saveHabits();
                    renderHabits();
                    renderChart();
                    updateStats();
                    renderAchievements();
                    updateWeeklySummary();
                });

                const streakContainer = document.createElement('div');
                streakContainer.className = 'streak-container';

                const streak = document.createElement('span');
                streak.className = 'streak';
                streak.textContent = `🔥 ${habit.streak}`;

                const progressBar = document.createElement('div');
                progressBar.className = 'progress-bar';
                const progressFill = document.createElement('div');
                progressFill.className = 'progress-fill';
                progressFill.style.width = `${Math.min((habit.streak / 30) * 100, 100)}%`;
                progressBar.appendChild(progressFill);

                streakContainer.appendChild(streak);
                streakContainer.appendChild(progressBar);

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-btn';
                deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete';
                deleteBtn.addEventListener('click', () => {
                    habits.splice(habits.indexOf(habit), 1);
                    saveHabits();
                    renderHabits();
                    renderChart();
                    updateStats();
                    renderAchievements();
                    updateWeeklySummary();
                });

                habitActions.appendChild(checkbox);
                habitActions.appendChild(streakContainer);
                habitActions.appendChild(deleteBtn);

                habitHeader.appendChild(habitName);
                habitHeader.appendChild(habitActions);

                habitItem.appendChild(habitHeader);

                // Add progress table
                const progressTable = document.createElement('table');
                progressTable.className = 'progress-table';
                const thead = document.createElement('thead');
                const tbody = document.createElement('tbody');

                const headerRow = document.createElement('tr');
                last7Days.forEach(day => {
                    const th = document.createElement('th');
                    th.textContent = new Date(day).toLocaleDateString('en-US', { weekday: 'short' });
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

                categorySection.appendChild(habitItem);
            });

            habitsList.appendChild(categorySection);
        }
    }

    function renderChart() {
        const ctx = document.getElementById('progressChart').getContext('2d');
        const last7Days = getLast7Days();
        const dailyCompletions = last7Days.map(day => {
            return habits.reduce((count, habit) => {
                return count + (habit.history.includes(day) ? 1 : 0);
            }, 0);
        });

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: last7Days.map(day => new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
                datasets: [{
                    label: 'Daily Completions',
                    data: dailyCompletions,
                    backgroundColor: 'rgba(0, 123, 255, 0.2)',
                    borderColor: 'rgba(0, 123, 255, 1)',
                    borderWidth: 2,
                    fill: true
                }]
            },
            options: {
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

    function filterHabits(searchTerm) {
        const filteredHabits = habits.filter(habit =>
            habit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            habit.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
        renderHabits(filteredHabits);
    }

    function renderAchievements() {
        achievementsList.innerHTML = '';
        achievements.forEach(achievement => {
            const achievementEl = document.createElement('div');
            achievementEl.className = 'achievement';
            
            const isUnlocked = achievement.condition();
            if (isUnlocked) {
                achievementEl.classList.add('unlocked');
            }

            achievementEl.innerHTML = `
                <i class="${achievement.icon} achievement-icon"></i>
                <div class="achievement-text">
                    <strong>${achievement.name}</strong>
                    <small>${achievement.description}</small>
                </div>
            `;

            achievementsList.appendChild(achievementEl);
        });
    }

    function updateWeeklySummary() {
        weeklySummaryEl.innerHTML = '';
        const last7Days = getLast7Days();
        
        habits.forEach(habit => {
            const completedDays = last7Days.filter(day => habit.history.includes(day)).length;
            const percentage = Math.round((completedDays / 7) * 100);
            
            const summaryItem = document.createElement('div');
            summaryItem.className = 'weekly-summary-item';
            summaryItem.innerHTML = `
                <span class="habit-name">${habit.name}</span>
                <span class="progress">${completedDays}/7 (${percentage}%)</span>
            `;
            
            weeklySummaryEl.appendChild(summaryItem);
        });
    }

    function updateDailyTip() {
        const today = new Date().toDateString();
        const lastTipUpdate = localStorage.getItem('lastTipUpdate');
        
        if (lastTipUpdate !== today) {
            const randomTip = dailyTips[Math.floor(Math.random() * dailyTips.length)];
            dailyTipEl.textContent = randomTip;
            localStorage.setItem('lastTipUpdate', today);
        }
    }

    addHabitBtn.addEventListener('click', function() {
        const habitName = habitInput.value.trim();
        const category = categorySelect.value;
        if (habitName) {
            habits.push({
                name: habitName,
                category: category,
                streak: 0,
                completedToday: false,
                history: []
            });
            habitInput.value = '';
            saveHabits();
            renderHabits();
            renderChart();
            updateStats();
            renderAchievements();
            updateWeeklySummary();
        }
    });

    darkModeToggle.addEventListener('click', toggleDarkMode);

    // Search functionality
    searchInput.addEventListener('input', function() {
        filterHabits(this.value);
    });

    // Mobile navigation
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

    // Close mobile menu when clicking nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            closeMobileMenu();
            closeSidebar();
        });
    });

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

    // Reset completedToday at the start of a new day
    const today = new Date().toDateString();
    const lastReset = localStorage.getItem('lastReset');
    if (lastReset !== today) {
        habits.forEach(habit => {
            habit.completedToday = false;
        });
        localStorage.setItem('lastReset', today);
        saveHabits();
    }

    // Initialize
    document.body.classList.toggle('dark-mode', darkMode);
    darkModeToggle.innerHTML = darkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    updateCategorySelect();
    renderHabits();
    renderChart();
    updateStats();
    renderAchievements();
    updateWeeklySummary();
    updateDailyTip();
});