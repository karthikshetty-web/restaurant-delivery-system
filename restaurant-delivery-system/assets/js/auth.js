/**
 * Kudla Kitchen - Customer Auth Module (Login & Registration)
 */

document.addEventListener('DOMContentLoaded', () => {
    AuthUI.init();
});

const AuthUI = {
    init() {
        this.initLoginForm();
        this.initRegisterForm();
    },

    togglePassword(inputId, iconBtn) {
        const input = document.getElementById(inputId);
        if (!input) return;

        if (input.type === 'password') {
            input.type = 'text';
            iconBtn.textContent = '👁️';
            iconBtn.setAttribute('title', 'Hide Password');
        } else {
            input.type = 'password';
            iconBtn.textContent = '🔒';
            iconBtn.setAttribute('title', 'Show Password');
        }
    },

    initLoginForm() {
        const form = document.getElementById('login-form');
        if (!form) return;

        // If user is already logged in, redirect to home page
        if (API.isLoggedIn()) {
            App.showToast('You are already logged in.', 'info');
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 800);
            return;
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const emailInput = document.getElementById('login-email');
            const passwordInput = document.getElementById('login-password');
            const submitBtn = document.getElementById('login-submit-btn');
            const alertBox = document.getElementById('auth-alert');

            const email = emailInput.value.trim();
            const password = passwordInput.value;

            // Clear previous alerts
            this.showAlert(alertBox, '', 'hidden');

            // Client validation
            if (!email || !password) {
                this.showAlert(alertBox, 'Please enter both email address and password.', 'error');
                return;
            }

            // Set loading state
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span class="spinner">⏳</span> Signing in...`;

            try {
                const response = await API.login(email, password);

                if (response.success) {
                    this.showAlert(alertBox, 'Login successful! Redirecting...', 'success');
                    App.showToast('Welcome back to Kudla Kitchen!', 'success');
                    
                    // Verify profile details
                    await API.getProfile();

                    setTimeout(() => {
                        window.location.href = '../index.html';
                    }, 1000);
                } else {
                    const errorMsg = response.message || 'Invalid login credentials.';
                    this.showAlert(alertBox, errorMsg, 'error');
                    App.showToast(errorMsg, 'error');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                }
            } catch (err) {
                this.showAlert(alertBox, 'An error occurred during login. Please try again.', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    },

    initRegisterForm() {
        const form = document.getElementById('register-form');
        if (!form) return;

        // If user is already logged in, redirect to home page
        if (API.isLoggedIn()) {
            App.showToast('You are already logged in.', 'info');
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 800);
            return;
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nameInput = document.getElementById('reg-name');
            const emailInput = document.getElementById('reg-email');
            const phoneInput = document.getElementById('reg-phone');
            const passwordInput = document.getElementById('reg-password');
            const confirmInput = document.getElementById('reg-confirm-password');
            const submitBtn = document.getElementById('reg-submit-btn');
            const alertBox = document.getElementById('auth-alert');

            const name = nameInput.value.trim();
            const email = emailInput.value.trim();
            const phone = phoneInput.value.trim();
            const password = passwordInput.value;
            const confirmPassword = confirmInput.value;

            // Clear alert
            this.showAlert(alertBox, '', 'hidden');

            // Validation checks
            if (!name || !email || !phone || !password || !confirmPassword) {
                this.showAlert(alertBox, 'All fields are required.', 'error');
                return;
            }

            if (!this.isValidEmail(email)) {
                this.showAlert(alertBox, 'Please enter a valid email address.', 'error');
                return;
            }

            if (password.length < 6) {
                this.showAlert(alertBox, 'Password must be at least 6 characters long.', 'error');
                return;
            }

            if (password !== confirmPassword) {
                this.showAlert(alertBox, 'Passwords do not match.', 'error');
                return;
            }

            // Set loading state
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span class="spinner">⏳</span> Creating Account...`;

            try {
                const response = await API.register(name, email, phone, password);

                if (response.success) {
                    this.showAlert(alertBox, 'Account created successfully! Redirecting to login...', 'success');
                    App.showToast('Registration successful! Please sign in.', 'success');

                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 1500);
                } else {
                    const errorMsg = response.message || 'Registration failed. Email may already be in use.';
                    this.showAlert(alertBox, errorMsg, 'error');
                    App.showToast(errorMsg, 'error');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                }
            } catch (err) {
                this.showAlert(alertBox, 'An error occurred during registration.', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    },

    showAlert(alertElement, message, type) {
        if (!alertElement) return;

        if (type === 'hidden' || !message) {
            alertElement.style.display = 'none';
            alertElement.className = 'auth-alert';
            alertElement.textContent = '';
            return;
        }

        alertElement.style.display = 'block';
        alertElement.className = `auth-alert auth-alert-${type}`;
        alertElement.textContent = message;
    },

    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
};
