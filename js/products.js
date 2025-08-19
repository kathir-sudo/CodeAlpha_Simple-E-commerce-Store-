document.addEventListener('DOMContentLoaded', async function() {
  // DOM Elements
  const productsGrid = document.querySelector('.products-grid#featured-products') || document.querySelector('.products-page .products-grid');
  const filtersContainer = document.querySelector('.filter-sidebar');
  const productsTitle = document.querySelector('.products-title');

  // State
  let allProducts = [];
  let filters = {
    category: [],
    price: 500,
    sort: '',
    keyword: ''
  };

  // Get initial filters from URL
  const urlParams = new URLSearchParams(window.location.search);
  filters.category = urlParams.get('category')?.split(',') || [];
  filters.keyword = urlParams.get('keyword') || '';
  filters.sort = urlParams.get('sort') || '';
  
  // --- RENDER FUNCTIONS ---
  
  function renderProducts(productsToRender) {
    if (!productsGrid) return;

    if (productsToRender.length === 0) {
      productsGrid.innerHTML = '<p class="no-results" style="grid-column: 1 / -1; text-align: center;">No products found matching your criteria.</p>';
      return;
    }
    
    productsGrid.innerHTML = productsToRender.map(product => `
      <div class="product-card" data-id="${product._id}">
        ${product.originalPrice && product.originalPrice > product.price ? 
          `<div class="product-badge">SALE</div>` : ''}
        <a href="product-detail.html?id=${product._id}">
          <img src="${product.imageUrl}" alt="${product.name}" class="product-image">
        </a>
        <div class="product-info">
          <a href="product-detail.html?id=${product._id}" class="product-title-link">${product.name}</a>
          <div class="product-price">
            <span class="current-price">${formatPrice(product.price)}</span>
            ${product.originalPrice && product.originalPrice > product.price ? 
              `<span class="original-price">${formatPrice(product.originalPrice)}</span>` : ''}
          </div>
          <div class="product-rating">
            ${Array.from({ length: 5 }, (_, i) => 
              `<i class="fa-star ${i < Math.round(product.rating) ? 'fas' : 'far'}"></i>`
            ).join('')}
            <span>(${product.numReviews})</span>
          </div>
          <button class="btn btn-sm add-to-cart">Add to Cart</button>
        </div>
      </div>
    `).join('');
  }

  function populateCategoryFilters() {
    if (!filtersContainer) return;
    const categories = [...new Set(allProducts.map(p => p.category))];
    const categoryFilterContent = filtersContainer.querySelector('.filter-content[data-filter="category"]');
    
    categoryFilterContent.innerHTML = categories.map(cat => `
      <div class="filter-item">
        <input type="checkbox" id="cat-${cat.toLowerCase()}" value="${cat}" ${filters.category.includes(cat) ? 'checked' : ''}>
        <label for="cat-${cat.toLowerCase()}">${cat}</label>
      </div>
    `).join('');
  }

  // --- LOGIC & API CALLS ---

  async function fetchAllProducts() {
    productsGrid.innerHTML = '<div class="loading-spinner" style="grid-column: 1 / -1;"></div>';
    try {
      // Fetch all products for filtering, ignoring pagination for this
      const response = await fetch(`${API_BASE_URL}/products?pageSize=100`);
      if (!response.ok) throw new Error('Could not fetch products');
      const data = await response.json();
      allProducts = data.products;
      
      if (filtersContainer) {
        populateCategoryFilters();
        applyFiltersAndRender();
      } else if (document.body.classList.contains('home-page')) {
        // Special logic for home page featured products
        const featured = allProducts.sort((a,b) => b.rating - a.rating).slice(0, 4);
        renderProducts(featured);
      }
    } catch (error) {
      productsGrid.innerHTML = `<p class="alert alert-error" style="grid-column: 1 / -1;">${error.message}</p>`;
    }
  }

  function applyFiltersAndRender() {
    let filtered = [...allProducts];

    // Keyword filter
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(keyword) || p.description.toLowerCase().includes(keyword));
      if(productsTitle) productsTitle.textContent = `Search: "${filters.keyword}"`;
    } else {
       if(productsTitle) productsTitle.textContent = 'All Products';
    }

    // Category filter
    if (filters.category.length > 0) {
      filtered = filtered.filter(p => filters.category.includes(p.category));
    }

    // Price filter
    filtered = filtered.filter(p => p.price <= filters.price);

    // Sorting
    switch (filters.sort) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'rating_desc':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'price_asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
    }

    renderProducts(filtered);
  }

  function handleAddToCart(e) {
    const card = e.target.closest('.product-card');
    if (!card) return;
    const productId = card.dataset.id;
    const product = allProducts.find(p => p._id === productId);
    
    if (product) {
      let cart = JSON.parse(localStorage.getItem('cart')) || [];
      const existingItem = cart.find(item => item.product === productId);
      
      if (existingItem) {
        existingItem.qty += 1;
      } else {
        cart.push({
          product: productId,
          name: product.name,
          image: product.imageUrl,
          price: product.price,
          qty: 1,
          color: product.colors[0],
          size: product.sizes[0]
        });
      }
      
      localStorage.setItem('cart', JSON.stringify(cart));
      updateCartCount();
      showAlert(`${product.name} added to cart!`);
    }
  }

  // --- EVENT LISTENERS & INITIALIZATION ---

  if (filtersContainer) {
    // Set up filter UI from state
    filtersContainer.querySelector('.price-slider').value = filters.price;
    filtersContainer.querySelector('.price-range').textContent = `Up to $${filters.price}`;
    document.getElementById('sort').value = filters.sort;

    filtersContainer.addEventListener('change', e => {
      if (e.target.type === 'checkbox') { // Category
        const category = e.target.value;
        if (e.target.checked) {
          filters.category.push(category);
        } else {
          filters.category = filters.category.filter(c => c !== category);
        }
      } else if (e.target.id === 'sort') { // Sort
        filters.sort = e.target.value;
      }
      applyFiltersAndRender();
    });

    filtersContainer.addEventListener('input', e => {
      if (e.target.type === 'range') { // Price
        filters.price = e.target.value;
        filtersContainer.querySelector('.price-range').textContent = `Up to $${filters.price}`;
        // Debounce filter application for slider
        clearTimeout(window.priceTimeout);
        window.priceTimeout = setTimeout(applyFiltersAndRender, 300);
      }
    });

    filtersContainer.querySelector('.clear-filters').addEventListener('click', () => {
        // Reset state
        filters.category = [];
        filters.price = 500;
        filters.sort = '';
        filters.keyword = '';
        // Reset UI
        filtersContainer.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
        filtersContainer.querySelector('.price-slider').value = 500;
        filtersContainer.querySelector('.price-range').textContent = `Up to $500`;
        document.getElementById('sort').value = '';
        if(productsTitle) productsTitle.textContent = 'All Products';
        // Re-render
        applyFiltersAndRender();
    });
  }

  productsGrid.addEventListener('click', e => {
    if (e.target.classList.contains('add-to-cart')) {
      handleAddToCart(e);
    }
  });

  document.body.classList.add(
    document.querySelector('.home-page') ? 'home-page' :
    document.querySelector('.products-page') ? 'products-page' : ''
  );

  fetchAllProducts();
});