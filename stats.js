document.addEventListener('DOMContentLoaded', function() {
    const storage = window.HabitTrackerStorage;
    const profile = storage.getCurrentProfile();
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const totalHabitsEl = document.getElementById('total-habits');
    const longestStreakEl = document.getElementById('longest-streak');
    const totalCompletionsEl = document.getElementById('total-completions');
    const todayCompletionsEl = document.getElementById('today-completions');
    const completionRateEl = document.getElementById('completion-rate');
    const avgStreakEl = document.getElementById('avg-streak');
    const statsAchievementSummaryEl = document.getElementById('stats-achievement-summary');
    const statsBestHabitEl = document.getElementById('stats-best-habit');

    let habits = HabitTrackerData.normalizeHabits(profile.habits || []);
    let darkMode = profile.darkMode;
    let monthlyChart = null;
    let yearlyChart = null;
    let categoryChart = null;

    function toggleDarkMode() {
        darkMode = !darkMode;
        document.body.classList.toggle('dark-mode', darkMode);
        storage.setDarkMode(darkMode);
        darkModeToggle.innerHTML = darkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }

    function updateStats() {
        const metrics = HabitTrackerData.getMetrics(habits);
        totalHabitsEl.textContent = metrics.totalHabits;
        longestStreakEl.textContent = metrics.longestStreak;
        totalCompletionsEl.textContent = metrics.totalCompletions;
        todayCompletionsEl.textContent = metrics.todayCompletions;
        completionRateEl.textContent = `${metrics.completionRate30}%`;
        avgStreakEl.textContent = metrics.averageStreak;
    }

    function getLast12Months() {
        const months = [];
        const current = new Date();
        current.setDate(1);

        for (let i = 11; i >= 0; i--) {
            const date = new Date(current.getFullYear(), current.getMonth() - i, 1);
            months.push({
                key: `${date.getFullYear()}-${date.getMonth()}`,
                label: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
                total: 0
            });
        }

        habits.forEach(habit => {
            habit.history.forEach(day => {
                const date = new Date(day);
                const key = `${date.getFullYear()}-${date.getMonth()}`;
                const bucket = months.find(month => month.key === key);
                if (bucket) {
                    bucket.total += 1;
                }
            });
        });

        return months;
    }

    function renderMonthlyChart() {
        const ctx = document.getElementById('monthlyChart').getContext('2d');
        const trend = HabitTrackerData.getMonthlyTrend(habits);

        if (monthlyChart) {
            monthlyChart.destroy();
        }

        monthlyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: trend.map(item => item.label),
                datasets: [{
                    label: 'Daily Completions',
                    data: trend.map(item => item.completions),
                    backgroundColor: 'rgba(54, 162, 235, 0.18)',
                    borderColor: 'rgba(54, 162, 235, 1)',
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

    function renderYearlyChart() {
        const ctx = document.getElementById('yearlyChart').getContext('2d');
        const months = getLast12Months();

        if (yearlyChart) {
            yearlyChart.destroy();
        }

        yearlyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months.map(month => month.label),
                datasets: [{
                    label: 'Monthly Completions',
                    data: months.map(month => month.total),
                    backgroundColor: 'rgba(40, 167, 69, 0.72)',
                    borderRadius: 12
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
                        beginAtZero: true
                    }
                }
            }
        });
    }

    function renderCategoryChart() {
        const ctx = document.getElementById('categoryChart').getContext('2d');
        const categories = HabitTrackerData.getCategoryBreakdown(habits);
        const labels = Object.keys(categories);
        const values = Object.values(categories).map(item => item.completions);

        if (categoryChart) {
            categoryChart.destroy();
        }

        categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.75)',
                        'rgba(54, 162, 235, 0.75)',
                        'rgba(255, 206, 86, 0.75)',
                        'rgba(75, 192, 192, 0.75)',
                        'rgba(153, 102, 255, 0.75)',
                        'rgba(255, 159, 64, 0.75)'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
    }

    function renderAchievementSummary() {
        const achievements = HabitTrackerData.getAchievementStatus(habits);
        const unlocked = achievements.filter(item => item.unlocked).length;
        const next = HabitTrackerData.getNextAchievements(habits, 2);

        statsAchievementSummaryEl.innerHTML = `
            <div class="summary-row-card">
                <div>
                    <strong>${unlocked}/${achievements.length} unlocked</strong>
                    <p>Badges earned so far</p>
                </div>
                <span>${Math.round((unlocked / achievements.length) * 100 || 0)}%</span>
            </div>
        `;

        next.forEach(item => {
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
            statsAchievementSummaryEl.appendChild(card);
        });
    }

    function renderBestHabit() {
        const bestHabit = HabitTrackerData.getMetrics(habits).bestHabit;

        if (!bestHabit) {
            statsBestHabitEl.innerHTML = '<div class="mini-message-card">Add habits to populate deeper statistics.</div>';
            return;
        }

        const completionRate = HabitTrackerData.getHabitCompletionRate(bestHabit, 30);
        statsBestHabitEl.innerHTML = `
            <div class="summary-row-card">
                <div>
                    <strong>${bestHabit.name}</strong>
                    <p>${bestHabit.category} · ${HabitTrackerData.getHabitLevel(bestHabit)}</p>
                </div>
                <span>${bestHabit.streak} day streak</span>
            </div>
            <div class="mini-progress-card">
                <div class="mini-progress-header">
                    <div>
                        <strong>30-Day reliability</strong>
                        <p>${completionRate.completed} completions in the last 30 days</p>
                    </div>
                    <span>${completionRate.percentage}%</span>
                </div>
                <div class="mini-progress-bar"><span style="width:${completionRate.percentage}%"></span></div>
            </div>
        `;
    }

    darkModeToggle.addEventListener('click', toggleDarkMode);

    document.body.classList.toggle('dark-mode', darkMode);
    darkModeToggle.innerHTML = darkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    updateStats();
    renderMonthlyChart();
    renderYearlyChart();
    renderCategoryChart();
    renderAchievementSummary();
    renderBestHabit();
});
