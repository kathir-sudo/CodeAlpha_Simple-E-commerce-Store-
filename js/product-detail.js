document.addEventListener('DOMContentLoaded', async function() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  if (!productId) {
    window.location.href = 'products.html';
    return;
  }

  // State variables
  let product = null;
  let selectedColor = '';
  let selectedSize = '';
  let selectedQuantity = 1;

  // DOM Elements
  const mainImage = document.querySelector('.main-image');
  const thumbnailsContainer = document.querySelector('.thumbnail-list');
  const productTitle = document.querySelector('.product-title');
  const productPrice = document.querySelector('.product-price');
  const productRatingContainer = document.querySelector('.product-rating');
  const productDescription = document.querySelector('.product-description');
  const productDescriptionTab = document.querySelector('.product-description-tab');
  const colorOptionsContainer = document.querySelector('.color-options');
  const sizeOptionsContainer = document.querySelector('.size-options');
  const quantityInput = document.querySelector('.quantity-input');
  const addToCartBtn = document.querySelector('.add-to-cart-btn');
  const reviewForm = document.querySelector('.review-form');
  const reviewList = document.querySelector('.review-list');
  const quantityBtnMinus = document.querySelector('.quantity-btn:first-of-type');
  const quantityBtnPlus = document.querySelector('.quantity-btn:last-of-type');
  const ratingStarsContainer = document.querySelector('.rating-stars');

  // --- FUNCTIONS ---

  async function fetchProductDetails() {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}`);
      if (!response.ok) throw new Error('Product not found');
      product = await response.json();
      renderProductDetails();
    } catch (error) {
      console.error('Error fetching product details:', error);
      document.querySelector('.product-detail-container').innerHTML = '<h2>Product Not Found</h2>';
    }
  }

  function renderProductDetails() {
    if (!product) return;

    document.title = `${product.name} | SHOP.CO`;
    mainImage.src = product.imageUrl;
    mainImage.alt = product.name;

    const allImages = [product.imageUrl, ...(product.images || [])];
    thumbnailsContainer.innerHTML = allImages.map((img, index) =>
      `<img src="${img}" class="thumbnail ${index === 0 ? 'active' : ''}" alt="Thumbnail ${index + 1}">`
    ).join('');

    productTitle.textContent = product.name;
    productPrice.innerHTML = `
      <span class="current-price">${formatPrice(product.price)}</span>
      ${product.originalPrice && product.originalPrice > product.price ? 
        `<span class="original-price">${formatPrice(product.originalPrice)}</span>` : ''}
    `;

    productRatingContainer.innerHTML = `
      ${Array.from({ length: 5 }, (_, i) => 
        `<i class="fa-star ${i < Math.round(product.rating) ? 'fas' : 'far'}"></i>`
      ).join('')}
      <span>${product.rating.toFixed(1)} (${product.numReviews} reviews)</span>
    `;

    productDescription.textContent = product.description.substring(0, 150) + '...';
    productDescriptionTab.textContent = product.description;

    colorOptionsContainer.innerHTML = (product.colors || []).map((color, index) =>
      `<div class="color-option" style="background-color: ${color.toLowerCase()}" data-value="${color}" title="${color}"></div>`
    ).join('');
    
    sizeOptionsContainer.innerHTML = (product.sizes || []).map((size, index) =>
      `<div class="size-option" data-value="${size}">${size}</div>`
    ).join('');

    // Set initial selections
    if (product.colors && product.colors.length > 0) {
      selectOption(colorOptionsContainer.firstChild, 'color');
    }
    if (product.sizes && product.sizes.length > 0) {
      selectOption(sizeOptionsContainer.firstChild, 'size');
    }

    renderReviews();

    if (currentUser && !product.reviews.some(r => r.user === currentUser._id)) {
      reviewForm.style.display = 'block';
    }
  }

  function renderReviews() {
    if (!product || product.reviews.length === 0) {
      reviewList.innerHTML = '<p>No reviews yet. Be the first to review!</p>';
      return;
    }
    reviewList.innerHTML = product.reviews.map(review => `
      <div class="review-item">
        <div class="review-header">
          <span class="review-user">${review.username}</span>
          <span class="review-date">${new Date(review.createdAt).toLocaleDateString()}</span>
        </div>
        <div class="review-rating">
          ${Array.from({ length: 5 }, (_, i) => `<i class="fa-star ${i < review.rating ? 'fas' : 'far'}"></i>`).join('')}
        </div>
        <p>${review.comment}</p>
      </div>
    `).join('');
  }
  
  function changeMainImage(thumbnailEl) {
    mainImage.src = thumbnailEl.src;
    document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
    thumbnailEl.classList.add('active');
  }

  function selectOption(element, type) {
    if (!element) return;
    const container = type === 'color' ? colorOptionsContainer : sizeOptionsContainer;
    container.querySelectorAll(`.${type}-option`).forEach(opt => opt.classList.remove('active'));
    element.classList.add('active');
    
    if (type === 'color') selectedColor = element.dataset.value;
    else if (type === 'size') selectedSize = element.dataset.value;
  }

  function handleAddToCart() {
    if (!product) return;
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItemIndex = cart.findIndex(item => 
      item.product === productId && item.color === selectedColor && item.size === selectedSize
    );
    
    if (existingItemIndex > -1) {
      cart[existingItemIndex].qty += selectedQuantity;
    } else {
      cart.push({
        product: productId,
        name: product.name,
        image: product.imageUrl,
        price: product.price,
        qty: selectedQuantity,
        color: selectedColor,
        size: selectedSize
      });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showAlert(`${product.name} added to cart!`);
  }

  async function handleReviewSubmit(e) {
    e.preventDefault();
    if (!currentUser) {
      showAlert('Please login to submit a review', 'error');
      return;
    }
    
    const activeStars = ratingStarsContainer.querySelectorAll('.fas.fa-star');
    const rating = activeStars.length;
    const comment = document.getElementById('review-comment').value;

    if (rating === 0 || !comment.trim()) {
      showAlert('Please provide a rating and a comment', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ rating, comment })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to submit review');
      
      showAlert('Review submitted successfully!');
      reviewForm.reset();
      ratingStarsContainer.querySelectorAll('.rating-star').forEach(s => s.className = 'far fa-star rating-star');
      fetchProductDetails();
    } catch (error) {
      showAlert(error.message, 'error');
    }
  }

  // --- EVENT LISTENERS ---

  thumbnailsContainer.addEventListener('click', e => {
    if (e.target.classList.contains('thumbnail')) {
      changeMainImage(e.target);
    }
  });

  colorOptionsContainer.addEventListener('click', e => {
    if (e.target.classList.contains('color-option')) {
      selectOption(e.target, 'color');
    }
  });
  
  sizeOptionsContainer.addEventListener('click', e => {
    if (e.target.classList.contains('size-option')) {
      selectOption(e.target, 'size');
    }
  });

  quantityBtnPlus.addEventListener('click', () => {
    if (selectedQuantity < 10) {
      selectedQuantity++;
      quantityInput.value = selectedQuantity;
    }
  });

  quantityBtnMinus.addEventListener('click', () => {
    if (selectedQuantity > 1) {
      selectedQuantity--;
      quantityInput.value = selectedQuantity;
    }
  });

  quantityInput.addEventListener('change', () => {
    const value = parseInt(quantityInput.value, 10);
    if (!isNaN(value) && value > 0 && value <= 10) {
      selectedQuantity = value;
    }
    quantityInput.value = selectedQuantity; // Corrects invalid input
  });

  addToCartBtn.addEventListener('click', handleAddToCart);
  reviewForm.addEventListener('submit', handleReviewSubmit);

  ratingStarsContainer.addEventListener('click', e => {
      if (e.target.classList.contains('rating-star')) {
          const rating = parseInt(e.target.dataset.rating, 10);
          ratingStarsContainer.querySelectorAll('.rating-star').forEach(star => {
              star.className = parseInt(star.dataset.rating, 10) <= rating ? 'fas fa-star rating-star' : 'far fa-star rating-star';
          });
      }
  });
  
  document.querySelector('.tab-headers').addEventListener('click', e => {
      if(e.target.classList.contains('tab-header')) {
          const tabId = e.target.dataset.tab;
          document.querySelectorAll('.tab-header').forEach(th => th.classList.remove('active'));
          e.target.classList.add('active');
          document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
          document.getElementById(tabId).classList.add('active');
      }
  });


  // --- INITIALIZATION ---
  fetchProductDetails();
});