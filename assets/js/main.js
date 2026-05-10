document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.header');
    const top = header?.querySelector('.top');
    const nav = header?.querySelector('.nav');
    const searchToggle = top?.querySelector('.search-toggle');
    const searchForm = top?.querySelector('.search');
    const searchInput = top?.querySelector('.search-input');
    const searchNarrowToggle = document.getElementById('search-narrow-toggle');
    const searchNarrowPanel = document.getElementById('search-narrow-panel');

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

    const closeSearchNarrow = () => {
        header.classList.remove('header--narrow-open');
        if (!searchNarrowPanel || searchNarrowPanel.hidden) {
            return;
        }
        searchNarrowPanel.hidden = true;
        searchNarrowToggle?.setAttribute('aria-expanded', 'false');
    };

    const toggleSearchNarrow = () => {
        if (!searchNarrowPanel || !searchNarrowToggle) {
            return;
        }
        const willOpen = searchNarrowPanel.hidden;
        searchNarrowPanel.hidden = !willOpen;
        searchNarrowToggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        header.classList.toggle('header--narrow-open', willOpen);
    };

    const closeMobileSearch = (shouldSyncHeights = true) => {
        top.classList.remove('search-open');
        searchToggle?.setAttribute('aria-expanded', 'false');
        closeSearchNarrow();

        if (shouldSyncHeights && mobileMedia.matches) {
            syncHeaderHeights();
        }
    };

    const openMobileSearch = () => {
        top.classList.add('search-open');
        searchToggle?.setAttribute('aria-expanded', 'true');
        syncHeaderHeights();
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
            closeMobileSearch(false);
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

    // Allow keyboard activation of the back icon (Enter / Space)
    backIcon?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            closeMobileSearch();
        }
    });

    searchForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        closeSearchNarrow();
        closeMobileSearch();
    });

    searchNarrowToggle?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleSearchNarrow();
    });

    document.addEventListener('click', (e) => {
        if (searchNarrowPanel?.hidden || !searchForm) {
            return;
        }
        const t = e.target;
        if (t instanceof Node && searchForm.contains(t)) {
            return;
        }
        closeSearchNarrow();
    });

    // ── Subscribe overlay logic ────────────────────────
    const overlay = document.getElementById('subscribe-overlay');
    const subscribeBtn = document.getElementById('subscribe-btn');
    
    // Steps
    const stepEmail = document.getElementById('step-email');
    const stepVerify = document.getElementById('step-verify');
    const stepSuccess = document.getElementById('step-success');

    // Fields
    const emailField = document.getElementById('subscribe-email');
    const verifyCodeField = document.getElementById('verify-code');
    const displayEmail = document.getElementById('display-email');

    // Buttons
    const cancelBtn = document.getElementById('subscribe-cancel');
    const submitEmailBtn = document.getElementById('subscribe-submit');
    const backToEmailBtn = document.getElementById('verify-back');
    const submitVerifyBtn = document.getElementById('verify-submit');
    const closeSuccessBtn = document.getElementById('success-close');

    /** Element that had focus before the modal was opened, so we can restore it. */
    let previouslyFocusedElement = null;

    /** The actual verification code (stored in memory for the demo). */
    let currentVerificationCode = null;

    const showStep = (step) => {
        [stepEmail, stepVerify, stepSuccess].forEach(s => s?.classList.add('hidden'));
        step?.classList.remove('hidden');
    };

    const openSubscribe = () => {
        previouslyFocusedElement = document.activeElement;
        showStep(stepEmail);
        overlay?.classList.add('open');
        overlay?.setAttribute('aria-hidden', 'false');
        setTimeout(() => emailField?.focus(), 100);
    };

    const closeSubscribe = () => {
        overlay?.classList.remove('open');
        overlay?.setAttribute('aria-hidden', 'true');
        
        // Reset fields and code after transition
        setTimeout(() => {
            if (emailField) emailField.value = '';
            if (verifyCodeField) verifyCodeField.value = '';
            currentVerificationCode = null;
            showStep(stepEmail);
        }, 300);

        if (previouslyFocusedElement instanceof HTMLElement) {
            previouslyFocusedElement.focus();
        }
        previouslyFocusedElement = null;
    };

    subscribeBtn?.addEventListener('click', openSubscribe);
    cancelBtn?.addEventListener('click', closeSubscribe);
    closeSuccessBtn?.addEventListener('click', closeSubscribe);

    // Step 1 -> Step 2
    submitEmailBtn?.addEventListener('click', () => {
        const email = emailField?.value?.trim();
        if (!email || !emailField?.reportValidity()) return;

        if (displayEmail) displayEmail.textContent = email;
        
        // Simulate sending email
        submitEmailBtn.disabled = true;
        submitEmailBtn.textContent = 'Sending...';
        
        currentVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(`%c[Email Simulation]`, 'color: #1a73e8; font-weight: bold;', `To: ${email}\nYour verification code is: ${currentVerificationCode}`);
        
        setTimeout(() => {
            submitEmailBtn.disabled = false;
            submitEmailBtn.textContent = 'Subscribe';
            showStep(stepVerify);
            verifyCodeField?.focus();
            
            alert(`[演示提示] 验证码已“发送”到您的邮箱。\n请在浏览器控制台 (F12) 查看模拟邮件内容。\n(验证码是: ${currentVerificationCode})`);
        }, 1200);
    });

    // Step 2 -> Step 3
    submitVerifyBtn?.addEventListener('click', () => {
        const code = verifyCodeField?.value?.trim();
        
        if (code !== currentVerificationCode) {
            verifyCodeField?.setCustomValidity('The code you entered is incorrect. Please try again.');
            verifyCodeField?.reportValidity();
            return;
        }
        
        verifyCodeField?.setCustomValidity('');

        // Simulate verification
        submitVerifyBtn.disabled = true;
        submitVerifyBtn.textContent = 'Verifying...';

        setTimeout(() => {
            submitVerifyBtn.disabled = false;
            submitVerifyBtn.textContent = 'Verify';
            showStep(stepSuccess);
        }, 1000);
    });

    // Step 2 -> Step 1
    backToEmailBtn?.addEventListener('click', () => {
        showStep(stepEmail);
    });

    // Close on backdrop click
    overlay?.addEventListener('click', (e) => {
        if (e.target === overlay) closeSubscribe();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') {
            return;
        }
        if (overlay?.classList.contains('open')) {
            closeSubscribe();
            return;
        }
        if (!searchNarrowPanel?.hidden) {
            closeSearchNarrow();
        }
    });
});
