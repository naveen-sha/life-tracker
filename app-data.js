(function() {
    const DEFAULT_CATEGORIES = ['General', 'Gym', 'Health', 'Productivity', 'Learning'];
    const QUOTES = [
        '"The journey of a thousand miles begins with a single step." - Lao Tzu',
        '"Success is the sum of small efforts repeated day in and day out." - Robert Collier',
        '"Small disciplines repeated with consistency every day lead to great achievements." - John C. Maxwell',
        '"Motivation gets you going, but discipline keeps you growing." - John C. Maxwell',
        '"You do not rise to the level of your goals. You fall to the level of your systems." - James Clear'
    ];
    const DAILY_TIPS = [
        'Start small and stay repeatable. Tiny wins build lasting habits.',
        'Missing one day is normal. The fastest recovery creates momentum.',
        'Pair a habit with a fixed time or place to make it easier to repeat.',
        'A visible streak is motivating, but showing up matters more than perfection.',
        'Review your habits weekly so you can keep the useful ones and reshape the weak ones.',
        'If a habit feels heavy, shrink it until it becomes easy to start.',
        'Energy changes every day. Build systems that still work on low-energy days.',
        'Celebrate consistency, not just big milestones.'
    ];

    function normalizeHabits(habits) {
        return (Array.isArray(habits) ? habits : []).map(habit => ({
            name: habit.name || 'Untitled Habit',
            category: habit.category || 'General',
            streak: Number(habit.streak) || 0,
            completedToday: Boolean(habit.completedToday),
            history: Array.isArray(habit.history) ? [...new Set(habit.history)] : []
        }));
    }

    function getTodayString() {
        return new Date().toDateString();
    }

    function getDateDaysAgo(daysAgo) {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        return date;
    }

    function getLastNDays(count) {
        const days = [];
        for (let i = count - 1; i >= 0; i--) {
            days.push(getDateDaysAgo(i).toDateString());
        }
        return days;
    }

    function getDateLabel(dateString, options) {
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    function getCompletionCountForDate(habits, dateString) {
        return habits.reduce((count, habit) => count + (habit.history.includes(dateString) ? 1 : 0), 0);
    }

    function getHabitCompletionRate(habit, days) {
        const totalDays = days || 30;
        const recentDays = getLastNDays(totalDays);
        const completed = recentDays.filter(day => habit.history.includes(day)).length;
        return {
            completed,
            total: totalDays,
            percentage: Math.round((completed / totalDays) * 100)
        };
    }

    function getBestHabit(habits) {
        if (!habits.length) {
            return null;
        }

        return [...habits].sort((a, b) => {
            if (b.streak !== a.streak) {
                return b.streak - a.streak;
            }
            return b.history.length - a.history.length;
        })[0];
    }

    function getCategoryBreakdown(habits) {
        return habits.reduce((acc, habit) => {
            if (!acc[habit.category]) {
                acc[habit.category] = {
                    habits: 0,
                    completions: 0
                };
            }

            acc[habit.category].habits += 1;
            acc[habit.category].completions += habit.history.length;
            return acc;
        }, {});
    }

    function getMetrics(habitsInput) {
        const habits = normalizeHabits(habitsInput);
        const today = getTodayString();
        const last7Days = getLastNDays(7);
        const last30Days = getLastNDays(30);
        const totalHabits = habits.length;
        const totalCompletions = habits.reduce((sum, habit) => sum + habit.history.length, 0);
        const longestStreak = habits.reduce((max, habit) => Math.max(max, habit.streak), 0);
        const todayCompletions = getCompletionCountForDate(habits, today);
        const averageStreak = totalHabits ? Math.round(habits.reduce((sum, habit) => sum + habit.streak, 0) / totalHabits) : 0;
        const completionRate30 = totalHabits ? Math.round((last30Days.reduce((sum, day) => sum + getCompletionCountForDate(habits, day), 0) / (totalHabits * 30)) * 100) : 0;
        const activeDays30 = last30Days.filter(day => getCompletionCountForDate(habits, day) > 0).length;
        const perfectDays30 = last30Days.filter(day => totalHabits > 0 && getCompletionCountForDate(habits, day) === totalHabits).length;
        const categoriesUsed = Object.keys(getCategoryBreakdown(habits)).length;
        const bestHabit = getBestHabit(habits);
        const weeklyCompletions = last7Days.reduce((sum, day) => sum + getCompletionCountForDate(habits, day), 0);
        const weeklyCapacity = totalHabits * 7;
        const weeklyCompletionRate = weeklyCapacity ? Math.round((weeklyCompletions / weeklyCapacity) * 100) : 0;

        return {
            totalHabits,
            totalCompletions,
            longestStreak,
            todayCompletions,
            averageStreak,
            completionRate30,
            activeDays30,
            perfectDays30,
            categoriesUsed,
            bestHabit,
            weeklyCompletions,
            weeklyCompletionRate
        };
    }

    const ACHIEVEMENTS = [
        { id: 'first-habit', name: 'First Steps', description: 'Create your first habit.', icon: 'fas fa-seedling', target: 1, progress: habits => habits.length },
        { id: 'habit-collector', name: 'Habit Collector', description: 'Build a stack of 5 habits.', icon: 'fas fa-layer-group', target: 5, progress: habits => getMetrics(habits).totalHabits },
        { id: 'week-streak', name: 'Week Warrior', description: 'Reach a 7-day streak on any habit.', icon: 'fas fa-fire', target: 7, progress: habits => getMetrics(habits).longestStreak },
        { id: 'month-streak', name: 'Month Master', description: 'Reach a 30-day streak on any habit.', icon: 'fas fa-crown', target: 30, progress: habits => getMetrics(habits).longestStreak },
        { id: 'century-club', name: 'Century Club', description: 'Log 100 total completions.', icon: 'fas fa-trophy', target: 100, progress: habits => getMetrics(habits).totalCompletions },
        { id: 'consistency-star', name: 'Consistency Star', description: 'Hit a 70% completion rate over the last 30 days.', icon: 'fas fa-star', target: 70, progress: habits => getMetrics(habits).completionRate30 },
        {
            id: 'perfect-week',
            name: 'Perfect Week',
            description: 'Complete every habit for 7 straight days.',
            icon: 'fas fa-medal',
            target: 7,
            progress: habits => {
                const normalized = normalizeHabits(habits);
                const last7Days = getLastNDays(7);

                if (!normalized.length) {
                    return 0;
                }

                return last7Days.filter(day => getCompletionCountForDate(normalized, day) === normalized.length).length;
            }
        },
        { id: 'category-explorer', name: 'Category Explorer', description: 'Track habits in 3 different categories.', icon: 'fas fa-compass', target: 3, progress: habits => getMetrics(habits).categoriesUsed },
        { id: 'active-month', name: 'Active Month', description: 'Show up on 20 days in the last 30 days.', icon: 'fas fa-calendar-check', target: 20, progress: habits => getMetrics(habits).activeDays30 },
        { id: 'perfect-ten', name: 'Perfect Ten', description: 'Earn 10 perfect days in the last 30 days.', icon: 'fas fa-gem', target: 10, progress: habits => getMetrics(habits).perfectDays30 }
    ];

    function getAchievementStatus(habitsInput) {
        const habits = normalizeHabits(habitsInput);

        return ACHIEVEMENTS.map(achievement => {
            const current = achievement.progress(habits);
            const unlocked = current >= achievement.target;
            const percentage = Math.max(0, Math.min(100, Math.round((current / achievement.target) * 100)));

            return {
                id: achievement.id,
                name: achievement.name,
                description: achievement.description,
                icon: achievement.icon,
                target: achievement.target,
                current,
                unlocked,
                percentage,
                remaining: Math.max(0, achievement.target - current)
            };
        });
    }

    function getUnlockedCount(habits) {
        return getAchievementStatus(habits).filter(item => item.unlocked).length;
    }

    function getNextAchievements(habits, limit) {
        const max = limit || 3;
        return getAchievementStatus(habits)
            .filter(item => !item.unlocked)
            .sort((a, b) => b.percentage - a.percentage || a.remaining - b.remaining)
            .slice(0, max);
    }

    function getHabitLevel(habit) {
        const completions = habit.history.length;
        if (completions >= 60) return 'Legend';
        if (completions >= 30) return 'Elite';
        if (completions >= 15) return 'Rising';
        if (completions >= 5) return 'Starter';
        return 'New';
    }

    function getWeeklyHabitSummary(habitsInput) {
        const habits = normalizeHabits(habitsInput);
        const last7Days = getLastNDays(7);

        return habits.map(habit => {
            const completedDays = last7Days.filter(day => habit.history.includes(day)).length;
            return {
                name: habit.name,
                category: habit.category,
                streak: habit.streak,
                history: habit.history,
                completedDays,
                percentage: Math.round((completedDays / 7) * 100),
                level: getHabitLevel(habit)
            };
        }).sort((a, b) => b.percentage - a.percentage || b.streak - a.streak);
    }

    function getMonthlyTrend(habitsInput) {
        const habits = normalizeHabits(habitsInput);
        const days = getLastNDays(30);

        return days.map(day => ({
            day,
            label: getDateLabel(day, { month: 'short', day: 'numeric' }),
            completions: getCompletionCountForDate(habits, day)
        }));
    }

    function getSuggestions(categoriesInput) {
        const categories = categoriesInput && categoriesInput.length ? categoriesInput : DEFAULT_CATEGORIES;
        const suggestionMap = {
            General: ['Plan tomorrow', 'Read 10 pages', 'Evening reflection'],
            Gym: ['Strength training', 'Mobility 10 min', 'Core workout'],
            Health: ['Drink water', 'Stretch 10 min', 'Walk after lunch'],
            Productivity: ['Deep work block', 'Inbox zero', 'Top 3 tasks'],
            Learning: ['Practice coding', 'Flashcards', 'Watch a tutorial', 'Write study notes']
        };

        const suggestions = categories.flatMap(category => suggestionMap[category] || [`${category} review`]);
        return [...new Set(suggestions)].slice(0, 8);
    }

    window.HabitTrackerData = {
        DEFAULT_CATEGORIES,
        QUOTES,
        DAILY_TIPS,
        ACHIEVEMENTS,
        normalizeHabits,
        getTodayString,
        getLastNDays,
        getDateLabel,
        getCompletionCountForDate,
        getHabitCompletionRate,
        getCategoryBreakdown,
        getMetrics,
        getAchievementStatus,
        getUnlockedCount,
        getNextAchievements,
        getWeeklyHabitSummary,
        getMonthlyTrend,
        getSuggestions,
        getHabitLevel
    };
})();
