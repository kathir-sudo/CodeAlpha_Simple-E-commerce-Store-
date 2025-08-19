// Global variables
const API_BASE_URL = 'http://localhost:5000/api';
let currentUser = null;

// DOM Elements
const headerPlaceholder = document.getElementById('header-placeholder');
const footerPlaceholder = document.getElementById('footer-placeholder');

// Header HTML
// In js/main.js

const headerHTML = `
  <header>
    <div class="container header-container">
      <a href="index.html" class="logo">SHOP.<span>CO</span></a>
      <nav class="main-nav">
        <ul class="nav-links">
          <li><a href="index.html">Home</a></li>
          <li><a href="products.html">Shop</a></li>
          <li class="profile-link-desktop"><a href="profile.html">My Account</a></li>
          <li class="admin-link-desktop"><a href="admin.html">Admin</a></li>
        </ul>
      </nav>
      <div class="header-icons">
        <a href="cart.html" aria-label="Shopping Cart">
          <i class="fas fa-shopping-cart">
            <span class="cart-count">0</span>
          </i>
        </a>
        <a href="login.html" class="user-icon-link" aria-label="User Account">
          <i class="fas fa-user"></i>
        </a>
      </div>
      <button class="mobile-menu-btn" aria-label="Toggle Menu">
        <i class="fas fa-bars"></i>
      </button>
    </div>
  </header>
`;

// Footer HTML
const footerHTML = `
  <footer>
    <div class="container footer-container">
      <div class="footer-about">
        <div class="footer-logo">SHOP.<span>CO</span></div>
        <p>Premium fashion and accessories at affordable prices.</p>
        <div class="social-links">
          <a href="#" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
          <a href="#" aria-label="Twitter"><i class="fab fa-twitter"></i></a>
          <a href="#" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
          <a href="#" aria-label="Pinterest"><i class="fab fa-pinterest-p"></i></a>
        </div>
      </div>
      <div class="footer-links">
        <h3>Shop</h3>
        <ul>
          <li><a href="products.html">All Products</a></li>
          <li><a href="products.html?sort=newest">New Arrivals</a></li>
          <li><a href="products.html?sort=rating_desc">Best Sellers</a></li>
        </ul>
      </div>
      <div class="footer-links">
        <h3>About</h3>
        <ul>
          <li><a href="#">Our Story</a></li>
          <li><a href="#">Careers</a></li>
          <li><a href="#">Terms & Conditions</a></li>
          <li><a href="#">Privacy Policy</a></li>
        </ul>
      </div>
      <div class="footer-links">
        <h3>Customer Service</h3>
        <ul>
          <li><a href="#">Contact Us</a></li>
          <li><a href="#">FAQs</a></li>
          <li><a href="#">Shipping & Returns</a></li>
        </ul>
      </div>
    </div>
    <div class="copyright">
      <p>© ${new Date().getFullYear()} SHOP.CO. All rights reserved.</p>
    </div>
  </footer>
`;

// Show alert message
function showAlert(message, type = 'success') {
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.textContent = message;
  
  const main = document.querySelector('main');
  if (main) {
    main.insertBefore(alert, main.firstChild);
    setTimeout(() => alert.remove(), 4000);
  } else {
    document.body.insertBefore(alert, document.body.firstChild);
     setTimeout(() => alert.remove(), 4000);
  }
}

// Format price
function formatPrice(price) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price);
}

// Check authentication status from localStorage
function checkAuthFromLocal() {
    const userString = localStorage.getItem('currentUser');
    if(userString) {
        currentUser = JSON.parse(userString);
    }
}


// Update UI based on auth status
// Replace the old updateAuthUI function in js/main.js with this one

function updateAuthUI() {
  const userIconLink = document.querySelector('.user-icon-link');
  const profileLinkDesktop = document.querySelector('.profile-link-desktop');
  const adminLinkDesktop = document.querySelector('.admin-link-desktop');

  // Ensure elements exist before trying to modify them
  if (!userIconLink || !profileLinkDesktop || !adminLinkDesktop) {
    return;
  }

  if (currentUser) {
    userIconLink.href = 'profile.html';
    profileLinkDesktop.style.display = 'list-item'; // Show the profile link
    
    // Explicitly show or hide the admin link based on the user's status
    if (currentUser.isAdmin) {
      adminLinkDesktop.style.display = 'list-item'; // Show the admin link
    } else {
      adminLinkDesktop.style.display = 'none'; // Hide the admin link
    }

  } else {
    userIconLink.href = 'login.html';
    profileLinkDesktop.style.display = 'none';
    adminLinkDesktop.style.display = 'none';
  }
}

// Update cart count in header
function updateCartCount() {
  const cartCountEl = document.querySelector('.cart-count');
  if (!cartCountEl) return;
  
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const totalItems = cart.reduce((total, item) => total + item.qty, 0);
  
  if (totalItems > 0) {
    cartCountEl.textContent = totalItems;
    cartCountEl.style.display = 'flex';
  } else {
    cartCountEl.style.display = 'none';
  }
}

// Initialize the app
function initApp() {
  // Inject header and footer
  if (headerPlaceholder) headerPlaceholder.innerHTML = headerHTML;
  if (footerPlaceholder) footerPlaceholder.innerHTML = footerHTML;
  
  checkAuthFromLocal();
  updateAuthUI();
  updateCartCount();
  
  // Mobile menu toggle
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');
  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);