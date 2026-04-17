// =============================================================================
// login.js  —  Authentication for Mitos Pensionne
// =============================================================================

const CREDENTIALS = {
    username:      'wyse',
    password:      'genova',
    // This email must match the user you created in Firebase Console
    // (Authentication → Users → Add user)
    firebaseEmail: 'wyse@mitos.app'
};

document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const username = document.getElementById('username').value.toLowerCase().trim();
    const password = document.getElementById('password').value.trim();
    const errorEl  = document.getElementById('errorMessage');
    const btn      = document.querySelector('.login-btn');

    errorEl.classList.remove('show');

    if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
        btn.innerHTML     = 'Logging in…';
        btn.style.opacity = '0.7';
        btn.disabled      = true;

        try {
            // Sign in to Firebase — onAuthStateChanged in login.html handles the redirect
            await window.firebaseSignIn(CREDENTIALS.firebaseEmail, password);
        } catch (err) {
            console.error('Firebase Auth error:', err);
            btn.innerHTML     = 'Log In <span class="btn-arrow">→</span>';
            btn.style.opacity = '1';
            btn.disabled      = false;

            errorEl.textContent = 'Login failed. Please try again.';
            errorEl.classList.add('show');
            setTimeout(() => errorEl.classList.remove('show'), 3000);
        }

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
