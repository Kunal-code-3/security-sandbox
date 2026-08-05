(function() {
    const authKey = 'securitySandboxAuth';
    const userKey = 'securitySandboxUser';

    function isAuthenticated() {
        return sessionStorage.getItem(authKey) === 'true' || localStorage.getItem(authKey) === 'true';
    }

    function logout() {
        sessionStorage.removeItem(authKey);
        sessionStorage.removeItem(userKey);
        localStorage.removeItem(authKey);
        localStorage.removeItem(userKey);
        window.location.href = 'auth.html';
    }

    const pageName = window.location.pathname.split('/').pop() || 'index.html';
    const isAuthPage = pageName === 'auth.html';

    // Redirect to login if unauthenticated on protected pages
    if (!isAuthPage && !isAuthenticated()) {
        window.location.replace('auth.html');
        return;
    }

    document.addEventListener('DOMContentLoaded', () => {
        const navUl = document.querySelector('nav ul');
        if (!navUl) return;

        // Find existing auth link (pointing to auth.html)
        const authLi = Array.from(navUl.querySelectorAll('li')).find(li => {
            const a = li.querySelector('a');
            return a && (a.getAttribute('href') === 'auth.html' || a.id === 'auth-link' || a.id === 'logout-nav-btn');
        });

        if (isAuthenticated()) {
            const userStr = sessionStorage.getItem(userKey) || localStorage.getItem(userKey);
            let userName = '';
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    if (user && user.name) userName = user.name.split(' ')[0];
                } catch (e) {}
            }

            if (authLi) {
                authLi.innerHTML = `
                    <a href="#" id="logout-nav-btn" class="logout-link">
                        <i class="fa-solid fa-right-from-bracket"></i> Log Out ${userName ? `(${userName})` : ''}
                    </a>
                `;
            } else {
                const li = document.createElement('li');
                li.innerHTML = `
                    <a href="#" id="logout-nav-btn" class="logout-link">
                        <i class="fa-solid fa-right-from-bracket"></i> Log Out ${userName ? `(${userName})` : ''}
                    </a>
                `;
                navUl.appendChild(li);
            }

            const logoutBtn = document.getElementById('logout-nav-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    logout();
                });
            }
        }
    });

    window.logoutSecuritySandbox = logout;
})();
