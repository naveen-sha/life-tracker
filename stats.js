document.addEventListener('DOMContentLoaded', function() {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const totalHabitsEl = document.getElementById('total-habits');
    const longestStreakEl = document.getElementById('longest-streak');
    const totalCompletionsEl = document.getElementById('total-completions');
    const todayCompletionsEl = document.getElementById('today-completions');
    const completionRateEl = document.getElementById('completion-rate');
    const avgStreakEl = document.getElementById('avg-streak');

    let habits = JSON.parse(localStorage.getItem('habits')) || [];
    let darkMode = localStorage.getItem('darkMode') === 'true';

    function toggleDarkMode() {
        darkMode = !darkMode;
        document.body.classList.toggle('dark-mode', darkMode);
        localStorage.setItem('darkMode', darkMode);
        darkModeToggle.innerHTML = darkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }

    function updateStats() {
        const totalHabits = habits.length;
        const longestStreak = habits.reduce((max, habit) => Math.max(max, habit.streak), 0);
        const totalCompletions = habits.reduce((sum, habit) => sum + habit.history.length, 0);
        const today = new Date().toDateString();
        const todayCompletions = habits.reduce((sum, habit) => sum + (habit.history.includes(today) ? 1 : 0), 0);
        const totalPossible = totalHabits * 30; // Assuming 30 days
        const completionRate = totalPossible > 0 ? Math.round((totalCompletions / totalPossible) * 100) : 0;
        const avgStreak = totalHabits > 0 ? Math.round(habits.reduce((sum, habit) => sum + habit.streak, 0) / totalHabits) : 0;

        totalHabitsEl.textContent = totalHabits;
        longestStreakEl.textContent = longestStreak;
        totalCompletionsEl.textContent = totalCompletions;
        todayCompletionsEl.textContent = todayCompletions;
        completionRateEl.textContent = `${completionRate}%`;
        avgStreakEl.textContent = avgStreak;
    }

    function renderMonthlyChart() {
        const ctx = document.getElementById('monthlyChart').getContext('2d');
        const last30Days = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            last30Days.push(date.toDateString());
        }

        const dailyCompletions = last30Days.map(day => {
            return habits.reduce((count, habit) => {
                return count + (habit.history.includes(day) ? 1 : 0);
            }, 0);
        });

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: last30Days.map(day => new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
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

    function renderCategoryChart() {
        const ctx = document.getElementById('categoryChart').getContext('2d');
        const categories = {};

        habits.forEach(habit => {
            if (!categories[habit.category]) {
                categories[habit.category] = 0;
            }
            categories[habit.category] += habit.history.length;
        });

        const categoryLabels = Object.keys(categories);
        const categoryData = Object.values(categories);

        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: categoryLabels,
                datasets: [{
                    data: categoryData,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(153, 102, 255, 0.6)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Completions by Category'
                    }
                }
            }
        });
    }

    darkModeToggle.addEventListener('click', toggleDarkMode);

    // Initialize
    document.body.classList.toggle('dark-mode', darkMode);
    darkModeToggle.innerHTML = darkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    updateStats();
    renderMonthlyChart();
    renderCategoryChart();
});