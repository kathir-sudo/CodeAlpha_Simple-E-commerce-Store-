document.addEventListener('DOMContentLoaded', function() {
  const API_BASE_URL = 'http://localhost:5000/api';
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  // Show alert message
  function showAlert(message, type = 'success') {
    const alertContainer = document.querySelector('.auth-container') || document.querySelector('main');
    if (!alertContainer) return;

    // Remove existing alerts
    const existingAlert = alertContainer.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    alertContainer.insertBefore(alert, alertContainer.firstChild);
    setTimeout(() => alert.remove(), 5000);
  }

  // Handle Login
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const submitBtn = this.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.innerHTML;

      if (!email || !password) {
        showAlert('Please fill in all fields', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

      try {
        const response = await fetch(`${API_BASE_URL}/users/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Login failed');
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data)); // Store user info
        
        showAlert('Login successful! Redirecting...');
        
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect') || 'profile.html';

        setTimeout(() => {
          window.location.href = redirect;
        }, 1500);

      } catch (error) {
        showAlert(error.message, 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    });
  }

  // Handle Registration
  if (registerForm) {
    registerForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const username = document.getElementById('register-username').value.trim();
      const email = document.getElementById('register-email').value.trim();
      const password = document.getElementById('register-password').value;
      const confirmPassword = document.getElementById('register-confirm-password').value;
      const submitBtn = this.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.innerHTML;

      if (!username || !email || !password || !confirmPassword) {
        showAlert('Please fill in all fields', 'error');
        return;
      }
      
      if (password !== confirmPassword) {
        showAlert('Passwords do not match', 'error');
        return;
      }
      
      if (password.length < 6) {
        showAlert('Password must be at least 6 characters', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';

      try {
        const response = await fetch(`${API_BASE_URL}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password })
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Registration failed');
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data));
        
        showAlert('Registration successful! Redirecting...');
        setTimeout(() => {
          window.location.href = 'profile.html';
        }, 1500);

      } catch (error) {
        showAlert(error.message, 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    });
  }
});