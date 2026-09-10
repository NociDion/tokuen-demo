const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const THEME_KEY = 'tokuen-theme';
const BOTTOM_NAV_LINKS = [
    { href: '../dashboard/', label: 'Home', icon: 'OV', match: /\/dashboard\/?$/ },
    { href: '../my-loans/', label: 'Loans', icon: 'LN', match: /\/my-loans\/?$/ },
    { href: '../payments/', label: 'Pay', icon: 'PY', match: /\/payments\/?$/ },
    { href: '../applications/', label: 'Apply', icon: 'AP', match: /\/applications\/?$/ },
    { href: '../settings/', label: 'More', icon: 'ST', match: /\/(settings|transactions|profile)\/?$/ },
];

let toastRoot;
let modalRoot;

const ensureGlobalContainers = () => {
    if (!toastRoot) {
        toastRoot = document.createElement('div');
        toastRoot.className = 'tokuen-toast-root';
        toastRoot.setAttribute('aria-live', 'polite');
        toastRoot.setAttribute('aria-atomic', 'true');
        document.body.appendChild(toastRoot);
    }

    if (!modalRoot) {
        modalRoot = document.createElement('div');
        modalRoot.className = 'tokuen-modal-root';
        modalRoot.hidden = true;
        modalRoot.innerHTML = `
            <div class="tokuen-modal-backdrop" data-modal-close></div>
            <div class="tokuen-modal" role="dialog" aria-modal="true" aria-labelledby="tokuen-modal-title">
                <div class="tokuen-modal-icon" aria-hidden="true"></div>
                <h2 id="tokuen-modal-title"></h2>
                <p class="tokuen-modal-message"></p>
                <div class="tokuen-modal-actions">
                    <button type="button" class="tokuen-modal-secondary" data-modal-close>Close</button>
                    <button type="button" class="tokuen-modal-primary" data-modal-confirm>Continue</button>
                </div>
            </div>
        `;
        document.body.appendChild(modalRoot);

        modalRoot.addEventListener('click', (event) => {
            if (event.target.matches('[data-modal-close]')) {
                closeModal();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && !modalRoot.hidden) {
                closeModal();
            }
        });
    }
};

export const showToast = (message, type = 'success') => {
    ensureGlobalContainers();

    const toast = document.createElement('div');
    toast.className = `tokuen-toast tokuen-toast-${type}`;
    toast.textContent = message;
    toastRoot.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('is-visible'));

    window.setTimeout(() => {
        toast.classList.remove('is-visible');
        window.setTimeout(() => toast.remove(), 280);
    }, 2800);
};

export const showModal = ({ title, message, confirmText = 'Got it', icon = 'success' }) =>
    new Promise((resolve) => {
        ensureGlobalContainers();

        modalRoot.querySelector('#tokuen-modal-title').textContent = title;
        modalRoot.querySelector('.tokuen-modal-message').textContent = message;
        modalRoot.querySelector('.tokuen-modal-icon').dataset.icon = icon;

        const confirmBtn = modalRoot.querySelector('[data-modal-confirm]');
        confirmBtn.textContent = confirmText;

        const onConfirm = () => {
            confirmBtn.removeEventListener('click', onConfirm);
            closeModal();
            resolve(true);
        };

        confirmBtn.addEventListener('click', onConfirm);
        modalRoot.hidden = false;
        requestAnimationFrame(() => modalRoot.classList.add('is-open'));
        confirmBtn.focus();
    });

const closeModal = () => {
    if (!modalRoot) {
        return;
    }

    modalRoot.classList.remove('is-open');
    window.setTimeout(() => {
        modalRoot.hidden = true;
    }, 220);
};

const easeOutCubic = (value) => 1 - Math.pow(1 - value, 3);

const animateValue = (element, config) => {
    if (element.dataset.counted === 'true' || prefersReducedMotion()) {
        return;
    }

    element.dataset.counted = 'true';
    const { end, prefix = '', suffix = '', decimals = 0 } = config;
    const duration = 900;
    const startTime = performance.now();

    const tick = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const current = end * easeOutCubic(progress);
        const formatted = decimals > 0
            ? current.toFixed(decimals)
            : Math.round(current).toLocaleString('en-US');

        element.textContent = `${prefix}${formatted}${suffix}`;

        if (progress < 1) {
            requestAnimationFrame(tick);
        }
    };

    requestAnimationFrame(tick);
};

const parseStatValue = (text) => {
    const trimmed = text.trim();

    const phpMatch = trimmed.match(/^PHP\s*([\d,]+(?:\.\d+)?)$/i);
    if (phpMatch) {
        return {
            end: parseFloat(phpMatch[1].replace(/,/g, '')),
            prefix: 'PHP ',
            suffix: '',
            decimals: phpMatch[1].includes('.') ? 2 : 0,
        };
    }

    const percentMatch = trimmed.match(/^([\d.]+)%$/);
    if (percentMatch) {
        return { end: parseFloat(percentMatch[1]), prefix: '', suffix: '%', decimals: 0 };
    }

    const numberMatch = trimmed.match(/^(\d+)$/);
    if (numberMatch) {
        return { end: parseInt(numberMatch[1], 10), prefix: '', suffix: '', decimals: 0 };
    }

    return null;
};

const initCountUp = () => {
    const selectors = [
        '.tokuen-client-stats strong',
        '.tokuen-transaction-stats strong',
        '.tokuen-payment-amount strong',
        '.tokuen-loan-amount strong',
        '[data-count]',
    ].join(',');

    document.querySelectorAll(selectors).forEach((element) => {
        if (element.dataset.counted === 'true') {
            return;
        }

        if (element.dataset.count) {
            animateValue(element, {
                end: parseFloat(element.dataset.count),
                prefix: element.dataset.prefix || '',
                suffix: element.dataset.suffix || '',
                decimals: parseInt(element.dataset.decimals || '0', 10),
            });
            return;
        }

        const config = parseStatValue(element.textContent);
        if (config) {
            animateValue(element, config);
        }
    });
};

const initRevealAnimations = () => {
    const targets = document.querySelectorAll(`
        .tokuen-client-stats article,
        .tokuen-client-panel,
        .tokuen-transaction-stats article,
        .tokuen-loan-card,
        .tokuen-loan-feature,
        .tokuen-auth-card,
        .tokuen-register-card,
        .tokuen-legal-card
    `);

    targets.forEach((element, index) => {
        if (element.dataset.revealReady === 'true') {
            return;
        }

        element.dataset.revealReady = 'true';
        element.classList.add('tokuen-reveal');
        element.style.setProperty('--reveal-delay', `${Math.min(index * 0.06, 0.42)}s`);
    });

    if (prefersReducedMotion()) {
        targets.forEach((element) => element.classList.add('is-visible'));
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );

    document.querySelectorAll('.tokuen-reveal:not(.is-visible)').forEach((element) => {
        observer.observe(element);
    });

    document.querySelectorAll('.tokuen-auth-card, .tokuen-hero-copy').forEach((element) => {
        element.classList.add('is-visible');
    });
};

const initProgressBars = () => {
    document.querySelectorAll('.tokuen-loan-progress').forEach((bar) => {
        if (bar.dataset.progressReady === 'true') {
            return;
        }

        bar.dataset.progressReady = 'true';
        const fill = bar.querySelector('span');
        if (!fill) {
            return;
        }

        const targetWidth = fill.style.width || fill.dataset.progress || '68%';
        fill.style.width = prefersReducedMotion() ? targetWidth : '0%';
        bar.dataset.targetProgress = targetWidth;

        const reveal = () => {
            fill.style.width = bar.dataset.targetProgress;
        };

        if (prefersReducedMotion()) {
            reveal();
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    requestAnimationFrame(reveal);
                    observer.disconnect();
                }
            },
            { threshold: 0.3 },
        );

        observer.observe(bar);
    });
};

const initDonutAnimation = () => {
    document.querySelectorAll('.tokuen-donut').forEach((donut) => {
        if (donut.dataset.donutReady === 'true') {
            return;
        }

        donut.dataset.donutReady = 'true';
        const paid = parseFloat(donut.dataset.paid || '68');
        donut.style.setProperty('--donut-paid', prefersReducedMotion() ? `${paid}%` : '0%');

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    donut.classList.add('is-animated');
                    requestAnimationFrame(() => {
                        donut.style.setProperty('--donut-paid', `${paid}%`);
                    });
                    observer.disconnect();
                }
            },
            { threshold: 0.35 },
        );

        observer.observe(donut);
    });
};

const buildChartSvg = (container) => {
    if (container.dataset.chartReady === 'true') {
        return;
    }

    container.dataset.chartReady = 'true';
    container.innerHTML = '';

    const values = [42, 58, 72, 61, 78, 88];
    const width = 420;
    const height = 210;
    const padX = 18;
    const padY = 22;
    const max = 100;
    const step = (width - padX * 2) / (values.length - 1);

    const points = values.map((value, index) => {
        const x = padX + step * index;
        const y = height - padY - ((value / max) * (height - padY * 2));
        return { x, y, value };
    });

    const linePath = points
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
        .join(' ');

    const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${height - padY} L ${points[0].x.toFixed(1)} ${height - padY} Z`;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'tokuen-chart-svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    // Keep the plotted line proportional when the dashboard panel changes
    // shape; the previous `none` value distorted it at tablet widths.
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.innerHTML = `
        <defs>
            <linearGradient id="tokuenChartFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="rgba(123, 63, 242, 0.28)" />
                <stop offset="100%" stop-color="rgba(49, 88, 245, 0.02)" />
            </linearGradient>
        </defs>
        <path class="tokuen-chart-area-path" d="${areaPath}" fill="url(#tokuenChartFill)" />
        <path class="tokuen-chart-line-path" d="${linePath}" />
        <g class="tokuen-chart-points-group">
            ${points.map((point, index) => `
                <circle class="tokuen-chart-dot" cx="${point.x}" cy="${point.y}" r="6" style="--dot-delay: ${index * 0.08}s" />
            `).join('')}
        </g>
    `;

    container.appendChild(svg);

    if (!prefersReducedMotion()) {
        requestAnimationFrame(() => container.classList.add('is-chart-ready'));
    } else {
        container.classList.add('is-chart-ready');
    }
};

const initCharts = () => {
    document.querySelectorAll('[data-tokuen-chart], .tokuen-chart-area').forEach(buildChartSvg);
};

const initTimeGreeting = () => {
    document.querySelectorAll('[data-greeting]').forEach((heading) => {
        const hour = new Date().getHours();
        let greeting = 'Good evening';

        if (hour < 12) {
            greeting = 'Good morning';
        } else if (hour < 17) {
            greeting = 'Good afternoon';
        }

        const name = heading.dataset.greeting || 'Juan';
        heading.textContent = `${greeting}, ${name}`;
    });
};

const initDarkMode = () => {
    if (document.documentElement.dataset.themeInit === 'true') {
        return;
    }

    document.documentElement.dataset.themeInit = 'true';

    const exemptPageSelector = '.tokuen-login-page, .tokuen-register-page, .tokuen-password-page, .tokuen-legal-page';
    const isExemptPage = document.querySelector(exemptPageSelector);
    const savedTheme = localStorage.getItem(THEME_KEY);

    if (!isExemptPage && savedTheme === 'dark') {
        document.documentElement.dataset.theme = 'dark';
    } else {
        delete document.documentElement.dataset.theme;
    }

    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.documentElement.dataset.theme = 'dark';
            localStorage.setItem(THEME_KEY, 'dark');
        } else {
            delete document.documentElement.dataset.theme;
            localStorage.setItem(THEME_KEY, 'light');
        }

        document.querySelectorAll('[data-theme-toggle]').forEach((toggle) => {
            toggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
            toggle.classList.toggle('is-dark', theme === 'dark');
        });
    };

    document.addEventListener('click', (event) => {
        const toggle = event.target.closest('[data-theme-toggle]');
        if (!toggle) {
            return;
        }

        event.preventDefault();
        const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        applyTheme(nextTheme);
        showToast(nextTheme === 'dark' ? 'Dark mode enabled' : 'Light mode enabled', 'info');
    });

    const dashboard = document.querySelector('[data-client-dashboard]');
    if (!dashboard || dashboard.dataset.themeReady === 'true') {
        return;
    }

    dashboard.dataset.themeReady = 'true';

    const topnavActions = dashboard.querySelector('.tokuen-client-topnav-actions');
    if (topnavActions && !topnavActions.querySelector('[data-theme-toggle]')) {
        const themeBtn = document.createElement('button');
        themeBtn.type = 'button';
        themeBtn.className = 'tokuen-theme-toggle';
        themeBtn.dataset.themeToggle = '';
        themeBtn.setAttribute('aria-label', 'Toggle dark mode');
        themeBtn.setAttribute('aria-pressed', savedTheme === 'dark' ? 'true' : 'false');
        themeBtn.classList.toggle('is-dark', savedTheme === 'dark');
        themeBtn.innerHTML = '<span aria-hidden="true"></span>';
        topnavActions.insertBefore(themeBtn, topnavActions.firstChild);
    }

    const toggleList = dashboard.querySelector('.tokuen-toggle-list');
    if (toggleList && !toggleList.querySelector('[data-theme-toggle]')) {
        const label = document.createElement('label');
        label.innerHTML = `
            <span>Dark mode</span>
            <button type="button" class="tokuen-theme-switch" data-theme-toggle aria-pressed="${savedTheme === 'dark' ? 'true' : 'false'}"></button>
        `;
        toggleList.prepend(label);
    }

    document.querySelectorAll('[data-theme-toggle]').forEach((toggle) => {
        const isDark = document.documentElement.dataset.theme === 'dark';
        toggle.setAttribute('aria-pressed', isDark ? 'true' : 'false');
        toggle.classList.toggle('is-dark', isDark);
    });
};

const initBottomNav = () => {
    const dashboard = document.querySelector('[data-client-dashboard]');
    if (!dashboard) {
        return;
    }

    const currentPath = window.location.pathname;
    let nav = dashboard.querySelector('.tokuen-bottom-nav');

    if (!nav) {
        nav = document.createElement('nav');
        nav.className = 'tokuen-bottom-nav';
        nav.setAttribute('aria-label', 'Mobile navigation');
        nav.innerHTML = BOTTOM_NAV_LINKS.map((link) => `
            <a href="${link.href}">
                <span class="tokuen-bottom-nav-icon">${link.icon}</span>
                <span class="tokuen-bottom-nav-label">${link.label}</span>
            </a>
        `).join('');
        dashboard.appendChild(nav);
    }

    nav.querySelectorAll('a[href]').forEach((item) => {
        const itemPath = new URL(item.href, window.location.href).pathname;
        const isActive = BOTTOM_NAV_LINKS.some((link) => link.match.test(currentPath) && link.match.test(itemPath));
        item.classList.toggle('active', isActive);
    });
};

const runButtonLoading = async (button, callback) => {
    if (button.dataset.loading === 'true') {
        return;
    }

    const originalText = button.textContent;
    button.dataset.loading = 'true';
    button.disabled = true;
    button.classList.add('is-loading');
    button.textContent = 'Processing…';

    await new Promise((resolve) => window.setTimeout(resolve, 750));

    button.classList.remove('is-loading');
    button.classList.add('is-success');
    button.textContent = 'Done';

    await callback();

    window.setTimeout(() => {
        button.disabled = false;
        button.dataset.loading = 'false';
        button.classList.remove('is-success');
        button.textContent = originalText;
    }, 900);
};

const initDemoActions = () => {
    if (document.body.dataset.demoActionsReady === 'true') {
        return;
    }

    document.body.dataset.demoActionsReady = 'true';

    document.addEventListener('click', async (event) => {
        const button = event.target.closest('button');
        if (!button || button.disabled) {
            return;
        }

        const label = button.textContent.trim();

        if (label === 'Pay Now') {
            event.preventDefault();
            await runButtonLoading(button, async () => {
                await showModal({
                    title: 'Payment submitted',
                    message: 'Your demo payment of PHP 12,500 was recorded. In production this would redirect to your chosen payment channel.',
                    confirmText: 'View receipt',
                    icon: 'success',
                });
                showToast('Payment submitted successfully');
            });
            return;
        }

        if (label === 'Create Application') {
            event.preventDefault();
            await runButtonLoading(button, async () => {
                await showModal({
                    title: 'Application created',
                    message: 'Your loan application draft is ready. Upload remaining documents to continue the review process.',
                    confirmText: 'Continue',
                    icon: 'apply',
                });
                showToast('Application draft saved');
            });
            return;
        }

        if (label === 'Download Contract' || label === 'Download Bill' || label === 'Download Latest Receipt' || label === 'Export Transaction History') {
            event.preventDefault();
            showToast(`${label} started — demo download`);
            if (navigator.vibrate) {
                navigator.vibrate(8);
            }
            return;
        }

        if (button.closest('.tokuen-settings-actions') && (label.includes('Save') || label.includes('Request'))) {
            event.preventDefault();
            await runButtonLoading(button, async () => {
                showToast('Profile changes saved');
            });
            return;
        }

        if (button.closest('.tokuen-method-list')) {
            event.preventDefault();
            const method = button.querySelector('strong')?.textContent || 'Payment method';
            showToast(`${method} selected for demo payment`, 'info');
            return;
        }

        if (button.closest('.tokuen-application-options')) {
            document.querySelectorAll('.tokuen-application-options button').forEach((item) => {
                item.classList.toggle('is-selected', item === button);
            });
            showToast(`${button.querySelector('strong')?.textContent || 'Option'} selected`, 'info');
            return;
        }

        if (button.closest('.tokuen-transaction-tools')) {
            document.querySelectorAll('.tokuen-transaction-tools button').forEach((item) => {
                item.classList.toggle('active', item === button);
            });
            showToast(`Showing ${label.toLowerCase()} — demo filter`, 'info');
        }
    });
};

const initCopyReferences = () => {
    document.querySelectorAll('.tokuen-transaction-row').forEach((row) => {
        if (row.classList.contains('head') || row.querySelector('[data-copy]')) {
            return;
        }

        const refCell = row.children[2];
        if (!refCell || !refCell.textContent.includes('TXN-')) {
            return;
        }

        const copyBtn = document.createElement('button');
        copyBtn.type = 'button';
        copyBtn.className = 'tokuen-copy-btn';
        copyBtn.dataset.copy = refCell.textContent.trim();
        copyBtn.textContent = 'Copy';
        refCell.appendChild(copyBtn);
    });

    document.addEventListener('click', async (event) => {
        const copyBtn = event.target.closest('[data-copy]');
        if (!copyBtn) {
            return;
        }

        event.preventDefault();
        const value = copyBtn.dataset.copy;

        try {
            await navigator.clipboard.writeText(value);
            showToast('Reference copied to clipboard');
        } catch {
            showToast(value, 'info');
        }
    });
};

const initPageTransitions = () => {
    if (document.body.dataset.pageTransitionsReady === 'true' || prefersReducedMotion()) {
        return;
    }

    document.body.dataset.pageTransitionsReady = 'true';

    if (document.querySelector('[data-client-dashboard]')) {
        return;
    }

    document.body.classList.add('tokuen-page-enter');

    requestAnimationFrame(() => {
        document.body.classList.add('is-entered');
    });

    document.addEventListener('click', (event) => {
        const link = event.target.closest('a[href]');
        if (!link || link.target === '_blank' || link.hasAttribute('download')) {
            return;
        }

        const url = new URL(link.href, window.location.href);
        if (url.origin !== window.location.origin || url.pathname === window.location.pathname) {
            return;
        }

        event.preventDefault();
        document.body.classList.add('tokuen-page-leaving');
        window.setTimeout(() => {
            window.location.href = link.href;
        }, 180);
    });
};

const initAuthOrbs = () => {
    document.querySelectorAll('.tokuen-register-page, .tokuen-password-page, .tokuen-legal-page').forEach((page) => {
        if (page.querySelector('.tokuen-floating-orbs') || page.querySelector('.tokuen-auth-bg')) {
            return;
        }

        const orbs = document.createElement('div');
        orbs.className = 'tokuen-floating-orbs';
        orbs.innerHTML = '<span></span><span></span><span></span>';
        page.prepend(orbs);
    });
};

const EYE_OPEN_SVG = `
    <svg class="tokuen-eye-icon tokuen-eye-open" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path fill="currentColor" d="M12 5C5.636 5 2 12 2 12s3.636 7 10 7 10-7 10-7-3.636-7-10-7zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"/>
    </svg>`;

const EYE_CLOSED_SVG = `
    <svg class="tokuen-eye-icon tokuen-eye-closed" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path fill="currentColor" d="M3.27 3.27 2 4.54l2.45 2.45C3.06 8.23 2.17 9.92 2 12s3.636 7 10 7c1.87 0 3.58-.52 5.01-1.41L20.46 22l1.27-1.27L3.27 3.27zM12 17a5 5 0 0 1-4.58-3.01l1.56-1.56A3 3 0 0 0 12 15a3 3 0 0 0 2.14-.89l1.55 1.55A4.98 4.98 0 0 1 12 17zm6.24-2.35-1.52-1.52a7.96 7.96 0 0 0 1.52-3.13c-1.15-2.67-3.52-4.35-6.24-4.35-1.05 0-2.04.24-2.94.66l-1.67-1.67C7.18 5.19 8.54 5 10 5c4.364 0 8 7 8 7a15.96 15.96 0 0 1-1.76 2.65z"/>
    </svg>`;

const initPasswordToggles = () => {
    document.querySelectorAll('.tokuen-input-group input[type="password"]').forEach((input) => {
        const group = input.closest('.tokuen-input-group');
        if (!group || group.dataset.passwordToggleReady === 'true') {
            return;
        }

        group.dataset.passwordToggleReady = 'true';
        group.classList.add('tokuen-input-group-password');

        let toggle = group.querySelector('.tokuen-password-toggle');
        const oldAddon = group.querySelector('.input-group-text:not(.tokuen-password-toggle)');

        if (!toggle) {
            toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.className = 'tokuen-password-toggle input-group-text';
            toggle.innerHTML = `${EYE_OPEN_SVG}${EYE_CLOSED_SVG}`;

            if (oldAddon) {
                oldAddon.replaceWith(toggle);
            } else {
                group.appendChild(toggle);
            }
        }

        toggle.setAttribute('aria-label', 'Show password');
        toggle.setAttribute('aria-pressed', 'false');

        toggle.addEventListener('click', () => {
            const isVisible = input.type === 'text';
            input.type = isVisible ? 'password' : 'text';
            toggle.classList.toggle('is-visible', !isVisible);
            toggle.setAttribute('aria-pressed', String(!isVisible));
            toggle.setAttribute('aria-label', isVisible ? 'Show password' : 'Hide password');
            input.focus();
        });
    });
};

const initLoginForm = () => {
    const loginBtn = document.querySelector('.tokuen-login-btn');
    if (!loginBtn || loginBtn.dataset.loginReady === 'true') {
        return;
    }

    loginBtn.dataset.loginReady = 'true';
    loginBtn.addEventListener('click', (event) => {
        const link = loginBtn.closest('a');
        if (link) {
            event.preventDefault();
            runButtonLoading(loginBtn, async () => {
                showToast('Welcome back to TOKUEN');
                window.setTimeout(() => {
                    window.location.href = link.href || './dashboard/';
                }, 400);
            });
        }
    });
};

const initPulseIndicators = () => {
    document.querySelectorAll('.tokuen-client-stats small, .tokuen-loan-side small').forEach((element) => {
        if (element.textContent.toLowerCase().includes('due') || element.textContent.toLowerCase().includes('current')) {
            element.classList.add('tokuen-pulse-text');
        }
    });
};

const initMobileLoanCarousel = () => {
    document.querySelectorAll('.tokuen-loans-grid').forEach((grid) => {
        grid.classList.remove('tokuen-mobile-carousel');
    });
};

export const initUiEffects = () => {
    if (document.body.dataset.uiEffectsReady === 'true') {
        return;
    }

    document.body.dataset.uiEffectsReady = 'true';

    ensureGlobalContainers();
    initAuthOrbs();
    initPasswordToggles();
    initTimeGreeting();
    initDarkMode();
    initBottomNav();
    initRevealAnimations();
    initCountUp();
    initProgressBars();
    initDonutAnimation();
    initCharts();
    initDemoActions();
    initCopyReferences();
    initPageTransitions();
    initLoginForm();
    initPulseIndicators();
    initMobileLoanCarousel();
};
