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

    const articleCollectionLabels = {
        recommended: 'Recommended',
        trending: 'Trending',
        latest: 'Latest'
    };

    const createArticleCollections = (sourceCollections = {}) => Object.fromEntries(
        Object.entries(articleCollectionLabels).map(([key, label]) => {
            const collection = sourceCollections[key] || {};
            return [
                key,
                {
                    label: collection.label || label,
                    articles: Array.isArray(collection.articles) ? collection.articles : []
                }
            ];
        })
    );
    let articleCollections = createArticleCollections(window.DEVINNE_ARTICLES || {});

    const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);

    const formatDateLabel = (dateTime) => {
        const date = new Date(`${dateTime}T00:00:00Z`);

        if (Number.isNaN(date.getTime())) {
            return dateTime;
        }

        return new Intl.DateTimeFormat('en', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            timeZone: 'UTC'
        }).format(date);
    };

    const toRelativeHref = (url) => {
        const currentDirectory = new URL('.', window.location.href);
        const articleDirectory = new URL('.', url);

        if (articleDirectory.href.startsWith(currentDirectory.href)) {
            return articleDirectory.href.slice(currentDirectory.href.length);
        }

        return articleDirectory.pathname;
    };

    const extractArticleMeta = (html) => {
        const documentFragment = new DOMParser().parseFromString(html, 'text/html');
        const metaScript = documentFragment.getElementById('article-meta');

        if (!metaScript) {
            return null;
        }

        try {
            return JSON.parse(metaScript.textContent.trim());
        } catch (error) {
            console.warn('Skipping article with invalid article-meta JSON.', error);
            return null;
        }
    };

    const fetchArticle = async (url) => {
        const response = await fetch(url, { cache: 'no-store' });

        if (!response.ok) {
            return null;
        }

        const meta = extractArticleMeta(await response.text());

        if (!meta || !meta.title || !meta.dateTime) {
            return null;
        }

        return {
            title: String(meta.title),
            dateTime: String(meta.dateTime),
            dateLabel: meta.dateLabel ? String(meta.dateLabel) : formatDateLabel(meta.dateTime),
            imageSrc: meta.imageSrc ? String(meta.imageSrc) : '',
            imageAlt: meta.imageAlt ? String(meta.imageAlt) : String(meta.title),
            href: meta.href ? String(meta.href) : toRelativeHref(url),
            groups: Array.isArray(meta.groups)
                ? meta.groups.map((group) => String(group).trim().toLowerCase()).filter(Boolean)
                : []
        };
    };

    const discoverNumberedArticleUrls = async () => {
        const maxArticlesToProbe = 200;
        const maxConsecutiveMisses = 12;
        const numberedArticleRoots = ['blogs', 'blog'];
        const discoveredUrls = [];

        for (const articleRoot of numberedArticleRoots) {
            let consecutiveMisses = 0;

            for (let articleIndex = 1; articleIndex <= maxArticlesToProbe; articleIndex += 1) {
                const articleUrl = new URL(`${articleRoot}/${articleIndex}/index.html`, window.location.href);

                try {
                    let response = await fetch(articleUrl, {
                        cache: 'no-store',
                        method: 'HEAD'
                    });

                    if (!response.ok && response.status === 405) {
                        response = await fetch(articleUrl, { cache: 'no-store' });
                    }

                    if (response.ok) {
                        discoveredUrls.push(articleUrl);
                        consecutiveMisses = 0;
                        continue;
                    }
                } catch (error) {
                    console.warn('Article probe failed.', error);
                }

                consecutiveMisses += 1;

                if (consecutiveMisses >= maxConsecutiveMisses) {
                    break;
                }
            }
        }

        return Array.from(new Map(discoveredUrls.map((url) => [url.href, url])).values());
    };

    const discoverArticleUrls = async () => {
        const blogIndexUrls = ['blogs/', 'blog/'].map((folder) => new URL(folder, window.location.href));
        const discoveredUrls = [];

        await Promise.all(blogIndexUrls.map(async (blogIndexUrl) => {
            try {
                const response = await fetch(blogIndexUrl, { cache: 'no-store' });

                if (!response.ok) {
                    return;
                }

                const directoryDocument = new DOMParser().parseFromString(await response.text(), 'text/html');
                const articleUrls = Array.from(directoryDocument.querySelectorAll('a[href]'))
                    .map((link) => new URL(link.getAttribute('href'), blogIndexUrl))
                    .filter((url) => url.origin === window.location.origin)
                    .filter((url) => url.pathname.startsWith(blogIndexUrl.pathname))
                    .map((url) => {
                        if (url.pathname.endsWith('/')) {
                            return new URL('index.html', url);
                        }

                        return url;
                    })
                    .filter((url) => url.pathname.toLowerCase().endsWith('/index.html'))
                    .filter((url) => url.pathname !== blogIndexUrl.pathname);

                discoveredUrls.push(...articleUrls);
            } catch (error) {
                console.warn(`Skipping index fetch for ${blogIndexUrl.href}`, error);
            }
        }));

        const directoryUrls = Array.from(new Map(discoveredUrls.map((url) => [url.href, url])).values());

        if (directoryUrls.length > 0) {
            return directoryUrls;
        }

        return discoverNumberedArticleUrls();
    };

    const buildArticleCollections = (articles) => {
        const sortedArticles = articles
            .filter(Boolean)
            .sort((articleA, articleB) => {
                const dateDifference = new Date(articleB.dateTime).getTime() - new Date(articleA.dateTime).getTime();

                if (dateDifference !== 0) {
                    return dateDifference;
                }

                return articleA.title.localeCompare(articleB.title);
            });

        const publicArticle = ({ groups, ...article }) => article;

        return createArticleCollections({
            recommended: {
                articles: sortedArticles
                    .filter((article) => article.groups.includes('recommended'))
                    .map(publicArticle)
            },
            trending: {
                articles: sortedArticles
                    .filter((article) => article.groups.includes('trending'))
                    .map(publicArticle)
            },
            latest: {
                articles: sortedArticles.map(publicArticle)
            }
        });
    };

    const loadArticleCollections = async () => {
        try {
            const articleUrls = await discoverArticleUrls();
            const discoveredArticles = await Promise.all(articleUrls.map(fetchArticle));
            const discoveredCollections = buildArticleCollections(discoveredArticles);

            if (discoveredCollections.latest.articles.length > 0) {
                articleCollections = discoveredCollections;
            }
        } catch (error) {
            console.warn('Article feed could not read the blog directory.', error);
        }

        renderArticleFeed(getInitialCategory(), { updateHash: false });
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

        if (selectedCollection.articles.length === 0) {
            articleFeedList.innerHTML = `
                <li class="article-list__item article-list__item--empty">
                    <p class="title">No articles yet.</p>
                </li>
            `;
        } else {
            articleFeedList.innerHTML = selectedCollection.articles.map((article) => `
            <li class="article-list__item">
                <a href="${escapeHTML(article.href)}" class="article-list__link">
                    <div class="text">
                        <p class="date"><time datetime="${escapeHTML(article.dateTime)}">${escapeHTML(article.dateLabel)}</time></p>
                        <p class="title">${escapeHTML(article.title)}</p>
                    </div>
                    <img class="image" src="${escapeHTML(article.imageSrc)}" alt="${escapeHTML(article.imageAlt)}" loading="lazy" width="300" height="300">
                </a>
            </li>
            `).join('');
        }

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
    loadArticleCollections();

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
            
            alert(`[Demo Notice] The verification code has been "sent" to your email.\nPlease check the simulated email content in the browser console (F12).\n(Verification code: ${currentVerificationCode})`);
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
