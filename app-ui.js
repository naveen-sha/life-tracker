document.addEventListener('DOMContentLoaded', function() {
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
});
