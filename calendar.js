document.addEventListener('DOMContentLoaded', function() {
    const storage = window.HabitTrackerStorage;
    let profile = storage.getCurrentProfile();

    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const currentMonthEl = document.getElementById('current-month');
    const calendarDaysEl = document.getElementById('calendar-days');

    const calTotalDaysEl = document.getElementById('cal-total-days');
    const calBestStreakEl = document.getElementById('cal-best-streak');
    const calCurrentStreakEl = document.getElementById('cal-current-streak');
    const calActiveRateEl = document.getElementById('cal-active-rate');
    const calDayTitleEl = document.getElementById('cal-day-title');
    const calDaySummaryEl = document.getElementById('cal-day-summary');
    const calDayHabitsEl = document.getElementById('cal-day-habits');

    const calEventDateEl = document.getElementById('cal-event-date');
    const calEventTypeEl = document.getElementById('cal-event-type');
    const calEventTitleEl = document.getElementById('cal-event-title');
    const calEventNoteEl = document.getElementById('cal-event-note');
    const calEventAddBtnEl = document.getElementById('cal-event-add-btn');
    const calendarEventListEl = document.getElementById('calendar-event-list');
    const calendarUpcomingListEl = document.getElementById('calendar-upcoming-list');

    let habits = window.HabitTrackerData
        ? HabitTrackerData.normalizeHabits(profile.habits || [])
        : (profile.habits || []);
    let plannerState = storage.getMeta('domainPlanner') || { gym: [], learning: [] };
    let goalState = storage.getMeta('domainGoals') || { gym: [], learning: [] };
    let calendarEvents = storage.getMeta('calendarEvents') || [];
    let darkMode = profile.darkMode;
    let currentDate = new Date();
    let selectedDate = new Date();
    let profileSettings = {
        ...storage.DEFAULT_SETTINGS,
        ...(profile.settings || {})
    };
    let lastReminderTriggerKey = storage.getMeta('lastReminderTriggerKey') || '';

    function formatISO(date) {
        return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    }

    function parseDayString(dayString) {
        return new Date(dayString);
    }

    function safeText(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function normalizeEventState() {
        if (!Array.isArray(calendarEvents)) {
            calendarEvents = [];
        }

        calendarEvents = calendarEvents
            .map(function(item) {
                return {
                    id: item.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                    date: item.date || formatISO(new Date()),
                    type: ['workout', 'study', 'task', 'personal'].includes(item.type) ? item.type : 'task',
                    title: String(item.title || '').trim(),
                    note: String(item.note || '').trim(),
                    createdAt: item.createdAt || new Date().toISOString()
                };
            })
            .filter(function(item) {
                return item.title;
            })
            .sort(function(a, b) {
                return b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);
            });
    }

    function saveEvents() {
        storage.setMeta('calendarEvents', calendarEvents);
    }

    function refreshState() {
        profile = storage.getCurrentProfile();
        habits = window.HabitTrackerData
            ? HabitTrackerData.normalizeHabits(profile.habits || [])
            : (profile.habits || []);
        plannerState = storage.getMeta('domainPlanner') || { gym: [], learning: [] };
        goalState = storage.getMeta('domainGoals') || { gym: [], learning: [] };
        calendarEvents = storage.getMeta('calendarEvents') || [];
        darkMode = profile.darkMode;
        profileSettings = {
            ...storage.DEFAULT_SETTINGS,
            ...(profile.settings || {})
        };
        normalizeEventState();
    }

    function playCalendarSound(kind) {
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
            const tone = profileSettings.alarmTone || 'chime';
            if (kind === 'alarm') {
                if (tone === 'beep') {
                    o.type = 'square';
                    o.frequency.setValueAtTime(760, now);
                    o.frequency.exponentialRampToValueAtTime(980, now + 0.24);
                } else if (tone === 'nova') {
                    o.type = 'sawtooth';
                    o.frequency.setValueAtTime(380, now);
                    o.frequency.exponentialRampToValueAtTime(1020, now + 0.42);
                } else if (tone === 'orbit') {
                    o.type = 'triangle';
                    o.frequency.setValueAtTime(560, now);
                    o.frequency.exponentialRampToValueAtTime(660, now + 0.18);
                    o.frequency.exponentialRampToValueAtTime(860, now + 0.5);
                } else if (tone === 'zen') {
                    o.type = 'sine';
                    o.frequency.setValueAtTime(340, now);
                    o.frequency.exponentialRampToValueAtTime(520, now + 0.6);
                } else if (tone === 'alert-x') {
                    o.type = 'square';
                    o.frequency.setValueAtTime(960, now);
                    o.frequency.exponentialRampToValueAtTime(680, now + 0.2);
                    o.frequency.exponentialRampToValueAtTime(1120, now + 0.45);
                } else if (tone === 'pulse') {
                    o.type = 'triangle';
                    o.frequency.setValueAtTime(420, now);
                    o.frequency.exponentialRampToValueAtTime(820, now + 0.48);
                } else {
                    o.type = 'sine';
                    o.frequency.setValueAtTime(520, now);
                    o.frequency.exponentialRampToValueAtTime(880, now + 0.42);
                }
            } else {
                o.type = 'sine';
                o.frequency.setValueAtTime(620, now);
                o.frequency.exponentialRampToValueAtTime(760, now + 0.22);
            }
            g.gain.setValueAtTime(0.0001, now);
            g.gain.exponentialRampToValueAtTime(0.15, now + 0.04);
            g.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
            o.connect(g);
            g.connect(ctx.destination);
            o.start();
            o.stop(now + 0.35);
        } catch (error) {
            // ignore
        }
    }

    function checkReminderAlarm() {
        if (!profileSettings.reminders || !profileSettings.reminderTime) {
            return;
        }

        const snoozeUntil = storage.getMeta('reminderSnoozeUntil');
        if (snoozeUntil && new Date(snoozeUntil).getTime() > Date.now()) {
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
        if (profileSettings.alarmSound !== false) {
            playCalendarSound('alarm');
        }
        const snoozeMinutes = Number(profileSettings.reminderSnoozeMinutes) || 5;
        if (confirm(`Reminder: Update your tracker and calendar logs.\n\nPress OK to snooze ${snoozeMinutes} min, Cancel to dismiss.`)) {
            const until = new Date(Date.now() + snoozeMinutes * 60 * 1000).toISOString();
            storage.setMeta('reminderSnoozeUntil', until);
        }
    }

    function toggleDarkMode() {
        darkMode = !darkMode;
        document.body.classList.toggle('dark-mode', darkMode);
        storage.setDarkMode(darkMode);
        darkModeToggle.innerHTML = darkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }

    function getDayCompletionCount(dayString) {
        return habits.reduce(function(count, habit) {
            return count + (habit.history && habit.history.includes(dayString) ? 1 : 0);
        }, 0);
    }

    function getMonthMetrics(year, month) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let activeDays = 0;
        let bestStreak = 0;
        let runningStreak = 0;

        for (let day = 1; day <= daysInMonth; day += 1) {
            const date = new Date(year, month, day);
            const dayString = date.toDateString();
            const count = getDayCompletionCount(dayString);

            if (count > 0) {
                activeDays += 1;
                runningStreak += 1;
                bestStreak = Math.max(bestStreak, runningStreak);
            } else {
                runningStreak = 0;
            }
        }

        let currentStreak = 0;
        const cursor = new Date();
        while (cursor.getMonth() === month && cursor.getFullYear() === year && getDayCompletionCount(cursor.toDateString()) > 0) {
            currentStreak += 1;
            cursor.setDate(cursor.getDate() - 1);
        }

        return {
            daysInMonth,
            activeDays,
            bestStreak,
            currentStreak,
            activeRate: daysInMonth ? Math.round((activeDays / daysInMonth) * 100) : 0
        };
    }

    function renderMonthStats() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const metrics = getMonthMetrics(year, month);

        calTotalDaysEl.textContent = metrics.activeDays;
        calBestStreakEl.textContent = `${metrics.bestStreak}d`;
        calCurrentStreakEl.textContent = `${metrics.currentStreak}d`;
        calActiveRateEl.textContent = `${metrics.activeRate}%`;
    }

    function renderCalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        currentMonthEl.textContent = currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

        const firstDay = new Date(year, month, 1);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        calendarDaysEl.innerHTML = '';

        for (let i = 0; i < 42; i += 1) {
            const day = new Date(startDate);
            day.setDate(startDate.getDate() + i);

            const dayEl = document.createElement('button');
            dayEl.type = 'button';
            dayEl.className = 'calendar-day';
            dayEl.textContent = day.getDate();

            if (day.getMonth() !== month) {
                dayEl.classList.add('other-month');
            }

            const dayString = day.toDateString();
            const completions = getDayCompletionCount(dayString);

            if (completions === habits.length && habits.length > 0) {
                dayEl.classList.add('completed');
            } else if (completions > 0) {
                dayEl.classList.add('partial');
            } else {
                dayEl.classList.add('none');
            }

            if (day.toDateString() === new Date().toDateString()) {
                dayEl.classList.add('today');
            }

            if (day.toDateString() === selectedDate.toDateString()) {
                dayEl.classList.add('selected');
            }

            const iso = formatISO(day);
            const dayEvents = calendarEvents.filter(function(event) {
                return event.date === iso;
            });

            if (dayEvents.length) {
                const marker = document.createElement('span');
                marker.className = 'calendar-day-events';
                marker.textContent = dayEvents.length;
                dayEl.appendChild(marker);
            }

            dayEl.addEventListener('click', function() {
                selectedDate = day;
                renderCalendar();
                renderSelectedDayDetails();
                renderEventList();
            });

            dayEl.addEventListener('dragover', function(event) {
                event.preventDefault();
            });

            dayEl.addEventListener('drop', function(event) {
                event.preventDefault();
                const draggedId = event.dataTransfer.getData('text/plain');
                if (!draggedId) {
                    return;
                }
                const targetIso = formatISO(day);
                const moving = calendarEvents.find(function(item) {
                    return item.id === draggedId;
                });
                if (!moving) {
                    return;
                }
                moving.date = targetIso;
                saveEvents();
                selectedDate = day;
                currentDate = new Date(day);
                playCalendarSound('success');
                renderCalendar();
                renderSelectedDayDetails();
                renderEventList();
            });

            calendarDaysEl.appendChild(dayEl);
        }

        renderMonthStats();
    }

    function renderSelectedDayDetails() {
        const dayString = selectedDate.toDateString();
        const selectedHabits = habits.filter(function(habit) {
            return habit.history && habit.history.includes(dayString);
        });

        calDayTitleEl.textContent = selectedDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });

        calDaySummaryEl.textContent = `${selectedHabits.length}/${habits.length} habits completed on this day.`;
        calDayHabitsEl.innerHTML = '';

        if (!selectedHabits.length) {
            calDayHabitsEl.innerHTML = '<div class="mini-message-card">No habits completed on this day.</div>';
            return;
        }

        selectedHabits.forEach(function(habit) {
            const card = document.createElement('div');
            card.className = 'profile-item';
            card.innerHTML = `
                <div>
                    <strong>${safeText(habit.name)}</strong>
                    <p>${safeText(habit.category)} category</p>
                </div>
                <span class="section-chip">${habit.streak || 0}d streak</span>
            `;
            calDayHabitsEl.appendChild(card);
        });
    }

    function renderEventList() {
        const iso = formatISO(selectedDate);
        const events = calendarEvents.filter(function(item) {
            return item.date === iso;
        });

        calendarEventListEl.innerHTML = '';

        if (!events.length) {
            calendarEventListEl.innerHTML = '<div class="mini-message-card">No notes/events for selected day.</div>';
            return;
        }

        events.forEach(function(item) {
            const row = document.createElement('div');
            row.className = 'planner-item';
            row.draggable = true;
            row.innerHTML = `
                <div class="planner-item-copy">
                    <strong>${safeText(item.title)}</strong>
                    <small>${safeText(item.type)}${item.note ? ` · ${safeText(item.note)}` : ''}</small>
                </div>
                <button class="planner-delete-btn" data-id="${item.id}"><i class="fas fa-trash"></i></button>
            `;
            row.addEventListener('dragstart', function(event) {
                event.dataTransfer.setData('text/plain', item.id);
            });
            calendarEventListEl.appendChild(row);
        });
    }

    function addCalendarEvent() {
        const title = String(calEventTitleEl.value || '').trim();
        const date = calEventDateEl.value || formatISO(selectedDate);
        const note = String(calEventNoteEl.value || '').trim();
        const type = calEventTypeEl.value || 'task';

        if (!title) {
            return;
        }

        calendarEvents.unshift({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            date,
            type,
            title,
            note,
            createdAt: new Date().toISOString()
        });

        normalizeEventState();
        saveEvents();
        playCalendarSound('success');

        calEventTitleEl.value = '';
        calEventNoteEl.value = '';
        selectedDate = new Date(date);
        currentDate = new Date(date);

        renderCalendar();
        renderSelectedDayDetails();
        renderEventList();
    }

    function renderUpcomingList() {
        const upcomingItems = [];

        ['gym', 'learning'].forEach(function(domain) {
            const plans = (plannerState[domain] || []).filter(function(item) {
                return item.type === 'plan' && !item.completed;
            }).slice(0, 4);

            plans.forEach(function(item) {
                upcomingItems.push({
                    domain,
                    label: item.text,
                    info: `${domain === 'gym' ? 'Workout' : 'Learning'} plan · ${new Date(item.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                });
            });

            const goals = (goalState[domain] || []).filter(function(goal) {
                return goal.completed < goal.target;
            }).slice(0, 4);

            goals.forEach(function(goal) {
                upcomingItems.push({
                    domain,
                    label: goal.title,
                    info: `${goal.completed}/${goal.target} done${goal.deadline ? ` · Due ${new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}`
                });
            });
        });

        calendarUpcomingListEl.innerHTML = '';

        if (!upcomingItems.length) {
            calendarUpcomingListEl.innerHTML = '<div class="mini-message-card">No upcoming plans or active goals right now.</div>';
            return;
        }

        upcomingItems.slice(0, 10).forEach(function(item) {
            const row = document.createElement('div');
            row.className = 'planner-item';
            row.innerHTML = `
                <div class="planner-item-copy">
                    <strong>${safeText(item.label)}</strong>
                    <small>${safeText(item.info)}</small>
                </div>
                <span class="section-chip">${item.domain.toUpperCase()}</span>
            `;
            calendarUpcomingListEl.appendChild(row);
        });
    }

    prevMonthBtn.addEventListener('click', function() {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', function() {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    darkModeToggle.addEventListener('click', toggleDarkMode);

    calendarEventListEl.addEventListener('click', function(event) {
        const deleteBtn = event.target.closest('.planner-delete-btn[data-id]');
        if (!deleteBtn) {
            return;
        }

        calendarEvents = calendarEvents.filter(function(item) {
            return item.id !== deleteBtn.dataset.id;
        });
        saveEvents();
        playCalendarSound('success');
        renderCalendar();
        renderEventList();
    });

    calEventAddBtnEl.addEventListener('click', addCalendarEvent);
    calEventTitleEl.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            addCalendarEvent();
        }
    });

    window.addEventListener('life-tracker-store-replaced', function() {
        refreshState();
        renderCalendar();
        renderSelectedDayDetails();
        renderEventList();
        renderUpcomingList();
    });

    // Initialize
    refreshState();
    document.body.classList.toggle('dark-mode', darkMode);
    darkModeToggle.innerHTML = darkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    calEventDateEl.value = formatISO(selectedDate);
    renderCalendar();
    renderSelectedDayDetails();
    renderEventList();
    renderUpcomingList();
    setInterval(checkReminderAlarm, 20000);
    checkReminderAlarm();
});
