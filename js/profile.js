document.addEventListener('DOMContentLoaded', async function() {
  if (!currentUser) {
    window.location.href = 'login.html';
    return;
  }
  
  // DOM Elements
  const profileAvatar = document.querySelector('.profile-avatar');
  const profileName = document.querySelector('.profile-name');
  const profileInfo = document.querySelector('.profile-info');
  const profileOrders = document.querySelector('.profile-orders');
  const logoutBtn = document.querySelector('.logout-btn');
  
  // Fetch user orders
  async function fetchUserOrders() {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/myorders`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const orders = await response.json();
        renderOrders(orders);
      } else {
          throw new Error('Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      profileOrders.innerHTML = '<p>Could not load your orders. Please try again later.</p>';
    }
  }
  
  // Render user orders
  function renderOrders(orders) {
    if (orders.length === 0) {
      profileOrders.innerHTML = '<p>You have no orders yet. <a href="products.html">Start shopping!</a></p>';
      return;
    }
    
    profileOrders.innerHTML = orders.map(order => `
      <div class="order-card">
        <div class="order-header">
          <span class="order-id">Order #${order._id.substring(0, 8)}</span>
          <span class="order-date">${new Date(order.createdAt).toLocaleDateString()}</span>
        </div>
        <div class="order-details">
            <p class="order-items-count">${order.orderItems.length} item(s)</p>
            <div class="order-total">Total: ${formatPrice(order.totalPrice)}</div>
        </div>
        <div class="order-status ${getStatusClass(order.status)}">${order.status}</div>
      </div>
    `).join('');
  }
  
  // Get status class for styling
  function getStatusClass(status) {
    switch(status.toLowerCase()) {
      case 'pending': return 'status-pending';
      case 'processing': return 'status-processing';
      case 'shipped': return 'status-shipped';
      case 'delivered': return 'status-delivered';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  }
  
  // Logout
  function logout(e) {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('cart');
    currentUser = null;
    showAlert("You've been logged out successfully.", "info");
    setTimeout(() => window.location.href = 'login.html', 1500);
  }
  
  // Initialize
  profileAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.username)}&background=ff6b6b&color=fff&size=100`;
  profileName.textContent = currentUser.username;
  
  profileInfo.innerHTML = `
    <div class="profile-info-item">
      <div class="profile-info-label">Username</div>
      <div>${currentUser.username}</div>
    </div>
    <div class="profile-info-item">
      <div class="profile-info-label">Email</div>
      <div>${currentUser.email}</div>
    </div>
    ${currentUser.isAdmin ? `
      <div class="profile-info-item">
        <div class="profile-info-label">Role</div>
        <div>Administrator</div>
      </div>
    ` : ''}
  `;
  
  await fetchUserOrders();
  
  // Event listeners
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }
});