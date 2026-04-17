// =============================================================================
// login.js  —  Authentication for Mitos Pensionne
// =============================================================================

const CREDENTIALS = {
    username: 'wyse',
    password: 'genova'
};

function checkAuth() {
    if (localStorage.getItem('mitos-auth') === 'authenticated') {
        window.location.href = 'index.html';
    }
}

document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const username = document.getElementById('username').value.toLowerCase().trim();
    const password = document.getElementById('password').value.trim();
    const errorEl  = document.getElementById('errorMessage');
    const btn      = document.querySelector('.login-btn');

    errorEl.classList.remove('show');

    if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
        try {
            localStorage.setItem('mitos-auth', 'authenticated');
        } catch (e) {
            console.error('Could not save auth state:', e);
        }

        btn.textContent   = 'Logging in…';
        btn.style.opacity = '0.7';
        btn.disabled      = true;

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 300);

    } else {
        errorEl.textContent = 'Invalid username or password';
        errorEl.classList.add('show');

        const inputs = document.querySelectorAll('.form-group input');
        inputs.forEach(input => {
            input.style.borderColor = 'rgba(255, 94, 94, 0.5)';
            setTimeout(() => { input.style.borderColor = ''; }, 1200);
        });

        setTimeout(() => { errorEl.classList.remove('show'); }, 3000);
    }
});

checkAuth();