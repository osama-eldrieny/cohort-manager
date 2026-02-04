// ============================================
// AUTHENTICATION & SESSION MANAGEMENT
// ============================================

// Store session token in localStorage
const SESSION_TOKEN_KEY = 'admin_session_token';
const USER_KEY = 'admin_user';

// Check if user is logged in
function isLoggedIn() {
    return !!localStorage.getItem(SESSION_TOKEN_KEY);
}

// Get current user from localStorage
function getCurrentUser() {
    const userJson = localStorage.getItem(USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
}

// Store session after login
function storeSession(user, sessionToken) {
    localStorage.setItem(SESSION_TOKEN_KEY, sessionToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// Clear session on logout
function clearSession() {
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

// Redirect to login if not authenticated
function redirectToLoginIfNeeded() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// LOGIN FUNCTION
async function loginUser(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.sessionToken) {
            storeSession(data.user, data.sessionToken);
            showToast('Login successful!', 'success');
            window.location.href = 'index.html';
            return true;
        } else {
            showToast(data.message || 'Invalid email or password', 'error');
            return false;
        }
    } catch (error) {
        console.error('❌ Login error:', error);
        showToast('Login failed', 'error');
        return false;
    }
}

// LOGOUT FUNCTION
function logoutUser() {
    clearSession();
    showToast('Logged out successfully', 'success');
    window.location.href = 'login.html';
}

// Verify session is still valid
async function verifySession() {
    const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
    if (!sessionToken) return false;

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionToken}`
            }
        });

        if (!response.ok) {
            clearSession();
            return false;
        }

        return true;
    } catch (error) {
        console.error('❌ Session verification error:', error);
        return false;
    }
}

// Initialize auth on page load
function initializeAuth() {
    if (!isLoggedIn()) {
        // Don't redirect from login.html itself
        if (!window.location.pathname.includes('login')) {
            redirectToLoginIfNeeded();
        }
    } else {
        // Update last activity timestamp
        verifySession().catch(e => {
            console.error('Session verification failed:', e);
            clearSession();
            window.location.href = 'login.html';
        });
    }
}

// Add logout button to header
async function addLogoutButton() {
    const headerButtons = document.querySelector('.header-buttons');
    if (!headerButtons) return;

    const user = getCurrentUser();
    if (user) {
        let displayName = user.email; // fallback to email
        
        // Try to get student name from students list
        try {
            const response = await fetch(`${API_BASE_URL}/api/students`);
            if (response.ok) {
                const students = await response.json();
                const student = students.find(s => s.email === user.email);
                if (student && student.name) {
                    displayName = student.name;
                }
            }
        } catch (error) {
            console.error('Could not fetch student name:', error);
            // Use email as fallback, which is fine
        }

        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'btn-secondary';
        logoutBtn.innerHTML = `<i class="fas fa-sign-out-alt"></i> Logout (${displayName})`;
        logoutBtn.onclick = logoutUser;
        headerButtons.appendChild(logoutBtn);
    }
}

// Toast notification function (if not already defined)
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        border-radius: 4px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Call on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeAuth();
});
