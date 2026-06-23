/* Global UI/UX Controller */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Preloader Handler
  const preloader = document.getElementById('preloader');
  if (preloader) {
    // Force a tiny lag for visual enjoyment of the premium preloader
    setTimeout(() => {
      preloader.style.opacity = '0';
      preloader.style.visibility = 'hidden';
    }, 800);
  }

  // 2. Theme Switching System
  const themeToggleBtns = document.querySelectorAll('.theme-toggle-btn');
  const savedTheme = localStorage.getItem('theme') || 'light'; // Light theme default
  
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcons(savedTheme);

  themeToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateThemeIcons(newTheme);
      
      showNotification('Theme Changed', `Switched to ${newTheme.toUpperCase()} mode`, 'info');
    });
  });

  function updateThemeIcons(theme) {
    themeToggleBtns.forEach(btn => {
      if (theme === 'light') {
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
      } else {
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
      }
    });
  }

  // 3. Sticky Navigation Header
  const header = document.querySelector('header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        header.classList.add('sticky');
      } else {
        header.classList.remove('sticky');
      }
    });
  }

  // 4. Mobile Menu Toggle
  const menuToggle = document.querySelector('.menu-toggle');
  const navMenu = document.querySelector('.nav-menu');
  if (menuToggle && navMenu) {
    // Inject mobile sidebar elements dynamically
    // 4.1 Injected Header
    if (!document.getElementById('mobile-menu-header')) {
      const headerDiv = document.createElement('div');
      headerDiv.id = 'mobile-menu-header';
      headerDiv.className = 'mobile-menu-header';
      
      // Clone the desktop logo to ensure they are identical
      const desktopBrand = document.querySelector('header .brand');
      let brandHtml = '';
      if (desktopBrand) {
        brandHtml = desktopBrand.cloneNode(true).outerHTML;
      } else {
        brandHtml = `
          <a href="index.html" class="brand">
            <div class="brand-icon" data-icon="printer"></div>
          </a>
        `;
      }
      
      headerDiv.innerHTML = `
        ${brandHtml}
        <button class="mobile-menu-close" id="mobile-menu-close-btn" aria-label="Close Menu">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      `;
      navMenu.insertBefore(headerDiv, navMenu.firstChild);
    }

    // 4.2 Injected Search Bar
    if (!document.getElementById('mobile-menu-search')) {
      const searchDiv = document.createElement('div');
      searchDiv.id = 'mobile-menu-search';
      searchDiv.className = 'mobile-menu-search';
      searchDiv.innerHTML = `
        <h4>Search Now!</h4>
        <div class="search-box">
          <input type="text" placeholder="Search here..." id="mobile-search-input">
          <button id="mobile-search-btn" aria-label="Search">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </button>
        </div>
      `;
      const headerDiv = document.getElementById('mobile-menu-header');
      navMenu.insertBefore(searchDiv, headerDiv.nextSibling);
    }

    // 4.25 Injected Auth Buttons for Mobile Sidebar
    if (!document.getElementById('mobile-menu-auth')) {
      const authDiv = document.createElement('div');
      authDiv.id = 'mobile-menu-auth';
      authDiv.className = 'mobile-menu-auth';
      authDiv.style.display = 'none'; // Default hidden inline, overridden by media query in CSS for mobile view
      
      const loginBtn = document.querySelector('.nav-actions a[href="login.html"], .nav-actions a[href="dashboard-customer.html"], .nav-actions a[href="dashboard-designer.html"], .nav-actions a[href="dashboard-admin.html"]');
      const registerBtn = document.querySelector('.nav-actions a[href="register.html"]');
      
      let loginHtml = loginBtn ? loginBtn.cloneNode(true).outerHTML : '<a href="login.html" class="btn btn-glass btn-sm">LogIn</a>';
      let registerHtml = (registerBtn && registerBtn.style.display !== 'none') ? registerBtn.cloneNode(true).outerHTML : '<a href="register.html" class="btn btn-primary btn-sm">Register</a>';
      
      authDiv.innerHTML = `
        ${loginHtml}
        ${registerHtml}
      `;
      navMenu.appendChild(authDiv);
    }

    // 4.3 Injected Contact Info
    if (!document.getElementById('mobile-menu-contact')) {
      const contactDiv = document.createElement('div');
      contactDiv.id = 'mobile-menu-contact';
      contactDiv.className = 'mobile-menu-contact';
      contactDiv.innerHTML = `
        <h4>Contact Info</h4>
        <div class="contact-item">
          <span class="contact-label">Phone</span>
          <span class="contact-value"><a href="tel:+917010792745">+91 7010792745</a></span>
        </div>
        <div class="contact-item">
          <span class="contact-label">Email</span>
          <span class="contact-value"><a href="mailto:info@stackly.com">info@stackly.com</a></span>
        </div>
        <div class="contact-item">
          <span class="contact-label">Location</span>
          <span class="contact-value">Stackly, salem</span>
        </div>
      `;
      navMenu.appendChild(contactDiv);
    }

    // Event Handlers for Opening/Closing
    const closeMenu = () => {
      menuToggle.classList.remove('active');
      navMenu.classList.remove('active');
      document.body.classList.remove('menu-active');
      document.documentElement.classList.remove('menu-active');
    };

    menuToggle.addEventListener('click', () => {
      const willBeActive = !navMenu.classList.contains('active');
      menuToggle.classList.toggle('active', willBeActive);
      navMenu.classList.toggle('active', willBeActive);
      document.body.classList.toggle('menu-active', willBeActive);
      document.documentElement.classList.toggle('menu-active', willBeActive);
    });

    // Close mobile menu when clicking outside of the sidebar
    document.addEventListener('click', (e) => {
      if (navMenu.classList.contains('active')) {
        if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
          closeMenu();
        }
      }
    });

    // Handle mobile navigation links & dropdown item click events
    document.querySelectorAll('.nav-link, .dropdown-item').forEach(link => {
      link.addEventListener('click', (e) => {
        if (link.classList.contains('dropdown-toggle') && window.innerWidth <= 768) {
          e.preventDefault();
          const dropdownParent = link.closest('.dropdown');
          if (dropdownParent) {
            dropdownParent.classList.toggle('active');
          }
        } else {
          closeMenu();
        }
      });
    });

    // Handle search action (redirect to 404.html)
    document.addEventListener('click', (e) => {
      const searchBtn = e.target.closest('#mobile-search-btn');
      if (searchBtn) {
        const searchInput = document.getElementById('mobile-search-input');
        if (searchInput && searchInput.value.trim() !== "") {
          window.location.href = '404.html';
        }
      }
    });

    document.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const searchInput = document.getElementById('mobile-search-input');
        if (searchInput && document.activeElement === searchInput && searchInput.value.trim() !== "") {
          window.location.href = '404.html';
        }
      }
    });

    // Connect dynamically added close button listener after DOM settles or immediately
    const bindCloseBtn = () => {
      const closeBtn = document.getElementById('mobile-menu-close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', closeMenu);
      } else {
        setTimeout(bindCloseBtn, 50);
      }
    };
    bindCloseBtn();
  }

  // 4.5 Dashboard Mobile Sidebar Open/Close and Blur/Scroll-lock Handlers
  const sidebarTrigger = document.getElementById('sidebar-trigger');
  const sidebarClose = document.getElementById('sidebar-close-btn');
  const dashboardSidebar = document.getElementById('dashboard-sidebar');

  if (sidebarTrigger && dashboardSidebar) {
    sidebarTrigger.addEventListener('click', () => {
      dashboardSidebar.classList.add('active');
      document.body.classList.add('sidebar-active');
      document.documentElement.classList.add('sidebar-active');
    });
  }

  if (sidebarClose && dashboardSidebar) {
    sidebarClose.addEventListener('click', () => {
      dashboardSidebar.classList.remove('active');
      document.body.classList.remove('sidebar-active');
      document.documentElement.classList.remove('sidebar-active');
    });
  }

  // Remove active scroll-lock/blur when navigation links inside the sidebar are clicked
  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', () => {
      document.body.classList.remove('sidebar-active');
      document.documentElement.classList.remove('sidebar-active');
      if (dashboardSidebar) dashboardSidebar.classList.remove('active');
    });
  });

  // 5. Scroll Intersection Observer for Stats Counters and Animations
  const statsCounters = document.querySelectorAll('.stats-counter');
  if (statsCounters.length > 0) {
    const observerOptions = {
      threshold: 0.5
    };

    const counterObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = entry.target;
          const countTo = parseInt(target.getAttribute('data-target'), 10);
          let currentCount = 0;
          const duration = 2000; // 2 seconds
          const stepTime = Math.max(Math.floor(duration / countTo), 15);
          
          const counterInterval = setInterval(() => {
            currentCount += Math.ceil(countTo / (duration / stepTime));
            if (currentCount >= countTo) {
              target.innerText = countTo.toLocaleString() + (target.getAttribute('data-suffix') || '');
              clearInterval(counterInterval);
            } else {
              target.innerText = currentCount.toLocaleString() + (target.getAttribute('data-suffix') || '');
            }
          }, stepTime);
          
          observer.unobserve(target);
        }
      });
    }, observerOptions);

    statsCounters.forEach(counter => counterObserver.observe(counter));
  }

  // 6. Active Navigation Link Indicator
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const linkHref = link.getAttribute('href');
    if (linkHref === currentPath || (currentPath === '' && linkHref === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // 6.5 Route Interceptor (Unavailability check -> redirect to 404)
  const VALID_PAGES = [
    'index.html', 'about.html', 'services.html', 'materials.html', 'pricing.html',
    'technologies.html', 'industries.html', 'gallery.html', 'blog.html', 'contact.html',
    '404.html', 'login.html', 'register.html', 'verify.html',
    'dashboard-customer.html', 'dashboard-designer.html', 'dashboard-admin.html'
  ];

  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a');
    if (anchor) {
      const href = anchor.getAttribute('href');
      // Intercept local relative html pages only
      if (href && !href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('#') && !href.startsWith('javascript:')) {
        const page = href.split('?')[0].split('#')[0];
        if (page && !VALID_PAGES.includes(page)) {
          e.preventDefault();
          window.location.href = '404.html';
        }
      }
    }
  });

  // 7. Initialize Toast Container on body
  if (!document.querySelector('.toast-container')) {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  // 8. Printo Benefits Slideshow
  const benefitsSlides = document.querySelectorAll('.benefits-slide');
  const benefitsDots = document.querySelectorAll('.benefits-dot');
  let currentBenefitIndex = 0;
  let benefitsInterval;

  function showBenefitSlide(index) {
    if (benefitsSlides.length === 0) return;
    if (index >= benefitsSlides.length) index = 0;
    if (index < 0) index = benefitsSlides.length - 1;

    benefitsSlides[currentBenefitIndex].classList.remove('active');
    benefitsDots[currentBenefitIndex].classList.remove('active');

    currentBenefitIndex = index;

    benefitsSlides[currentBenefitIndex].classList.add('active');
    benefitsDots[currentBenefitIndex].classList.add('active');
  }

  if (benefitsSlides.length > 0) {
    benefitsDots.forEach((dot, idx) => {
      dot.addEventListener('click', () => {
        showBenefitSlide(idx);
        startBenefitsAutoSlide();
      });
    });

    function startBenefitsAutoSlide() {
      if (benefitsInterval) clearInterval(benefitsInterval);
      benefitsInterval = setInterval(() => {
        showBenefitSlide(currentBenefitIndex + 1);
      }, 5000);
    }
    
    startBenefitsAutoSlide();
  }

  // 9. Printo Process Workflow Tabs
  const tabBtns = document.querySelectorAll('.printo-tab-btn');
  const tabPanels = document.querySelectorAll('.printo-tab-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const activePanel = document.getElementById(`printo-tab-panel-${targetTab}`);
      if (activePanel) {
        activePanel.classList.add('active');
      }
    });
  });

  // 10. Testimonials slideshow
  const testiSlides = document.querySelectorAll('.testi-slide');
  const testiDots = document.querySelectorAll('.testi-dot');
  let currentTestiIndex = 0;
  let testiInterval;

  function showTestiSlide(index) {
    if (testiSlides.length === 0) return;
    if (index >= testiSlides.length) index = 0;
    if (index < 0) index = testiSlides.length - 1;

    testiSlides[currentTestiIndex].classList.remove('active');
    testiDots[currentTestiIndex].classList.remove('active');

    currentTestiIndex = index;

    testiSlides[currentTestiIndex].classList.add('active');
    testiDots[currentTestiIndex].classList.add('active');
  }

  if (testiSlides.length > 0) {
    testiDots.forEach((dot, idx) => {
      dot.addEventListener('click', () => {
        showTestiSlide(idx);
        startTestiAutoSlide();
      });
    });

    function startTestiAutoSlide() {
      if (testiInterval) clearInterval(testiInterval);
      testiInterval = setInterval(() => {
        showTestiSlide(currentTestiIndex + 1);
      }, 6000);
    }

    startTestiAutoSlide();
  }

  // 11. Video modal handling
  const videoPlayBtn = document.querySelector('.video-play-btn');
  const videoModal = document.getElementById('video-modal');
  if (videoPlayBtn && videoModal) {
    videoPlayBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = '404.html';
    });

    const closeBtn = videoModal.querySelector('.modal-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        const iframe = videoModal.querySelector('iframe');
        if (iframe) {
          iframe.src = '';
        }
        closeModal('video-modal');
      });
    }

    videoModal.addEventListener('click', (e) => {
      if (e.target === videoModal) {
        const iframe = videoModal.querySelector('iframe');
        if (iframe) {
          iframe.src = '';
        }
        closeModal('video-modal');
      }
    });
  }

  // 12. Dynamic Login/Dashboard Header Link Update
  const userSession = sessionStorage.getItem('currentUser');
  if (userSession) {
    try {
      const currentUser = JSON.parse(userSession);
      let dest = 'dashboard-customer.html';
      if (currentUser.role === 'designer') dest = 'dashboard-designer.html';
      else if (currentUser.role === 'admin') dest = 'dashboard-admin.html';

      // Update all anchors linking to login.html
      document.querySelectorAll('a[href="login.html"]').forEach(link => {
        link.setAttribute('href', dest);
        if (link.textContent.includes('LogIn')) {
          link.innerHTML = link.innerHTML
            .replace('LogIn to Portal', 'Go to Dashboard')
            .replace('LogIn', 'Dashboard');
        }
        // If it was a header btn-glass, make it btn-primary for logged in state
        if (link.classList.contains('btn-glass')) {
          link.classList.remove('btn-glass');
          link.classList.add('btn-primary');
        }
      });

      // Hide all register links/buttons
      document.querySelectorAll('a[href="register.html"]').forEach(link => {
        link.style.display = 'none';
      });
    } catch (err) {
      console.error('Error parsing user session:', err);
    }
  }
});

// Global Notification Function (Toast style)
function showNotification(title, message, type = 'info') {
  const container = document.querySelector('.toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="toast-icon text-success"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  } else if (type === 'danger') {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="toast-icon text-danger"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
  } else if (type === 'warning') {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="toast-icon text-warning"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
  } else {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="toast-icon text-info"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
  }

  toast.innerHTML = `
    ${iconSvg}
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-desc">${message}</div>
    </div>
    <button class="toast-close">&times;</button>
  `;

  container.appendChild(toast);
  
  // Animate Entrance
  setTimeout(() => toast.classList.add('show'), 50);

  // Close event listener
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  });

  // Auto-remove after 4 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }
  }, 4000);
}

// Global Modal Utilities
function openModal(modalId) {
  const overlay = document.getElementById(modalId);
  if (overlay) {
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Disable page scrolling
  }
}

function closeModal(modalId) {
  const overlay = document.getElementById(modalId);
  if (overlay) {
    overlay.classList.remove('active');
    document.body.style.overflow = ''; // Enable page scrolling
  }
}

// Bind Escape key to close active modals
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const activeModals = document.querySelectorAll('.modal-overlay.active');
    activeModals.forEach(modal => closeModal(modal.id));
  }
});
