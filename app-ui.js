document.addEventListener('DOMContentLoaded', function() {
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isCoarse = window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches;

    function initSpaceTheme() {
        document.body.classList.add('space-theme');

        const root = document.createElement('div');
        root.className = 'space-theme-root';
        root.setAttribute('aria-hidden', 'true');

        const nebula = document.createElement('div');
        nebula.className = 'space-nebula-layer';
        root.appendChild(nebula);

        const stars = document.createElement('div');
        stars.className = 'space-stars-layer';
        root.appendChild(stars);

        const glows = document.createElement('div');
        glows.className = 'space-glow-layer';
        root.appendChild(glows);

        if (!prefersReducedMotion) {
            for (let i = 0; i < 32; i += 1) {
                const dot = document.createElement('span');
                dot.className = 'star-dot';
                dot.style.left = `${Math.random() * 100}%`;
                dot.style.top = `${Math.random() * 100}%`;
                dot.style.animationDelay = `${Math.random() * 5}s`;
                dot.style.animationDuration = `${2 + Math.random() * 4}s`;
                dot.style.opacity = String(0.35 + Math.random() * 0.65);
                stars.appendChild(dot);
            }

            const meteor = document.createElement('span');
            meteor.className = 'shooting-star';
            stars.appendChild(meteor);
        }

        document.body.prepend(root);

        if (!prefersReducedMotion && !isCoarse) {
            let targetX = 0;
            let targetY = 0;
            let currentX = 0;
            let currentY = 0;
            let raf = 0;

            function animateParallax() {
                currentX += (targetX - currentX) * 0.08;
                currentY += (targetY - currentY) * 0.08;
                root.style.setProperty('--space-shift-x', `${currentX.toFixed(2)}px`);
                root.style.setProperty('--space-shift-y', `${currentY.toFixed(2)}px`);
                raf = window.requestAnimationFrame(animateParallax);
            }

            document.addEventListener('pointermove', function(event) {
                targetX = (event.clientX / window.innerWidth - 0.5) * 18;
                targetY = (event.clientY / window.innerHeight - 0.5) * 18;
            }, { passive: true });

            if (!raf) {
                raf = window.requestAnimationFrame(animateParallax);
            }
        }
    }

    function initMobileMenu() {
        const menuToggle = document.getElementById('mobile-menu-toggle');
        const navMenu = document.querySelector('.nav-menu');
        const navOverlay = document.getElementById('mobile-nav-overlay');

        if (!menuToggle || !navMenu || !navOverlay) {
            return;
        }

        function isMenuOpen() {
            return navMenu.classList.contains('mobile-open');
        }

        function closeMenu() {
            navMenu.classList.remove('mobile-open');
            navOverlay.classList.remove('active');
            menuToggle.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('ui-lock-scroll');
        }

        function openMenu() {
            navMenu.classList.add('mobile-open');
            navOverlay.classList.add('active');
            menuToggle.setAttribute('aria-expanded', 'true');
            document.body.classList.add('ui-lock-scroll');
        }

        menuToggle.addEventListener('click', function() {
            if (isMenuOpen()) {
                closeMenu();
                return;
            }

            openMenu();
        });

        navOverlay.addEventListener('click', closeMenu);

        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                closeMenu();
            }
        });

        navMenu.querySelectorAll('.nav-link').forEach(function(link) {
            link.addEventListener('click', closeMenu);
        });

        window.addEventListener('resize', function() {
            if (window.innerWidth > 768) {
                closeMenu();
            }
        });
    }

    initSpaceTheme();
    initMobileMenu();
});
