/**
 * ATO AI Training Program - Main JavaScript
 * Handles all interactivity: animations, navigation, progress tracking, accordions
 * Works on both index page and individual session pages
 */

// ============================================================================
// PAGE LOAD ANIMATION
// ============================================================================

/**
 * Triggers fade-in animation on page load
 * CSS should transition body from opacity 0 to 1 when 'loaded' class is present
 */
function initPageLoadAnimation() {
  // Wait for DOM to be fully parsed
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      // Add loaded class to trigger CSS opacity transition
      document.body.classList.add('loaded');
    });
  } else {
    // If DOMContentLoaded has already fired
    document.body.classList.add('loaded');
  }
}

// ============================================================================
// SCROLL ANIMATIONS - INTERSECTION OBSERVER
// ============================================================================

/**
 * Initializes Intersection Observer for fade-in and slide-in animations
 * Elements with 'fade-in' or 'slide-in-left' classes will animate when entering viewport
 */
function initScrollAnimations() {
  // Elements to observe
  const observableElements = document.querySelectorAll('.fade-in, .slide-in-left');

  if (observableElements.length === 0) return; // No elements to animate

  // Intersection Observer options
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px'
  };

  // Callback when element enters viewport
  const observerCallback = (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const element = entry.target;
        const delay = element.getAttribute('data-delay');

        // Apply staggered delay if data-delay attribute exists
        if (delay) {
          element.style.transitionDelay = delay + 'ms';
        }

        // Add visible class to trigger CSS animation
        element.classList.add('visible');

        // Only animate once - unobserve after animation
        observer.unobserve(element);
      }
    });
  };

  // Create and start observer
  const observer = new IntersectionObserver(observerCallback, observerOptions);
  observableElements.forEach((element) => observer.observe(element));
}

// ============================================================================
// PROGRESS TRACKER
// ============================================================================

/**
 * Progress tracker state - array of 5 booleans
 * Index represents step number (0-4), value represents completion status
 */
let progressState = [false, false, false, false, false];

/**
 * Toggles completion status of a training step
 * @param {number} index - Step index (0-4)
 */
function toggleStep(index) {
  if (index < 0 || index >= progressState.length) return;
  progressState[index] = !progressState[index];
  updateProgress();
}

/**
 * Updates progress bar UI based on current state
 * Updates: fill bar width, percentage text, dot styles with checkmarks
 */
function updateProgress() {
  // Calculate completion percentage
  const completedCount = progressState.filter(Boolean).length;
  const percentage = (completedCount / progressState.length) * 100;

  // Update progress bar fill
  const progressFill = document.querySelector('.progress-fill');
  if (progressFill) {
    progressFill.style.width = percentage + '%';
  }

  // Update percentage text
  const progressText = document.querySelector('.progress-text');
  if (progressText) {
    progressText.textContent = Math.round(percentage) + '%';
  }

  // Update dot styles for each step
  const progressDots = document.querySelectorAll('.progress-dot');
  progressDots.forEach((dot, index) => {
    if (index < progressState.length) {
      if (progressState[index]) {
        dot.classList.add('completed');
        // Add checkmark content (via CSS ::before or data attribute)
        dot.setAttribute('data-completed', 'true');
      } else {
        dot.classList.remove('completed');
        dot.removeAttribute('data-completed');
      }
    }
  });
}

/**
 * Initializes progress tracker
 * Attaches click handlers to progress dots
 */
function initProgressTracker() {
  const progressDots = document.querySelectorAll('.progress-dot');

  if (progressDots.length === 0) return; // Not on index page

  progressDots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      toggleStep(index);
    });
  });

  // Initial render
  updateProgress();
}

// ============================================================================
// SESSION ACCORDION (INDEX PAGE) - For toggling session details in cards
// ============================================================================

/**
 * Toggles session accordion open/closed
 * Uses max-height CSS transition for smooth animation
 * Closes other open sessions (single-open accordion behavior)
 * @param {HTMLElement} headerElement - The session header that was clicked
 */
function toggleSession(headerElement) {
  // Get the details container (should be next sibling or child)
  const detailsDiv = headerElement.nextElementSibling;

  if (!detailsDiv) return;

  // Check if currently open
  const isOpen = detailsDiv.classList.contains('open');

  // Get all session containers on the page
  const allSessionHeaders = document.querySelectorAll('.session-header');

  // Close all other sessions
  allSessionHeaders.forEach((header) => {
    if (header !== headerElement) {
      const otherDetails = header.nextElementSibling;
      if (otherDetails) {
        otherDetails.classList.remove('open');
        // Also toggle the arrow if it exists
        const arrow = header.querySelector('.session-toggle-arrow');
        if (arrow) {
          arrow.classList.remove('open');
        }
      }
    }
  });

  // Toggle current session
  if (isOpen) {
    detailsDiv.classList.remove('open');
  } else {
    detailsDiv.classList.add('open');
  }

  // Toggle arrow rotation
  const toggleArrow = headerElement.querySelector('.session-toggle-arrow');
  if (toggleArrow) {
    toggleArrow.classList.toggle('open');
  }
}

/**
 * Initializes session accordion
 * Attaches click handlers to all session headers
 */
function initSessionAccordion() {
  const sessionHeaders = document.querySelectorAll('.session-header');

  if (sessionHeaders.length === 0) return; // No sessions on this page

  sessionHeaders.forEach((header) => {
    header.addEventListener('click', () => {
      toggleSession(header);
    });
  });
}

// ============================================================================
// ACCORDION TOGGLE - For session card details on index page
// ============================================================================

/**
 * Toggles accordion open/closed for session card details
 * @param {HTMLElement} button - The accordion toggle button
 */
function toggleAccordion(button) {
  const content = button.nextElementSibling;

  if (!content) return;

  // Toggle open class on button
  button.classList.toggle('open');

  // Toggle open class on content
  if (content && content.classList.contains('accordion-content')) {
    content.classList.toggle('open');
  }
}

// ============================================================================
// MOBILE NAVIGATION
// ============================================================================

/**
 * Toggles mobile navigation menu visibility
 * Toggles class on nav-links and mobile menu toggle button (hamburger or nav-toggle)
 */
function toggleMobileNav() {
  const navLinks = document.querySelector('.nav-links');
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle, .hamburger, .nav-toggle');

  if (navLinks) {
    navLinks.classList.toggle('active');
  }
  if (mobileMenuToggle) {
    mobileMenuToggle.classList.toggle('active');
  }
}

/**
 * Closes mobile navigation menu
 * Called when a navigation link is clicked
 */
function closeMobileNav() {
  const navLinks = document.querySelector('.nav-links');
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle, .hamburger, .nav-toggle');

  if (navLinks) {
    navLinks.classList.remove('active');
  }
  if (mobileMenuToggle) {
    mobileMenuToggle.classList.remove('active');
  }
}

/**
 * Initializes mobile navigation
 * Attaches click handlers to mobile menu toggle (hamburger/nav-toggle) and nav links
 */
function initMobileNav() {
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle, .hamburger, .nav-toggle');

  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', toggleMobileNav);
  }

  // Close menu when a navigation link is clicked
  const navLinks = document.querySelectorAll('nav a');
  navLinks.forEach((link) => {
    link.addEventListener('click', closeMobileNav);
  });
}

// ============================================================================
// SMOOTH SCROLLING
// ============================================================================

/**
 * Initializes smooth scrolling for anchor links
 * Accounts for sticky navigation height offset
 */
function initSmoothScrolling() {
  // Get all anchor links
  const anchorLinks = document.querySelectorAll('a[href^="#"]');

  anchorLinks.forEach((link) => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');

      // Skip if href is just '#' or empty
      if (href === '#' || href === '') return;

      const targetElement = document.querySelector(href);

      if (targetElement) {
        e.preventDefault();

        // Calculate offset for sticky nav (adjust value if needed)
        const navHeight = document.querySelector('nav')
          ? document.querySelector('nav').offsetHeight
          : 0;
        const offsetTop = targetElement.offsetTop - navHeight - 20; // 20px extra padding

        // Smooth scroll
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        });
      }
    });
  });
}

// ============================================================================
// ACTIVE NAVIGATION
// ============================================================================

/**
 * Highlights current session in navigation
 * Used on individual session pages to show which session is active
 */
function initActiveNavigation() {
  // Get current page URL or session identifier
  const currentPath = window.location.pathname;

  // Find all session links in navigation
  const sessionLinks = document.querySelectorAll('nav a[data-session]');

  if (sessionLinks.length === 0) return; // No session links on this page

  sessionLinks.forEach((link) => {
    const linkHref = link.getAttribute('href');

    // Check if link matches current page
    if (currentPath.includes(linkHref.replace(/^\//, '').replace(/\.html$/, ''))) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Main initialization function
 * Runs all setup functions when DOM is ready
 */
function initializeApp() {
  // Run page load animation
  initPageLoadAnimation();

  // Initialize scroll animations (Intersection Observer)
  initScrollAnimations();

  // Initialize progress tracker (index page only)
  initProgressTracker();

  // Initialize session accordion (index page only)
  initSessionAccordion();

  // Initialize mobile navigation
  initMobileNav();

  // Initialize smooth scrolling
  initSmoothScrolling();

  // Initialize active navigation
  initActiveNavigation();
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // If this script loads after DOMContentLoaded has fired
  initializeApp();
}
