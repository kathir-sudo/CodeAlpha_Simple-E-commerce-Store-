document.addEventListener('DOMContentLoaded', async function() {
  // Wait for currentUser to be populated by main.js
  await new Promise(resolve => setTimeout(resolve, 100));

  // Check admin status
  if (!currentUser || !currentUser.isAdmin) {
    showAlert('You are not authorized to view this page.', 'error');
    setTimeout(() => window.location.href = 'index.html', 2000);
    return;
  }
  
  // DOM Elements
  const adminContent = document.querySelector('.admin-content');
  const adminMenu = document.querySelector('.admin-menu');
  let currentView = 'products';

  // --- RENDER FUNCTIONS ---
  
  const renderProductsTable = (products) => {
    adminContent.innerHTML = `
      <div class="admin-content-header">
        <h2 class="admin-content-title">Products</h2>
        <button class="btn btn-primary add-product-btn">Add Product</button>
      </div>
      <table class="admin-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>Price</th>
            <th>Category</th>
            <th>Stock</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${products.map(product => `
            <tr data-id="${product._id}">
              <td><img src="${product.imageUrl}" alt="${product.name}" width="50" height="50" style="object-fit: cover;"></td>
              <td>${product.name}</td>
              <td>${formatPrice(product.price)}</td>
              <td>${product.category}</td>
              <td>${product.stock}</td>
              <td class="table-actions">
                <button class="action-btn edit-btn">Edit</button>
                <button class="action-btn delete-btn">Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  };

  const renderOrdersTable = (orders) => {
    adminContent.innerHTML = `
      <h2 class="admin-content-title">Orders</h2>
      <table class="admin-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${orders.map(order => `
            <tr data-id="${order._id}">
              <td>${order._id.substring(0, 8)}...</td>
              <td>${order.user ? order.user.username : 'Deleted User'}</td>
              <td>${new Date(order.createdAt).toLocaleDateString()}</td>
              <td>${formatPrice(order.totalPrice)}</td>
              <td>
                <select class="status-select" data-order-id="${order._id}">
                  <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                  <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
                  <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                  <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                  <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  };

  const renderProductForm = (product = null) => {
    adminContent.innerHTML = `
      <h2 class="admin-content-title">${product ? 'Edit Product' : 'Add Product'}</h2>
      <form class="admin-form" id="product-form">
        <input type="hidden" id="productId" value="${product?._id || ''}">
        <div class="form-row">
          <div class="form-group">
            <label for="name">Product Name</label>
            <input type="text" id="name" value="${product?.name || ''}" required>
          </div>
          <div class="form-group">
            <label for="price">Price</label>
            <input type="number" id="price" step="0.01" value="${product?.price || ''}" required>
          </div>
        </div>
        <div class="form-group">
            <label for="description">Description</label>
            <textarea id="description" required>${product?.description || ''}</textarea>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label for="category">Category</label>
                <input type="text" id="category" value="${product?.category || ''}" required>
            </div>
            <div class="form-group">
                <label for="stock">Stock</label>
                <input type="number" id="stock" value="${product?.stock || '0'}" required>
            </div>
        </div>
         <div class="form-row">
            <div class="form-group">
                <label for="colors">Colors (comma separated)</label>
                <input type="text" id="colors" value="${product?.colors?.join(', ') || ''}">
            </div>
            <div class="form-group">
                <label for="sizes">Sizes (comma separated)</label>
                <input type="text" id="sizes" value="${product?.sizes?.join(', ') || ''}">
            </div>
        </div>
        <div class="form-group">
            <label for="image">Product Image</label>
            <input type="file" id="image" name="image">
            <input type="hidden" id="imageUrl" value="${product?.imageUrl || ''}">
            ${product?.imageUrl ? `<img src="${product.imageUrl}" class="image-preview">` : ''}
        </div>
        <div class="form-actions">
            <button type="button" class="btn cancel-btn">Cancel</button>
            <button type="submit" class="btn btn-primary save-btn">Save</button>
        </div>
      </form>
    `;
  };

  // --- API CALLS & LOGIC ---

  const fetchAndRender = async (view) => {
    adminContent.innerHTML = '<div class="loading-spinner"></div>';
    try {
      const token = localStorage.getItem('token');
      const url = view === 'products' ? `${API_BASE_URL}/products?pageSize=100` : `${API_BASE_URL}/orders`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      if (view === 'products') renderProductsTable(data.products);
      else if (view === 'orders') renderOrdersTable(data);
      
    } catch (error) {
      adminContent.innerHTML = `<p class="alert alert-error">Error: ${error.message}</p>`;
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const saveBtn = e.target.querySelector('.save-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    const productId = document.getElementById('productId').value;
    const isEdit = !!productId;
    let imageUrl = document.getElementById('imageUrl').value;
    const imageFile = document.getElementById('image').files[0];
    
    try {
      // 1. Upload image if a new one is selected
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const uploadRes = await fetch(`${API_BASE_URL}/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.message || 'Image upload failed');
        imageUrl = uploadData.image;
      }
      
      // 2. Prepare product data
      const productData = {
        name: document.getElementById('name').value,
        price: document.getElementById('price').value,
        description: document.getElementById('description').value,
        category: document.getElementById('category').value,
        stock: document.getElementById('stock').value,
        colors: document.getElementById('colors').value,
        sizes: document.getElementById('sizes').value,
        imageUrl: imageUrl,
      };

      // 3. Save product data (Create or Update)
      const url = isEdit ? `${API_BASE_URL}/products/${productId}` : `${API_BASE_URL}/products`;
      const method = isEdit ? 'PUT' : 'POST';
      
      const productRes = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(productData),
      });

      const savedProduct = await productRes.json();
      if (!productRes.ok) throw new Error(savedProduct.message || 'Failed to save product');

      showAlert(`Product ${isEdit ? 'updated' : 'created'} successfully!`);
      await switchView('products');

    } catch (error) {
      showAlert(error.message, 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save';
    }
  };
  
  const handleDeleteProduct = async (productId) => {
      if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;
      try {
          const res = await fetch(`${API_BASE_URL}/products/${productId}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          if (!res.ok) {
              const data = await res.json();
              throw new Error(data.message);
          }
          showAlert('Product deleted successfully');
          document.querySelector(`tr[data-id="${productId}"]`).remove();
      } catch (error) {
          showAlert(error.message, 'error');
      }
  };

  const handleUpdateStatus = async (orderId, status) => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message);
      }
      showAlert('Order status updated successfully.', 'success');
    } catch(error) {
       showAlert(error.message, 'error');
    }
  };

  // --- EVENT HANDLING & INITIALIZATION ---
  
  const switchView = async (view) => {
    currentView = view;
    document.querySelectorAll('.admin-menu a').forEach(a => a.classList.remove('active'));
    document.querySelector(`.admin-menu a[href="#${view}"]`).classList.add('active');
    await fetchAndRender(view);
  };

  adminMenu.addEventListener('click', (e) => {
    e.preventDefault();
    if (e.target.tagName === 'A') {
      const view = e.target.hash.substring(1);
      if (view !== currentView) {
        switchView(view);
      }
    }
  });

  adminContent.addEventListener('click', async (e) => {
    const target = e.target;
    if (target.classList.contains('add-product-btn')) {
        renderProductForm();
    } else if (target.classList.contains('edit-btn')) {
        const productId = target.closest('tr').dataset.id;
        const res = await fetch(`${API_BASE_URL}/products/${productId}`);
        const product = await res.json();
        renderProductForm(product);
    } else if (target.classList.contains('delete-btn')) {
        const productId = target.closest('tr').dataset.id;
        handleDeleteProduct(productId);
    } else if (target.classList.contains('cancel-btn')) {
        switchView('products');
    }
  });
  
  adminContent.addEventListener('submit', (e) => {
    if (e.target.id === 'product-form') {
        handleFormSubmit(e);
    }
  });

  adminContent.addEventListener('change', (e) => {
      if(e.target.classList.contains('status-select')) {
          const orderId = e.target.dataset.orderId;
          const status = e.target.value;
          handleUpdateStatus(orderId, status);
      }
  });

  // Initial load
  switchView('products');
});