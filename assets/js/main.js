document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.header');
    const top = header?.querySelector('.top');
    const nav = header?.querySelector('.nav');
    const searchToggle = top?.querySelector('.search-toggle');
    const searchForm = top?.querySelector('.search');
    const searchInput = top?.querySelector('.search-input');

    if (!header || !top || !nav) {
        return;
    }

    const minTopScale = 0.72;
    const scrollThreshold = 8;
    let topHeight = 0;
    let lastScrollY = window.scrollY;
    let isTicking = false;
    let ignoreDirectionUntil = 0;
    const mobileMedia = window.matchMedia('(max-width: 640px)');

    const closeMobileSearch = () => {
        top.classList.remove('search-open');
    };

    const openMobileSearch = () => {
        top.classList.add('search-open');
        searchInput?.focus();
    };

    const setTopProgress = (progress) => {
        const clampedProgress = Math.min(Math.max(progress, 0), 1);
        const scale = 1 - ((1 - minTopScale) * clampedProgress);

        header.style.setProperty('--top-collapse', `${topHeight * clampedProgress}px`);
        header.style.setProperty('--top-content-opacity', `${1 - clampedProgress}`);
        header.style.setProperty('--top-content-scale', `${scale}`);
    };

    const syncHeaderHeights = () => {
        if (!mobileMedia.matches) {
            closeMobileSearch();
        }

        topHeight = top.offsetHeight;
        header.style.setProperty('--header-top-height', `${topHeight}px`);
        header.style.setProperty('--header-nav-height', `${nav.offsetHeight}px`);
        setTopProgress(header.classList.contains('header--nav-only') ? 1 : 0);
    };

    const setNavOnly = (shouldShowNavOnly) => {
        if (header.classList.contains('header--nav-only') === shouldShowNavOnly) {
            return;
        }

        header.classList.toggle('header--nav-only', shouldShowNavOnly);
        setTopProgress(shouldShowNavOnly ? 1 : 0);
        ignoreDirectionUntil = performance.now() + 220;
    };

    const updateHeaderState = () => {
        const currentScrollY = window.scrollY;
        const scrollDelta = currentScrollY - lastScrollY;

        if (currentScrollY <= 0) {
            setNavOnly(false);
            setTopProgress(0);
            lastScrollY = currentScrollY;
            return;
        }

        if (!header.classList.contains('header--nav-only') && currentScrollY < topHeight) {
            setTopProgress(currentScrollY / topHeight);
            lastScrollY = currentScrollY;
            return;
        }

        if (performance.now() < ignoreDirectionUntil) {
            lastScrollY = currentScrollY;
            return;
        }

        if (Math.abs(scrollDelta) < scrollThreshold) {
            return;
        }

        if (scrollDelta > 0) {
            closeMobileSearch();
            setNavOnly(true);
        } else {
            setNavOnly(false);
            setTopProgress(0);
        }

        lastScrollY = currentScrollY;
    };

    const requestHeaderUpdate = () => {
        if (isTicking) {
            return;
        }

        isTicking = true;
        window.requestAnimationFrame(() => {
            updateHeaderState();
            isTicking = false;
        });
    };

    syncHeaderHeights();
    updateHeaderState();

    window.addEventListener('resize', syncHeaderHeights);
    window.addEventListener('scroll', requestHeaderUpdate, { passive: true });

    searchToggle?.addEventListener('click', () => {
        if (!mobileMedia.matches) {
            return;
        }

        if (top.classList.contains('search-open')) {
            closeMobileSearch();
            return;
        }

        openMobileSearch();
    });

    const backIcon = top?.querySelector('.back-icon');
    backIcon?.addEventListener('click', () => {
        if (!mobileMedia.matches) {
            return;
        }

        closeMobileSearch();
    });

    searchForm?.addEventListener('submit', () => {
        closeMobileSearch();
    });
});
