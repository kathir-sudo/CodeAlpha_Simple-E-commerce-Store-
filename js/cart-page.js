document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const cartContainer = document.querySelector('.cart-container');
  const cartItemsContainer = document.querySelector('.cart-items');
  const cartSummaryContainer = document.querySelector('.cart-summary');
  
  // Cart data
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  
  // Render the entire cart page
  function renderCartPage() {
    if (cart.length === 0) {
      cartContainer.innerHTML = `
        <div class="empty-cart" style="grid-column: 1 / -1; text-align: center; padding: 50px 0;">
          <i class="fas fa-shopping-cart empty-cart-icon"></i>
          <h2 class="empty-cart-message">Your cart is empty</h2>
          <a href="products.html" class="btn btn-primary">Continue Shopping</a>
        </div>
      `;
      return;
    }
    
    // Render cart items
    cartItemsContainer.innerHTML = `
      <div class="cart-header">
        <h3 class="cart-title">Your Cart</h3>
        <span>${cart.reduce((total, item) => total + item.qty, 0)} items</span>
      </div>
      ${cart.map((item, index) => `
        <div class="cart-item" data-index="${index}">
          <img src="${item.image}" alt="${item.name}" class="cart-item-image">
          <div class="cart-item-details">
            <div>
              <h4 class="cart-item-title">${item.name}</h4>
              <p class="cart-item-options">${item.color || ''} / ${item.size || ''}</p>
            </div>
            <button class="cart-item-remove">Remove</button>
          </div>
          <div class="cart-item-actions">
            <p class="cart-item-price">${formatPrice(item.price)}</p>
            <div class="cart-item-quantity">
              <button class="quantity-btn minus">-</button>
              <input type="text" class="quantity-input" value="${item.qty}" readonly>
              <button class="quantity-btn plus">+</button>
            </div>
          </div>
        </div>
      `).join('')}
    `;
    
    updateCartSummary();
  }
  
  // Update cart summary
  function updateCartSummary() {
    const subtotal = cart.reduce((total, item) => total + (item.price * item.qty), 0);
    const shipping = subtotal > 50 ? 0 : 5.99;
    const total = subtotal + shipping;
    
    cartSummaryContainer.innerHTML = `
      <h3 class="summary-title">Order Summary</h3>
      <div class="summary-row">
        <span>Subtotal</span>
        <span>${formatPrice(subtotal)}</span>
      </div>
      <div class="summary-row">
        <span>Shipping</span>
        <span>${shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
      </div>
      <div class="summary-row summary-total">
        <span>Total</span>
        <span>${formatPrice(total)}</span>
      </div>
      <button class="btn btn-primary checkout-btn">Proceed to Checkout</button>
    `;
  }
  
  // --- Event Handlers ---
  
  function handleCartAction(e) {
    const target = e.target;
    const cartItem = target.closest('.cart-item');
    if (!cartItem) return;
    
    const index = parseInt(cartItem.dataset.index, 10);

    if (target.classList.contains('cart-item-remove')) {
      cart.splice(index, 1);
    } else if (target.classList.contains('quantity-btn')) {
      const isPlus = target.classList.contains('plus');
      if (isPlus && cart[index].qty < 10) {
        cart[index].qty++;
      } else if (!isPlus && cart[index].qty > 1) {
        cart[index].qty--;
      }
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    renderCartPage();
  }

  function proceedToCheckout() {
    if (currentUser) {
      window.location.href = 'checkout.html';
    } else {
      showAlert('Please login to proceed to checkout.', 'error');
      setTimeout(() => {
        window.location.href = `login.html?redirect=checkout.html`;
      }, 1500);
    }
  }

  // --- Initialization and Event Listeners ---
  
  renderCartPage();

  cartItemsContainer.addEventListener('click', handleCartAction);
  cartSummaryContainer.addEventListener('click', e => {
      if (e.target.classList.contains('checkout-btn')) {
          proceedToCheckout();
      }
  });
});