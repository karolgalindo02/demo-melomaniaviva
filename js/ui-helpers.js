// UI Helper Functions

// Show loading spinner
function showLoading(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = '<div class="flex justify-center items-center py-8"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>';
  }
}

// Show error message
function showError(message, elementId = null) {
  const errorHtml = `
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
      <strong class="font-bold">Error: </strong>
      <span class="block sm:inline">${message}</span>
    </div>
  `;
  
  if (elementId) {
    const element = document.getElementById(elementId);
    if (element) element.innerHTML = errorHtml;
  } else {
    // Show in toast
    showToast(message, 'error');
  }
}

// Show success message
function showSuccess(message, elementId = null) {
  const successHtml = `
    <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
      <strong class="font-bold">Éxito: </strong>
      <span class="block sm:inline">${message}</span>
    </div>
  `;
  
  if (elementId) {
    const element = document.getElementById(elementId);
    if (element) element.innerHTML = successHtml;
  } else {
    showToast(message, 'success');
  }
}

// Toast notification
function showToast(message, type = 'info') {
  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500'
  };
  
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300`;
  toast.innerHTML = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Format date
function formatDate(date) {
  if (!date) return '';
  
  if (date.toDate) {
    date = date.toDate(); // Firestore timestamp
  }
  
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(date).toLocaleDateString('es-ES', options);
}

// Format time ago
function timeAgo(date) {
  if (!date) return '';
  
  if (date.toDate) {
    date = date.toDate();
  }
  
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' años';
  
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' meses';
  
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' días';
  
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' horas';
  
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' minutos';
  
  return 'Hace un momento';
}

// Toggle modal
function toggleModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    if (modal.classList.contains('hidden')) {
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    } else {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  }
}

// Close modal on outside click
function setupModalCloseOnOutsideClick() {
  document.querySelectorAll('[data-modal]').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        toggleModal(modal.id);
      }
    });
  });
}

// Smooth scroll to element
function scrollToElement(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// Initialize tooltips
function initTooltips() {
  document.querySelectorAll('[data-tooltip]').forEach(element => {
    element.addEventListener('mouseenter', (e) => {
      const tooltip = document.createElement('div');
      tooltip.className = 'absolute bg-gray-800 text-white text-sm px-2 py-1 rounded shadow-lg z-50';
      tooltip.textContent = e.target.dataset.tooltip;
      tooltip.id = 'active-tooltip';
      
      document.body.appendChild(tooltip);
      
      const rect = e.target.getBoundingClientRect();
      tooltip.style.top = (rect.top - tooltip.offsetHeight - 5) + 'px';
      tooltip.style.left = (rect.left + rect.width / 2 - tooltip.offsetWidth / 2) + 'px';
    });
    
    element.addEventListener('mouseleave', () => {
      const tooltip = document.getElementById('active-tooltip');
      if (tooltip) tooltip.remove();
    });
  });
}

// Image lazy loading
function initLazyLoading() {
  const images = document.querySelectorAll('img[data-src]');
  
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        observer.unobserve(img);
      }
    });
  });
  
  images.forEach(img => imageObserver.observe(img));
}

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  setupModalCloseOnOutsideClick();
  initTooltips();
  initLazyLoading();
});