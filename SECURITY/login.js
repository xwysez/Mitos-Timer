// =============================================================================
// login.js  —  Authentication for Mitos Pensionne
// Credentials are checked here; on success, sets localStorage and redirects.
// This file lives in: LOGIN FOLDER/
// The main app lives one level up: ../index.html
// =============================================================================

const CREDENTIALS = {
    username: 'wyse',
    password: 'genova'
};

// Redirect to main app if already authenticated
function checkAuth() {
    if (localStorage.getItem('mitos-auth') === 'authenticated') {
        window.location.href = '../LOG/index.html';
    }
}

document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const u = document.getElementById('username').value;
    const p = document.getElementById('password').value;

    if (u === 'wyse' && p === 'genova') {
        localStorage.setItem('mitos-auth', 'authenticated');
        window.location.href = '../LOG/index.html';
    } else {
        alert('Invalid login');
    }
});

checkAuth();

// Handle form submission
document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const username     = document.getElementById('username').value.toLowerCase().trim();
    const password     = document.getElementById('password').value.trim();
    const errorEl      = document.getElementById('errorMessage');
    const btn          = document.querySelector('.login-btn');

    // Clear any existing error
    errorEl.classList.remove('show');

    if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
        // ── Success ───────────────────────────────────────────────────────────
        try {
            localStorage.setItem('mitos-auth', 'authenticated');
        } catch (e) {
            console.error('Could not save auth state:', e);
        }

        // Brief visual feedback before redirect
        btn.textContent = 'Logging in…';
        btn.style.opacity = '0.7';
        btn.disabled = true;

        setTimeout(() => {
            window.location.href = '/index.html';
        }, 300);

    } else {
        // ── Failure ───────────────────────────────────────────────────────────
        errorEl.textContent = 'Invalid username or password';
        errorEl.classList.add('show');

        // Shake the input fields
        const inputs = document.querySelectorAll('.form-group input');
        inputs.forEach(input => {
            input.style.borderColor = 'rgba(255, 94, 94, 0.5)';
            setTimeout(() => { input.style.borderColor = ''; }, 1200);
        });

        // Auto-hide error after 3 seconds
        setTimeout(() => { errorEl.classList.remove('show'); }, 3000);
    }
});

// Run on load
checkAuth();