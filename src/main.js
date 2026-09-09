import 'admin-lte/dist/js/adminlte';
import './css/style.css'

const initClientDashboard = () => {
    document.documentElement.style.visibility = 'visible'
    const dashboard = document.querySelector('[data-client-dashboard]');

    if (!dashboard || dashboard.dataset.navReady === 'true') {
        return;
    }

    const toggle = dashboard.querySelector('[data-sidebar-toggle]');
    const sidebar = dashboard.querySelector('.tokuen-client-sidebar');
    const navLinks = dashboard.querySelectorAll('.tokuen-client-nav a');
    const mobileQuery = window.matchMedia('(max-width: 760px)');
    const storageKey = 'tokuen-sidebar-collapsed';

    if (!toggle || !sidebar) {
        return;
    }

    dashboard.dataset.navReady = 'true';

    const setExpanded = (isExpanded) => {
        toggle.setAttribute('aria-expanded', String(isExpanded));
    };

    const closeMobileSidebar = () => {
        if (!mobileQuery.matches) {
            return;
        }

        dashboard.classList.remove('is-sidebar-collapsed');
        setExpanded(false);
    };

    const setActiveLink = () => {
        const currentPath = window.location.pathname.replace(/\/$/, '');
        const currentHash = window.location.hash;

        navLinks.forEach((link) => {
            const linkUrl = new URL(link.href, window.location.origin);
            const linkPath = linkUrl.pathname.replace(/\/$/, '');
            const samePath = linkPath === currentPath;

            const isActive = samePath && (
                linkUrl.hash === currentHash ||
                (!currentHash && (linkUrl.hash === '' || linkUrl.hash === '#overview'))
            );

            link.classList.toggle('active', isActive);
        });
    };

    const applyState = () => {
        if (mobileQuery.matches) {
            dashboard.classList.remove('is-sidebar-collapsed');
            setExpanded(false);
            return;
        }

        const isCollapsed = localStorage.getItem(storageKey) === 'true';
        dashboard.classList.toggle('is-sidebar-collapsed', isCollapsed);
        setExpanded(!isCollapsed);
    };

    toggle.addEventListener('click', (event) => {
        event.preventDefault();

        const isActive = dashboard.classList.toggle('is-sidebar-collapsed');

        if (mobileQuery.matches) {
            setExpanded(isActive);
            return;
        }

        localStorage.setItem(storageKey, String(isActive));
        setExpanded(!isActive);
    });

    navLinks.forEach((link) => {
        link.addEventListener('click', () => {
            const linkUrl = new URL(link.href, window.location.origin);

            if (linkUrl.pathname === window.location.pathname) {
                setActiveLink();
                navLinks.forEach((item) => item.classList.remove('active'));
                link.classList.add('active');
            }

            closeMobileSidebar();
        });
    });

    document.addEventListener('click', (event) => {
        if (!mobileQuery.matches || !dashboard.classList.contains('is-sidebar-collapsed')) {
            return;
        }

        if (!sidebar.contains(event.target) && !toggle.contains(event.target)) {
            closeMobileSidebar();
        }
    });

    window.addEventListener('hashchange', () => {
        setActiveLink();
    });

    mobileQuery.addEventListener('change', applyState);
    applyState();
    setActiveLink();
};

document.addEventListener('DOMContentLoaded', initClientDashboard);
document.addEventListener('livewire:navigated', initClientDashboard);
