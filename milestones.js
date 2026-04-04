document.addEventListener('DOMContentLoaded', function() {
    const storage = window.HabitTrackerStorage;
    const ui = window.HabitTrackerUI || {};
    const profile = storage.getCurrentProfile();
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const roadmapConsistencyEl = document.getElementById('roadmap-consistency');
    const roadmapConsistencyCopyEl = document.getElementById('roadmap-consistency-copy');
    const roadmapListEl = document.getElementById('roadmap-list');
    const momentumNotesEl = document.getElementById('momentum-notes');
    const categoryMomentumEl = document.getElementById('category-momentum');

    let habits = HabitTrackerData.normalizeHabits(profile.habits || []);
    let darkMode = typeof ui.resolveDarkMode === 'function' ? ui.resolveDarkMode(profile) : profile.darkMode;

    function toggleDarkMode() {
        darkMode = !darkMode;
        document.body.classList.toggle('dark-mode', darkMode);
        storage.setDarkMode(darkMode);
        if (typeof ui.renderThemeToggleIcon === 'function') {
            ui.renderThemeToggleIcon(darkModeToggle, darkMode);
        } else {
            darkModeToggle.innerHTML = darkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        }
    }

    function renderRoadmap() {
        const achievements = HabitTrackerData.getAchievementStatus(habits)
            .sort((a, b) => Number(a.unlocked) - Number(b.unlocked) || b.percentage - a.percentage);

        roadmapListEl.innerHTML = '';

        achievements.forEach(item => {
            const row = document.createElement('div');
            row.className = `roadmap-item${item.unlocked ? ' done' : ''}`;
            row.innerHTML = `
                <div class="roadmap-marker"><i class="${item.icon}"></i></div>
                <div class="roadmap-content">
                    <div class="section-title-row">
                        <strong>${item.name}</strong>
                        <span class="section-chip">${item.unlocked ? 'Done' : `${item.remaining} left`}</span>
                    </div>
                    <p>${item.description}</p>
                    <div class="mini-progress-bar"><span style="width:${item.percentage}%"></span></div>
                </div>
            `;
            roadmapListEl.appendChild(row);
        });
    }

    function renderMomentumNotes() {
        const metrics = HabitTrackerData.getMetrics(habits);
        const notes = [];

        notes.push(metrics.bestHabit
            ? `${metrics.bestHabit.name} is leading with a ${metrics.bestHabit.streak}-day streak.`
            : 'Create your first habit to start building momentum.');
        notes.push(`You have shown up on ${metrics.activeDays30} of the last 30 days.`);
        notes.push(metrics.weeklyCompletionRate >= 60
            ? `Strong pace: ${metrics.weeklyCompletionRate}% of your weekly habit slots are complete.`
            : `Your weekly completion rate is ${metrics.weeklyCompletionRate}%. A few more check-ins will lift it fast.`);
        notes.push(`${HabitTrackerData.getUnlockedCount(habits)} achievements are already unlocked.`);

        momentumNotesEl.innerHTML = '';
        notes.forEach(note => {
            const card = document.createElement('div');
            card.className = 'mini-message-card';
            card.textContent = note;
            momentumNotesEl.appendChild(card);
        });

        roadmapConsistencyEl.textContent = `${metrics.completionRate30}%`;
        roadmapConsistencyCopyEl.textContent = `${metrics.perfectDays30} perfect days logged in the last 30 days.`;
    }

    function renderCategoryMomentum() {
        const categories = HabitTrackerData.getCategoryBreakdown(habits);
        const entries = Object.entries(categories);
        categoryMomentumEl.innerHTML = '';

        if (!entries.length) {
            categoryMomentumEl.innerHTML = '<div class="mini-message-card">Categories will show up here after you add habits.</div>';
            return;
        }

        entries
            .sort((a, b) => b[1].completions - a[1].completions)
            .forEach(([name, data]) => {
                const card = document.createElement('div');
                card.className = 'summary-row-card';
                card.innerHTML = `
                    <div>
                        <strong>${name}</strong>
                        <p>${data.habits} habits tracked</p>
                    </div>
                    <span>${data.completions} completions</span>
                `;
                categoryMomentumEl.appendChild(card);
            });
    }

    darkModeToggle.addEventListener('click', toggleDarkMode);

    document.body.classList.toggle('dark-mode', darkMode);
    if (typeof ui.renderThemeToggleIcon === 'function') {
        ui.renderThemeToggleIcon(darkModeToggle, darkMode);
    } else {
        darkModeToggle.innerHTML = darkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }
    renderRoadmap();
    renderMomentumNotes();
    renderCategoryMomentum();
});



