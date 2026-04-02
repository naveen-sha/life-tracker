document.addEventListener('DOMContentLoaded', function() {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const currentMonthEl = document.getElementById('current-month');
    const calendarDaysEl = document.getElementById('calendar-days');

    let habits = JSON.parse(localStorage.getItem('habits')) || [];
    let darkMode = localStorage.getItem('darkMode') === 'true';
    let currentDate = new Date();

    function toggleDarkMode() {
        darkMode = !darkMode;
        document.body.classList.toggle('dark-mode', darkMode);
        localStorage.setItem('darkMode', darkMode);
        darkModeToggle.innerHTML = darkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }

    function renderCalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        currentMonthEl.textContent = currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        calendarDaysEl.innerHTML = '';

        for (let i = 0; i < 42; i++) {
            const day = new Date(startDate);
            day.setDate(startDate.getDate() + i);

            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day';
            dayEl.textContent = day.getDate();

            if (day.getMonth() !== month) {
                dayEl.classList.add('other-month');
                dayEl.style.opacity = '0.5';
            }

            const dayString = day.toDateString();
            const completions = habits.reduce((count, habit) => {
                return count + (habit.history.includes(dayString) ? 1 : 0);
            }, 0);

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

            calendarDaysEl.appendChild(dayEl);
        }
    }

    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    darkModeToggle.addEventListener('click', toggleDarkMode);

    // Initialize
    document.body.classList.toggle('dark-mode', darkMode);
    darkModeToggle.innerHTML = darkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    renderCalendar();
});