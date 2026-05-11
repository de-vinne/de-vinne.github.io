document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.header');
    const top = header?.querySelector('.top');
    const nav = header?.querySelector('.nav');

    if (!header || !top || !nav) {
        return;
    }

    const minTopScale = 0.72;
    const scrollThreshold = 8;
    let topHeight = 0;
    let lastScrollY = window.scrollY;
    let isTicking = false;
    let ignoreDirectionUntil = 0;

    const setTopProgress = (progress) => {
        const clampedProgress = Math.min(Math.max(progress, 0), 1);
        const scale = 1 - ((1 - minTopScale) * clampedProgress);

        header.style.setProperty('--top-collapse', `${topHeight * clampedProgress}px`);
        header.style.setProperty('--top-content-opacity', `${1 - clampedProgress}`);
        header.style.setProperty('--top-content-scale', `${scale}`);
    };

    const syncHeaderHeights = () => {
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

    const searchToggleBtn = document.getElementById('search-toggle-btn');
    const searchForm = header.querySelector('.search');
    const searchInput = document.getElementById('search-input');
    const searchCloseBtn = header.querySelector('.back-icon');
    const searchNarrowToggle = document.getElementById('search-narrow-toggle');
    const searchNarrowPanel = document.getElementById('search-narrow-panel');

    const setNarrowPanelState = (isOpen) => {
        if (!searchNarrowToggle || !searchNarrowPanel) {
            return;
        }

        searchNarrowToggle.setAttribute('aria-expanded', String(isOpen));
        searchNarrowPanel.hidden = !isOpen;
        header.classList.toggle('header--narrow-open', isOpen);
    };

    const openMobileSearch = () => {
        top.classList.add('search-open');
        searchToggleBtn?.setAttribute('aria-expanded', 'true');
        setTimeout(() => searchInput?.focus(), 0);
    };

    const closeMobileSearch = () => {
        top.classList.remove('search-open');
        searchToggleBtn?.setAttribute('aria-expanded', 'false');
        setNarrowPanelState(false);
    };

    searchToggleBtn?.addEventListener('click', () => {
        if (top.classList.contains('search-open')) {
            closeMobileSearch();
            return;
        }

        openMobileSearch();
    });

    searchCloseBtn?.addEventListener('click', closeMobileSearch);

    searchNarrowToggle?.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const isOpen = searchNarrowToggle.getAttribute('aria-expanded') === 'true';
        setNarrowPanelState(!isOpen);
    });

    searchNarrowPanel?.addEventListener('click', (event) => {
        event.stopPropagation();
    });

    document.addEventListener('click', (event) => {
        if (!searchForm?.contains(event.target)) {
            setNarrowPanelState(false);
        }
    });

    const articleFeedSection = document.getElementById('article-feed');
    const articleFeedTitle = document.getElementById('article-feed-title');
    const articleFeedList = document.getElementById('article-feed-list');
    const categoryNavLinks = Array.from(nav.querySelectorAll('.nav__link[data-category]'));

    const recommendedArticles = [
        {
            title: '5 new features for Android XR',
            dateTime: '2024-06-06',
            dateLabel: 'June 6, 2024',
            imageSrc: 'https://storage.googleapis.com/gweb-uniblog-publish-prod/images/Final_Hero_Image.max-300x300.format-webp.webp',
            imageAlt: 'Android XR features illustration',
            href: '#'
        },
        {
            title: '3 new Gemini features are coming to Google TV',
            dateTime: '2024-06-05',
            dateLabel: 'June 5, 2024',
            imageSrc: 'https://storage.googleapis.com/gweb-uniblog-publish-prod/images/updated_blog_hero_image__1.max-300x300.format-webp.webp',
            imageAlt: 'Gemini features on Google TV',
            href: '#'
        },
        {
            title: 'Connecting your car beyond the dashboard',
            dateTime: '2024-06-04',
            dateLabel: 'June 4, 2024',
            imageSrc: 'https://storage.googleapis.com/gweb-uniblog-publish-prod/images/Open_sourcAndOS_01_exp_HERO_Her.max-300x300.format-webp.webp',
            imageAlt: 'Connected car technology',
            href: '#'
        }
    ];

    const trendingArticles = [
        {
            title: 'How AI Overviews are changing everyday search',
            dateTime: '2024-06-03',
            dateLabel: 'June 3, 2024',
            imageSrc: 'https://storage.googleapis.com/gweb-uniblog-publish-prod/images/io_social_share.width-1300.format-webp.webp',
            imageAlt: 'AI search results on a phone',
            href: '#'
        },
        {
            title: 'The developer tools teams are sharing most this week',
            dateTime: '2024-06-02',
            dateLabel: 'June 2, 2024',
            imageSrc: 'https://storage.googleapis.com/gweb-uniblog-publish-prod/images/Gemini_1.5_Flash.width-1300.format-webp.webp',
            imageAlt: 'Developer tooling highlights',
            href: '#'
        },
        {
            title: 'Why foldables are back at the center of hardware talk',
            dateTime: '2024-06-01',
            dateLabel: 'June 1, 2024',
            imageSrc: 'https://storage.googleapis.com/gweb-uniblog-publish-prod/images/IO24_Recap_Blog_Hero.width-1300.format-webp.webp',
            imageAlt: 'Foldable device photography',
            href: '#'
        }
    ];

    const latestArticles = [
        {
            title: 'Android 15 beta expands to more devices',
            dateTime: '2024-06-07',
            dateLabel: 'June 7, 2024',
            imageSrc: 'https://storage.googleapis.com/gweb-uniblog-publish-prod/images/android15.width-1300.format-webp.webp',
            imageAlt: 'Android 15 beta artwork',
            href: '#'
        },
        {
            title: 'A fresh look at productivity upgrades in Workspace',
            dateTime: '2024-06-06',
            dateLabel: 'June 6, 2024',
            imageSrc: 'https://storage.googleapis.com/gweb-uniblog-publish-prod/images/workspace.width-1300.format-webp.webp',
            imageAlt: 'Workspace productivity visual',
            href: '#'
        },
        {
            title: 'Security updates rolling out across Chrome this month',
            dateTime: '2024-06-05',
            dateLabel: 'June 5, 2024',
            imageSrc: 'https://storage.googleapis.com/gweb-uniblog-publish-prod/images/chrome.width-1300.format-webp.webp',
            imageAlt: 'Chrome security update artwork',
            href: '#'
        }
    ];

    const articleCollections = {
        recommended: {
            label: 'Recommended',
            articles: recommendedArticles
        },
        trending: {
            label: 'Trending',
            articles: trendingArticles
        },
        latest: {
            label: 'Latest',
            articles: latestArticles
        }
    };

    const getInitialCategory = () => {
        const hashCategory = window.location.hash.replace('#', '').trim().toLowerCase();
        return articleCollections[hashCategory] ? hashCategory : 'recommended';
    };

    const renderArticleFeed = (categoryKey, options = {}) => {
        if (!articleFeedSection || !articleFeedTitle || !articleFeedList) {
            return;
        }

        const selectedCollection = articleCollections[categoryKey];
        if (!selectedCollection) {
            return;
        }

        articleFeedSection.setAttribute('aria-label', `${selectedCollection.label} articles`);
        articleFeedTitle.textContent = selectedCollection.label;
        articleFeedList.innerHTML = selectedCollection.articles.map((article) => `
            <li class="article-list__item">
                <a href="${article.href}" class="article-list__link">
                    <div class="text">
                        <p class="date"><time datetime="${article.dateTime}">${article.dateLabel}</time></p>
                        <p class="title">${article.title}</p>
                    </div>
                    <img class="image" src="${article.imageSrc}" alt="${article.imageAlt}" loading="lazy" width="300" height="300">
                </a>
            </li>
        `).join('');

        categoryNavLinks.forEach((link) => {
            const isActive = link.dataset.category === categoryKey;
            link.classList.toggle('is-active', isActive);
            if (isActive) {
                link.setAttribute('aria-current', 'page');
            } else {
                link.removeAttribute('aria-current');
            }
        });

        if (options.updateHash !== false) {
            window.history.replaceState(null, '', `#${categoryKey}`);
        }
    };

    categoryNavLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            renderArticleFeed(link.dataset.category);
        });
    });

    window.addEventListener('hashchange', () => {
        renderArticleFeed(getInitialCategory(), { updateHash: false });
    });

    renderArticleFeed(getInitialCategory(), { updateHash: false });

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
        if (searchNarrowToggle?.getAttribute('aria-expanded') === 'true') {
            setNarrowPanelState(false);
            searchNarrowToggle.focus();
            return;
        }
        if (top.classList.contains('search-open')) {
            closeMobileSearch();
            searchToggleBtn?.focus();
            return;
        }
        if (overlay?.classList.contains('open')) {
            closeSubscribe();
            return;
        }
    });
});
