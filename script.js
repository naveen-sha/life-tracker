document.addEventListener('DOMContentLoaded', function() {
    const storage = window.HabitTrackerStorage;
    const cloud = window.HabitTrackerCloud;
    let profile = storage.getCurrentProfile();
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
    const suggestionChipsEl = document.getElementById('suggestion-chips');
    const quickFiltersEl = document.getElementById('quick-filters');
    const habitCountStatusEl = document.getElementById('habit-count-status');
    const rankArenaEl = document.getElementById('rank-arena');
    const rankCharacterModelEl = document.getElementById('rank-character-model');
    const rankCharacterEmblemEl = document.getElementById('rank-character-emblem');
    const rankCharacterNameEl = document.getElementById('rank-character-name');
    const rankCharacterTitleEl = document.getElementById('rank-character-title');
    const rankBadgeEl = document.getElementById('rank-badge');
    const rankScoreValueEl = document.getElementById('rank-score-value');
    const rankTierProgressEl = document.getElementById('rank-tier-progress');
    const rankNextHintEl = document.getElementById('rank-next-hint');
    const rankStreakValueEl = document.getElementById('rank-streak-value');
    const rankConsistencyValueEl = document.getElementById('rank-consistency-value');
    const rankVolumeValueEl = document.getElementById('rank-volume-value');
    const gymDomainRateEl = document.getElementById('gym-domain-rate');
    const gymDomainCopyEl = document.getElementById('gym-domain-copy');
    const gymDomainQuickAddEl = document.getElementById('gym-domain-quick-add');
    const gymDomainListEl = document.getElementById('gym-domain-list');
    const learningDomainRateEl = document.getElementById('learning-domain-rate');
    const learningDomainCopyEl = document.getElementById('learning-domain-copy');
    const learningDomainQuickAddEl = document.getElementById('learning-domain-quick-add');
    const learningDomainListEl = document.getElementById('learning-domain-list');
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
    const gymPlanInputEl = document.getElementById('gym-plan-input');
    const gymPlanTypeEl = document.getElementById('gym-plan-type');
    const gymPlanAddBtnEl = document.getElementById('gym-plan-add-btn');
    const gymPlanListEl = document.getElementById('gym-plan-list');
    const gymPlanStatsEl = document.getElementById('gym-plan-stats');
    const gymPlanDurationEl = document.getElementById('gym-plan-duration');
    const gymPlanIntensityEl = document.getElementById('gym-plan-intensity');
    const learningPlanInputEl = document.getElementById('learning-plan-input');
    const learningPlanTypeEl = document.getElementById('learning-plan-type');
    const learningPlanAddBtnEl = document.getElementById('learning-plan-add-btn');
    const learningPlanListEl = document.getElementById('learning-plan-list');
    const learningPlanStatsEl = document.getElementById('learning-plan-stats');
    const learningPlanDurationEl = document.getElementById('learning-plan-duration');
    const learningPlanResourceEl = document.getElementById('learning-plan-resource');
    const gymGoalTitleEl = document.getElementById('gym-goal-title');
    const gymGoalTargetEl = document.getElementById('gym-goal-target');
    const gymGoalDeadlineEl = document.getElementById('gym-goal-deadline');
    const gymGoalRecurrenceEl = document.getElementById('gym-goal-recurrence');
    const gymGoalAddBtnEl = document.getElementById('gym-goal-add-btn');
    const gymGoalListEl = document.getElementById('gym-goal-list');
    const gymGoalStatsEl = document.getElementById('gym-goal-stats');
    const learningGoalTitleEl = document.getElementById('learning-goal-title');
    const learningGoalTargetEl = document.getElementById('learning-goal-target');
    const learningGoalDeadlineEl = document.getElementById('learning-goal-deadline');
    const learningGoalRecurrenceEl = document.getElementById('learning-goal-recurrence');
    const learningGoalAddBtnEl = document.getElementById('learning-goal-add-btn');
    const learningGoalListEl = document.getElementById('learning-goal-list');
    const learningGoalStatsEl = document.getElementById('learning-goal-stats');

    let habits = HabitTrackerData.normalizeHabits(profile.habits || []);
    let darkMode = profile.darkMode;
    let categories = profile.categories || HabitTrackerData.DEFAULT_CATEGORIES;
    let progressChart = null;
    let currentFilter = 'all';
    let undoPayload = null;
    let undoTimer = null;
    let plannerState = storage.getMeta('domainPlanner') || { gym: [], learning: [] };
    let goalState = storage.getMeta('domainGoals') || { gym: [], learning: [] };
    let cloudSyncTimer = null;
    let refreshRafId = 0;
    let searchDebounceTimer = null;
    let profileSettings = {
        ...storage.DEFAULT_SETTINGS,
        ...(profile.settings || {})
    };
    let lastReminderTriggerKey = storage.getMeta('lastReminderTriggerKey') || '';

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function calculateCurrentStreak(history) {
        const completed = new Set(Array.isArray(history) ? history : []);
        let streak = 0;
        const cursor = new Date();

        while (completed.has(cursor.toDateString())) {
            streak += 1;
            cursor.setDate(cursor.getDate() - 1);
        }

        return streak;
    }

    function normalizeHabitState(habit) {
        habit.history = [...new Set(Array.isArray(habit.history) ? habit.history : [])];
        habit.completedToday = habit.history.includes(HabitTrackerData.getTodayString());
        habit.streak = calculateCurrentStreak(habit.history);
    }

    function normalizeHabitsState() {
        habits.forEach(normalizeHabitState);
    }

    function saveHabits() {
        storage.saveHabits(habits);
        scheduleCloudSync();
    }

    function saveCategories() {
        storage.saveCategories(categories);
        scheduleCloudSync();
    }

    const RANK_ORDER = ['E', 'D', 'C', 'B', 'A', 'S'];

    function getRankValue(rank) {
        return RANK_ORDER.indexOf(rank);
    }

    function normalizePlannerState() {
        const safe = plannerState && typeof plannerState === 'object' ? plannerState : {};

        ['gym', 'learning'].forEach(domain => {
            if (!Array.isArray(safe[domain])) {
                safe[domain] = [];
            }

            safe[domain] = safe[domain].map(item => ({
                id: item.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                text: String(item.text || '').trim(),
                type: item.type === 'done' ? 'done' : 'plan',
                completed: Boolean(item.completed),
                duration: Math.max(0, Number(item.duration) || 0),
                intensity: ['light', 'medium', 'hard'].includes(item.intensity) ? item.intensity : 'medium',
                resource: String(item.resource || '').trim(),
                createdAt: item.createdAt || new Date().toISOString()
            })).filter(item => item.text);
        });

        plannerState = safe;
    }

    function savePlannerState() {
        storage.setMeta('domainPlanner', plannerState);
        scheduleCloudSync();
    }

    function normalizeGoalState() {
        const safe = goalState && typeof goalState === 'object' ? goalState : {};

        ['gym', 'learning'].forEach(domain => {
            if (!Array.isArray(safe[domain])) {
                safe[domain] = [];
            }

            safe[domain] = safe[domain].map(item => {
                const target = Math.max(1, Number(item.target) || 1);
                const completed = Math.max(0, Math.min(target, Number(item.completed) || 0));
                return {
                    id: item.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                    title: String(item.title || '').trim(),
                    target,
                    completed,
                    deadline: item.deadline || '',
                    recurrence: ['daily', 'weekly', 'monthly', 'none'].includes(item.recurrence) ? item.recurrence : 'none',
                    lastResetAt: item.lastResetAt || new Date().toISOString(),
                    createdAt: item.createdAt || new Date().toISOString()
                };
            }).filter(item => item.title);
        });

        goalState = safe;
    }

    function saveGoalState() {
        storage.setMeta('domainGoals', goalState);
        scheduleCloudSync();
    }

    function canCloudSync() {
        return Boolean(
            cloud &&
            typeof cloud.isReady === 'function' &&
            cloud.isReady() &&
            typeof cloud.getCurrentUser === 'function' &&
            cloud.getCurrentUser()
        );
    }

    function scheduleCloudSync() {
        if (!canCloudSync()) {
            return;
        }

        clearTimeout(cloudSyncTimer);
        cloudSyncTimer = setTimeout(function() {
            cloud.sync().catch(function() {
                // Keep silent on dashboard to avoid noisy alerts.
            });
        }, 900);
    }

    function scheduleRefresh() {
        if (refreshRafId) {
            return;
        }

        refreshRafId = window.requestAnimationFrame(function() {
            refreshRafId = 0;
            refreshAll();
        });
    }

    function playUISound(kind) {
        if (!profileSettings.soundEffects) {
            return;
        }

        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) {
            return;
        }

        try {
            const ctx = new AudioCtx();
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            const now = ctx.currentTime;

            if (kind === 'success') {
                o.type = 'sine';
                o.frequency.setValueAtTime(520, now);
                o.frequency.exponentialRampToValueAtTime(760, now + 0.2);
            } else if (kind === 'alarm') {
                o.type = 'triangle';
                o.frequency.setValueAtTime(440, now);
                o.frequency.exponentialRampToValueAtTime(900, now + 0.4);
            } else {
                o.type = 'square';
                o.frequency.setValueAtTime(420, now);
            }

            g.gain.setValueAtTime(0.0001, now);
            g.gain.exponentialRampToValueAtTime(0.14, now + 0.03);
            g.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
            o.connect(g);
            g.connect(ctx.destination);
            o.start(now);
            o.stop(now + 0.4);
        } catch (error) {
            // ignore audio failures
        }
    }

    function shouldResetRecurringGoal(goal, now) {
        if (!goal || goal.recurrence === 'none') {
            return false;
        }

        const last = new Date(goal.lastResetAt || goal.createdAt || now.toISOString());
        if (goal.recurrence === 'daily') {
            return now.toDateString() !== last.toDateString();
        }

        if (goal.recurrence === 'weekly') {
            const ms = now.getTime() - last.getTime();
            return ms >= 7 * 24 * 60 * 60 * 1000;
        }

        if (goal.recurrence === 'monthly') {
            return now.getMonth() !== last.getMonth() || now.getFullYear() !== last.getFullYear();
        }

        return false;
    }

    function applyRecurringGoalResets() {
        const now = new Date();
        let changed = false;

        ['gym', 'learning'].forEach(function(domain) {
            (goalState[domain] || []).forEach(function(goal) {
                if (goal.recurrence !== 'none' && shouldResetRecurringGoal(goal, now)) {
                    goal.completed = 0;
                    goal.lastResetAt = now.toISOString();
                    changed = true;
                }
            });
        });

        if (changed) {
            saveGoalState();
        }
    }

    function triggerReminderAlarm() {
        if (profileSettings.alarmSound !== false) {
            playUISound('alarm');
        }

        showUndoToast('Reminder: Time to check your habits and goals.', function() {});

        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                new Notification('Life Tracker Reminder', {
                    body: 'Open your tracker and log your progress now.'
                });
            } else if (Notification.permission === 'default') {
                Notification.requestPermission().catch(function() {});
            }
        }
    }

    function checkReminderAlarm() {
        if (!profileSettings.reminders || !profileSettings.reminderTime) {
            return;
        }

        const now = new Date();
        const hhmm = now.toTimeString().slice(0, 5);
        if (hhmm !== profileSettings.reminderTime) {
            return;
        }

        const triggerKey = `${now.toDateString()}-${hhmm}`;
        if (lastReminderTriggerKey === triggerKey) {
            return;
        }

        lastReminderTriggerKey = triggerKey;
        storage.setMeta('lastReminderTriggerKey', triggerKey);
        triggerReminderAlarm();
    }

    function reloadFromCurrentProfile() {
        profile = storage.getCurrentProfile();
        habits = HabitTrackerData.normalizeHabits(profile.habits || []);
        darkMode = profile.darkMode;
        categories = profile.categories || HabitTrackerData.DEFAULT_CATEGORIES;
        profileSettings = {
            ...storage.DEFAULT_SETTINGS,
            ...(profile.settings || {})
        };
        plannerState = storage.getMeta('domainPlanner') || { gym: [], learning: [] };
        goalState = storage.getMeta('domainGoals') || { gym: [], learning: [] };

        ensureCoreCategories();
        normalizePlannerState();
        normalizeGoalState();
        normalizeHabitsState();
        updateCategorySelect();
        renderSuggestionChips();
        document.body.classList.toggle('dark-mode', darkMode);
        darkModeToggle.innerHTML = darkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        scheduleRefresh();
    }

    function ensureCoreCategories() {
        ['Gym', 'Learning'].forEach(required => {
            if (!categories.includes(required)) {
                categories.push(required);
            }
        });
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

    function shouldEnable3DInteraction() {
        const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const coarse = window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches;
        const smallScreen = window.innerWidth < 992;
        return !reduced && !coarse && !smallScreen;
    }

    function applyTilt(card, point) {
        const rect = card.getBoundingClientRect();
        const x = point.clientX - rect.left;
        const y = point.clientY - rect.top;
        const rotateY = ((x / rect.width) - 0.5) * 12;
        const rotateX = ((0.5 - y / rect.height) * 10);
        card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
    }

    function setup3DInteractions() {
        const cards = document.querySelectorAll('.rank-arena-card, .domain-card, .planner-panel, .stat-card, .hero-dashboard-card');
        cards.forEach(card => {
            let rafId = 0;
            let point = null;
            card.classList.add('tilt-card');
            card.addEventListener('mousemove', function(event) {
                if (!shouldEnable3DInteraction()) {
                    return;
                }

                point = {
                    clientX: event.clientX,
                    clientY: event.clientY
                };

                if (rafId) {
                    return;
                }

                rafId = window.requestAnimationFrame(function() {
                    rafId = 0;
                    if (point) {
                        applyTilt(card, point);
                    }
                });
            });
            card.addEventListener('mouseleave', function() {
                point = null;
                card.style.transform = '';
            });
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

    function isDuplicateHabit(name, category, excludedHabit) {
        const normalizedName = name.trim().toLowerCase();
        const normalizedCategory = category.trim().toLowerCase();

        return habits.some(habit => {
            if (excludedHabit && habit === excludedHabit) {
                return false;
            }

            return habit.name.trim().toLowerCase() === normalizedName &&
                habit.category.trim().toLowerCase() === normalizedCategory;
        });
    }

    function setFilter(filterValue) {
        currentFilter = filterValue;
        if (!quickFiltersEl) {
            return;
        }

        quickFiltersEl.querySelectorAll('.filter-pill').forEach(button => {
            button.classList.toggle('active', button.dataset.filter === currentFilter);
        });
    }

    function getVisibleHabits() {
        const searchTerm = (searchInput.value || '').trim().toLowerCase();
        const today = HabitTrackerData.getTodayString();

        return habits.filter(habit => {
            if (searchTerm && !habit.name.toLowerCase().includes(searchTerm) && !habit.category.toLowerCase().includes(searchTerm)) {
                return false;
            }

            if (currentFilter === 'today') {
                return habit.history.includes(today);
            }

            if (currentFilter === 'pending') {
                return !habit.history.includes(today);
            }

            if (currentFilter === 'high-streak') {
                return habit.streak >= 7;
            }

            if (currentFilter === 'gym') {
                return habit.category.toLowerCase() === 'gym';
            }

            if (currentFilter === 'learning') {
                return habit.category.toLowerCase() === 'learning';
            }

            return true;
        });
    }

    function renderHabits() {
        const habitsToRender = sortHabits(getVisibleHabits());
        habitsList.innerHTML = '';

        if (habitCountStatusEl) {
            habitCountStatusEl.textContent = `${habitsToRender.length} of ${habits.length} habits shown`;
        }

        if (!habitsToRender.length) {
            habitsList.innerHTML = '<div class="empty-state-card">No habits match your current filters. Try another filter or search term.</div>';
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
            section.innerHTML = `<h2 class="category-title">${escapeHtml(category)}</h2>`;

            grouped[category].forEach(habit => {
                section.appendChild(createHabitCard(habit));
            });

            habitsList.appendChild(section);
        });
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
        renderRankArena();
        renderDomainCommandCenter();
        renderPlannerArena();
        renderGoalArena();
    }

    function renderRankArena() {
        if (!rankArenaEl) {
            return;
        }

        const rank = HabitTrackerData.getRankProfile(habits);
        const current = rank.current;
        const next = rank.next;

        rankArenaEl.setAttribute('data-rank', current.rank.toLowerCase());
        if (rankCharacterModelEl) {
            rankCharacterModelEl.setAttribute('data-rank', current.rank.toLowerCase());
        }
        rankCharacterEmblemEl.textContent = current.rank;
        rankCharacterNameEl.textContent = current.character;
        rankCharacterTitleEl.textContent = current.title;
        rankBadgeEl.innerHTML = `<i class="${current.icon}"></i> Rank ${current.rank}`;
        rankScoreValueEl.textContent = `${rank.score}/100 Power`;
        rankTierProgressEl.style.width = `${rank.progressWithinTier}%`;
        rankStreakValueEl.textContent = `${rank.metrics.longestStreak}d`;
        rankConsistencyValueEl.textContent = `${rank.metrics.completionRate30}%`;
        rankVolumeValueEl.textContent = `${rank.metrics.totalCompletions}`;

        if (next) {
            rankNextHintEl.textContent = `${rank.pointsToNext} more power points to reach Rank ${next.rank}.`;
        } else {
            rankNextHintEl.textContent = 'You are at the absolute top rank. Keep dominating.';
        }

        handleRankUpEffects(current.rank, current);
    }

    function playRankUpSound() {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) {
            return;
        }

        try {
            const audioCtx = new AudioCtx();
            const oscillator = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(392, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(784, audioCtx.currentTime + 0.18);
            oscillator.frequency.exponentialRampToValueAtTime(1175, audioCtx.currentTime + 0.34);

            gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.16, audioCtx.currentTime + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.42);

            oscillator.connect(gain);
            gain.connect(audioCtx.destination);
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.45);
        } catch (error) {
            // Silent fallback if autoplay/audio context is blocked.
        }
    }

    function showRankUpBanner(rankInfo) {
        const previous = document.querySelector('.rank-up-banner');
        if (previous) {
            previous.remove();
        }

        const banner = document.createElement('div');
        banner.className = 'rank-up-banner';
        banner.innerHTML = `
            <strong>Rank Up Unlocked</strong>
            <span>You reached Rank ${rankInfo.rank} · ${escapeHtml(rankInfo.title)}</span>
        `;
        document.body.appendChild(banner);

        setTimeout(function() {
            banner.classList.add('visible');
        }, 40);

        setTimeout(function() {
            banner.classList.remove('visible');
            setTimeout(function() {
                banner.remove();
            }, 300);
        }, 2800);
    }

    function handleRankUpEffects(currentRank, rankInfo) {
        const savedRank = storage.getMeta('lastKnownRank');

        if (!savedRank) {
            storage.setMeta('lastKnownRank', currentRank);
            return;
        }

        const currentValue = getRankValue(currentRank);
        const savedValue = getRankValue(savedRank);

        if (currentValue > savedValue) {
            rankArenaEl.classList.add('rank-up-active');
            setTimeout(function() {
                rankArenaEl.classList.remove('rank-up-active');
            }, 1400);

            if (typeof confetti === 'function') {
                confetti({ particleCount: 160, spread: 95, origin: { y: 0.52 } });
                confetti({ particleCount: 80, spread: 65, angle: 45, origin: { x: 0, y: 0.6 } });
                confetti({ particleCount: 80, spread: 65, angle: 135, origin: { x: 1, y: 0.6 } });
            }

            playRankUpSound();
            showRankUpBanner(rankInfo);
            storage.setMeta('lastKnownRank', currentRank);
            return;
        }

        if (currentValue !== savedValue) {
            storage.setMeta('lastKnownRank', currentRank);
        }
    }

    function getCategoryWeeklyRate(categoryName) {
        const targetCategory = categoryName.toLowerCase();
        const categoryHabits = habits.filter(habit => habit.category.toLowerCase() === targetCategory);
        if (!categoryHabits.length) {
            return 0;
        }

        const last7Days = HabitTrackerData.getLastNDays(7);
        const completed = last7Days.reduce((sum, day) => {
            return sum + categoryHabits.reduce((count, habit) => count + (habit.history.includes(day) ? 1 : 0), 0);
        }, 0);

        const capacity = categoryHabits.length * 7;
        return capacity ? Math.round((completed / capacity) * 100) : 0;
    }

    function renderDomainCard(categoryName, rateEl, copyEl, quickAddEl, listEl, templates) {
        if (!rateEl || !copyEl || !quickAddEl || !listEl) {
            return;
        }

        const targetCategory = categoryName.toLowerCase();
        const categoryHabits = habits
            .filter(habit => habit.category.toLowerCase() === targetCategory)
            .sort((a, b) => b.streak - a.streak || b.history.length - a.history.length);
        const domainGoals = goalState[targetCategory] || [];
        const completedGoals = domainGoals.filter(goal => goal.completed >= goal.target).length;

        const weeklyRate = getCategoryWeeklyRate(categoryName);
        rateEl.textContent = `${weeklyRate}% this week`;

        if (!categoryHabits.length) {
            copyEl.textContent = `No ${categoryName.toLowerCase()} habits yet. Add one quick start and begin your streak.`;
        } else {
            copyEl.textContent = `${categoryHabits.length} habits tracked. Best streak: ${categoryHabits[0].streak} days. Goals: ${completedGoals}/${domainGoals.length} completed.`;
        }

        quickAddEl.innerHTML = '';
        templates.forEach(template => {
            const button = document.createElement('button');
            button.className = 'domain-chip';
            button.textContent = template;
            button.addEventListener('click', function() {
                addHabit(template, categoryName);
            });
            quickAddEl.appendChild(button);
        });

        listEl.innerHTML = '';
        if (!categoryHabits.length) {
            listEl.innerHTML = '<div class="mini-message-card">Nothing here yet. Use a quick action above.</div>';
            return;
        }

        categoryHabits.slice(0, 4).forEach(habit => {
            const item = document.createElement('div');
            item.className = 'domain-list-item';
            item.innerHTML = `
                <div>
                    <strong>${escapeHtml(habit.name)}</strong>
                    <p>${habit.history.length} total check-ins</p>
                </div>
                <span>${habit.streak}d streak</span>
            `;
            listEl.appendChild(item);
        });
    }

    function renderDomainCommandCenter() {
        renderDomainCard(
            'Gym',
            gymDomainRateEl,
            gymDomainCopyEl,
            gymDomainQuickAddEl,
            gymDomainListEl,
            ['Upper body', 'Lower body', 'Cardio 20 min', 'Mobility 10 min']
        );

        renderDomainCard(
            'Learning',
            learningDomainRateEl,
            learningDomainCopyEl,
            learningDomainQuickAddEl,
            learningDomainListEl,
            ['Read 20 pages', 'Practice coding', 'Flashcards', 'Revision notes']
        );
    }

    function addPlannerEntry(domain, text, type, options) {
        const normalizedDomain = domain === 'learning' ? 'learning' : 'gym';
        const trimmedText = text.trim();
        if (!trimmedText) {
            return;
        }
        const meta = options && typeof options === 'object' ? options : {};
        const duration = Math.max(0, Number(meta.duration) || 0);

        plannerState[normalizedDomain].unshift({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            text: trimmedText,
            type: type === 'done' ? 'done' : 'plan',
            completed: type === 'done',
            duration,
            intensity: ['light', 'medium', 'hard'].includes(meta.intensity) ? meta.intensity : 'medium',
            resource: String(meta.resource || '').trim(),
            createdAt: new Date().toISOString()
        });

        savePlannerState();
        playUISound('success');
        renderPlannerArena();
    }

    function togglePlannerEntry(domain, id) {
        const list = plannerState[domain];
        const item = list.find(entry => entry.id === id);
        if (!item) {
            return;
        }

        item.completed = !item.completed;
        if (item.completed) {
            item.type = 'done';
        }

        savePlannerState();
        playUISound('success');
        renderPlannerArena();
    }

    function removePlannerEntry(domain, id) {
        plannerState[domain] = plannerState[domain].filter(item => item.id !== id);
        savePlannerState();
        renderPlannerArena();
    }

    function formatPlannerDate(iso) {
        try {
            return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } catch (error) {
            return '';
        }
    }

    function renderPlannerDomain(domain, listEl, statsEl) {
        if (!listEl || !statsEl) {
            return;
        }

        const entries = plannerState[domain];
        const doneCount = entries.filter(item => item.completed || item.type === 'done').length;
        statsEl.textContent = `${doneCount} done / ${entries.length} total`;
        listEl.innerHTML = '';

        if (!entries.length) {
            listEl.innerHTML = '<div class="mini-message-card">No entries yet. Add your first log or plan.</div>';
            return;
        }

        entries.slice(0, 10).forEach(item => {
            const row = document.createElement('div');
            row.className = `planner-item${item.completed ? ' completed' : ''}`;
            const plannerMeta = [
                item.duration > 0 ? `${item.duration} min` : '',
                domain === 'gym' ? `Intensity: ${item.intensity}` : '',
                domain === 'learning' && item.resource ? `Resource: ${escapeHtml(item.resource)}` : ''
            ].filter(Boolean).join(' - ');

            row.innerHTML = `
                <label class="planner-check">
                    <input type="checkbox" ${item.completed ? 'checked' : ''} data-domain="${domain}" data-id="${item.id}">
                    <span></span>
                </label>
                <div class="planner-item-copy">
                    <strong>${escapeHtml(item.text)}</strong>
                    <small>${item.type === 'done' ? 'Completed' : 'Planned'} - ${formatPlannerDate(item.createdAt)}${plannerMeta ? ` - ${plannerMeta}` : ''}</small>
                </div>
                <button class="planner-delete-btn" data-domain="${domain}" data-id="${item.id}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            listEl.appendChild(row);
        });
    }

    function addGoalEntry(domain, title, target, deadline, recurrence) {
        const normalizedDomain = domain === 'learning' ? 'learning' : 'gym';
        const trimmedTitle = String(title || '').trim();
        const normalizedTarget = Math.max(1, Number(target) || 1);
        const normalizedRecurrence = ['daily', 'weekly', 'monthly', 'none'].includes(recurrence) ? recurrence : 'none';
        if (!trimmedTitle) {
            return;
        }

        goalState[normalizedDomain].unshift({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            title: trimmedTitle,
            target: normalizedTarget,
            completed: 0,
            deadline: deadline || '',
            recurrence: normalizedRecurrence,
            lastResetAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
        });

        saveGoalState();
        playUISound('success');
        renderGoalArena();
        renderDomainCommandCenter();
    }

    function updateGoalProgress(domain, id, delta) {
        const list = goalState[domain] || [];
        const goal = list.find(item => item.id === id);
        if (!goal) {
            return;
        }

        goal.completed = Math.max(0, Math.min(goal.target, goal.completed + delta));
        saveGoalState();
        if (goal.completed >= goal.target) {
            playUISound('success');
        }
        renderGoalArena();
        renderDomainCommandCenter();
    }

    function removeGoalEntry(domain, id) {
        goalState[domain] = (goalState[domain] || []).filter(item => item.id !== id);
        saveGoalState();
        renderGoalArena();
        renderDomainCommandCenter();
    }

    function formatDeadline(value) {
        if (!value) {
            return 'No deadline';
        }

        try {
            return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch (error) {
            return 'No deadline';
        }
    }

    function renderGoalDomain(domain, listEl, statsEl) {
        if (!listEl || !statsEl) {
            return;
        }

        const goals = goalState[domain] || [];
        const completedCount = goals.filter(goal => goal.completed >= goal.target).length;
        statsEl.textContent = `${completedCount} done / ${goals.length} total`;
        listEl.innerHTML = '';

        if (!goals.length) {
            listEl.innerHTML = '<div class="mini-message-card">No goals yet. Add one target and start tracking progress.</div>';
            return;
        }

        goals.slice(0, 12).forEach(goal => {
            const percent = Math.round((goal.completed / goal.target) * 100);
            const row = document.createElement('div');
            row.className = `planner-item${goal.completed >= goal.target ? ' completed' : ''}`;
            row.innerHTML = `
                <div class="planner-item-copy">
                    <strong>${escapeHtml(goal.title)}</strong>
                    <small>${goal.completed}/${goal.target} sessions - Due: ${formatDeadline(goal.deadline)} - Repeat: ${goal.recurrence || 'none'}</small>
                    <div class="mini-progress-bar"><span style="width:${percent}%"></span></div>
                </div>
                <div class="goal-actions">
                    <button class="goal-action-btn" data-domain="${domain}" data-id="${goal.id}" data-action="dec">-1</button>
                    <button class="goal-action-btn" data-domain="${domain}" data-id="${goal.id}" data-action="inc">+1</button>
                    <button class="planner-delete-btn" data-domain="${domain}" data-id="${goal.id}" data-action="delete"><i class="fas fa-trash"></i></button>
                </div>
            `;
            listEl.appendChild(row);
        });
    }

    function renderPlannerArena() {
        renderPlannerDomain('gym', gymPlanListEl, gymPlanStatsEl);
        renderPlannerDomain('learning', learningPlanListEl, learningPlanStatsEl);
    }

    function renderGoalArena() {
        renderGoalDomain('gym', gymGoalListEl, gymGoalStatsEl);
        renderGoalDomain('learning', learningGoalListEl, learningGoalStatsEl);
    }

    function showUndoToast(message, onUndo) {
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `
            <span>${escapeHtml(message)}</span>
            <button type="button">Undo</button>
        `;

        const undoButton = toast.querySelector('button');
        undoButton.addEventListener('click', function() {
            clearTimeout(undoTimer);
            undoTimer = null;
            undoPayload = null;
            onUndo();
            toast.remove();
        });

        document.body.appendChild(toast);

        clearTimeout(undoTimer);
        undoTimer = setTimeout(function() {
            undoPayload = null;
            toast.remove();
        }, 5000);
    }

    function handleHabitToggle(habit, checked) {
        const today = HabitTrackerData.getTodayString();
        const todayIndex = habit.history.indexOf(today);

        if (checked && todayIndex === -1) {
            habit.history.push(today);
            if (typeof confetti === 'function') {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }
        }

        if (!checked && todayIndex > -1) {
            habit.history.splice(todayIndex, 1);
        }

        normalizeHabitState(habit);
        saveHabits();
        if (checked) {
            playUISound('success');
        }
        refreshAll();
    }

    function editHabit(habit) {
        const nextName = window.prompt('Edit habit name:', habit.name);
        if (nextName === null) {
            return;
        }

        const trimmedName = nextName.trim();
        if (!trimmedName) {
            return;
        }

        const nextCategoryRaw = window.prompt(
            `Edit category (existing: ${categories.join(', ')}):`,
            habit.category
        );
        if (nextCategoryRaw === null) {
            return;
        }

        const trimmedCategory = nextCategoryRaw.trim() || habit.category;

        if (isDuplicateHabit(trimmedName, trimmedCategory, habit)) {
            showUndoToast('Habit already exists in this category.', function() {});
            return;
        }

        habit.name = trimmedName;
        habit.category = trimmedCategory;

        if (!categories.includes(trimmedCategory)) {
            categories.push(trimmedCategory);
            saveCategories();
            updateCategorySelect();
            renderSuggestionChips();
        }

        normalizeHabitState(habit);
        saveHabits();
        refreshAll();
    }

    function deleteHabit(habit) {
        const index = habits.indexOf(habit);
        if (index === -1) {
            return;
        }

        const removed = habits.splice(index, 1)[0];
        saveHabits();
        refreshAll();

        undoPayload = { removed, index };
        showUndoToast(`Deleted "${removed.name}"`, function() {
            if (!undoPayload) {
                return;
            }

            const safeIndex = Math.max(0, Math.min(undoPayload.index, habits.length));
            habits.splice(safeIndex, 0, undoPayload.removed);
            undoPayload = null;
            saveHabits();
            refreshAll();
        });
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
                    <div class="habit-title-row">
                        <span class="habit-name">${escapeHtml(habit.name)}</span>
                    </div>
                    <div class="habit-meta-row">
                        <span class="habit-tag">${escapeHtml(habit.category)}</span>
                        <span class="habit-tag">${escapeHtml(level)}</span>
                        <span class="habit-tag">${last30Rate.percentage}% in 30 days</span>
                    </div>
                </div>
                <div class="habit-actions">
                    <label class="checkbox-wrap">
                        <input type="checkbox" class="checkbox" ${habit.completedToday ? 'checked' : ''}>
                    </label>
                    <div class="streak-container">
                        <span class="streak"><i class="fas fa-fire"></i> ${habit.streak}</span>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width:${Math.min((habit.streak / 30) * 100, 100)}%"></div>
                        </div>
                    </div>
                    <div class="habit-action-buttons">
                        <button class="edit-btn"><i class="fas fa-pen"></i> Edit</button>
                        <button class="delete-btn"><i class="fas fa-trash"></i> Delete</button>
                    </div>
                </div>
            </div>
        `;

        const checkbox = habitItem.querySelector('.checkbox');
        const editBtn = habitItem.querySelector('.edit-btn');
        const deleteBtn = habitItem.querySelector('.delete-btn');

        checkbox.addEventListener('change', function() {
            handleHabitToggle(habit, checkbox.checked);
        });
        editBtn.addEventListener('click', function() {
            editHabit(habit);
        });
        deleteBtn.addEventListener('click', function() {
            deleteHabit(habit);
        });

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

    function updateStats() {
        const metrics = HabitTrackerData.getMetrics(habits);
        totalHabitsEl.textContent = metrics.totalHabits;
        longestStreakEl.textContent = metrics.longestStreak;
        totalCompletionsEl.textContent = metrics.totalCompletions;
        todayCompletionsEl.textContent = metrics.todayCompletions;
        motivationQuoteEl.textContent = HabitTrackerData.QUOTES[Math.floor(Math.random() * HabitTrackerData.QUOTES.length)];
    }

    function renderChart() {
        const chartEl = document.getElementById('progressChart');
        if (!chartEl) {
            return;
        }

        const ctx = chartEl.getContext('2d');
        const trend = HabitTrackerData.getMonthlyTrend(habits);
        const labels = trend.map(item => item.label);
        const values = trend.map(item => item.completions);
        const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (progressChart) {
            progressChart.data.labels = labels;
            progressChart.data.datasets[0].data = values;
            progressChart.update('none');
            return;
        }

        progressChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Daily Completions',
                    data: values,
                    backgroundColor: 'rgba(0, 123, 255, 0.18)',
                    borderColor: 'rgba(0, 123, 255, 1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.35
                }]
            },
            options: {
                responsive: true,
                animation: {
                    duration: reducedMotion ? 0 : 260
                },
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
                    <strong>${escapeHtml(achievement.name)}</strong>
                    <small>${escapeHtml(achievement.description)}</small>
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
                <span class="habit-name">${escapeHtml(habit.name)}</span>
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
            dashboardSubtitleEl.textContent = `You have completed ${metrics.weeklyCompletionRate}% of this week's habit slots. Keep that energy going.`;
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
                <strong>${escapeHtml(bestHabit.name)}</strong>
                <p>${escapeHtml(bestHabit.category)} is currently your strongest habit.</p>
                <div class="summary-row-card">
                    <div>
                        <strong>${bestHabit.streak} day streak</strong>
                        <p>${monthlyRate.completed}/30 completions this month</p>
                    </div>
                    <span>${escapeHtml(HabitTrackerData.getHabitLevel(bestHabit))}</span>
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
                        <strong>${escapeHtml(item.name)}</strong>
                        <p>${escapeHtml(item.description)}</p>
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

        entries
            .sort((a, b) => b[1].completions - a[1].completions)
            .slice(0, 4)
            .forEach(([name, data]) => {
                const card = document.createElement('div');
                card.className = 'summary-row-card';
                card.innerHTML = `
                    <div>
                        <strong>${escapeHtml(name)}</strong>
                        <p>${data.habits} habits</p>
                    </div>
                    <span>${data.completions} wins</span>
                `;
                categoryHighlightsEl.appendChild(card);
            });
    }

    function addHabit(name, category) {
        const habitName = name.trim();
        const categoryName = (category || categorySelect.value || 'General').trim();

        if (!habitName) {
            return false;
        }

        if (isDuplicateHabit(habitName, categoryName)) {
            showUndoToast('Habit already exists in this category.', function() {});
            return false;
        }

        habits.push({
            name: habitName,
            category: categoryName,
            streak: 0,
            completedToday: false,
            history: []
        });

        if (!categories.includes(categoryName)) {
            categories.push(categoryName);
            saveCategories();
            updateCategorySelect();
        }

        saveHabits();
        playUISound('success');
        refreshAll();
        return true;
    }

    function renderSuggestionChips() {
        suggestionChipsEl.innerHTML = '';

        HabitTrackerData.getSuggestions(categories).forEach(suggestion => {
            const button = document.createElement('button');
            button.className = 'suggestion-chip';
            button.textContent = suggestion;
            button.addEventListener('click', function() {
                addHabit(suggestion, categorySelect.value);
                habitInput.value = '';
                habitInput.focus();
            });
            suggestionChipsEl.appendChild(button);
        });
    }

    function toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('mobile-open');
        sidebarOverlay.classList.toggle('active');

        if (sidebar.classList.contains('mobile-open')) {
            document.body.classList.add('ui-lock-scroll');
        } else if (!document.querySelector('.nav-menu') || !document.querySelector('.nav-menu').classList.contains('mobile-open')) {
            document.body.classList.remove('ui-lock-scroll');
        }
    }

    function closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.remove('mobile-open');
        sidebarOverlay.classList.remove('active');

        if (!document.querySelector('.nav-menu') || !document.querySelector('.nav-menu').classList.contains('mobile-open')) {
            document.body.classList.remove('ui-lock-scroll');
        }
    }

    addHabitBtn.addEventListener('click', function() {
        const added = addHabit(habitInput.value, categorySelect.value);
        if (added) {
            habitInput.value = '';
        }
    });

    habitInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            const added = addHabit(habitInput.value, categorySelect.value);
            if (added) {
                habitInput.value = '';
            }
        }
    });

    darkModeToggle.addEventListener('click', toggleDarkMode);
    sortSelect.addEventListener('change', scheduleRefresh);
    searchInput.addEventListener('input', function() {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(function() {
            scheduleRefresh();
        }, 110);
    });

    if (quickFiltersEl) {
        quickFiltersEl.addEventListener('click', function(event) {
            const filterBtn = event.target.closest('.filter-pill');
            if (!filterBtn) {
                return;
            }

            setFilter(filterBtn.dataset.filter || 'all');
            scheduleRefresh();
        });
    }

    if (gymPlanAddBtnEl) {
        gymPlanAddBtnEl.addEventListener('click', function() {
            addPlannerEntry('gym', gymPlanInputEl.value, gymPlanTypeEl.value, {
                duration: gymPlanDurationEl ? gymPlanDurationEl.value : 0,
                intensity: gymPlanIntensityEl ? gymPlanIntensityEl.value : 'medium'
            });
            gymPlanInputEl.value = '';
            if (gymPlanDurationEl) {
                gymPlanDurationEl.value = '';
            }
            gymPlanInputEl.focus();
        });
    }

    if (learningPlanAddBtnEl) {
        learningPlanAddBtnEl.addEventListener('click', function() {
            addPlannerEntry('learning', learningPlanInputEl.value, learningPlanTypeEl.value, {
                duration: learningPlanDurationEl ? learningPlanDurationEl.value : 0,
                resource: learningPlanResourceEl ? learningPlanResourceEl.value : ''
            });
            learningPlanInputEl.value = '';
            if (learningPlanDurationEl) {
                learningPlanDurationEl.value = '';
            }
            if (learningPlanResourceEl) {
                learningPlanResourceEl.value = '';
            }
            learningPlanInputEl.focus();
        });
    }

    if (gymPlanInputEl) {
        gymPlanInputEl.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                gymPlanAddBtnEl.click();
            }
        });
    }

    if (learningPlanInputEl) {
        learningPlanInputEl.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                learningPlanAddBtnEl.click();
            }
        });
    }

    function handlePlannerListInteraction(event) {
        const checkbox = event.target.closest('input[type="checkbox"][data-domain][data-id]');
        if (checkbox) {
            togglePlannerEntry(checkbox.dataset.domain, checkbox.dataset.id);
            return;
        }

        const deleteBtn = event.target.closest('.planner-delete-btn[data-domain][data-id]');
        if (deleteBtn) {
            removePlannerEntry(deleteBtn.dataset.domain, deleteBtn.dataset.id);
        }
    }

    function handleGoalListInteraction(event) {
        const actionBtn = event.target.closest('[data-action][data-domain][data-id]');
        if (!actionBtn) {
            return;
        }

        const domain = actionBtn.dataset.domain;
        const id = actionBtn.dataset.id;
        const action = actionBtn.dataset.action;

        if (action === 'inc') {
            updateGoalProgress(domain, id, 1);
            return;
        }

        if (action === 'dec') {
            updateGoalProgress(domain, id, -1);
            return;
        }

        if (action === 'delete') {
            removeGoalEntry(domain, id);
        }
    }

    if (gymPlanListEl) {
        gymPlanListEl.addEventListener('click', handlePlannerListInteraction);
    }

    if (learningPlanListEl) {
        learningPlanListEl.addEventListener('click', handlePlannerListInteraction);
    }

    if (gymGoalListEl) {
        gymGoalListEl.addEventListener('click', handleGoalListInteraction);
    }

    if (learningGoalListEl) {
        learningGoalListEl.addEventListener('click', handleGoalListInteraction);
    }

    if (gymGoalAddBtnEl) {
        gymGoalAddBtnEl.addEventListener('click', function() {
            addGoalEntry(
                'gym',
                gymGoalTitleEl.value,
                gymGoalTargetEl.value,
                gymGoalDeadlineEl.value,
                gymGoalRecurrenceEl ? gymGoalRecurrenceEl.value : 'none'
            );
            gymGoalTitleEl.value = '';
            gymGoalTargetEl.value = '';
            gymGoalDeadlineEl.value = '';
            if (gymGoalRecurrenceEl) {
                gymGoalRecurrenceEl.value = 'none';
            }
            gymGoalTitleEl.focus();
        });
    }

    if (learningGoalAddBtnEl) {
        learningGoalAddBtnEl.addEventListener('click', function() {
            addGoalEntry(
                'learning',
                learningGoalTitleEl.value,
                learningGoalTargetEl.value,
                learningGoalDeadlineEl.value,
                learningGoalRecurrenceEl ? learningGoalRecurrenceEl.value : 'none'
            );
            learningGoalTitleEl.value = '';
            learningGoalTargetEl.value = '';
            learningGoalDeadlineEl.value = '';
            if (learningGoalRecurrenceEl) {
                learningGoalRecurrenceEl.value = 'none';
            }
            learningGoalTitleEl.focus();
        });
    }

    sidebarToggle.addEventListener('click', toggleSidebar);

    if (sidebarClose) {
        sidebarClose.addEventListener('click', closeSidebar);
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', closeSidebar);
    });

    window.addEventListener('life-tracker-store-replaced', function() {
        reloadFromCurrentProfile();
    });

    window.addEventListener('life-tracker-auth-changed', function() {
        if (canCloudSync()) {
            cloud.sync().catch(function() {});
        }
    });

    const today = HabitTrackerData.getTodayString();
    const lastReset = storage.getMeta('lastReset');
    if (lastReset !== today) {
        habits.forEach(habit => {
            habit.completedToday = false;
        });
        storage.setMeta('lastReset', today);
    }

    ensureCoreCategories();
    normalizePlannerState();
    savePlannerState();
    normalizeGoalState();
    applyRecurringGoalResets();
    saveGoalState();
    normalizeHabitsState();
    saveHabits();
    saveCategories();
    setFilter('all');
    document.body.classList.toggle('dark-mode', darkMode);
    darkModeToggle.innerHTML = darkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    updateCategorySelect();
    updateLiveDateTime();
    setInterval(updateLiveDateTime, 1000);
    setInterval(checkReminderAlarm, 20000);
    updateDailyTip();
    renderSuggestionChips();
    setup3DInteractions();
    refreshAll();

    if (canCloudSync()) {
        cloud.sync().catch(function() {});
    }

    checkReminderAlarm();
});


