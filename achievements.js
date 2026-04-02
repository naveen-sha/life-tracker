document.addEventListener('DOMContentLoaded', function() {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const unlockedCountEl = document.getElementById('achievement-unlocked-count');
    const unlockedCopyEl = document.getElementById('achievement-unlocked-copy');
    const nextCardsEl = document.getElementById('next-achievement-cards');
    const championHabitsEl = document.getElementById('champion-habits');
    const allAchievementsGridEl = document.getElementById('all-achievements-grid');
    const badgeProgressSummaryEl = document.getElementById('badge-progress-summary');

    let habits = HabitTrackerData.normalizeHabits(JSON.parse(localStorage.getItem('habits')) || []);
    let darkMode = localStorage.getItem('darkMode') === 'true';

    function toggleDarkMode() {
        darkMode = !darkMode;
        document.body.classList.toggle('dark-mode', darkMode);
        localStorage.setItem('darkMode', darkMode);
        darkModeToggle.innerHTML = darkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }

    function renderOverview() {
        const achievements = HabitTrackerData.getAchievementStatus(habits);
        const unlocked = achievements.filter(item => item.unlocked).length;
        const percentage = achievements.length ? Math.round((unlocked / achievements.length) * 100) : 0;

        unlockedCountEl.textContent = `${unlocked} / ${achievements.length}`;
        unlockedCopyEl.textContent = unlocked === achievements.length
            ? 'Every badge is unlocked. You are on a serious roll.'
            : `${achievements.length - unlocked} badges still waiting for you.`;
        badgeProgressSummaryEl.textContent = `${percentage}% complete`;
    }

    function renderNextWins() {
        const nextAchievements = HabitTrackerData.getNextAchievements(habits, 3);
        nextCardsEl.innerHTML = '';

        if (!nextAchievements.length) {
            nextCardsEl.innerHTML = '<div class="mini-message-card">All achievements unlocked. Time to raise your own challenge.</div>';
            return;
        }

        nextAchievements.forEach(item => {
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
            nextCardsEl.appendChild(card);
        });
    }

    function renderChampions() {
        const weekly = HabitTrackerData.getWeeklyHabitSummary(habits).slice(0, 4);
        championHabitsEl.innerHTML = '';

        if (!weekly.length) {
            championHabitsEl.innerHTML = '<div class="mini-message-card">Add a few habits and your champions will appear here.</div>';
            return;
        }

        weekly.forEach((habit, index) => {
            const card = document.createElement('div');
            card.className = 'summary-row-card';
            card.innerHTML = `
                <div>
                    <strong>#${index + 1} ${habit.name}</strong>
                    <p>${habit.category} · ${habit.level}</p>
                </div>
                <span>${habit.completedDays}/7 days</span>
            `;
            championHabitsEl.appendChild(card);
        });
    }

    function renderAllBadges() {
        const achievements = HabitTrackerData.getAchievementStatus(habits);
        allAchievementsGridEl.innerHTML = '';

        achievements.forEach(item => {
            const card = document.createElement('article');
            card.className = `achievement-detail-card${item.unlocked ? ' unlocked' : ''}`;
            card.innerHTML = `
                <div class="achievement-detail-top">
                    <i class="${item.icon} achievement-icon"></i>
                    <span class="achievement-state">${item.unlocked ? 'Unlocked' : 'In Progress'}</span>
                </div>
                <h3>${item.name}</h3>
                <p>${item.description}</p>
                <div class="mini-progress-bar"><span style="width:${item.percentage}%"></span></div>
                <div class="achievement-detail-meta">
                    <span>${item.current}/${item.target}</span>
                    <span>${item.percentage}%</span>
                </div>
            `;
            allAchievementsGridEl.appendChild(card);
        });
    }

    darkModeToggle.addEventListener('click', toggleDarkMode);

    document.body.classList.toggle('dark-mode', darkMode);
    darkModeToggle.innerHTML = darkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    renderOverview();
    renderNextWins();
    renderChampions();
    renderAllBadges();
});
