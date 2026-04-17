// =============================================================================
// login.js  —  Authentication for Mitos Pensionne
// =============================================================================

const CREDENTIALS = {
    firebaseEmail: 'brutaslouise@gmail.com'
};

document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const password = document.getElementById('password').value.trim();
    const errorEl  = document.getElementById('errorMessage');
    const btn      = document.querySelector('.login-btn');

    errorEl.classList.remove('show');

    btn.innerHTML     = 'Logging in…';
    btn.style.opacity = '0.7';
    btn.disabled      = true;

    try {
        await window.firebaseSignIn(CREDENTIALS.firebaseEmail, password);
        // redirect handled by onAuthStateChanged
    } catch (err) {
        console.error('Firebase Auth error:', err);

        btn.innerHTML     = 'Log In <span class="btn-arrow">→</span>';
        btn.style.opacity = '1';
        btn.disabled      = false;

        errorEl.textContent = err.message;
        errorEl.classList.add('show');
    }
});