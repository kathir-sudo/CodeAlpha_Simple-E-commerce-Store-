document.addEventListener('DOMContentLoaded', function() {
  // Redirect if not logged in or cart is empty
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  if (!currentUser || cart.length === 0) {
    window.location.href = 'cart.html';
    return;
  }

  // DOM Elements
  const checkoutForm = document.getElementById('checkout-form');
  const orderItemsContainer = document.querySelector('.order-items');
  const orderTotalsContainer = document.querySelector('.order-totals');
  const paymentMethodSelect = document.getElementById('payment-method');
  const creditCardDetails = document.getElementById('credit-card-details');

  // Render Order Summary
  function renderOrderSummary() {
    const subtotal = cart.reduce((total, item) => total + (item.price * item.qty), 0);
    const shipping = subtotal > 50 ? 0 : 5.99;
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + shipping + tax;

    // Render items
    orderItemsContainer.innerHTML = cart.map(item => `
      <div class="order-item">
        <div class="order-item-info">
          <img src="${item.image}" alt="${item.name}" class="order-item-image">
          <div class="order-item-details">
            <span class="order-item-name">${item.name} (x${item.qty})</span>
            <span class="order-item-options">${item.color} / ${item.size}</span>
          </div>
        </div>
        <span class="order-item-price">${formatPrice(item.price * item.qty)}</span>
      </div>
    `).join('');

    // Render totals
    orderTotalsContainer.innerHTML = `
      <div class="order-total-row">
        <span>Subtotal</span>
        <span id="subtotal">${formatPrice(subtotal)}</span>
      </div>
      <div class="order-total-row">
        <span>Shipping</span>
        <span id="shipping">${formatPrice(shipping)}</span>
      </div>
      <div class="order-total-row">
        <span>Tax</span>
        <span id="tax">${formatPrice(tax)}</span>
      </div>
      <div class="order-total-row order-total">
        <span>Total</span>
        <span id="total">${formatPrice(total)}</span>
      </div>
    `;
  }

  // Handle Payment Method Change
  paymentMethodSelect.addEventListener('change', (e) => {
    if (e.target.value === 'CreditCard') {
      creditCardDetails.style.display = 'block';
    } else {
      creditCardDetails.style.display = 'none';
    }
  });

  // Handle Form Submission
  checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const placeOrderBtn = document.querySelector('.place-order-btn');
    const originalBtnText = placeOrderBtn.innerHTML;

    placeOrderBtn.disabled = true;
    placeOrderBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Placing Order...';

    // Calculate totals again to ensure accuracy
    const subtotal = cart.reduce((total, item) => total + (item.price * item.qty), 0);
    const shipping = subtotal > 50 ? 0 : 5.99;
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax;

    const orderData = {
      orderItems: cart.map(item => ({
        product: item.product,
        name: item.name,
        image: item.image,
        price: item.price,
        qty: item.qty,
        color: item.color,
        size: item.size
      })),
      shippingAddress: {
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        postalCode: document.getElementById('postal-code').value,
        country: document.getElementById('country').value,
      },
      paymentMethod: document.getElementById('payment-method').value,
      totalPrice: total,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(orderData),
      });

      const createdOrder = await response.json();

      if (!response.ok) {
        throw new Error(createdOrder.message || 'Failed to place order.');
      }

      showAlert('Order placed successfully! Redirecting to your profile.');
      localStorage.removeItem('cart');
      updateCartCount(); // from main.js

      setTimeout(() => {
        window.location.href = 'profile.html';
      }, 2000);

    } catch (error) {
      showAlert(error.message, 'error');
      placeOrderBtn.disabled = false;
      placeOrderBtn.innerHTML = originalBtnText;
    }
  });

  // Initial Render
  renderOrderSummary();
});