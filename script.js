// ============================================================================
// ATO AI Training Site - Main Script
// Handles: Auth, Progress Tracking, Animations, Mobile Nav, Page Load
// ============================================================================

// STATE MANAGEMENT
let currentUser = null;
let progressData = [
  { session: 1, status: 'not_started', completed_at: null, confidence_rating: null },
  { session: 2, status: 'not_started', completed_at: null, confidence_rating: null },
  { session: 3, status: 'not_started', completed_at: null, confidence_rating: null },
  { session: 4, status: 'not_started', completed_at: null, confidence_rating: null },
  { session: 5, status: 'not_started', completed_at: null, confidence_rating: null }
];

// ============================================================================
// AUTH FUNCTIONALITY
// ============================================================================

/**
 * Initialize auth - check session and listen for changes
 */
async function initializeAuth() {
  try {
    if (!window.supabase) {
      console.warn('Supabase not initialized - auth will not persist');
      updateAuthUI(null);
      return;
    }

    const { data: { session } } = await window.supabase.auth.getSession();
    currentUser = session?.user || null;
    updateAuthUI(currentUser);

    // Listen for auth state changes
    const { data: { subscription } } = window.supabase.auth.onAuthStateChange(
      (event, session) => {
        currentUser = session?.user || null;
        updateAuthUI(currentUser);

        // If user just logged in and we're on index, load progress
        if (event === 'SIGNED_IN' && isIndexPage()) {
          loadProgress();
        }

        // If user logs out, redirect to index
        if (event === 'SIGNED_OUT') {
          window.location.href = 'index.html';
        }
      }
    );

    return () => subscription?.unsubscribe();
  } catch (error) {
    console.error('Auth initialization error:', error);
    updateAuthUI(null);
  }
}

/**
 * Send magic link to email
 */
async function sendMagicLink(email) {
  try {
    if (!window.supabase) {
      showAuthError('Supabase not available');
      return false;
    }

    if (!email || !email.includes('@')) {
      showAuthError('Please enter a valid email');
      return false;
    }

    const { error } = await window.supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: window.location.origin + window.location.pathname
      }
    });

    if (error) {
      showAuthError(error.message || 'Failed to send magic link');
      return false;
    }

    showAuthSuccess('Check your email for a login link!');
    return true;
  } catch (error) {
    console.error('Magic link error:', error);
    showAuthError(error.message || 'Failed to send magic link');
    return false;
  }
}

/**
 * Sign out user
 */
async function signOut() {
  try {
    if (!window.supabase) {
      currentUser = null;
      updateAuthUI(null);
      window.location.href = 'index.html';
      return;
    }

    const { error } = await window.supabase.auth.signOut();
    if (error) throw error;

    currentUser = null;
    updateAuthUI(null);
    window.location.href = 'index.html';
  } catch (error) {
    console.error('Sign out error:', error);
    showAuthError('Failed to sign out');
  }
}

/**
 * Update auth UI based on login state
 */
function updateAuthUI(user) {
  const authForm = document.querySelector('.auth-form');
  const authStatus = document.querySelector('.auth-status');

  if (user) {
    // User is logged in
    if (authForm) authForm.style.display = 'none';
    if (authStatus) {
      authStatus.style.display = 'flex';
      authStatus.innerHTML = `
        <div class="auth-user-info">
          <span class="auth-email">${escapeHtml(user.email)}</span>
          <button class="auth-logout-btn" onclick="signOut()">Logout</button>
        </div>
      `;
    }
    // Update nav to show logged in state
    const navUserInfo = document.querySelector('.nav-user-info');
    if (navUserInfo) {
      navUserInfo.style.display = 'flex';
      navUserInfo.innerHTML = `
        <span>${escapeHtml(user.email)}</span>
        <button class="nav-logout-btn" onclick="signOut()">Logout</button>
      `;
    }
  } else {
    // User is not logged in
    if (authForm) authForm.style.display = 'block';
    if (authStatus) authStatus.style.display = 'none';

    const navUserInfo = document.querySelector('.nav-user-info');
    if (navUserInfo) navUserInfo.style.display = 'none';

    // Initialize login form if on index
    initializeLoginForm();
  }
}

/**
 * Initialize the login form on index page
 */
function initializeLoginForm() {
  const form = document.querySelector('.auth-form');
  if (!form) return;

  const emailInput = form.querySelector('input[type="email"]');
  const submitBtn = form.querySelector('button[type="submit"]');

  if (emailInput && submitBtn) {
    submitBtn.onclick = async (e) => {
      e.preventDefault();
      const email = emailInput.value.trim();
      const success = await sendMagicLink(email);
      if (success) {
        emailInput.value = '';
      }
    };

    // Allow enter key to submit
    emailInput.onkeypress = (e) => {
      if (e.key === 'Enter') {
        submitBtn.click();
      }
    };
  }
}

/**
 * Show auth error message
 */
function showAuthError(message) {
  const msgEl = document.querySelector('.auth-message');
  if (msgEl) {
    msgEl.textContent = message;
    msgEl.className = 'auth-message error';
    msgEl.style.display = 'block';
    setTimeout(() => {
      msgEl.style.display = 'none';
    }, 5000);
  }
}

/**
 * Show auth success message
 */
function showAuthSuccess(message) {
  const msgEl = document.querySelector('.auth-message');
  if (msgEl) {
    msgEl.textContent = message;
    msgEl.className = 'auth-message success';
    msgEl.style.display = 'block';
    setTimeout(() => {
      msgEl.style.display = 'none';
    }, 5000);
  }
}

// ============================================================================
// PROGRESS TRACKING FUNCTIONALITY
// ============================================================================

/**
 * Check if we're on the index page
 */
function isIndexPage() {
  return window.location.pathname.endsWith('index.html') ||
         window.location.pathname.endsWith('/');
}

/**
 * Load progress from database
 */
async function loadProgress() {
  try {
    if (!window.supabase || !currentUser) {
      console.warn('Cannot load progress: supabase or user not available');
      return progressData;
    }

    const { data, error } = await window.supabase
      .from('session_progress')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('session', { ascending: true });

    if (error) throw error;

    // Build progress map from database
    if (data && data.length > 0) {
      const dbMap = {};
      data.forEach(row => {
        dbMap[row.session] = {
          session: row.session,
          status: row.status,
          completed_at: row.completed_at,
          confidence_rating: row.confidence_rating
        };
      });

      // Merge with default progress data
      progressData = progressData.map(item =>
        dbMap[item.session] || item
      );
    }

    updateProgressUI(progressData);
    return progressData;
  } catch (error) {
    console.error('Load progress error:', error);
    // Fall back to in-memory data
    updateProgressUI(progressData);
    return progressData;
  }
}

/**
 * Toggle step completion (called from step dot buttons on index)
 */
async function toggleStep(sessionNumber) {
  try {
    if (!currentUser) {
      showProgressMessage('Please log in to track progress', 'error');
      return;
    }

    if (!window.supabase) {
      // Just toggle in memory
      const item = progressData[sessionNumber - 1];
      if (item) {
        item.status = item.status === 'completed' ? 'not_started' : 'completed';
        item.completed_at = item.status === 'completed' ? new Date().toISOString() : null;
      }
      updateProgressUI(progressData);
      return;
    }

    const currentItem = progressData[sessionNumber - 1];
    const isCompleted = currentItem?.status === 'completed';
    const newStatus = isCompleted ? 'not_started' : 'completed';
    const timestamp = newStatus === 'completed' ? new Date().toISOString() : null;

    // Update database
    const { error } = await window.supabase
      .from('session_progress')
      .update({
        status: newStatus,
        completed_at: timestamp,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', currentUser.id)
      .eq('session', sessionNumber);

    if (error) {
      // If no row exists, insert it
      if (error.code === 'PGRST116') {
        const { error: insertError } = await window.supabase
          .from('session_progress')
          .insert({
            user_id: currentUser.id,
            session: sessionNumber,
            status: newStatus,
            completed_at: timestamp,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        if (insertError) throw insertError;
      } else {
        throw error;
      }
    }

    // Update local state
    if (progressData[sessionNumber - 1]) {
      progressData[sessionNumber - 1].status = newStatus;
      progressData[sessionNumber - 1].completed_at = timestamp;
    }

    updateProgressUI(progressData);
  } catch (error) {
    console.error('Toggle step error:', error);
    showProgressMessage('Failed to update progress', 'error');
  }
}

/**
 * Mark session as complete and show confidence rating modal
 */
async function markSessionComplete(sessionNumber) {
  try {
    if (!currentUser) {
      showProgressMessage('Please log in to complete this session', 'error');
      return;
    }

    // Show confidence rating modal
    showConfidenceRatingModal(sessionNumber);
  } catch (error) {
    console.error('Mark session complete error:', error);
    showProgressMessage('Failed to complete session', 'error');
  }
}

/**
 * Submit confidence rating and update database
 */
async function submitConfidenceRating(sessionNumber, rating) {
  try {
    if (!currentUser) return;

    if (!window.supabase) {
      // Just update in memory
      if (progressData[sessionNumber - 1]) {
        progressData[sessionNumber - 1].confidence_rating = rating;
        progressData[sessionNumber - 1].status = 'completed';
        progressData[sessionNumber - 1].completed_at = new Date().toISOString();
      }
      closeConfidenceRatingModal();
      updateProgressUI(progressData);
      showSessionCompleteMessage(sessionNumber);
      return;
    }

    const timestamp = new Date().toISOString();

    // Update database
    const { error } = await window.supabase
      .from('session_progress')
      .update({
        status: 'completed',
        completed_at: timestamp,
        confidence_rating: rating,
        updated_at: timestamp
      })
      .eq('user_id', currentUser.id)
      .eq('session', sessionNumber);

    if (error) {
      // If no row exists, insert it
      if (error.code === 'PGRST116') {
        const { error: insertError } = await window.supabase
          .from('session_progress')
          .insert({
            user_id: currentUser.id,
            session: sessionNumber,
            status: 'completed',
            completed_at: timestamp,
            confidence_rating: rating,
            created_at: timestamp,
            updated_at: timestamp
          });
        if (insertError) throw insertError;
      } else {
        throw error;
      }
    }

    // Update local state
    if (progressData[sessionNumber - 1]) {
      progressData[sessionNumber - 1].status = 'completed';
      progressData[sessionNumber - 1].completed_at = timestamp;
      progressData[sessionNumber - 1].confidence_rating = rating;
    }

    closeConfidenceRatingModal();
    updateProgressUI(progressData);
    showSessionCompleteMessage(sessionNumber);
  } catch (error) {
    console.error('Submit rating error:', error);
    showProgressMessage('Failed to save rating', 'error');
  }
}

/**
 * Update progress UI on the page
 */
function updateProgressUI(progress) {
  if (!progress || progress.length === 0) return;

  // Update progress bar on index page
  const progressBar = document.querySelector('.progress-bar-fill');
  if (progressBar) {
    const completedCount = progress.filter(p => p.status === 'completed').length;
    const percentage = (completedCount / 5) * 100;
    progressBar.style.width = percentage + '%';
  }

  // Update percentage text
  const percentageText = document.querySelector('.progress-percentage');
  if (percentageText) {
    const completedCount = progress.filter(p => p.status === 'completed').length;
    percentageText.textContent = Math.round((completedCount / 5) * 100) + '%';
  }

  // Update step dots
  progress.forEach((item, index) => {
    const dotButton = document.querySelector(`button[onclick="toggleStep(${item.session})"]`);
    if (dotButton) {
      const dot = dotButton.querySelector('.step-dot') || dotButton;

      if (item.status === 'completed') {
        dot.classList.add('completed');
        dot.textContent = '✓';
      } else {
        dot.classList.remove('completed');
        dot.textContent = item.session;
      }
    }
  });

  // Update progress element on session pages (if it exists)
  const sessionProgressEl = document.querySelector('[data-session-progress]');
  if (sessionProgressEl) {
    const currentSessionNum = parseInt(sessionProgressEl.dataset.sessionProgress);
    const currentItem = progress.find(p => p.session === currentSessionNum);

    if (currentItem && currentItem.status === 'completed') {
      sessionProgressEl.classList.add('completed');
      if (sessionProgressEl.querySelector('.progress-indicator')) {
        sessionProgressEl.querySelector('.progress-indicator').textContent = '✓';
      }
    }
  }
}

/**
 * Show session complete message with next session link
 */
function showSessionCompleteMessage(sessionNumber) {
  const msgEl = document.querySelector('.progress-message');
  if (msgEl) {
    const nextSession = sessionNumber < 5 ? sessionNumber + 1 : null;
    let html = `<div class="success-message">
      <strong>Session ${sessionNumber} Complete!</strong>`;
    if (nextSession) {
      html += `<br><a href="session-${nextSession}.html">Continue to Session ${nextSession}</a>`;
    } else {
      html += `<br>You've completed all sessions!`;
    }
    html += '</div>';

    msgEl.innerHTML = html;
    msgEl.style.display = 'block';
  } else {
    // Create a simple alert if no message element
    alert(`Session ${sessionNumber} complete!`);
  }
}

/**
 * Show progress message
 */
function showProgressMessage(message, type = 'info') {
  const msgEl = document.querySelector('.progress-message');
  if (msgEl) {
    msgEl.textContent = message;
    msgEl.className = `progress-message ${type}`;
    msgEl.style.display = 'block';
  }
}

// ============================================================================
// CONFIDENCE RATING MODAL
// ============================================================================

/**
 * Show confidence rating modal
 */
function showConfidenceRatingModal(sessionNumber) {
  // Remove existing modal if present
  const existingModal = document.getElementById('confidence-rating-modal');
  if (existingModal) existingModal.remove();

  const modal = document.createElement('div');
  modal.id = 'confidence-rating-modal';
  modal.className = 'confidence-rating-modal';
  modal.innerHTML = `
    <div class="confidence-rating-content">
      <h3>How confident do you feel about this session?</h3>
      <p class="confidence-rating-scale">1 = Not confident | 5 = Very confident</p>
      <div class="confidence-rating-buttons">
        <button class="confidence-btn" onclick="submitConfidenceRating(${sessionNumber}, 1)">1</button>
        <button class="confidence-btn" onclick="submitConfidenceRating(${sessionNumber}, 2)">2</button>
        <button class="confidence-btn" onclick="submitConfidenceRating(${sessionNumber}, 3)">3</button>
        <button class="confidence-btn" onclick="submitConfidenceRating(${sessionNumber}, 4)">4</button>
        <button class="confidence-btn" onclick="submitConfidenceRating(${sessionNumber}, 5)">5</button>
      </div>
      <button class="confidence-skip" onclick="closeConfidenceRatingModal()">Skip for now</button>
    </div>
  `;

  // Add modal styles
  const style = document.createElement('style');
  style.id = 'confidence-modal-styles';
  if (!document.getElementById('confidence-modal-styles')) {
    style.textContent = `
      .confidence-rating-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .confidence-rating-content {
        background: white;
        padding: 2rem;
        border-radius: 12px;
        max-width: 400px;
        text-align: center;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        animation: slideUp 0.3s ease-out;
      }

      @keyframes slideUp {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      .confidence-rating-content h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1.3rem;
        color: #333;
      }

      .confidence-rating-scale {
        color: #666;
        font-size: 0.9rem;
        margin: 0 0 1.5rem 0;
      }

      .confidence-rating-buttons {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
        justify-content: center;
      }

      .confidence-btn {
        width: 50px;
        height: 50px;
        border: 2px solid #ddd;
        background: white;
        border-radius: 8px;
        cursor: pointer;
        font-size: 1.1rem;
        font-weight: bold;
        transition: all 0.2s ease;
      }

      .confidence-btn:hover {
        border-color: #4CAF50;
        color: #4CAF50;
      }

      .confidence-btn:active {
        background: #4CAF50;
        color: white;
        border-color: #4CAF50;
      }

      .confidence-skip {
        background: none;
        border: none;
        color: #999;
        cursor: pointer;
        font-size: 0.9rem;
        text-decoration: underline;
        padding: 0;
      }

      .confidence-skip:hover {
        color: #666;
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(modal);
}

/**
 * Close confidence rating modal
 */
function closeConfidenceRatingModal() {
  const modal = document.getElementById('confidence-rating-modal');
  if (modal) {
    modal.remove();
  }
}

// ============================================================================
// SCROLL ANIMATIONS
// ============================================================================

/**
 * Initialize scroll observer for fade-in animations
 */
function initializeScrollObserver() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.delay
          ? parseInt(entry.target.dataset.delay)
          : 0;

        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);
      }
    });
  }, observerOptions);

  // Observe all fade-in elements
  document.querySelectorAll('.fade-in').forEach(el => {
    observer.observe(el);
  });
}

// ============================================================================
// ACCORDION FUNCTIONALITY
// ============================================================================

/**
 * Toggle accordion
 */
function toggleAccordion(button) {
  const content = button.nextElementSibling;
  if (!content || !content.classList.contains('accordion-content')) {
    return;
  }

  const isOpen = content.classList.contains('open');

  // Close all accordions (optional - can be commented out to allow multiple open)
  document.querySelectorAll('.accordion-content.open').forEach(el => {
    if (el !== content) {
      el.classList.remove('open');
      const btn = el.previousElementSibling;
      if (btn && btn.querySelector('.accordion-arrow')) {
        btn.querySelector('.accordion-arrow').style.transform = 'rotate(0deg)';
      }
    }
  });

  // Toggle current accordion
  content.classList.toggle('open');

  // Rotate arrow
  const arrow = button.querySelector('.accordion-arrow');
  if (arrow) {
    arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
  }
}

// ============================================================================
// MOBILE NAVIGATION
// ============================================================================

/**
 * Toggle mobile navigation
 */
function toggleMobileNav() {
  const navLinks = document.querySelector('.nav-links');
  const hamburger = document.querySelector('.hamburger');

  if (navLinks) {
    navLinks.classList.toggle('active');
  }

  if (hamburger) {
    hamburger.classList.toggle('active');
  }
}

/**
 * Close mobile nav when a link is clicked
 */
function initializeMobileNavLinks() {
  const navLinks = document.querySelectorAll('.nav-links a');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      const navLinksContainer = document.querySelector('.nav-links');
      const hamburger = document.querySelector('.hamburger');

      if (navLinksContainer) navLinksContainer.classList.remove('active');
      if (hamburger) hamburger.classList.remove('active');
    });
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// ============================================================================
// PAGE INITIALIZATION
// ============================================================================

/**
 * Initialize all functionality when DOM is ready
 */
function initializeAll() {
  // Add 'loaded' class to body
  document.body.classList.add('loaded');

  // Initialize auth
  initializeAuth();

  // Initialize scroll observer
  initializeScrollObserver();

  // Initialize mobile nav
  initializeMobileNavLinks();

  // If on index page, load progress after a short delay to ensure auth is set up
  if (isIndexPage()) {
    setTimeout(async () => {
      if (currentUser && window.supabase) {
        await loadProgress();
      }
    }, 100);
  }
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAll);
} else {
  // DOM is already loaded
  initializeAll();
}
