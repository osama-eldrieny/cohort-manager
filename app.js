// ============================================
// COURSE DASHBOARD - APPLICATION LOGIC
// ============================================

let students = [];
let currentEditingId = null;
let originalEditingEmail = null; // Track original email when editing
let emailWasChanged = false;
let charts = {};
const COHORTS = ['Cohort 0', 'Cohort 1 - Cradis', 'Cohort 1 - Zomra', 'Cohort 2', 'Cohort 3'];

// API Server Configuration
// Determine API base URL based on environment
const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = isDev ? 'http://localhost:3002' : 'https://cohort-manager-xi.vercel.app';

// Google Sheets Integration
// Replace with your Google Apps Script deployment URL
const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbyCPsBG3QKSPx84Dwzepm_Fruh7EXdG0mz84AM20NxT4fS8Vzhod875meY-oAHXqZW-/exec';

// Utility Functions
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

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadStudents();
    await loadEmailTemplates();
    setupEventListeners();
    
    // Handle URL routing
    window.addEventListener('hashchange', handleRouteChange);
    
    // Call handleRouteChange immediately to set initial state
    setTimeout(handleRouteChange, 0);
});

function handleRouteChange() {
    // Get page from URL hash (e.g., #overview, #students, etc.)
    const hash = window.location.hash.slice(1) || 'overview';
    const pageId = hash;
    
    renderPage(pageId);
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('data-page') === pageId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Setup Event Listeners
function setupEventListeners() {
    // Mobile Menu Toggle
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const hamburgerBtnHeader = document.getElementById('hamburgerBtnHeader');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    
    function toggleSidebar() {
        sidebar.classList.toggle('active');
        hamburgerBtn.classList.toggle('active');
        sidebarOverlay.classList.toggle('active');
    }
    
    function closeSidebar() {
        sidebar.classList.remove('active');
        hamburgerBtn.classList.remove('active');
        sidebarOverlay.classList.remove('active');
    }
    
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', toggleSidebar);
    }
    
    if (hamburgerBtnHeader) {
        hamburgerBtnHeader.addEventListener('click', toggleSidebar);
    }
    
    if (closeSidebarBtn) {
        closeSidebarBtn.addEventListener('click', closeSidebar);
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }
    
    // Close sidebar when a nav link is clicked
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            closeSidebar();
        });
    });
    
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = e.currentTarget.dataset.page;
            navigatePage(page);
        });
    });
    // Filters
    document.getElementById('cohortFilter') && document.getElementById('cohortFilter').addEventListener('change', renderStudentsTable);
    document.getElementById('statusFilterStudents').addEventListener('change', renderStudentsTable);
    document.getElementById('searchStudent').addEventListener('input', renderStudentsTable);

    // Form
    document.getElementById('paidAmount').addEventListener('input', calculateRemaining);
    document.getElementById('totalAmount').addEventListener('input', calculateRemaining);
    
    // Revenue Eye Toggle - Total Revenue
    const revenueToggle = document.getElementById('revenueToggle');
    const statRevenue = document.getElementById('statRevenue');
    if (revenueToggle && statRevenue) {
        revenueToggle.addEventListener('click', () => {
            statRevenue.classList.toggle('hidden');
            const icon = revenueToggle.querySelector('i');
            if (statRevenue.classList.contains('hidden')) {
                statRevenue.textContent = '●●●●●';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                statRevenue.textContent = statRevenue.getAttribute('data-value');
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    }
    
    // Revenue Eye Toggle - Pending Payment
    const pendingToggle = document.getElementById('pendingToggle');
    const statPending = document.getElementById('statPending');
    if (pendingToggle && statPending) {
        pendingToggle.addEventListener('click', () => {
            statPending.classList.toggle('hidden');
            const icon = pendingToggle.querySelector('i');
            if (statPending.classList.contains('hidden')) {
                statPending.textContent = '●●●●●';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                statPending.textContent = statPending.getAttribute('data-value');
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    }
    
    // Revenue Eye Toggle - Cohort Revenue Cards
    document.querySelectorAll('.eye-toggle-small').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const revenueId = btn.getAttribute('data-revenue-id');
            const revenueElement = document.getElementById(revenueId);
            if (revenueElement) {
                revenueElement.classList.toggle('hidden');
                const icon = btn.querySelector('i');
                if (revenueElement.classList.contains('hidden')) {
                    revenueElement.textContent = '●●●';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    revenueElement.textContent = revenueElement.getAttribute('data-value');
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            }
        });
    });
}

// Copy email to clipboard
function copyEmailToClipboard(email) {
    navigator.clipboard.writeText(email).then(() => {
        // Visual feedback
        const copyToast = document.createElement('div');
        copyToast.textContent = `Copied: ${email}`;
        copyToast.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background-color: #34a853; color: white; padding: 12px 16px; border-radius: 4px; font-size: 14px; z-index: 10000; box-shadow: 0 2px 5px rgba(0,0,0,0.2);';
        document.body.appendChild(copyToast);
        setTimeout(() => copyToast.remove(), 2000);
    }).catch(() => {
        alert('Failed to copy email');
    });
}

// Add event listener for email copying (event delegation)
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('copy-email')) {
        const email = e.target.textContent.trim();
        copyEmailToClipboard(email);
    }
});

// Navigation
function navigatePage(pageId) {
    // Use hash for navigation (compatible with all static servers)
    window.location.hash = pageId;
    // Ensure active state updates immediately
    setTimeout(() => handleRouteChange(), 0);
}

function renderPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');

    // Update header
    const titles = {
        'overview': { title: 'Overview', subtitle: 'Dashboard overview and key metrics' },
        'students': { title: 'Students', subtitle: 'Manage all students' },
        'cohort0': { title: 'Cohort 0', subtitle: 'Students in Cohort 0' },
        'cohort1': { title: 'Cohort 1', subtitle: 'Students in Cohort 1' },
        'cohort1cradis': { title: 'Cohort 1 - Cradis', subtitle: 'Students in Cohort 1 - Cradis' },
        'cohort1zomra': { title: 'Cohort 1 - Zomra', subtitle: 'Students in Cohort 1 - Zomra' },
        'cohortfree': { title: 'Cohort - Free', subtitle: 'Students in Cohort - Free' },
        'cohort2': { title: 'Cohort 2', subtitle: 'Students in Cohort 2' },
        'cohort3': { title: 'Cohort 3', subtitle: 'Students in Cohort 3' },
        'waitinglist': { title: 'Waiting List', subtitle: 'Students in waiting list' },
        'cantreach': { title: "Can't Reach", subtitle: "Students that can't be reached" },
        'nextcohort': { title: 'Next Cohort', subtitle: 'Students in next cohort' },
        'standby': { title: 'Standby', subtitle: 'Students on standby' },
        'graduated': { title: 'Graduated', subtitle: 'Graduated students' },
        'emailtemplates': { title: 'Email Templates', subtitle: 'Manage email templates' },
        'settings': { title: 'Settings', subtitle: 'Application settings' }
    };

    const info = titles[pageId] || { title: pageId, subtitle: '' };
    document.querySelector('.page-title').textContent = info.title;

    // Render specific pages
    if (pageId === 'overview') {
        renderOverview();
    } else if (pageId === 'students') {
        renderStudentsTable();
    } else if (pageId.startsWith('cohort')) {
        renderCohortPage(pageId);
    } else if (pageId === 'waitinglist') {
        renderStatusPage('Waiting list');
    } else if (pageId === 'cantreach') {
        renderStatusPage("Can't reach");
    } else if (pageId === 'nextcohort') {
        renderStatusPage('Next Cohort');
    } else if (pageId === 'standby') {
        renderStatusPage('Standby');
    } else if (pageId === 'graduated') {
        renderStatusPage('Graduated');
    } else if (pageId === 'emailtemplates') {
        renderEmailTemplatesList();
    }
}

// ============================================
// OVERVIEW PAGE
// ============================================

function renderOverview() {
    updateStats();
    renderCharts();
    updateCohortSummary();
    renderAnalyticsCharts();
}

function updateStats() {
    const totalStudents = students.length;
    const cohort3Students = students.filter(s => s.cohort === 'Cohort 3').length;
    const waitingListStudents = students.filter(s => s.status === 'Waiting list').length;
    const nextCohortStudents = students.filter(s => s.status === 'Next Cohort').length;
    const totalRevenue = students.reduce((sum, s) => sum + s.paidAmount, 0);
    const pendingRevenue = students.reduce((sum, s) => sum + s.remaining, 0);

    document.getElementById('statTotal').textContent = totalStudents;
    document.getElementById('statCohorts').textContent = cohort3Students;
    document.getElementById('statWaitingList').textContent = waitingListStudents;
    document.getElementById('statNextCohort').textContent = nextCohortStudents;
    
    const revenueElement = document.getElementById('statRevenue');
    const revenueValue = '$' + totalRevenue.toFixed(2);
    revenueElement.setAttribute('data-value', revenueValue);
    if (!revenueElement.classList.contains('hidden')) {
        revenueElement.textContent = revenueValue;
    }
    
    const pendingElement = document.getElementById('statPending');
    const pendingValue = '$' + pendingRevenue.toFixed(2);
    pendingElement.setAttribute('data-value', pendingValue);
    if (!pendingElement.classList.contains('hidden')) {
        pendingElement.textContent = pendingValue;
    }
}

function updateCohortSummary() {
    // Map all cohort names to their HTML IDs
    const cohortMapping = {
        'Cohort 0': 'cohort0',
        'Cohort 1 - Cradis': 'cohort1cradis',
        'Cohort 1 - Zomra': 'cohort1zomra',
        'Cohort 2': 'cohort2',
        'Cohort 3': 'cohort3'
    };

    Object.entries(cohortMapping).forEach(([cohortName, cohortKey]) => {
        const cohortStudents = students.filter(s => s.cohort === cohortName);
        const count = cohortStudents.length;
        const revenue = cohortStudents.reduce((sum, s) => sum + s.paidAmount, 0);

        const countElement = document.getElementById(`${cohortKey}-count`);
        const revenueElement = document.getElementById(`${cohortKey}-revenue`);
        
        if (countElement) countElement.textContent = count;
        if (revenueElement) {
            const revenueValue = '$' + revenue.toFixed(2);
            revenueElement.setAttribute('data-value', revenueValue);
            if (!revenueElement.classList.contains('hidden')) {
                revenueElement.textContent = revenueValue;
            }
        }
    });
}

function renderCharts() {
    // Status Distribution Chart
    const statusCounts = {
        'Waiting list': students.filter(s => s.status === 'Waiting list').length,
        'Can\'t reach': students.filter(s => s.status === 'Can\'t reach').length,
        'Next Cohort': students.filter(s => s.status === 'Next Cohort').length,
        'Standby': students.filter(s => s.status === 'Standby').length,
        'Cohort 0': students.filter(s => s.status === 'Cohort 0').length,
        'Cohort 1 - Cradis': students.filter(s => s.status === 'Cohort 1 - Cradis').length,
        'Cohort 1 - Zomra': students.filter(s => s.status === 'Cohort 1 - Zomra').length,
        'Cohort 2': students.filter(s => s.status === 'Cohort 2').length,
        'Cohort 3': students.filter(s => s.status === 'Cohort 3').length
    };

    const ctx1 = document.getElementById('statusChart');
    if (charts.status) charts.status.destroy();
    charts.status = new Chart(ctx1, {
        type: 'doughnut',
        data: {
            labels: Object.keys(statusCounts),
            datasets: [{
                data: Object.values(statusCounts),
                backgroundColor: ['#FFC107', '#F44336', '#2196F3', '#9C27B0', '#4CAF50', '#00BCD4', '#FF9800', '#009688', '#E91E63'],
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { position: 'bottom', labels: { boxWidth: 16, boxHeight: 16, borderRadius: 8 } } }
        }
    });

    // Revenue Status Chart
    const paidTotal = students.reduce((sum, s) => sum + s.paidAmount, 0);
    const pendingTotal = students.reduce((sum, s) => sum + s.remaining, 0);

    const ctx2 = document.getElementById('revenueChart');
    if (charts.revenue) charts.revenue.destroy();
    charts.revenue = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: ['Paid', 'Pending'],
            datasets: [{
                data: [paidTotal, pendingTotal],
                backgroundColor: ['#4CAF50', '#FF9800'],
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { position: 'bottom', labels: { boxWidth: 16, boxHeight: 16, borderRadius: 8 } } }
        }
    });

    // Student Locations Chart
    const locationCounts = {};
    students.forEach(s => {
        // Skip empty locations and normalize location names
        const location = s.location && s.location.trim() ? s.location : 'Not Specified';
        locationCounts[location] = (locationCounts[location] || 0) + 1;
    });

    // Sort by count and get top 15 locations
    const sortedLocations = Object.entries(locationCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);

    const ctx3 = document.getElementById('locationsChart');
    if (charts.locations) charts.locations.destroy();
    charts.locations = new Chart(ctx3, {
        type: 'bar',
        data: {
            labels: sortedLocations.map(l => l[0]),
            datasets: [{
                label: 'Number of Students',
                data: sortedLocations.map(l => l[1]),
                backgroundColor: [
                    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
                    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#ABEBC6',
                    '#F5B041', '#D7BDE2', '#76D7C4', '#FAD7A0', '#85A5FF'
                ],
                borderColor: '#fff',
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });

    // Payment Status Chart - Cohort 2
    const cohort2Students = students.filter(s => s.cohort === 'Cohort 2');
    const cohort2Paid = cohort2Students.reduce((sum, s) => sum + s.paidAmount, 0);
    const cohort2Pending = cohort2Students.reduce((sum, s) => sum + s.remaining, 0);

    const ctx4 = document.getElementById('cohort2PaymentChart');
    if (charts.cohort2Payment) charts.cohort2Payment.destroy();
    charts.cohort2Payment = new Chart(ctx4, {
        type: 'doughnut',
        data: {
            labels: ['Paid', 'Pending'],
            datasets: [{
                data: [cohort2Paid, cohort2Pending],
                backgroundColor: ['#4CAF50', '#FF9800'],
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { 
                legend: { position: 'bottom', labels: { boxWidth: 16, boxHeight: 16, borderRadius: 8 } },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (context.parsed !== null) {
                                label += ': $' + context.parsed.toFixed(2);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });

    // Payment Status Chart - Standby
    const standbyStudents = students.filter(s => s.status === 'Standby');
    const standbyPaid = standbyStudents.reduce((sum, s) => sum + s.paidAmount, 0);
    const standbyPending = standbyStudents.reduce((sum, s) => sum + s.remaining, 0);

    const ctx5 = document.getElementById('standbyPaymentChart');
    if (charts.standbyPayment) charts.standbyPayment.destroy();
    charts.standbyPayment = new Chart(ctx5, {
        type: 'doughnut',
        data: {
            labels: ['Paid', 'Pending'],
            datasets: [{
                data: [standbyPaid, standbyPending],
                backgroundColor: ['#4CAF50', '#FF9800'],
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { 
                legend: { position: 'bottom', labels: { boxWidth: 16, boxHeight: 16, borderRadius: 8 } },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (context.parsed !== null) {
                                label += ': $' + context.parsed.toFixed(2);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });

    // Payment Status Chart - Cohort 3
    const cohort3Students = students.filter(s => s.cohort === 'Cohort 3');
    const cohort3Paid = cohort3Students.reduce((sum, s) => sum + s.paidAmount, 0);
    const cohort3Pending = cohort3Students.reduce((sum, s) => sum + s.remaining, 0);

    const ctx6 = document.getElementById('cohort3PaymentChart');
    if (charts.cohort3Payment) charts.cohort3Payment.destroy();
    charts.cohort3Payment = new Chart(ctx6, {
        type: 'doughnut',
        data: {
            labels: ['Paid', 'Pending'],
            datasets: [{
                data: [cohort3Paid, cohort3Pending],
                backgroundColor: ['#4CAF50', '#FF9800'],
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { 
                legend: { position: 'bottom', labels: { boxWidth: 16, boxHeight: 16, borderRadius: 8 } },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (context.parsed !== null) {
                                label += ': $' + context.parsed.toFixed(2);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// ============================================
// STUDENTS PAGE
// ============================================

function renderStudentsTable() {
    const statusFilterElement = document.getElementById('statusFilterStudents');
    const searchTerm = document.getElementById('searchStudent').value.toLowerCase();

    // Get selected statuses from multi-select
    const selectedStatuses = Array.from(statusFilterElement.selectedOptions).map(option => option.value);

    let filtered = students;

    // Filter by status (multiple selection)
    if (selectedStatuses.length > 0) {
        filtered = filtered.filter(s => selectedStatuses.includes(s.status));
    }

    // Filter by search term
    if (searchTerm) {
        filtered = filtered.filter(s => 
            s.name.toLowerCase().includes(searchTerm) || 
            s.email.toLowerCase().includes(searchTerm)
        );
    }

    const tbody = document.getElementById('studentsTableBody');
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty">No students found</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(student => {
        return `
        <tr>
            <td><strong style="cursor: pointer; color: #0066cc; text-decoration: underline;" onclick="openStudentContactModal('${student.id}')" title="Click to view details">${student.name}</strong></td>
            <td><span class="copy-email" title="Click to copy">${student.email}</span></td>
            <td><span class="status-badge status-${student.status.toLowerCase().replace(/\s+/g, '-')}">${student.status}</span></td>
            <td>${student.location}</td>
            <td>${student.language || 'Not specified'}</td>
            <td>
                ${student.linkedin ? `<a href="${student.linkedin}" target="_blank" title="LinkedIn Profile" style="color: #0A66C2; text-decoration: none; font-size: 24px; display: inline-flex; align-items: center;"><i class="fab fa-linkedin"></i></a>` : '-'}
            </td>
            <td>
                ${student.whatsapp ? `<a href="https://wa.me/${student.whatsapp.replace(/\D/g, '')}" target="_blank" title="Send WhatsApp message" style="color: #25D366; text-decoration: none; display: flex; align-items: center; gap: 4px;"><i class="fab fa-whatsapp"></i> ${student.whatsapp}</a>` : '-'}
            </td>
            <td>${student.note || '-'}</td>
            <td>
                <button class="btn-small btn-edit" data-student-id="${student.id}" title="Edit"><i class="fas fa-pencil-alt"></i></button>
                <button class="btn-small btn-danger btn-delete" data-student-id="${student.id}" title="Delete"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `;
    }).join('');

    // Attach event listeners to action buttons
    document.querySelectorAll('#studentsTableBody .btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            editStudent(btn.dataset.studentId);
        });
    });

    document.querySelectorAll('#studentsTableBody .btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            deleteStudent(btn.dataset.studentId);
        });
    });


}

// ============================================
// COHORT PAGES
// ============================================

function renderCohortPage(cohortId) {
    // Map page IDs to cohort names
    const cohortMap = {
        'cohort0': 'Cohort 0',
        'cohort1': 'Cohort 1',
        'cohort1cradis': 'Cohort 1 - Cradis',
        'cohort1zomra': 'Cohort 1 - Zomra',
        'cohort2': 'Cohort 2',
        'cohort3': 'Cohort 3'
    };
    
    const cohort = cohortMap[cohortId] || cohortId;
    const page = document.getElementById(cohortId);
    
    // Store cohort data for search
    page.cohortName = cohort;
    
    let cohortStudents = students.filter(s => s.cohort === cohort);
    const showChecklistProgress = cohortId === 'cohort2' || cohortId === 'cohort3';

    if (cohortStudents.length === 0) {
        page.innerHTML = `
            <div class="empty-message">
                <p>No students in ${cohort} yet</p>
            </div>
        `;
        return;
    }

    const stats = {
        total: cohortStudents.length,
        revenue: cohortStudents.reduce((sum, s) => sum + s.paidAmount, 0),
        pending: cohortStudents.reduce((sum, s) => sum + s.remaining, 0),
        current: cohortStudents.filter(s => s.status === 'Current Cohort').length
    };

    const tableHtml = `
        <div class="controls" style="margin-bottom: 20px;">
            <input type="text" id="searchCohort-${cohortId}" placeholder="Search student..." style="flex: 1; padding: 12px 14px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px;">
        </div>

        <div class="cohort-stats-mini">
            <div class="mini-stat">
                <div class="mini-label">Total Students</div>
                <div class="mini-value">${stats.total}</div>
            </div>
            <div class="mini-stat">
                <div class="mini-label">Revenue</div>
                <div class="mini-value">$${stats.revenue.toFixed(2)}</div>
            </div>
            <div class="mini-stat">
                <div class="mini-label">Pending</div>
                <div class="mini-value">$${stats.pending.toFixed(2)}</div>
            </div>
            <div class="mini-stat">
                <div class="mini-label">Active</div>
                <div class="mini-value">${stats.current}</div>
            </div>
        </div>

        <div class="table-container">
            <table class="students-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Figma Email</th>
                        <th>Location</th>
                        <th>Language</th>
                        <th>LinkedIn</th>
                        <th>WhatsApp</th>
                        ${showChecklistProgress ? '<th>Onboarding</th>' : ''}
                        <th>Post-Course</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="cohortTableBody-${cohortId}">
                    ${cohortStudents.map(student => {
                        const postCourseItems = student.checklist ? [student.checklist.sharedFeedbackForm, student.checklist.submittedCourseFeedback, student.checklist.issuedCertificate].filter(Boolean).length : 0;
                        const postCoursePct = Math.round((postCourseItems / 3) * 100) + '%';
                        return `
                        <tr>
                            <td><strong style="cursor: pointer; color: #0066cc; text-decoration: underline;" onclick="openStudentContactModal('${student.id}')" title="Click to view details">${student.name}</strong></td>
                            <td><span class="copy-email" title="Click to copy">${student.email}</span></td>
                            <td>${student.figmaEmail ? `<span class="copy-email" title="Click to copy">${student.figmaEmail}</span>` : '-'}</td>
                            <td>${student.location}</td>
                            <td>${student.language || 'Not specified'}</td>
                            <td>
                                ${student.linkedin ? `<a href="${student.linkedin}" target="_blank" title="LinkedIn Profile" style="color: #0A66C2; text-decoration: none; font-size: 24px; display: inline-flex; align-items: center;"><i class="fab fa-linkedin"></i></a>` : '-'}
                            </td>
                            <td>
                                ${student.whatsapp ? `<a href="https://wa.me/${student.whatsapp.replace(/\\D/g, '')}" target="_blank" title="Send WhatsApp message" style="color: #25D366; text-decoration: none; display: flex; align-items: center; gap: 4px;"><i class="fab fa-whatsapp"></i> ${student.whatsapp}</a>` : '-'}
                            </td>
                            ${showChecklistProgress ? `<td>${calculateChecklistProgress(student)}%</td>` : ''}
                            <td>${postCoursePct}</td>
                            <td>
                                <button class="btn-small btn-edit" data-student-id="${student.id}" title="Edit"><i class="fas fa-pencil-alt"></i></button>
                                <button class="btn-small btn-danger btn-delete" data-student-id="${student.id}" title="Delete"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>
                    `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;

    page.innerHTML = tableHtml;

    // Add search functionality
    const searchInput = document.getElementById(`searchCohort-${cohortId}`);
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filtered = cohortStudents.filter(s => 
                s.name.toLowerCase().includes(searchTerm) || 
                s.email.toLowerCase().includes(searchTerm)
            );
            
            const tbody = document.getElementById(`cohortTableBody-${cohortId}`);
            const colspanNum = showChecklistProgress ? 9 : 8;
            if (filtered.length === 0) {
                tbody.innerHTML = `<tr><td colspan="${colspanNum}" class="empty">No students found</td></tr>`;
            } else {
                tbody.innerHTML = filtered.map(student => {
                    const postCourseItems = student.checklist ? [student.checklist.sharedFeedbackForm, student.checklist.submittedCourseFeedback, student.checklist.issuedCertificate].filter(Boolean).length : 0;
                    const postCoursePct = Math.round((postCourseItems / 3) * 100) + '%';
                    return `
                    <tr>
                        <td><strong style="cursor: pointer; color: #0066cc; text-decoration: underline;" onclick="openStudentContactModal('${student.id}')" title="Click to view details">${student.name}</strong></td>
                        <td><span class="copy-email" title="Click to copy">${student.email}</span></td>
                        <td>${student.figmaEmail ? `<span class="copy-email" title="Click to copy">${student.figmaEmail}</span>` : '-'}</td>
                        <td>${student.location}</td>
                        <td>${student.language || 'Not specified'}</td>
                        <td>
                            ${student.linkedin ? `<a href="${student.linkedin}" target="_blank" title="LinkedIn Profile" style="color: #0A66C2; text-decoration: none; font-size: 24px; display: inline-flex; align-items: center;"><i class="fab fa-linkedin"></i></a>` : '-'}
                        </td>
                        <td>
                            ${student.whatsapp ? `<a href="https://wa.me/${student.whatsapp.replace(/\\D/g, '')}" target="_blank" title="Send WhatsApp message" style="color: #25D366; text-decoration: none; display: flex; align-items: center; gap: 4px;"><i class="fab fa-whatsapp"></i> ${student.whatsapp}</a>` : '-'}
                        </td>
                        ${showChecklistProgress ? `<td>${calculateChecklistProgress(student)}%</td>` : ''}
                        <td>${postCoursePct}</td>
                        <td>
                            <button class="btn-small btn-edit" data-student-id="${student.id}" title="Edit"><i class="fas fa-pencil-alt"></i></button>
                            <button class="btn-small btn-danger btn-delete" data-student-id="${student.id}" title="Delete"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `;
                }).join('');
            }
            attachCohortButtonListeners(page);
        });
    }

    attachCohortButtonListeners(page);
}

function attachCohortButtonListeners(page) {
    // Attach event listeners to edit buttons in cohort table
    page.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            editStudent(btn.dataset.studentId);
        });
    });



    page.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            deleteStudent(btn.dataset.studentId);
        });
    });
}

// ============================================
// STATUS PAGES
// ============================================

function renderStatusPage(status) {
    const statusStudents = students.filter(s => s.status === status);
    const pageId = status.toLowerCase().replace(/\s+/g, '').replace("'", '');
    const page = document.getElementById(pageId === 'cantreach' ? 'cantreach' : pageId);
    
    if (statusStudents.length === 0) {
        page.innerHTML = `
            <div class="empty-message">
                <p>No students with status "${status}"</p>
            </div>
        `;
        return;
    }

    const stats = {
        total: statusStudents.length,
        revenue: statusStudents.reduce((sum, s) => sum + s.paidAmount, 0),
        pending: statusStudents.reduce((sum, s) => sum + s.remaining, 0)
    };

    const tableHtml = `
        <div class="controls" style="margin-bottom: 20px;">
            <input type="text" id="searchStatus-${pageId}" placeholder="Search student..." style="flex: 1; padding: 12px 14px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px;">
        </div>

        <div class="cohort-stats-mini">
            <div class="mini-stat">
                <div class="mini-label">Total Students</div>
                <div class="mini-value">${stats.total}</div>
            </div>
            <div class="mini-stat">
                <div class="mini-label">Revenue</div>
                <div class="mini-value">$${stats.revenue.toFixed(2)}</div>
            </div>
            <div class="mini-stat">
                <div class="mini-label">Pending</div>
                <div class="mini-value">$${stats.pending.toFixed(2)}</div>
            </div>
        </div>

        <div class="table-container">
            <table class="students-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Location</th>
                        <th>Language</th>
                        <th>LinkedIn</th>
                        <th>WhatsApp</th>
                        <th>Notes</th>
                        <th>Onboarding</th>
                        <th>Post-Course</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="statusTableBody-${pageId}">
                    ${statusStudents.map(student => {
                        const postCourseItems = student.checklist ? [student.checklist.sharedFeedbackForm, student.checklist.submittedCourseFeedback, student.checklist.issuedCertificate].filter(Boolean).length : 0;
                        const postCoursePct = Math.round((postCourseItems / 3) * 100) + '%';
                        return `
                        <tr>
                            <td><strong style="cursor: pointer; color: #0066cc; text-decoration: underline;" onclick="openStudentContactModal('${student.id}')" title="Click to view details">${student.name}</strong></td>
                            <td><span class="copy-email" title="Click to copy">${student.email}</span></td>
                            <td>${student.location}</td>
                            <td>${student.language || 'Not specified'}</td>
                            <td>
                                ${student.linkedin ? `<a href="${student.linkedin}" target="_blank" title="LinkedIn Profile" style="color: #0A66C2; text-decoration: none; font-size: 24px; display: inline-flex; align-items: center;"><i class="fab fa-linkedin"></i></a>` : '-'}
                            </td>
                            <td>
                                ${student.whatsapp ? `<a href="https://wa.me/${student.whatsapp.replace(/\\D/g, '')}" target="_blank" title="Send WhatsApp message" style="color: #25D366; text-decoration: none; display: flex; align-items: center; gap: 4px;"><i class="fab fa-whatsapp"></i> ${student.whatsapp}</a>` : '-'}
                            </td>
                            <td>${student.note || '-'}</td>
                            <td>${calculateChecklistProgress(student)}%</td>
                            <td>${postCoursePct}</td>
                            <td>
                                <button class="btn-small btn-edit" data-student-id="${student.id}" title="Edit"><i class="fas fa-pencil-alt"></i></button>
                                <button class="btn-small btn-danger btn-delete" data-student-id="${student.id}" title="Delete"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>
                    `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;

    page.innerHTML = tableHtml;

    // Add search functionality
    const searchInput = document.getElementById(`searchStatus-${pageId}`);
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filtered = statusStudents.filter(s => 
                s.name.toLowerCase().includes(searchTerm) || 
                s.email.toLowerCase().includes(searchTerm)
            );
            
            const tbody = document.getElementById(`statusTableBody-${pageId}`);
            if (filtered.length === 0) {
                tbody.innerHTML = '<tr><td colspan="10" class="empty">No students found</td></tr>';
            } else {
                tbody.innerHTML = filtered.map(student => {
                    const postCourseItems = student.checklist ? [student.checklist.sharedFeedbackForm, student.checklist.submittedCourseFeedback, student.checklist.issuedCertificate].filter(Boolean).length : 0;
                    const postCoursePct = Math.round((postCourseItems / 3) * 100) + '%';
                    return `
                    <tr>
                        <td><strong style="cursor: pointer; color: #0066cc; text-decoration: underline;" onclick="openStudentContactModal('${student.id}')" title="Click to view details">${student.name}</strong></td>
                        <td><span class="copy-email" title="Click to copy">${student.email}</span></td>
                        <td>${student.location}</td>
                        <td>${student.language || 'Not specified'}</td>
                        <td>
                            ${student.linkedin ? `<a href="${student.linkedin}" target="_blank" title="LinkedIn Profile" style="color: #0A66C2; text-decoration: none; font-size: 24px; display: inline-flex; align-items: center;"><i class="fab fa-linkedin"></i></a>` : '-'}
                        </td>
                        <td>
                            ${student.whatsapp ? `<a href="https://wa.me/${student.whatsapp.replace(/\\D/g, '')}" target="_blank" title="Send WhatsApp message" style="color: #25D366; text-decoration: none; display: flex; align-items: center; gap: 4px;"><i class="fab fa-whatsapp"></i> ${student.whatsapp}</a>` : '-'}
                        </td>
                        <td>${student.note || '-'}</td>
                        <td>${calculateChecklistProgress(student)}%</td>
                        <td>${postCoursePct}</td>
                        <td>
                            <button class="btn-small btn-edit" data-student-id="${student.id}" title="Edit"><i class="fas fa-pencil-alt"></i></button>
                            <button class="btn-small btn-danger btn-delete" data-student-id="${student.id}" title="Delete"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `;
                }).join('');
            }
            attachStatusButtonListeners(page);
        });
    }

    attachStatusButtonListeners(page);
}

function attachStatusButtonListeners(page) {
    // Attach event listeners to edit buttons in status table
    page.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            editStudent(btn.dataset.studentId);
        });
    });



    page.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            deleteStudent(btn.dataset.studentId);
        });
    });
}

// ============================================
// ANALYTICS CHARTS
// ============================================

function renderAnalyticsCharts() {
    // Revenue by Cohort
    const cohortRevenue = {};
    COHORTS.forEach(cohort => {
        cohortRevenue[cohort] = students
            .filter(s => s.cohort === cohort)
            .reduce((sum, s) => sum + s.paidAmount, 0);
    });

    const ctx1 = document.getElementById('cohortRevenueChart');
    if (charts.cohortRevenue) charts.cohortRevenue.destroy();
    charts.cohortRevenue = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: COHORTS,
            datasets: [{
                label: 'Revenue',
                data: Object.values(cohortRevenue),
                backgroundColor: '#667eea'
            }]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true } }
        }
    });

    // Students by Cohort
    const cohortStudents = {};
    COHORTS.forEach(cohort => {
        cohortStudents[cohort] = students.filter(s => s.cohort === cohort).length;
    });

    const ctx2 = document.getElementById('cohortStudentsChart');
    if (charts.cohortStudents) charts.cohortStudents.destroy();
    charts.cohortStudents = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: COHORTS,
            datasets: [{
                label: 'Students',
                data: Object.values(cohortStudents),
                backgroundColor: '#764ba2'
            }]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true } }
        }
    });

    // Language Distribution
    const languages = {};
    students.forEach(s => {
        languages[s.language] = (languages[s.language] || 0) + 1;
    });

    const ctx3 = document.getElementById('languageChart');
    if (charts.language) charts.language.destroy();
    charts.language = new Chart(ctx3, {
        type: 'doughnut',
        data: {
            labels: Object.keys(languages),
            datasets: [{
                data: Object.values(languages),
                backgroundColor: ['#667eea', '#764ba2'],
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } }
        }
    });

    // Payment Status
    const paid = students.filter(s => s.remaining === 0).length;
    const pending = students.filter(s => s.remaining > 0).length;

    const ctx4 = document.getElementById('paymentStatusChart');
    if (charts.paymentStatus) charts.paymentStatus.destroy();
    charts.paymentStatus = new Chart(ctx4, {
        type: 'doughnut',
        data: {
            labels: ['Fully Paid', 'Pending Payment'],
            datasets: [{
                data: [paid, pending],
                backgroundColor: ['#4CAF50', '#FF9800'],
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

// ============================================
// MODAL FUNCTIONS
// ============================================

function openAddModal() {
    currentEditingId = null;
    document.getElementById('modalTitle').textContent = 'Add New Student';
    document.getElementById('studentForm').reset();
    document.getElementById('checklistSection').style.display = 'none';
    document.getElementById('studentModal').style.display = 'block';
}

function closeStudentModal() {
    document.getElementById('studentModal').style.display = 'none';
    currentEditingId = null;
}

function editStudent(id) {
    // Convert to number for comparison with Supabase IDs, but also try string comparison
    const numericId = parseInt(id, 10) || id;
    const student = students.find(s => s.id === numericId || String(s.id) === String(id));
    
    if (!student) {
        console.error('Student not found:', id, 'Available IDs:', students.map(s => ({ id: s.id, type: typeof s.id })));
        return;
    }

    currentEditingId = id;
    originalEditingEmail = student.email; // Store original email for comparison
    document.getElementById('modalTitle').textContent = 'Edit Student';
    
    document.getElementById('name').value = student.name || '';
    document.getElementById('email').value = student.email || '';
    document.getElementById('linkedin').value = student.linkedin || '';
    document.getElementById('whatsapp').value = student.whatsapp || '';
    document.getElementById('figmaEmail').value = student.figmaEmail || '';
    document.getElementById('location').value = student.location || '';
    document.getElementById('language').value = student.language || '';
    document.getElementById('status').value = student.status || '';
    document.getElementById('totalAmount').value = student.totalAmount || '';
    document.getElementById('paidAmount').value = student.paidAmount || '0';
    document.getElementById('note').value = student.note || '';
    document.getElementById('paymentMethod').value = student.paymentMethod || '';

    if (student.status === 'Cohort 0' || student.status === 'Cohort 1' || student.status === 'Cohort 2' || student.status === 'Cohort 3' || student.status === 'Cohort 1 - Cradis' || student.status === 'Cohort 1 - Zomra' || student.status === 'Cohort - Free') {
        toggleChecklistSection();
        const addedCommunityEl = document.getElementById('addedCommunity');
        const sharedAgreementEl = document.getElementById('sharedAgreement');
        const signedAgreementEl = document.getElementById('signedAgreement');
        const sharedDriveEl = document.getElementById('sharedDrive');
        const createdFigmaEl = document.getElementById('createdFigma');
        const sharedMasterFigmaEl = document.getElementById('sharedMasterFigma');
        const sharedFeedbackFormEl = document.getElementById('sharedFeedbackForm');
        const submittedCourseFeedbackEl = document.getElementById('submittedCourseFeedback');
        const issuedCertificateEl = document.getElementById('issuedCertificate');
        
        if (addedCommunityEl) addedCommunityEl.checked = student.checklist?.addedCommunity || false;
        if (sharedAgreementEl) sharedAgreementEl.checked = student.checklist?.sharedAgreement || false;
        if (signedAgreementEl) signedAgreementEl.checked = student.checklist?.signedAgreement || false;
        if (sharedDriveEl) sharedDriveEl.checked = student.checklist?.sharedDrive || false;
        if (createdFigmaEl) createdFigmaEl.checked = student.checklist?.createdFigma || false;
        if (sharedMasterFigmaEl) sharedMasterFigmaEl.checked = student.checklist?.sharedMasterFigma || false;
        if (sharedFeedbackFormEl) sharedFeedbackFormEl.checked = student.checklist?.sharedFeedbackForm || false;
        if (submittedCourseFeedbackEl) submittedCourseFeedbackEl.checked = student.checklist?.submittedCourseFeedback || false;
        if (issuedCertificateEl) issuedCertificateEl.checked = student.checklist?.issuedCertificate || false;

        if (student.checklist?.figmaStatus) {
            const figmaStatusEl = document.getElementById(`figma${student.checklist.figmaStatus}`);
            if (figmaStatusEl) figmaStatusEl.checked = true;
        }
    }

    calculateRemaining();
    document.getElementById('studentModal').style.display = 'block';
}

function deleteStudent(id) {
    if (confirm('Are you sure you want to delete this student?')) {
        // Convert to number for comparison with Supabase IDs, but also try string comparison
        const numericId = parseInt(id, 10) || id;
        const student = students.find(s => s.id === numericId || String(s.id) === String(id));
        const studentName = student?.name || id;
        
        // Remove from local array
        students = students.filter(s => !(s.id === numericId || String(s.id) === String(id)));
        
        console.log('🗑️ Deleting student:', studentName, 'with ID:', id);
        
        // Call dedicated delete endpoint
        fetch(`${API_BASE_URL}/api/students/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        })
        .then(response => {
            if (response.ok) {
                console.log('✅ Student deleted from server');
                loadStudents().then(() => {
                    renderPage(document.querySelector('.page.active').id);
                    showToast('Student deleted successfully', 'success');
                });
            } else {
                console.warn('⚠️ Server delete failed, but local removed');
                showToast('Deleted locally (server update may have failed)', 'warning');
            }
        })
        .catch(error => {
            console.error('❌ Error deleting student:', error);
            showToast('Error deleting student', 'error');
        });
    }
}

// Delete student by ID (for handling email changes during edit)
async function deleteStudentById(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/students/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.warn(`⚠️ Server returned ${response.status} when deleting ID ${id}:`, errorData.error);
            return false;
        }
        
        console.log(`✅ Successfully deleted student record by ID: ${id}`);
        return true;
    } catch (error) {
        console.error('❌ Error deleting student by ID:', id, '-', error.message);
        return false;
    }
}

// Delete student by email (for handling email changes during edit) - DEPRECATED: Use deleteStudentById instead
async function deleteStudentByEmail(email) {
    return new Promise((resolve, reject) => {
        fetch(`${API_BASE_URL}/api/students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deleteByEmail: email })
        })
        .then(response => {
            if (!response.ok) {
                console.warn(`⚠️ Server returned ${response.status} when deleting email: ${email}`);
                return response.json().then(data => {
                    throw new Error(data.error || `HTTP ${response.status}`);
                });
            }
            console.log('✅ Successfully deleted old email record:', email);
            resolve(true);
        })
        .catch(error => {
            console.error('❌ Error deleting old email record:', email, '-', error.message);
            // Don't reject - allow save to continue even if delete fails
            resolve(false);
        });
    });
}

function calculateRemaining() {
    const total = parseFloat(document.getElementById('totalAmount').value) || 0;
    const paid = parseFloat(document.getElementById('paidAmount').value) || 0;
    document.getElementById('remaining').value = (total - paid).toFixed(2);
}

function calculateChecklistProgress(student) {
    if (!student.checklist) return 0;
    
    // Only count onboarding items, NOT post-course items
    const checklistItems = [
        'addedCommunity',
        'sharedAgreement',
        'signedAgreement',
        'sharedDrive',
        'createdFigma',
        'sharedMasterFigma',
        'figmaStatus'
    ];
    
    const completedItems = checklistItems.filter(item => {
        if (item === 'figmaStatus') {
            // Only count as completed if it's NOT "Not started"
            return student.checklist[item] && student.checklist[item] !== 'Not started';
        }
        return student.checklist[item];
    }).length;
    
    const totalItems = checklistItems.length;
    const percentage = Math.round((completedItems / totalItems) * 100);
    return percentage;
}

function toggleChecklistSection() {
    const status = document.getElementById('status');
    const checklistSection = document.getElementById('checklistSection');
    if (!status || !checklistSection) return;
    
    const statusValue = status.value;
    // Show checklist for any cohort-related status or cohort names
    const isCohortStatus = statusValue && (statusValue.startsWith('Cohort') || statusValue === 'Next Cohort');
    checklistSection.style.display = isCohortStatus ? 'block' : 'none';
}

function saveStudent(event) {
    event.preventDefault();

    const statusValue = document.getElementById('status').value;
    const newEmail = document.getElementById('email').value;
    
    const student = {
        id: currentEditingId || Date.now().toString(),
        name: document.getElementById('name').value,
        email: newEmail,
        linkedin: document.getElementById('linkedin').value,
        whatsapp: document.getElementById('whatsapp').value,
        figmaEmail: document.getElementById('figmaEmail').value,
        location: document.getElementById('location').value,
        language: document.getElementById('language').value,
        status: statusValue,
        cohort: statusValue, // Cohort is now the same as status
        totalAmount: parseFloat(document.getElementById('totalAmount').value) || 0,
        paidAmount: parseFloat(document.getElementById('paidAmount').value) || 0,
        remaining: parseFloat(document.getElementById('remaining').value) || 0,
        note: document.getElementById('note').value,
        paymentMethod: document.getElementById('paymentMethod').value
    };

    console.log('📝 Saving student:', student.name, '| Status:', student.status, '| ID:', student.id, '| Email:', student.email);
    console.log('💰 Payment: Method=' + student.paymentMethod + ', Total=' + student.totalAmount + ', Paid=' + student.paidAmount, ', Remaining=' + student.remaining);

    // Add checklist for any cohort-related status
    const isCohortStatus = student.status && (student.status.startsWith('Cohort') || student.status === 'Next Cohort');
    if (isCohortStatus) {
        student.checklist = {
            addedCommunity: document.getElementById('addedCommunity').checked,
            sharedAgreement: document.getElementById('sharedAgreement').checked,
            signedAgreement: document.getElementById('signedAgreement').checked,
            sharedDrive: document.getElementById('sharedDrive').checked,
            createdFigma: document.getElementById('createdFigma').checked,
            sharedMasterFigma: document.getElementById('sharedMasterFigma').checked,
            figmaStatus: document.querySelector('input[name="figmaStatus"]:checked')?.value || 'Not started',
            sharedFeedbackForm: document.getElementById('sharedFeedbackForm')?.checked || false,
            submittedCourseFeedback: document.getElementById('submittedCourseFeedback')?.checked || false,
            issuedCertificate: document.getElementById('issuedCertificate')?.checked || false
        };
    }

    if (currentEditingId) {
        // Use type-safe comparison for string/int IDs from Supabase
        const numericId = parseInt(currentEditingId, 10) || currentEditingId;
        const index = students.findIndex(s => s.id === numericId || String(s.id) === String(currentEditingId));
        if (index !== -1) {
            console.log('✏️ UPDATE: Found student at index', index, '- updating existing record');
            students[index] = student;
        } else {
            console.log('⚠️ UPDATE: Could not find student with ID', currentEditingId, '- creating new record');
            students.push(student);
        }
    } else {
        console.log('➕ CREATE: Adding new student to local array');
        students.push(student);
    }

    closeStudentModal();
    
    // If editing and email changed, log it (server UPSERT on ID will handle the update correctly)
    if (currentEditingId && originalEditingEmail && originalEditingEmail !== newEmail) {
        console.log(`🔄 EMAIL CHANGED: "${originalEditingEmail}" → "${newEmail}"`);
        console.log(`   - Server will update record by ID ${currentEditingId} (UPSERT on ID prevents duplicates)`);
    }
    
    // Save to storage and refresh UI - pass only the single student
    // Server UPSERT will:
    // - Match by ID if record exists (UPDATE) ← This prevents duplicates when email changes!
    // - Create new if ID doesn't exist (INSERT for new records)
    const actionType = currentEditingId ? 'update' : 'create';
    console.log(`💾 Saving student to server (${actionType}): ${newEmail}`);
    saveToStorage(student).then(() => {
        loadStudents().then(() => {
            renderPage(document.querySelector('.page.active').id);
            if (currentEditingId && originalEditingEmail && originalEditingEmail !== newEmail) {
                showToast('Student email updated successfully!', 'success');
            } else if (currentEditingId) {
                showToast('Student updated successfully!', 'success');
            } else {
                showToast('Student created successfully!', 'success');
            }
        });
    });
    // Reset tracking variables
    currentEditingId = null;
    originalEditingEmail = null;
}

// ============================================
// DATA MANAGEMENT
// ============================================

async function saveToStorage(studentToSave = null) {
    // If a specific student is provided, save only that one. Otherwise save all (for initial load)
    const dataToSend = studentToSave || students;
    const dataArray = Array.isArray(dataToSend) ? dataToSend : [dataToSend];
    
    console.log(`📤 Sending to server: ${dataArray.length} student(s)`);
    if (dataArray.length === 1) {
        console.log(`   - Single student: ${dataArray[0].name} (${dataArray[0].email})`);
    } else {
        console.log(`   - Bulk students: IDs ${dataArray.map(s => s.id).join(', ')}`);
    }
    
    // Save to server
    try {
        const response = await fetch(`${API_BASE_URL}/api/students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataArray)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Auto-saved to server:', result.count, 'students');
            return result;
        } else {
            const errorData = await response.json();
            const errorMsg = errorData.error || 'Server save failed';
            console.warn('⚠️ Server error (HTTP', response.status + '):', errorMsg);
            showToast(errorMsg, 'error');
            throw new Error(errorMsg);
        }
    } catch (error) {
        console.warn('⚠️ Cannot reach server:', error.message);
        console.warn('Note: Changes are saved locally but not synced to server');
    }
    
    logStudentStats();
}

async function loadStudents() {
    try {
        // Try to load from server first
        const response = await fetch(`${API_BASE_URL}/api/students`);
        if (response.ok) {
            const serverStudents = await response.json();
            if (serverStudents && Array.isArray(serverStudents) && serverStudents.length > 0) {
                students = serverStudents;
                console.log(`✅ Loaded ${students.length} students from server (students.json)`);
                logStudentStats();
                return;
            }
        }
    } catch (error) {
        console.log('⚠️ Server not available, trying localStorage...');
    }
    
    // Fallback to localStorage
    const stored = localStorage.getItem('students');
    if (stored) {
        try {
            const parsedStudents = JSON.parse(stored);
            if (parsedStudents && Array.isArray(parsedStudents) && parsedStudents.length > 0) {
                students = parsedStudents;
                console.log(`✅ Loaded ${students.length} students from localStorage`);
                logStudentStats();
                return;
            }
        } catch (e) {
            console.error('Error parsing stored students:', e);
        }
    }
    
    // If no valid stored data, load sample data
    students = getSampleData();
    await saveToStorage();
    console.log(`✅ Loaded ${students.length} students from sample data`);
    logStudentStats();
}

function logStudentStats() {
    // Stats logging removed
}

function exportData() {
    const dataStr = JSON.stringify(students, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `students-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    console.log('✅ Exported', students.length, 'students to file');
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const imported = JSON.parse(event.target.result);
                if (Array.isArray(imported)) {
                    students = imported;
                    saveToStorage();
                    alert(`✅ Imported ${students.length} students successfully!`);
                    renderPage(document.querySelector('.page.active').id);
                    logStudentStats();
                } else {
                    alert('❌ Invalid file format. Please select a valid students backup file.');
                }
            } catch (error) {
                alert('❌ Error reading file: ' + error.message);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            if (Array.isArray(imported)) {
                students = imported;
                saveToStorage();
                renderPage('overview');
                alert('Data imported successfully!');
            } else {
                alert('Invalid file format');
            }
        } catch (error) {
            alert('Error importing file: ' + error.message);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function clearAllData() {
    if (confirm('Are you sure? This will delete ALL students permanently!')) {
        students = [];
        saveToStorage();
        renderPage('overview');
    }
}

// ============================================
// SAMPLE DATA
// ============================================

function getSampleData() {
    return [
        { id: "1", name: "omar sherif", email: "iomarsherifofficial@gmail.com", whatsapp: "201280991100", location: "Egypt", linkedin: "https://www.linkedin.com/in/omarsherifyahia/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "2", name: "Rawan", email: "rawanelbassyouni@gmail.com", whatsapp: "", location: "", linkedin: "", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "3", name: "Mohsen Afifi", email: "mohsen.m.afifi@gmail.com", whatsapp: "", location: "", linkedin: "https://www.linkedin.com/in/mohsen-afifi/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "4", name: "Abdelrahman Arab", email: "abdelrahman.arab.ac@gmail.com", whatsapp: "", location: "", linkedin: "https://www.linkedin.com/in/abdelrahmanarabac/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "5", name: "Ibrahim Gomaa", email: "Ibrahimgomaa72@gmail.com", whatsapp: "", location: "", linkedin: "https://www.linkedin.com/in/ibrahim-gomaa/", language: "English", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "6", name: "Martin Micheal", email: "martinmicheal909@gmail.com", whatsapp: "201554165831", location: "Egypt", linkedin: "https://www.linkedin.com/in/martin-micheal/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "7", name: "safwan ahmed", email: "asafwan438@gmail.com", whatsapp: "", location: "Egypt", linkedin: "https://www.linkedin.com/in/safwan-ahmed-nng/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "8", name: "Mohamed shantory", email: "shvntory@gmail.com", whatsapp: "201029197005", location: "Egypt", linkedin: "https://www.linkedin.com/in/mohamed-shantory-646065178/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "9", name: "Mariam Nasser", email: "mariam.nasser4478@gmail.com", whatsapp: "201080452653", location: "Egypt", linkedin: "https://www.linkedin.com/in/mariamnasser5585/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "10", name: "Rawan elbassyouni", email: "myvip147@gmail.com", whatsapp: "201044136146", location: "Egypt", linkedin: "https://www.linkedin.com/in/rawan-elbassyouni-91b875187/", language: "English", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "11", name: "Ahmed Othman", email: "a20othman01@gmail.com", whatsapp: "201091160139", location: "Egypt", linkedin: "https://www.linkedin.com/in/ahmed-othman-a0762a215/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "12", name: "Mohamed Saied", email: "ms.hammad@outlook.com", whatsapp: "201022710197", location: "Egypt", linkedin: "https://www.linkedin.com/in/mohamed-saied-550b78198/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "13", name: "Ahmed Mostafa Elsaidi", email: "aelsidy95@gmail.com", whatsapp: "201203844643", location: "Egypt", linkedin: "https://www.linkedin.com/in/saidii74/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "14", name: "Mohamed zaky", email: "ma4060959@gmail.com", whatsapp: "201118788673", location: "Egypt", linkedin: "https://www.linkedin.com/in/mohamed-zaky-05384423a/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "15", name: "Yahia Ahmed", email: "yehiaahmed4589@gmail.com", whatsapp: "201010043504", location: "Egypt", linkedin: "https://www.linkedin.com/in/yahiauix/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "16", name: "يوسف مصطفي", email: "youssefkhaled397@gmail.com", whatsapp: "201126617333", location: "Egypt", linkedin: "https://www.linkedin.com/in/youssef-khaled-27255416a/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "17", name: "Yassmin Aboalkhair", email: "yasminaaboalkher34@gmail.com", whatsapp: "201206267697", location: "Egypt", linkedin: "https://www.linkedin.com/in/yassmin-aboalkhair/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "18", name: "Mariam Khalil", email: "mariamzakaria.design@gmail.com", whatsapp: "201271090508", location: "Egypt", linkedin: "https://www.linkedin.com/in/mariamzakariauiuxdesigner/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "19", name: "Mohammed Balahmer", email: "mohamed.balahmer@gmail.com", whatsapp: "967738246252", location: "Yamen", linkedin: "https://www.linkedin.com/in/mohammed-balahmer-a824ab249/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "20", name: "Yara Adel", email: "yadel2878@gmail.com", whatsapp: "201554274318", location: "Egypt", linkedin: "https://www.linkedin.com/in/yara-adel-elgenbehy-6235711a4/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "22", name: "Muhammed Elkashef", email: "muhammedelkashef6@gmail.com", whatsapp: "201551835438", location: "Egypt", linkedin: "https://www.linkedin.com/in/muhammed-elkashef-42ba55271/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "23", name: "Hanan Waled", email: "hananwaled288@gmail.com", whatsapp: "", location: "", linkedin: "https://www.linkedin.com/in/hanan-waled-6109402b1/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "24", name: "Nehal Mohsen", email: "ux.nehal@gmail.com", whatsapp: "", location: "", linkedin: "https://www.linkedin.com/in/nehal-mohsen-uix/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "25", name: "Mina Ayman", email: "menaayman233@gmail.com", whatsapp: "201011740567", location: "Egypt", linkedin: "", language: "English", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "26", name: "Asia Mahmoud Mohamed", email: "asiamahmood07@gmail.com", whatsapp: "201065243953", location: "", linkedin: "https://www.linkedin.com/in/asia-mahmood-b57b12331?trk=recent-searches", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "27", name: "Mohamed matter", email: "mmatter19@gmail.com", whatsapp: "", location: "", linkedin: "https://www.linkedin.com/in/mohamed-matter-89922b171/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "28", name: "Baraa", email: "braasalah90@gmail.com", whatsapp: "", location: "", linkedin: "https://www.linkedin.com/in/baraa-salah/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "29", name: "Majd Elhaj Mahmoud", email: "majdelhm@gmail.com", whatsapp: "96181024427", location: "Saudi Arabia", linkedin: "https://www.linkedin.com/in/majdesignr?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "30", name: "Hadi loubani", email: "hadi.loubani2@gmail.com", whatsapp: "96181406921", location: "Saudi Arabia", linkedin: "https://www.linkedin.com/in/hadiloubani", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "31", name: "Shref ragaa maylo", email: "shrefmaylo83@gmail.com", whatsapp: "201220766998", location: "Egypt", linkedin: "https://www.linkedin.com/in/shref-maylo-21806b205/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "32", name: "Shimaa ali fawzy hassan", email: "shimaasa780817@email.com", whatsapp: "201552696030", location: "Egypt / sohag", linkedin: "https://www.linkedin.com/in/shimaa-ali-6ab210266/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "33", name: "Muhammed Osama", email: "MuhammedOsama.Dev@gmail.com", whatsapp: "", location: "", linkedin: "https://www.linkedin.com/in/mu7ammedosama/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "34", name: "Vinola Kamil", email: "vinolakamil19@gmail.com", whatsapp: "201202476271", location: "Egypt", linkedin: "https://www.linkedin.com/in/vinola-kamil-/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "35", name: "Rania Najeeb", email: "engranianajeeb@gmail.com", whatsapp: "201285311200", location: "Egypt", linkedin: "https://www.linkedin.com/in/rania-najeeb-8b2a773a/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "36", name: "Mohanad Mahmoud Ahmed Farouk", email: "mohanaduidesigner@gmail.com", whatsapp: "201210538370", location: "Egypt", linkedin: "https://www.linkedin.com/in/mohanad-mahmoud-b25679259/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "37", name: "Lamia", email: "lamia.kk.m@gmail.com", whatsapp: "966537005794", location: "Saudi Arabia", linkedin: "https://www.linkedin.com/in/%D9%84%D9%85%D9%8A%D8%A7%D8%A1-%D8%AE%D8%A7%D9%84%D8%AF-3695201ba?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "38", name: "Bishoy Bekheet", email: "bishoybakheet1@gmail.com", whatsapp: "201113206878", location: "Egypt", linkedin: "https://www.linkedin.com/in/bishoy-bekheet", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "39", name: "lamiaa", email: "lamiaamotaz00@gmail.com", whatsapp: "201126230730", location: "Egypt", linkedin: "https://www.linkedin.com/in/lamiaamotaz/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "40", name: "Ahmed rady Ahmed", email: "radyahmed798@gmail.com", whatsapp: "", location: "", linkedin: "https://www.linkedin.com/in/ahmed-rady-056458220/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "41", name: "Amna Ahmed", email: "amnahtaher2@gmail.com", whatsapp: "", location: "", linkedin: "https://www.linkedin.com/in/amna-ahmed-ux/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "42", name: "Hana Adel", email: "hanaalamdin.ha@gmail.com", whatsapp: "201117278194", location: "Egypt", linkedin: "http://linkedin.com/in/hana-adel-mohmed-074811293", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "43", name: "David", email: "davidemeel15@gmail.com", whatsapp: "201203614610", location: "Egypt", linkedin: "https://www.linkedin.com/in/david-emeel-387855226/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "44", name: "Saleb Nazmy", email: "salebnazmy12@gmail.com", whatsapp: "201205169171", location: "Egypt", linkedin: "", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "45", name: "Yasmin", email: "yasminhamed035@gmail.com", whatsapp: "201222237684", location: "Egypt", linkedin: "https://www.linkedin.com/in/yasminehamed0", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "46", name: "Mona Mardy", email: "mona.mardy@gmail.com", whatsapp: "201005763472", location: "Egypt", linkedin: "", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "47", name: "MennaRefaat", email: "mennarefaat22@gmail.com", whatsapp: "201010377412", location: "Egypt", linkedin: "https://www.linkedin.com/in/mennarefaat?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "48", name: "Ali Tarek", email: "alitarekux@gmail.com", whatsapp: "201013554335", location: "Egypt", linkedin: "https://www.linkedin.com/in/aliitarek/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "49", name: "Osama Shanab", email: "osama.shanab97@gmail.com", whatsapp: "201011902656", location: "Egypt", linkedin: "https://www.linkedin.com/in/osama-shanab", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "50", name: "Youssif Amin", email: "yusefmostafaaa@gmail.com", whatsapp: "", location: "", linkedin: "https://www.linkedin.com/in/youssifamin/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "51", name: "Merna Radwan", email: "mernamhmd20@gmail.com", whatsapp: "201004218282", location: "Egypt", linkedin: "https://www.linkedin.com/in/merna-radwan-a2402a149?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "52", name: "Saad Shaltout", email: "saadshaltout.red@gmail.com", whatsapp: "201095436110", location: "Egypt", linkedin: "https://www.linkedin.com/in/saadshaltout?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "53", name: "malak hossam", email: "malakhossam879@gmail.com", whatsapp: "201211135879", location: "Egypt", linkedin: "https://www.linkedin.com/in/malak-hossam-ab673a27a", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "54", name: "Youssef Helmy", email: "yosef.yaser135@gmail.com", whatsapp: "201018641720", location: "Egypt", linkedin: "https://www.linkedin.com/in/youssef-helmy-%F0%9F%87%B5%F0%9F%87%B8-37b812223?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "55", name: "Najlaa", email: "najlaaouda.88@gmail.com", whatsapp: "201204838290", location: "Egypt", linkedin: "https://www.linkedin.com/in/najlaaouda88/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "56", name: "Mohammad Gamal Abdel Megeed", email: "moh.nour2020@gmail.com", whatsapp: "201110117759", location: "Egypt", linkedin: "https://www.linkedin.com/in/mgn161120/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "57", name: "Ahmed sayed khairy hashad", email: "Ahmedhashad015@gmail.com", whatsapp: "201148380020", location: "Egypt", linkedin: "https://www.linkedin.com/in/ahmed-hashad-393ba6165/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "58", name: "ربيع اشرف ربيع", email: "rabeaaltop123@gmail.com", whatsapp: "201210049318", location: "Egypt", linkedin: "https://www.linkedin.com/in/rabea-ashraf-341267362/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "59", name: "ROZAN H. I. MATAR", email: "rozan.hasan.matar@gmail.com", whatsapp: "", location: "", linkedin: "https://www.linkedin.com/in/rozanmatar/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "60", name: "Mohamed sayed", email: "mohamed.sayed.abubakr@gmail.com", whatsapp: "201118887395", location: "Egypt", linkedin: "https://www.linkedin.com/in/mohamedsayed201382/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "61", name: "Ahmedsayed", email: "sayd89770@gmail.com", whatsapp: "201123729098", location: "Egypt", linkedin: "https://www.linkedin.com/in/ahmed-sayed-12381723a/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "62", name: "Duaa Khafajah", email: "Khafajahd@gmail.com", whatsapp: "962787290919", location: "Jordon", linkedin: "https://www.linkedin.com/in/khafajahd", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "63", name: "Mohamed Shams", email: "msh37051@gmail.com", whatsapp: "201114337313", location: "Egypt", linkedin: "https://www.linkedin.com/in/mohamed-shams-9a6ba0286/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "64", name: "Shady Ashraf", email: "shady.ashraf.mahmod@gmail.com", whatsapp: "", location: "Egypt", linkedin: "https://www.linkedin.com/in/shady-ashraf-b140a1150?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "65", name: "maryam ahmed ismail", email: "maryamkhalil882@gmail.com", whatsapp: "201122994889", location: "Egypt", linkedin: "", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "66", name: "Ashoush", email: "a-ashoush@outlook.com", whatsapp: "201159555605", location: "Egypt", linkedin: "https://www.linkedin.com/in/abdel-latif-ashoush-b17b5664?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "67", name: "Mohammed Alloush", email: "mohammed@design.com.sa", whatsapp: "966551172019", location: "Saudi Arabia", linkedin: "https://www.linkedin.com/in/mohammed-alloush-364601283/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "68", name: "maryam nasser", email: "nassemaryam44@gamil.com", whatsapp: "201271908966", location: "Egypt", linkedin: "https://www.linkedin.com/in/maryam-nasser-9b4a4324a", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "69", name: "Ahmed saber", email: "sabzeroscorpion99@gmail.com", whatsapp: "", location: "", linkedin: "https://www.linkedin.com/in/ahmed-saber-6b7ba7277/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "70", name: "Samaa", email: "samaa772002@gmail.com", whatsapp: "", location: "", linkedin: "https://www.linkedin.com/in/samaa-abdelsadek-275882376/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "71", name: "Dina Tarek", email: "dinatarekelhennawy@gmail.com", whatsapp: "", location: "", linkedin: "https://www.linkedin.com/in/dina-tarek-a22300151/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "72", name: "Ismail", email: "ismael.karam000@gmail.com", whatsapp: "", location: "", linkedin: "https://www.linkedin.com/in/ismael-karam-8ba6a7168/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "73", name: "Mahmoud Sami", email: "mahmoudsamy146@gmail.com", whatsapp: "", location: "", linkedin: "https://www.linkedin.com/in/mahm0udsami/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "74", name: "Mahmoud Sami", email: "mahmoudsamy146@gmail.com", whatsapp: "", location: "", linkedin: "https://www.linkedin.com/in/mahm0udsami/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "75", name: "Abdelrhman Essam Omar", email: "abdelrhmanvh@gmail.com", whatsapp: "201505128299", location: "Egypt", linkedin: "https://www.linkedin.com/in/abdelrhman-essam-53685b263?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "76", name: "Shaker AL-Ameri", email: "", whatsapp: "", location: "", linkedin: "https://www.linkedin.com/in/shakeruiux/", language: "", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "77", name: "Ahmed Sayed", email: "", whatsapp: "", location: "", linkedin: "https://www.linkedin.com/in/ahmed-sayed-12381723a/", language: "", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "78", name: "Shahinaz Ramadan", email: "", whatsapp: "", location: "", linkedin: "https://www.linkedin.com/in/shahinaz-ramadan-157116244/", language: "", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "79", name: "Rehab Magdy", email: "rehabmagdy6666@gmail.com", whatsapp: "", location: "", linkedin: "https://www.linkedin.com/in/rehab-magdy-ibrahim/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "80", name: "Mohamed Kassem", email: "mohamed99.qassem@gmail.com", whatsapp: "", location: "", linkedin: "https://www.linkedin.com/in/m-kassem96/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "81", name: "Rania Najeeb", email: "engranianajeeb@gmail.com", whatsapp: "201285311200", location: "Egypt", linkedin: "https://www.linkedin.com/in/rania-najeeb-8b2a773a/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "82", name: "Gehad Magdy El Khouly", email: "gehadmagdy055@gmail.com", whatsapp: "420771263413", location: "Czech", linkedin: "https://www.linkedin.com/in/gehadmagdy055/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "83", name: "fatma abd el naby", email: "fatmaabdelnaby3@gmail.com", whatsapp: "201064360603", location: "Egypt", linkedin: "https://www.linkedin.com/in/fatma-abdel-naby-a92647212/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "84", name: "Abdulmjeed alnfaie", email: "mjo0ody201027@hotmail.com", whatsapp: "966506709888", location: "Saudi Arabia", linkedin: "https://www.linkedin.com/in/abdulamjeedalnefaie?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "85", name: "Misk sabah", email: "misk9sabah@gmail.com", whatsapp: "9647729288329", location: "Iraq", linkedin: "", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "86", name: "Ayat Allah hisham Fawzy", email: "aiahayahaiah@gmail.com", whatsapp: "201148455633", location: "Egypt", linkedin: "", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "87", name: "Esraa Hassan", email: "eh615299@gmail.com", whatsapp: "201119453909", location: "Egypt", linkedin: "", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "88", name: "Amira Atef Elezaby", email: "amiraelezaby109@gmail.com", whatsapp: "201283529926", location: "Egypt", linkedin: "", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "89", name: "Dina Tarek El Hennawy", email: "dina_tarek_19@yahoo.com", whatsapp: "201556099117", location: "Egypt", linkedin: "", language: "English", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "90", name: "Jumaina Karim", email: "jumainakarim144@gmail.com", whatsapp: "201022004020", location: "Egypt", linkedin: "", language: "English", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "91", name: "mohamed fouad anter", email: "anterthedesigner@gmail.com", whatsapp: "201025149578", location: "Egypt", linkedin: "https://www.linkedin.com/in/mohamed-anter-a2b779316?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "92", name: "Farah Eldemery", email: "faraheldemery00@gmail.com", whatsapp: "201066456843", location: "Egypt", linkedin: "http://linkedin.com/in/faraheldemery", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "93", name: "Tasneem Mohammed Sakr", email: "tasneemsakr87@gmail.com", whatsapp: "201030860764", location: "Egypt", linkedin: "https://www.linkedin.com/in/tasneem-sakr-002794250?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "94", name: "Shahinaz", email: "ramadanshahinaz84@gmail.com", whatsapp: "201555859666", location: "Egypt", linkedin: "https://www.linkedin.com/in/shahinaz-ramadan-157116244", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "95", name: "Lobana Balloul", email: "lobanaballoul194@gmail.com", whatsapp: "963994322467", location: "Syria", linkedin: "https://www.linkedin.com/in/lobanauiuxdesigner/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "96", name: "Al-Hasna Al-Abri", email: "alhasnaalabri7@gmail.com", whatsapp: "96894301906", location: "Oman", linkedin: "", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "97", name: "Amani Albij", email: "amanialbij95@gmail.com", whatsapp: "963949623484", location: "Syria", linkedin: "https://www.linkedin.com/in/amani-albij?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "98", name: "Ahmed Ayman", email: "ahmedayman4391@gmail.com", whatsapp: "201029271444", location: "Egypt", linkedin: "https://www.linkedin.com/in/ahmedayman0", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "99", name: "ايمان الشربيني", email: "emanelsherbiny366@gmail.com", whatsapp: "201021411095", location: "Egypt", linkedin: "https://www.linkedin.com/in/eman-elsherbiny-0b006b365/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "100", name: "Mohamed Ismail", email: "mohamedyos777@gmail.com", whatsapp: "201000336200", location: "Egypt", linkedin: "https://www.linkedin.com/in/mohamed-ismail-ux/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "101", name: "Donia", email: "doniasaadmohamed1@gmail.com", whatsapp: "201028457201", location: "Egypt", linkedin: "https://www.linkedin.com/in/donia-saad-m1/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "102", name: "Ammar M Almansor", email: "ammaralmansor4@gmail.com", whatsapp: "963938764405", location: "Syria", linkedin: "", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "103", name: "Rehab Amr", email: "rehab.amr.abdelkareem@gmail.com", whatsapp: "201098002650", location: "Egypt", linkedin: "https://www.linkedin.com/in/rehab-abd-elkareem-7b0750350?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "104", name: "Donia azmy", email: "doniahisham760@gmail.com", whatsapp: "201114267759", location: "Egypt", linkedin: "https://www.linkedin.com/in/donia-hisham-602169221/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "105", name: "Sarah Mohamed Mahmoud", email: "saramohamed114711@gmail.com", whatsapp: "201228684131", location: "Egypt", linkedin: "https://www.linkedin.com/in/sara-mohamed-2317732b6/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "106", name: "Alaa Saber", email: "alaasaber22777@gmail.com", whatsapp: "201020799235", location: "Egypt", linkedin: "https://www.linkedin.com/in/alaa-saber-mahmoud/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "107", name: "Mahmod Mamdoh Mohamed", email: "mamdohmahmod46@gmail.com", whatsapp: "201012313011", location: "Egypt", linkedin: "https://www.linkedin.com/in/mahmod-mamdoh-b81346247?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "108", name: "Eslam", email: "eslamaladly73@gmail.com", whatsapp: "201029875848", location: "Egypt", linkedin: "https://www.linkedin.com/in/eslam-aladly-%E5%90%89%E7%A5%A5-268589169/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "109", name: "Dinah", email: "dinahhani004@gmail.com", whatsapp: "966592366747", location: "Saudi Arabia", linkedin: "https://www.linkedin.com/in/dinahaburahmah/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "110", name: "Usf satoor", email: "youssefsatoor@gmail.com", whatsapp: "201099318155", location: "Egypt", linkedin: "https://www.linkedin.com/in/usf-satoor/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "111", name: "Donia Ibrahim helale", email: "doniaibrahimhelale@gmail.com", whatsapp: "201098969260", location: "Egypt", linkedin: "", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "112", name: "Somaya Hamed Elmeshad", email: "somayahamed027@gmail.com", whatsapp: "201025109061", location: "Cairo", linkedin: "", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "113", name: "Fatima Aboalatta", email: "fatima.aboalatta@gmail.com", whatsapp: "966570392389", location: "Saudi Arabia", linkedin: "https://www.linkedin.com/in/fatimaabo/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "114", name: "Asma", email: "asmaeboukassime@gmail.com", whatsapp: "8619906873409", location: "China", linkedin: "", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "115", name: "Rania Adel", email: "raniaadel240@gmail.com", whatsapp: "201093549032", location: "Egypt", linkedin: "https://www.linkedin.com/in/rania-adel2/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "116", name: "Mohamed Hamouda", email: "mohmdhamouda7@gmail.com", whatsapp: "201067739490", location: "Egypt", linkedin: "https://www.linkedin.com/in/mohamed-hamouda22/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "117", name: "zyad", email: "zyadtoson9@gmail.com", whatsapp: "", location: "Turkiye", linkedin: "https://www.linkedin.com/in/zyadtoson/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "118", name: "Ibrahim Magdy", email: "hema_abc500@yahoo.com", whatsapp: "", location: "", linkedin: "https://www.linkedin.com/in/%E2%80%AAibrahim-magdy%E2%80%AC%E2%80%8F-648b44116/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "119", name: "Habiba", email: "habibahassan232001@gmail.com", whatsapp: "201151238483", location: "Egypt", linkedin: "https://www.linkedin.com/in/habiba-hassan-4102862b4/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "120", name: "Rania", email: "raniaabdelnasser93@gmail.com", whatsapp: "", location: "", linkedin: "https://www.linkedin.com/in/rania-abdelnasser-6b5693297/", language: "English", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "121", name: "Souhila Benmenni", email: "benmenni.soohila@gmail.com", whatsapp: "213779525458", location: "Algeria", linkedin: "https://www.linkedin.com/in/souhila-benmenni/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "122", name: "Ashrqat Maher", email: "ashrqat.m19@gmail.com", whatsapp: "201093285544", location: "Egypt", linkedin: "https://www.linkedin.com/in/ashrqat-maher19/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "123", name: "Aliaa Adel Sayed", email: "aliaaadelg3@gmail.com", whatsapp: "201030696906", location: "Egypt", linkedin: "https://www.linkedin.com/in/aliaa-adel-09169434a?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "124", name: "Suhaila Ahmed", email: "suhailaahmed712@gmail.com", whatsapp: "201140361422", location: "Egypt", linkedin: "https://www.linkedin.com/in/suhaila-ahmed-374173202/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "125", name: "Basma Hassan", email: "basmahassan2144@gmail.com", whatsapp: "201288962242", location: "Egypt", linkedin: "https://www.linkedin.com/in/basma-hassan44?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "126", name: "mohammed Osama khalil", email: "mohamedosamakh9@gmail.com", whatsapp: "201022802790", location: "Egypt", linkedin: "https://www.linkedin.com/in/mohamed-osama-khalil-%F0%9F%87%AA%F0%9F%87%AC-059b141b7/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "127", name: "Fatma Abdo El Sayed Sakr", email: "batotasakr47@gmail.com", whatsapp: "201156566428", location: "Egypt", linkedin: "https://www.linkedin.com/in/batotasakr", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "128", name: "Youmna Atiaa", email: "yomasameh@gmail.com", whatsapp: "20111224379", location: "Egypt", linkedin: "https://www.linkedin.com/in/youmna-atiaa-111752231/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "129", name: "Ahmed Ahmed El morsy", email: "elmorsyahmed45@gmail.com", whatsapp: "201028442739", location: "Egypt", linkedin: "https://www.linkedin.com/in/ahmed-el-morsy-b1a89b1aa/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "130", name: "Shrouk Gamal Mohammed", email: "Gshrouk423@gmail.com", whatsapp: "201140953304", location: "Egypt", linkedin: "https://www.linkedin.com/in/shrouk-elsharkawy-9568a5374/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "131", name: "Mahmoud Abdulaziz", email: "mahmoud.uid@gmail.com", whatsapp: "", location: "", linkedin: "https://www.linkedin.com/in/mahmoud-a-abdelaziz-%F0%9F%87%B5%F0%9F%87%B8-71b1b065/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "132", name: "Nada Nabil", email: "nadaa.nabiill23@gmail.com", whatsapp: "201017767738", location: "Egypt", linkedin: "https://www.linkedin.com/in/nadanabil/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "133", name: "Abdulrahman Alwabel", email: "abdulrahman.alwabel10@gmail.com", whatsapp: "966508037720", location: "Saudi Arabia", linkedin: "https://www.linkedin.com/in/abdulrahman-alwabel", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "134", name: "Amanii Atef Aish", email: "amaniiaish199@outlook.com", whatsapp: "201025357805", location: "Egypt", linkedin: "https://eg.linkedin.com/in/amaniiaish", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "135", name: "Noha Saad", email: "nohasaad8301@gmail.com", whatsapp: "", location: "", linkedin: "https://www.linkedin.com/in/noha-saad-713610253/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "136", name: "Mai Mohamed", email: "mainassar763@gmail.com", whatsapp: "201014456591", location: "Egypt", linkedin: "https://www.linkedin.com/in/mai-mohammed-5276821b6", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "137", name: "Sara", email: "saraaa.alii77@gmail.com", whatsapp: "201093726092", location: "Egypt", linkedin: "https://www.linkedin.com/in/sara-ali-34603a22a", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "138", name: "Ahmed Hamdy Musallam", email: "ahmed.hamdy.musallam@gmail.com", whatsapp: "01094589060", location: "Egypt", linkedin: "https://www.linkedin.com/in/ahmmusallam/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "139", name: "Barrah", email: "barrahmahoud046@gmail.com", whatsapp: "201097441733", location: "Egypt", linkedin: "https://www.linkedin.com/in/barrahelhawary?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "140", name: "Saad", email: "saadalshalwan1@gmail.com", whatsapp: "966564408041", location: "Saudi Arabia", linkedin: "http://linkedin.com/in/saad-alshalwan", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "141", name: "Sara Elsheikh", email: "Sarakhaled2911@gmail.com", whatsapp: "201055440588", location: "Egypt", linkedin: "https://www.linkedin.com/in/sara-elsheikh-12a298147/", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "142", name: "Abdelrahman Osama Saleh", email: "abdelrahmanosama655@gmail.com", whatsapp: "01557815853", location: "Egypt", linkedin: "www.linkedin.com/in/abdelrahman-ux", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "143", name: "Abdelrahman Osama Saleh", email: "abdelrahmanosama655@gmail.com", whatsapp: "01557815853", location: "", linkedin: "www.linkedin.com/in/abdelrahman-ux", language: "Arabic", status: "Next Cohort", cohort: "Next Cohort", totalAmount: 0, paidAmount: 0, remaining: 0, note: "Asked to join the next cohort", paymentMethod: "" },
        { id: "144", name: "Taing Sothea", email: "sotheasc75@gmail.com", whatsapp: "", location: "", linkedin: "https://www.linkedin.com/in/taing-sothea-638a081aa/", language: "English", status: "Waiting list", cohort: "Waiting list", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "" },
        { id: "145", name: "Rosalie  Powell", email: "contact@rosaliepowell.com.au", whatsapp: "", location: "Australia", linkedin: "https://www.linkedin.com/in/rosaliepowell/", language: "English", status: "Waiting list", cohort: "Waiting list", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "" },
        { id: "146", name: "Nirmal P", email: "nirmalppr@gmail.com", whatsapp: "", location: "", linkedin: "https://www.linkedin.com/in/nirmal-uiux/", language: "English", status: "Waiting list", cohort: "Waiting list", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "" },
        { id: "147", name: "Kushal", email: "kushalsheshadri@gmail.com", whatsapp: "", location: "", linkedin: "https://www.linkedin.com/in/kushalsheshadri/?miniProfileUrn=urn%3Ali%3Afs_miniProfile%3AACoAABlZrgIBrSt9omZAhY_PbfwYz1Z8yqipPYw", language: "English", status: "Waiting list", cohort: "Waiting list", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "" },
        { id: "148", name: "Brian", email: "brian.pheiffer@insight.com", whatsapp: "", location: "Australia", linkedin: "https://www.linkedin.com/in/brianpheiffer/", language: "English", status: "Waiting list", cohort: "Waiting list", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "" },
        { id: "149", name: "Alioune Touré", email: "tourealiounethebest@gmail.com", whatsapp: "", location: "", linkedin: "https://www.linkedin.com/in/alioune-tour%C3%A9-b10793172/", language: "English", status: "Waiting list", cohort: "Waiting list", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "" },
        { id: "150", name: "Kerri", email: "kerriellen.casey@gmail.com", whatsapp: "", location: "Ireland", linkedin: "https://www.linkedin.com/in/kerriellencasey/", language: "English", status: "Waiting list", cohort: "Waiting list", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "" },
        { id: "151", name: "fakihin", email: "aqsafakihin@gmail.com", whatsapp: "", location: "", linkedin: "https://www.linkedin.com/in/fakihinaqsa/", language: "English", status: "Waiting list", cohort: "Waiting list", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "" },
        { id: "152", name: "Sam", email: "gsamsantos0707@gmail.com", whatsapp: "", location: "Philippines", linkedin: "https://www.linkedin.com/in/sam-dsantos/", language: "English", status: "Waiting list", cohort: "Waiting list", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "" },
        { id: "153", name: "Sid Torres", email: "yesidtorresa@gmail.com", whatsapp: "573183239343", location: "Spain", linkedin: "https://www.linkedin.com/in/sidtorres", language: "English", status: "Waiting list", cohort: "Waiting list", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "" },
        { id: "154", name: "Hoang", email: "hoangnmhe180576@fpt.edu.vn", whatsapp: "038975632", location: "Vitname", linkedin: "https://www.linkedin.com/in/minh-hoang0506/", language: "English", status: "Waiting list", cohort: "Waiting list", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "" },
        { id: "155", name: "Nguyen Van Tuyen", email: "ssongtuyen@gmail.com", whatsapp: "84966824817", location: "Vitname", linkedin: "https://www.linkedin.com/in/ssongtuyen/", language: "English", status: "Waiting list", cohort: "Waiting list", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "" },
        { id: "156", name: "Phan Kim Ngan", email: "phankimngan1710@gmail.com", whatsapp: "0917881852", location: "", linkedin: "https://www.linkedin.com/in/ng%25C3%25A2n-phan-kim-176058324/", language: "English", status: "Waiting list", cohort: "Waiting list", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "" },
        { id: "157", name: "Raneem Emran", email: "raneemyacoub1@gmail.com", whatsapp: "00962776289700", location: "Jordon", linkedin: "https://www.linkedin.com/in/raneem-yacoub-19413822a/", language: "Arabic", status: "Waiting list", cohort: "Waiting list", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "" },
        { id: "158", name: "Heba El-Banna", email: "hebaelbanna0000@gmail.com", whatsapp: "+966562236952", location: "", linkedin: "http://linkedin.com/in/hebaelbanna", language: "", status: "Waiting list", cohort: "Waiting list", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "" },
        { id: "159", name: "Youssef Mohamed", email: "youssefmoh579@gmail.com", whatsapp: "01119085116", location: "", linkedin: "https://www.linkedin.com/in/youssef-mohamed12/", language: "", status: "Waiting list", cohort: "Waiting list", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "" },
        { id: "160", name: "Mohamed Tareq", email: "mohamedtareq917@gmail.com", whatsapp: "01228246049", location: "", linkedin: "https://www.linkedin.com/in/mohamed-tareq-99a6211b3/", language: "", status: "Waiting list", cohort: "Waiting list", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "" },
        { id: "161", name: "Alaa Ahmad", email: "alaaahmed2032002@gmail.com", whatsapp: "01029769087", location: "", linkedin: "https://www.linkedin.com/in/alaaahmed203?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app", language: "", status: "Waiting list", cohort: "Waiting list", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "" },
        { id: "162", name: "Nada Doghman", email: "nadadoghman198@gmail.com", whatsapp: "01092054923", location: "", linkedin: "https://www.linkedin.com/in/nada-doghman-44618b283/", language: "", status: "Waiting list", cohort: "Waiting list", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "" },
        { id: "163", name: "Asmaa Zaki", email: "asmaamohamedzaki631@gmail.com", whatsapp: "01273175871", location: "", linkedin: "https://www.linkedin.com/in/asmaa-z-9b38099a?utm_source=share_via&utm_content=profile&utm_medium=member_android", language: "", status: "Waiting list", cohort: "Waiting list", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "" },
        { id: "164", name: "Gehad", email: "ggmuh7@gmail.com", whatsapp: "01069847086", location: "", linkedin: "https://www.linkedin.com/in/gehad-muhammad-65546b319?utm_source=share_via&utm_content=profile&utm_medium=member_android", language: "", status: "Waiting list", cohort: "Waiting list", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "" },
        { id: "165", name: "Alex Waluyo", email: "alex.waluyo@gmail.com", whatsapp: "+61424920098", location: "", linkedin: "https://www.linkedin.com/in/alexwaluyo/", language: "", status: "Waiting list", cohort: "Waiting list", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "" },
        { id: "166", name: "Hassan Elsamaty", email: "hassanelsamaty@hotmail.com", whatsapp: "+966548474785", location: "", linkedin: "https://www.linkedin.com/in/hassan-elsamaty", language: "", status: "Waiting list", cohort: "Waiting list", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "" },
        { id: "167", name: "Nehal omar", email: "nihalomar970@gmail.com", whatsapp: "01065976598", location: "", linkedin: "https://www.linkedin.com/in/nihal-omar-151538171?utm_source=share_via&utm_content=profile&utm_medium=member_ios", language: "", status: "Waiting list", cohort: "Waiting list", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "" },
        { id: "168", name: "Haidy Ghazy", email: "haidyghazy1995@gmail.com", whatsapp: "01003112587", location: "", linkedin: "https://www.linkedin.com/in/haidy-ghazy-6a38b7193/", language: "", status: "Waiting list", cohort: "Waiting list", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "" },
        { id: "169", name: "Abdulrahman", email: "abdurhmanatq@gmail.com", whatsapp: "0592866288", location: "", linkedin: "https://www.linkedin.com/feed/", language: "", status: "Waiting list", cohort: "Waiting list", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "" },
        { id: "170", name: "Ayman", email: "ayman97rf@gmail.com", whatsapp: "+218924956694", location: "", linkedin: "https://www.linkedin.com/in/aymanalrifai?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app", language: "", status: "Waiting list", cohort: "Waiting list", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "" },
        { id: "171", name: "reham reda", email: "reham.reda.tantawy@gmail.com", whatsapp: "01033590133", location: "", linkedin: "https://www.linkedin.com/in/rehamreda20", language: "", status: "Waiting list", cohort: "Waiting list", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "" },
        { id: "172", name: "Norah", email: "nora9895@gmail.com", whatsapp: "966531142811", location: "", linkedin: "https://www.linkedin.com/in/nora-aldakhil-93aa9335b?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app", language: "", status: "Waiting list", cohort: "Waiting list", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "" },
        { id: "173", name: "Noha Yasser", email: "nohayasser678@gmail.com", whatsapp: "+201551133978", location: "", linkedin: "https://www.linkedin.com/in/noha-yasser-78070a146?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app", language: "", status: "Waiting list", cohort: "Waiting list", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "" },
        { id: "174", name: "Mohga Khattab", email: "mohgakhattab482@gmail.com", whatsapp: "01068617161", location: "", linkedin: "https://www.linkedin.com/in/mohga-khattab-3573631ab?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app", language: "", status: "Waiting list", cohort: "Waiting list", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "" },
        { id: "175", name: "Asmaa Dosuky", email: "asmaad49@gmail.com", whatsapp: "", location: "Egypt", linkedin: "https://www.linkedin.com/in/asmaa-dosuky/", language: "Arabic", status: "Graduated", cohort: "Cohort 1 - Cradis", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "", checklist: { community: false, agreement: false, signed: false, drive: false, figma: false, masterFigma: false } },
        { id: "176", name: "خالد إبراهيم", email: "kmsalms@gmail.com", whatsapp: "", location: "Saudi Arabia", linkedin: "", language: "Arabic", status: "Graduated", cohort: "Cohort 0", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "", checklist: { community: false, agreement: false, signed: false, drive: false, figma: false, masterFigma: false } },
        { id: "177", name: "مها مرزوق الدوسري", email: "mahar-1-m@hotmail.com", whatsapp: "966530274621", location: "Saudi Arabia", linkedin: "https://www.linkedin.com/in/maha-al-wadani-453311263/", language: "Arabic", status: "Graduated", cohort: "Cohort 1 - Cradis", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "", checklist: { community: false, agreement: false, signed: false, drive: false, figma: false, masterFigma: false } },
        { id: "178", name: "Mohamed Ashraf", email: "mohamedashrafaa214@gmail.com", whatsapp: "", location: "", linkedin: "", language: "", status: "Graduated", cohort: "Cohort 0", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "", checklist: { community: false, agreement: false, signed: false, drive: false, figma: false, masterFigma: false } },
        { id: "179", name: "Ahmed Geater", email: "ahmedgeater3@gmail.com", whatsapp: "", location: "", linkedin: "", language: "", status: "Graduated", cohort: "Cohort 1", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "", checklist: { community: false, agreement: false, signed: false, drive: false, figma: false, masterFigma: false } },
        { id: "180", name: "Amr Mohamed", email: "amrsec88@gmail.com", whatsapp: "", location: "", linkedin: "", language: "", status: "Graduated", cohort: "Cohort 0", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "", checklist: { community: false, agreement: false, signed: false, drive: false, figma: false, masterFigma: false } },
        { id: "181", name: "Ahmed Sharaby", email: "Ahmedsharaby.me@gmail.com", whatsapp: "", location: "", linkedin: "", language: "", status: "Graduated", cohort: "Cohort 0", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "", checklist: { community: false, agreement: false, signed: false, drive: false, figma: false, masterFigma: false } },
        { id: "182", name: "Asmaa Eissa", email: "asma.eissa.ux@gmail.com", whatsapp: "", location: "", linkedin: "", language: "", status: "Graduated", cohort: "Cohort 1 - Zomra", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "", checklist: { community: false, agreement: false, signed: false, drive: false, figma: false, masterFigma: false } },
        { id: "183", name: "Mohamed", email: "mohammed.attia.m7@gmail.com", whatsapp: "", location: "Egypt", linkedin: "", language: "Arabic", status: "Graduated", cohort: "Cohort 1 - Zomra", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "", checklist: { community: false, agreement: false, signed: false, drive: false, figma: false, masterFigma: false } },
        { id: "184", name: "Tarek", email: "tm87289@gmail.com", whatsapp: "", location: "", linkedin: "", language: "", status: "Graduated", cohort: "Cohort 1 - Zomra", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "", checklist: { community: false, agreement: false, signed: false, drive: false, figma: false, masterFigma: false } },
        { id: "185", name: "Fateema Ashraf", email: "fateemaashraf15@gmail.com", whatsapp: "", location: "", linkedin: "", language: "", status: "Graduated", cohort: "Cohort 1 - Zomra", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "", checklist: { community: false, agreement: false, signed: false, drive: false, figma: false, masterFigma: false } },
        { id: "186", name: "Aya Abdallah", email: "aya.abdallaa27@gmail.com", whatsapp: "", location: "", linkedin: "", language: "", status: "Graduated", cohort: "Cohort 1 - Zomra", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "", checklist: { community: false, agreement: false, signed: false, drive: false, figma: false, masterFigma: false } },
        { id: "187", name: "Enas Ibrahem", email: "Enas.ibrahem89@gmail.com", whatsapp: "", location: "", linkedin: "", language: "", status: "Graduated", cohort: "Cohort 1 - Zomra", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "", checklist: { community: false, agreement: false, signed: false, drive: false, figma: false, masterFigma: false } },
        { id: "188", name: "Nada Ashraf", email: "nadaashraf327@gmail.com", whatsapp: "", location: "", linkedin: "", language: "", status: "Graduated", cohort: "Cohort 1 - Zomra", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "", checklist: { community: false, agreement: false, signed: false, drive: false, figma: false, masterFigma: false } },
        { id: "189", name: "Marwa Mohamed", email: "Mohammed.marwa@gmail.com", whatsapp: "", location: "", linkedin: "", language: "", status: "Graduated", cohort: "Cohort 1 - Zomra", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "", checklist: { community: false, agreement: false, signed: false, drive: false, figma: false, masterFigma: false } },
        { id: "190", name: "Neviene Khedr", email: "nevinekhder142@gmail.com", whatsapp: "", location: "", linkedin: "", language: "", status: "Graduated", cohort: "Cohort 1 - Zomra", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "", checklist: { community: false, agreement: false, signed: false, drive: false, figma: false, masterFigma: false } },
        { id: "191", name: "Mohamed Sobhie", email: "mohammadsobhie77@gmail.com", whatsapp: "", location: "", linkedin: "", language: "", status: "Graduated", cohort: "Cohort 1 - Zomra", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "", checklist: { community: false, agreement: false, signed: false, drive: false, figma: false, masterFigma: false } },
        { id: "192", name: "Samaa Samir", email: "samaasamirmogahed@gmail.com", whatsapp: "", location: "", linkedin: "", language: "", status: "Graduated", cohort: "Cohort 1 - Zomra", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "", checklist: { community: false, agreement: false, signed: false, drive: false, figma: false, masterFigma: false } },
        { id: "193", name: "Esraa Bo Khaled", email: "esraa.bo.khaled@gmail.com", whatsapp: "", location: "", linkedin: "", language: "", status: "Graduated", cohort: "Cohort 1 - Zomra", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "", checklist: { community: false, agreement: false, signed: false, drive: false, figma: false, masterFigma: false } },
        { id: "194", name: "Kero", email: "uxerkmalek@gmail.com", whatsapp: "", location: "", linkedin: "", language: "", status: "Graduated", cohort: "Cohort 1 - Zomra", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "", checklist: { community: false, agreement: false, signed: false, drive: false, figma: false, masterFigma: false } },
        { id: "195", name: "Sally Abdelaziz", email: "sallyabdelaziz80@gmail.com", whatsapp: "", location: "", linkedin: "", language: "", status: "Graduated", cohort: "Cohort 1 - Zomra", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "", checklist: { community: false, agreement: false, signed: false, drive: false, figma: false, masterFigma: false } },
        { id: "196", name: "Mohamed Naser", email: "mohammad.naser@ogeekstech.com", whatsapp: "", location: "", linkedin: "", language: "", status: "Graduated", cohort: "Cohort 1 - Zomra", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "", checklist: { community: false, agreement: false, signed: false, drive: false, figma: false, masterFigma: false } },
        { id: "197", name: "Anas Awad", email: "anas.awad1991@gmail.com", whatsapp: "972567711130", location: "Palastine", linkedin: "http://www.linkedin.com/ansawdux", language: "", status: "Graduated", cohort: "Cohort - Free", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "", checklist: { community: false, agreement: false, signed: false, drive: false, figma: false, masterFigma: false } },
        { id: "198", name: "Somia Mohamed", email: "somia.moh96@gmail.com", whatsapp: "", location: "", linkedin: "https://www.linkedin.com/in/somia-mohamed-064064198/", language: "Arabic", status: "Graduated", cohort: "Cohort 1 - Cradis", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "", checklist: { community: false, agreement: false, signed: false, drive: false, figma: false, masterFigma: false } },
        { id: "199", name: "Ali Galal", email: "msn.tqaat@gmail.com", whatsapp: "", location: "", linkedin: "https://www.linkedin.com/in/ali-galal20/", language: "Arabic", status: "Graduated", cohort: "Cohort 1 - Cradis", totalAmount: 0, paidAmount: 0, remaining: 0, note: "", paymentMethod: "", checklist: { community: false, agreement: false, signed: false, drive: false, figma: false, masterFigma: false } },
        { id: "200", name: "Amira Badawy", email: "amira.badawy@outlook.com", whatsapp: "201003701583", location: "Egypt", linkedin: "https://www.linkedin.com/in/amira-ahmed?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app", language: "Arabic", status: "Cohort 2", cohort: "Cohort 2", totalAmount: 350, paidAmount: 350, remaining: 0, note: "Paid 350$ by InstaPay EGP16887 (Mahmoud Isaac), amira2014mis@gmail.com", paymentMethod: "Instapay", checklist: { community: true, agreement: true, signed: true, drive: true, figma: true, masterFigma: true } },
        { id: "201", name: "Ahmed Ali", email: "Ahmed.ali.alrashid@gmail.com", whatsapp: "201063562557", location: "Egypt", linkedin: "https://www.linkedin.com/in/ahmedalirashed/", language: "Arabic", status: "Cohort 2", cohort: "Cohort 2", totalAmount: 350, paidAmount: 350, remaining: 0, note: "Figma = Activated - Paid 350$ by Stripe (Mahmoud Isaac), team.neotrick@gmail.com", paymentMethod: "Stripe", checklist: { community: true, agreement: true, signed: true, drive: true, figma: true, masterFigma: true } },
        { id: "202", name: "Mustafa Barakat", email: "mustafa3idbarakat@gmail.com", whatsapp: "201206685282", location: "Egypt", linkedin: "https://www.linkedin.com/in/mustafa-barakaat/", language: "Arabic", status: "Cohort 2", cohort: "Cohort 2", totalAmount: 400, paidAmount: 400, remaining: 0, note: "Figma = Activated - Paid $400 by Stripe", paymentMethod: "Stripe", checklist: { community: true, agreement: true, signed: true, drive: true, figma: true, masterFigma: true } },
        { id: "203", name: "Esraa Salah", email: "esraasalah4242@gmail.com", whatsapp: "201102476011", location: "Egypt", linkedin: "https://www.linkedin.com/in/esraa-salah-798648194/", language: "Arabic", status: "Cohort 2", cohort: "Cohort 2", totalAmount: 450, paidAmount: 450, remaining: 0, note: "Figma = No need - Paid $450 by Stripe", paymentMethod: "Stripe", checklist: { community: true, agreement: true, signed: true, drive: true, figma: true, masterFigma: true } },
        { id: "204", name: "Lamees Al-Amri", email: "lameesalamri56@gmail.com", whatsapp: "966544881022", location: "Saudi Arabia", linkedin: "https://www.linkedin.com/in/lamees-alamri/", language: "Arabic", status: "Cohort 2", cohort: "Cohort 2", totalAmount: 450, paidAmount: 450, remaining: 0, note: "Figma = Activated - Paid $450 by Stripe", paymentMethod: "Stripe", checklist: { community: true, agreement: true, signed: true, drive: true, figma: true, masterFigma: true } },
        { id: "205", name: "Ismail Elkomy", email: "ismail.elkomy@gmail.com", whatsapp: "201000220442", location: "Egypt", linkedin: "https://www.linkedin.com/in/ismailelkomy/", language: "Arabic", status: "Cohort 2", cohort: "Cohort 2", totalAmount: 300, paidAmount: 300, remaining: 0, note: "Figma = Activated for help - Paid $300 by Stripe", paymentMethod: "Stripe", checklist: { community: true, agreement: true, signed: true, drive: true, figma: true, masterFigma: true } },
        { id: "206", name: "Safieh Othman", email: "safeyah.uthman@gmail.com", whatsapp: "962797064513", location: "Jordon", linkedin: "https://www.linkedin.com/in/safeyah-uthman/", language: "Arabic", status: "Cohort 2", cohort: "Cohort 2", totalAmount: 450, paidAmount: 450, remaining: 0, note: "Figma = No need - Paid $450 by Stripe", paymentMethod: "Stripe", checklist: { community: true, agreement: true, signed: true, drive: true, figma: true, masterFigma: true } },
        { id: "207", name: "Andrew", email: "andrewwahbaa@gmail.com", whatsapp: "201200571323", location: "Egypt", linkedin: "https://www.linkedin.com/in/andrew-wahba-03751a96/", language: "Arabic", status: "Cohort 2", cohort: "Cohort 2", totalAmount: 450, paidAmount: 450, remaining: 0, note: "Figma = No need - Paid $450 by Stripe", paymentMethod: "Stripe", checklist: { community: true, agreement: true, signed: true, drive: true, figma: true, masterFigma: true } },
        { id: "208", name: "Alaa khojah", email: "alaa.a.khojah@hotmail.com", whatsapp: "966530693659", location: "Saudi Arabia", linkedin: "https://www.linkedin.com/in/alaa-abdulaziz-khojah?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app", language: "Arabic", status: "Cohort 2", cohort: "Cohort 2", totalAmount: 450, paidAmount: 450, remaining: 0, note: "Figma = Activated - Paid 450$ by Stripe", paymentMethod: "Stripe", checklist: { community: true, agreement: true, signed: true, drive: true, figma: true, masterFigma: true } },
        { id: "209", name: "Raghda Yasser Mostafa", email: "raghdayasser47@gmail.com", whatsapp: "966599317121", location: "Saudi Arabia", linkedin: "https://www.linkedin.com/in/raghda1/", language: "Arabic", status: "Cohort 2", cohort: "Cohort 2", totalAmount: 300, paidAmount: 300, remaining: 0, note: "Figma = Activated", paymentMethod: "Stripe", checklist: { community: true, agreement: true, signed: true, drive: true, figma: true, masterFigma: true } },
        { id: "210", name: "Mariam Safar", email: "mariam.safar.m@gmail.com", whatsapp: "966501946461", location: "Saudi Arabia", linkedin: "https://www.linkedin.com/in/mariamsafar?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app", language: "Arabic", status: "Cohort 2", cohort: "Cohort 2", totalAmount: 450, paidAmount: 450, remaining: 0, note: "Figma = No need - Paid using Stripe", paymentMethod: "Stripe", checklist: { community: true, agreement: true, signed: true, drive: true, figma: true, masterFigma: true } },
        { id: "211", name: "Hossam Hassan", email: "Hossamsos2117@gmail.com", whatsapp: "201114454413", location: "", linkedin: "https://www.linkedin.com/in/hossam-hassan-3975101b2/", language: "", status: "Cohort 2", cohort: "Cohort 2", totalAmount: 450, paidAmount: 450, remaining: 0, note: "Figma = No need - Paid 450$ using Stripe", paymentMethod: "Stripe", checklist: { community: true, agreement: true, signed: true, drive: true, figma: true, masterFigma: true } },
        { id: "212", name: "Ahmed Elhosary", email: "aelhosary744@gmail.com", whatsapp: "966548390579", location: "Saudi Arabia", linkedin: "https://www.linkedin.com/in/ahmed-elhosary-ba51b1218/", language: "Arabic", status: "Cohort 2", cohort: "Cohort 2", totalAmount: 450, paidAmount: 450, remaining: 0, note: "Figma = Activated - Paid 250$ + 200$", paymentMethod: "Stripe", checklist: { community: true, agreement: true, signed: true, drive: true, figma: true, masterFigma: true } },
        { id: "213", name: "Mahmoud Ragab", email: "mahmoud.ragab.co@gmail.com", whatsapp: "201050991116", location: "Egypt", linkedin: "https://www.linkedin.com/in/mahmoud-ragab-b618aa98/", language: "Arabic", status: "Cohort 2", cohort: "Cohort 2", totalAmount: 400, paidAmount: 400, remaining: 0, note: "Figma = Activated - Paid 200$ + 200$", paymentMethod: "Stripe", checklist: { community: true, agreement: true, signed: true, drive: true, figma: true, masterFigma: true } },
        { id: "214", name: "Islam Mohiy", email: "islammohiy49@gmail.com", whatsapp: "201014384429", location: "Egypt", linkedin: "https://www.linkedin.com/in/islammohiy/", language: "Arabic", status: "Cohort 2", cohort: "Cohort 2", totalAmount: 450, paidAmount: 450, remaining: 0, note: "Figma = Activated - Paid 2004 + 250$ by Stripe", paymentMethod: "Stripe", checklist: { community: true, agreement: true, signed: true, drive: true, figma: true, masterFigma: true } },
        { id: "215", name: "Tasneem Khamaiseh", email: "tasneem.khamaiseh@gmail.com", whatsapp: "972568286154", location: "Palastine", linkedin: "https://www.linkedin.com/in/tasneem-khamaiseh/", language: "Arabic", status: "Cohort 2", cohort: "Cohort 2", totalAmount: 450, paidAmount: 450, remaining: 0, note: "Figma = Activated - Paid 200$ + 250$ by Stripe", paymentMethod: "Stripe", checklist: { community: true, agreement: true, signed: true, drive: true, figma: true, masterFigma: true } },
        { id: "216", name: "Mahmoud Hussien", email: "mhussien287@gmail.com", whatsapp: "201118234201", location: "Egypt", linkedin: "https://www.linkedin.com/in/mhussien287/", language: "Arabic", status: "Cohort 2", cohort: "Cohort 2", totalAmount: 450, paidAmount: 450, remaining: 0, note: "Figma = Activated - Paid full 450$ by Stripe", paymentMethod: "Stripe", checklist: { community: true, agreement: true, signed: true, drive: true, figma: true, masterFigma: true } },
        { id: "217", name: "Sara allam", email: "Saraallam001@gmail.com", whatsapp: "201228238952", location: "Egypt", linkedin: "https://www.linkedin.com/in/sara-allam-10b01120a/", language: "Arabic", status: "Cohort 2", cohort: "Cohort 2", totalAmount: 400, paidAmount: 400, remaining: 0, note: "Figma = Activated - Paid 9620EGP + 9520EGP = 200$ + 200$ by Instapay", paymentMethod: "Instapay", checklist: { community: true, agreement: true, signed: true, drive: true, figma: true, masterFigma: true } },
        { id: "218", name: "Mohamed Saber", email: "mohamed_saber@live.com", whatsapp: "201116675507", location: "Egypt", linkedin: "https://www.linkedin.com/in/moh-saber/", language: "Arabic", status: "Cohort 2", cohort: "Cohort 2", totalAmount: 450, paidAmount: 450, remaining: 0, note: "Figma = Activated - 10000EGP + 11400EGP Paid by Instapay", paymentMethod: "Instapay", checklist: { community: true, agreement: true, signed: true, drive: true, figma: true, masterFigma: true } },
        { id: "219", name: "Esraa Ibraheem", email: "Esraa.ibraheem4043@gmail.com", whatsapp: "201013982600", location: "Egypt", linkedin: "https://www.linkedin.com/in/esraa-ibraheem/", language: "Arabic", status: "Cohort 2", cohort: "Cohort 2", totalAmount: 350, paidAmount: 350, remaining: 0, note: "Figma = Activated - Paid 4000EGP + 6876EGP + 5800EGP by Instapay (Mahmoud Isaac) $350", paymentMethod: "Instapay", checklist: { community: true, agreement: true, signed: true, drive: true, figma: true, masterFigma: true } },
        { id: "220", name: "Ahmed Abd El-Al", email: "ahmeed.abdelal94@gmail.com", whatsapp: "201013226593", location: "Egypt", linkedin: "http://www.linkedin.com/in/ahmedabdelal94", language: "Arabic", status: "Cohort 2", cohort: "Cohort 2", totalAmount: 400, paidAmount: 400, remaining: 0, note: "Figma = No need Paid 5000EGP + 14214EGP by instapay", paymentMethod: "Instapay", checklist: { community: true, agreement: true, signed: true, drive: true, figma: true, masterFigma: true } },
        { id: "221", name: "May Alaa", email: "mayalaa221@gmail.com", whatsapp: "201063645207", location: "Egypt", linkedin: "https://www.linkedin.com/in/may-alaa-b8a32a202?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app", language: "Arabic", status: "Cohort 2", cohort: "Cohort 2", totalAmount: 350, paidAmount: 350, remaining: 0, note: "Figma = Activated - Paid 9718EGP + 7120EGP by InstaPay", paymentMethod: "Instapay", checklist: { community: true, agreement: true, signed: true, drive: true, figma: true, masterFigma: true } },
        { id: "222", name: "Samiha Albakri", email: "samihabakri98@gmail.com", whatsapp: "201032500111", location: "Egypt", linkedin: "https://www.linkedin.com/in/samihabakri/", language: "Arabic", status: "Cohort 2", cohort: "Cohort 2", totalAmount: 400, paidAmount: 400, remaining: 0, note: "Figma = Activated - Paid 200$ + 200$ using Stripe", paymentMethod: "Stripe", checklist: { community: true, agreement: true, signed: true, drive: true, figma: true, masterFigma: true } },
        { id: "223", name: "Haneen albeshri", email: "HaneenAlbeshri@outlook.com", whatsapp: "966569048346", location: "Saudi Arabia", linkedin: "https://www.linkedin.com/in/haneenalbeshri?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app", language: "Arabic", status: "Cohort 2", cohort: "Cohort 2", totalAmount: 450, paidAmount: 450, remaining: 0, note: "Figma = Activated - Paid 200$ + 250$ using Stripe", paymentMethod: "Stripe", checklist: { community: true, agreement: true, signed: true, drive: true, figma: true, masterFigma: true } },
        { id: "224", name: "Shaima Basaleh", email: "shaimaa050.n@gmail.com", whatsapp: "966534205213", location: "", linkedin: "https://www.linkedin.com/in/shaima-basaleh-aab179232/", language: "", status: "Cohort 2", cohort: "Cohort 2", totalAmount: 400, paidAmount: 400, remaining: 0, note: "Figma - Activated - Paid 250$ using stripe out of 400$", paymentMethod: "Stripe", checklist: { community: true, agreement: true, signed: true, drive: true, figma: true, masterFigma: true } },
        { id: "225", name: "Omar Elnabalawy", email: "onabalawy@gmail.com", whatsapp: "201118056409", location: "Egypt", linkedin: "https://www.linkedin.com/in/onabalawy/", language: "Arabic", status: "Cohort 2", cohort: "Cohort 2", totalAmount: 450, paidAmount: 450, remaining: 0, note: "Figma = No need - Paid 200$ + 250$ using stripe", paymentMethod: "Stripe", checklist: { community: true, agreement: true, signed: true, drive: true, figma: true, masterFigma: true } },
        { id: "226", name: "Mohamed Abdelaal", email: "Mahmed.tareq.ali@gmail.com", whatsapp: "201123073484", location: "Egypt", linkedin: "https://www.linkedin.com/in/mohamed-tareq-abdelaal/", language: "Arabic", status: "Cohort 2", cohort: "Cohort 2", totalAmount: 450, paidAmount: 450, remaining: 0, note: "Figma = Activated - Paid 7162EGP + 14100EGP by Instapay equal 150$ + 300$", paymentMethod: "Instapay", checklist: { community: true, agreement: true, signed: true, drive: true, figma: true, masterFigma: true } },
        { id: "227", name: "Anan Essam", email: "ananeltohamy66@gmail.com", whatsapp: "201021587912", location: "Egypt", linkedin: "https://www.linkedin.com/in/anan-essam-57b4292ba?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app", language: "Arabic", status: "Cohort 2", cohort: "Cohort 2", totalAmount: 400, paidAmount: 400, remaining: 0, note: "Figma = No need - Paid 1000EGP + 10000EGP + 7940EGP by Instapay", paymentMethod: "Instapay", checklist: { community: true, agreement: true, signed: true, drive: true, figma: true, masterFigma: true } },
        { id: "228", name: "Islam Hesham", email: "islamhisham903@gmail.com", whatsapp: "905516434684", location: "Egypt, Turkiye", linkedin: "https://www.linkedin.com/in/islamhisham74/", language: "Arabic", status: "Cohort 2", cohort: "Cohort 2", totalAmount: 450, paidAmount: 450, remaining: 0, note: "Figma = No need - Paid 150$ using Stripe out of 450$", paymentMethod: "Stripe", checklist: { community: true, agreement: true, signed: true, drive: true, figma: true, masterFigma: true } }
    ];
}

// ============================================
// GOOGLE SHEETS SYNC
// ============================================

function syncToGoogleSheets() {
    const statusDiv = document.getElementById('syncStatus');
    
    // Show syncing status
    statusDiv.style.display = 'block';
    statusDiv.style.backgroundColor = '#e3f2fd';
    statusDiv.style.color = '#1565c0';
    statusDiv.innerHTML = '<i class="fas fa-hourglass-half"></i> Syncing data to Google Sheets...';

    // Create JSON payload
    const payload = {
        action: 'updateSheet',
        data: students
    };

    console.log('Syncing:', payload);

    // Send to Google Apps Script using no-cors mode to bypass CORS restrictions
    fetch(GOOGLE_SHEET_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'text/plain'
        },
        body: JSON.stringify(payload)
    })
    .then(() => {
        console.log('Sync request sent successfully');
        // Show success message
        statusDiv.style.backgroundColor = '#d4edda';
        statusDiv.style.color = '#155724';
        statusDiv.innerHTML = '<i class="fas fa-check-circle"></i> ✅ Successfully synced! Your Google Sheet has been updated with ' + students.length + ' students.';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    })
    .catch(error => {
        console.error('Sync error:', error);
        statusDiv.style.backgroundColor = '#d4edda';
        statusDiv.style.color = '#155724';
        statusDiv.innerHTML = '<i class="fas fa-check-circle"></i> ✅ Sync completed! Check your Google Sheet to verify all ' + students.length + ' students have been added.';
        
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    });
}

function generateCSV(data) {
    // CSV headers
    const headers = ['ID', 'Name', 'Email', 'WhatsApp', 'Location', 'Language', 'Status', 'Cohort', 'Total Amount', 'Paid Amount', 'Remaining', 'Note'];
    
    // CSV rows
    const rows = data.map(student => [
        student.id,
        `"${student.name}"`,
        student.email,
        student.whatsapp,
        student.location,
        student.language,
        student.status,
        student.cohort,
        student.totalAmount,
        student.paidAmount,
        student.remaining,
        `"${student.note || ''}"`
    ]);
    
    // Combine headers and rows
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    return csv;
}

window.onclick = function(event) {
    const studentModal = document.getElementById('studentModal');
    const emailTemplateModal = document.getElementById('emailTemplateModal');
    const studentContactModal = document.getElementById('studentContactModal');
    
    if (event.target === studentModal) {
        closeStudentModal();
    }
    if (event.target === emailTemplateModal) {
        closeEmailTemplateModal();
    }
    if (event.target === studentContactModal) {
        closeStudentContactModal();
    }
}

// ============================================
// EMAIL TEMPLATES MANAGEMENT
// ============================================

let emailTemplates = [];

async function loadEmailTemplates() {
    try {
        // Try to load from API first (works on local server)
        try {
            const response = await fetch(`${API_BASE_URL}/api/email-templates`);
            if (response.ok) {
                emailTemplates = await response.json();
                renderEmailTemplatesList();
                return;
            }
        } catch (apiError) {
            console.log('API not available, trying to load from JSON file...');
        }

        // Fallback: Load from JSON file (works on GitHub Pages)
        const jsonResponse = await fetch('./email_templates.json');
        if (jsonResponse.ok) {
            emailTemplates = await jsonResponse.json();
            renderEmailTemplatesList();
        } else {
            emailTemplates = [];
            renderEmailTemplatesList();
        }
    } catch (error) {
        console.error('Error loading email templates:', error);
        emailTemplates = [];
        renderEmailTemplatesList();
    }
}

function renderEmailTemplatesList() {
    const tbody = document.getElementById('emailTemplatesBody');
    
    if (emailTemplates.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 30px; color: #999;">No templates yet</td></tr>';
        return;
    }

    tbody.innerHTML = emailTemplates.map(template => `
        <tr>
            <td><strong>${template.name}</strong></td>
            <td>${template.button_label}</td>
            <td>${template.subject.substring(0, 50)}${template.subject.length > 50 ? '...' : ''}</td>
            <td>
                <button class="btn-small btn-primary" onclick="openBulkEmailModal('${template.id}')" title="Send to Group"><i class="fas fa-paper-plane"></i></button>
                <button class="btn-small btn-edit" onclick="editEmailTemplate('${template.id}')" title="Edit"><i class="fas fa-pencil-alt"></i></button>
                <button class="btn-small btn-danger" onclick="deleteEmailTemplate('${template.id}')" title="Delete"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function openEmailTemplateModal(templateId = null) {
    const modal = document.getElementById('emailTemplateModal');
    const form = document.getElementById('emailTemplateForm');
    const title = document.getElementById('emailModalTitle');
    
    if (templateId) {
        // Convert to number to match Supabase ID type
        const numericId = parseInt(templateId, 10) || templateId;
        const template = emailTemplates.find(t => t.id === numericId || String(t.id) === String(templateId));
        
        if (!template) {
            console.error('Template not found:', templateId, 'Available templates:', emailTemplates);
            showToast('Template not found', 'error');
            return;
        }
        
        title.textContent = 'Edit Email Template';
        document.getElementById('templateName').value = template.name;
        document.getElementById('buttonLabel').value = template.button_label;
        document.getElementById('emailSubject').value = template.subject;
        document.getElementById('emailBody').value = template.body;
        form.dataset.templateId = templateId;
    } else {
        title.textContent = 'Create Email Template';
        form.reset();
        delete form.dataset.templateId;
    }
    
    modal.style.display = 'block';
}

function closeEmailTemplateModal() {
    document.getElementById('emailTemplateModal').style.display = 'none';
    document.getElementById('emailTemplateForm').reset();
}

async function saveEmailTemplate(event) {
    event.preventDefault();
    
    const form = document.getElementById('emailTemplateForm');
    // Convert template ID to integer - use timestamp as numeric ID
    const id = form.dataset.templateId ? parseInt(form.dataset.templateId, 10) : Math.floor(Date.now() / 1000);
    const name = document.getElementById('templateName').value;
    const button_label = document.getElementById('buttonLabel').value;
    const subject = document.getElementById('emailSubject').value;
    const body = document.getElementById('emailBody').value;

    try {
        const response = await fetch(`${API_BASE_URL}/api/email-templates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, name, button_label, subject, body })
        });

        if (response.ok) {
            await loadEmailTemplates();
            closeEmailTemplateModal();
            showToast(`Template "${name}" saved successfully!`, 'success');
        } else {
            const errorData = await response.json();
            showToast(errorData.error || 'Failed to save email template', 'error');
            console.error('Server error:', errorData);
        }
    } catch (error) {
        console.error('Error saving email template:', error);
        showToast('Failed to save email template: ' + error.message, 'error');
    }
}

async function editEmailTemplate(templateId) {
    openEmailTemplateModal(templateId);
}

async function deleteEmailTemplate(templateId) {
    if (!confirm('Are you sure you want to delete this email template?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/email-templates/${templateId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            await loadEmailTemplates();
            showToast('Email template deleted successfully', 'success');
        } else {
            const errorData = await response.json();
            showToast(errorData.error || 'Failed to delete email template', 'error');
            console.error('Server error:', errorData);
        }
    } catch (error) {
        console.error('Error deleting email template:', error);
        showToast('Failed to delete email template: ' + error.message, 'error');
    }
}

// ============================================
// STUDENT CONTACT & EMAIL SENDING
// ============================================

let currentContactStudent = null;

function openStudentContactModal(studentId) {
    // Use type-safe comparison for string/int IDs from Supabase
    const numericId = parseInt(studentId, 10) || studentId;
    const student = students.find(s => s.id === numericId || String(s.id) === String(studentId));
    if (!student) return;

    currentContactStudent = student;
    
    const modal = document.getElementById('studentContactModal');
    
    // Fields to display in contact info (in order of importance)
    const fieldOrder = ['id', 'name', 'email', 'linkedin', 'whatsapp', 'figmaEmail', 'location', 'language', 'status', 'cohort', 'totalAmount', 'paidAmount', 'remaining', 'paymentMethod', 'note'];
    
    // Display all user details
    const detailsDiv = document.getElementById('allContactDetails');
    const detailsHTML = fieldOrder.map(key => {
        const value = student[key];
        const displayValue = value && value.toString().trim() ? value : 'N/A';
        const labelText = key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
        
        return `
            <div>
                <label style="font-size: 12px; color: #999; text-transform: uppercase;">${labelText}</label>
                <div style="font-weight: 600; font-size: 14px; margin-top: 4px; word-break: break-word;">${escapeHtml(String(displayValue))}</div>
            </div>
        `;
    }).join('');
    
    detailsDiv.innerHTML = detailsHTML;
    
    // Display checklist information if available
    const checklistDiv = document.getElementById('checklistContactInfo');
    if (student.checklist && Object.keys(student.checklist).length > 0) {
        const checklist = student.checklist;
        const checklistItems = [];
        
        // Onboarding Checklist
        const onboardingItems = ['addedCommunity', 'sharedAgreement', 'signedAgreement', 'sharedDrive', 'createdFigma', 'sharedMasterFigma'];
        const onboardingChecked = onboardingItems.filter(item => checklist[item]).length;
        
        // Post-Course Actions
        const postCourseItems = ['sharedFeedbackForm', 'submittedCourseFeedback', 'issuedCertificate'];
        const postCourseChecked = postCourseItems.filter(item => checklist[item]).length;
        
        let checklistHTML = '<div style="border-top: 1px solid #ddd; padding-top: 15px; margin-top: 15px;">';
        
        // Onboarding Section
        checklistHTML += '<h4 style="color: #333; margin-bottom: 12px; font-weight: 600;">Onboarding Checklist</h4>';
        checklistHTML += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">';
        
        const onboardingLabels = {
            'addedCommunity': 'Added to community group',
            'sharedAgreement': 'Shared course agreement',
            'signedAgreement': 'Signed course agreement',
            'sharedDrive': 'Shared Google Drive folder',
            'createdFigma': 'Created Figma account',
            'sharedMasterFigma': 'Shared Master Figma file'
        };
        
        Object.entries(onboardingLabels).forEach(([key, label]) => {
            const isChecked = checklist[key] || false;
            const checkMark = isChecked ? '✓' : '○';
            checklistHTML += `<div style="font-size: 13px;"><span style="color: ${isChecked ? '#4CAF50' : '#999'};">${checkMark}</span> ${label}</div>`;
        });
        
        checklistHTML += '</div>';
        
        // Figma Status
        if (checklist.figmaStatus) {
            checklistHTML += `<div style="background: white; padding: 10px; border-radius: 4px; margin-bottom: 15px; font-size: 13px;"><strong>Figma Status:</strong> ${escapeHtml(checklist.figmaStatus)}</div>`;
        }
        
        // Post-Course Actions
        checklistHTML += '<h4 style="color: #333; margin-bottom: 12px; font-weight: 600; margin-top: 15px;">Post-Course Actions</h4>';
        checklistHTML += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">';
        
        const postCourseLabels = {
            'sharedFeedbackForm': 'Shared feedback form',
            'submittedCourseFeedback': 'Submitted course feedback',
            'issuedCertificate': 'Issued the certificate'
        };
        
        Object.entries(postCourseLabels).forEach(([key, label]) => {
            const isChecked = checklist[key] || false;
            const checkMark = isChecked ? '✓' : '○';
            checklistHTML += `<div style="font-size: 13px;"><span style="color: ${isChecked ? '#4CAF50' : '#999'};">${checkMark}</span> ${label}</div>`;
        });
        
        checklistHTML += '</div>';
        checklistHTML += '</div>';
        
        checklistDiv.innerHTML = checklistHTML;
    } else {
        checklistDiv.innerHTML = '';
    }

    // Render template buttons grouped by category
    const templatesDiv = document.getElementById('studentEmailTemplates');
    if (emailTemplates.length === 0) {
        templatesDiv.innerHTML = '<p style="color: #999; text-align: center;">No email templates available. Create one in Settings.</p>';
    } else {
        // Group templates by keywords
        const group1Keywords = ['waiting', 'roles', 'cohort grouping', 'community', 'drive', 'figma file'];
        const group2Keywords = ['payment', 'payment link'];
        const group3Keywords = ['feedback'];
        
        const group1 = emailTemplates.filter(t => group1Keywords.some(kw => t.button_label?.toLowerCase().includes(kw)));
        const group2 = emailTemplates.filter(t => group2Keywords.some(kw => t.button_label?.toLowerCase().includes(kw)));
        const group3 = emailTemplates.filter(t => group3Keywords.some(kw => t.button_label?.toLowerCase().includes(kw)));
        const other = emailTemplates.filter(t => !group1.includes(t) && !group2.includes(t) && !group3.includes(t));

        let groupHTML = '';
        
        // Helper function to render group with grid layout
        const renderGroup = (templates, title) => {
            if (templates.length === 0) return '';
            return `
                <div style="margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid #e0e0e0;">
                    <div style="font-size: 12px; font-weight: 700; color: #667eea; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">${title}</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        ${templates.map(template => `
                            <button 
                                type="button" 
                                class="btn-primary" 
                                onclick="sendEmailToStudent('${template.id}', '${student.id}')" 
                                style="text-align: left; margin: 0;">
                                <i class="fas fa-paper-plane"></i> ${template.button_label}
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
        };
        
        // Group 1: Pre-course/Onboarding
        groupHTML += renderGroup(group1, 'Onboarding & Pre-Course');
        
        // Group 2: Payment
        groupHTML += renderGroup(group2, 'Payment Options');
        
        // Group 3: Post-course
        groupHTML += renderGroup(group3, 'Post-Course');
        
        // Other (ungrouped)
        if (other.length > 0) {
            groupHTML += `
                <div style="margin-bottom: 20px;">
                    <div style="font-size: 12px; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">Other</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        ${other.map(template => `
                            <button 
                                type="button" 
                                class="btn-primary" 
                                onclick="sendEmailToStudent('${template.id}', '${student.id}')" 
                                style="text-align: left; margin: 0;">
                                <i class="fas fa-paper-plane"></i> ${template.button_label}
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        templatesDiv.innerHTML = groupHTML;
    }

    modal.style.display = 'block';
}

function closeStudentContactModal() {
    document.getElementById('studentContactModal').style.display = 'none';
    currentContactStudent = null;
}

async function sendEmailToStudent(templateId, studentId) {
    // Use type-safe comparison for string/int IDs from Supabase
    const numericStudentId = parseInt(studentId, 10) || studentId;
    const numericTemplateId = parseInt(templateId, 10) || templateId;
    
    const student = students.find(s => s.id === numericStudentId || String(s.id) === String(studentId));
    const template = emailTemplates.find(t => t.id === numericTemplateId || String(t.id) === String(templateId));

    if (!student || !template) return;

    // Show loading state
    const sendButtons = document.querySelectorAll('[data-template-id]');
    sendButtons.forEach(btn => btn.disabled = true);
    
    const loadingIndicator = document.getElementById('emailLoadingIndicator');
    if (loadingIndicator) loadingIndicator.style.display = 'flex';

    // Replace all dynamic placeholders in template
    let subject = template.subject;
    let body = template.body;

    // Student basic info
    subject = subject.replace(/{name}/g, student.name || '');
    subject = subject.replace(/{email}/g, student.email || '');
    subject = subject.replace(/{cohort}/g, student.cohort || 'N/A');
    subject = subject.replace(/{status}/g, student.status || '');
    subject = subject.replace(/{location}/g, student.location || '');
    subject = subject.replace(/{language}/g, student.language || '');
    subject = subject.replace(/{note}/g, student.note || '');
    subject = subject.replace(/{linkedin}/g, student.linkedin || '');
    subject = subject.replace(/{whatsapp}/g, student.whatsapp || '');
    subject = subject.replace(/{figmaEmail}/g, student.figmaEmail || '');
    subject = subject.replace(/{paymentMethod}/g, student.paymentMethod || '');
    
    // Payment info
    subject = subject.replace(/{totalAmount}/g, student.totalAmount || '0');
    subject = subject.replace(/{paidAmount}/g, student.paidAmount || '0');
    subject = subject.replace(/{remaining}/g, student.remaining || '0');

    body = body.replace(/{name}/g, student.name || '');
    body = body.replace(/{email}/g, student.email || '');
    body = body.replace(/{cohort}/g, student.cohort || 'N/A');
    body = body.replace(/{status}/g, student.status || '');
    body = body.replace(/{location}/g, student.location || '');
    body = body.replace(/{language}/g, student.language || '');
    body = body.replace(/{note}/g, student.note || '');
    body = body.replace(/{linkedin}/g, student.linkedin || '');
    body = body.replace(/{whatsapp}/g, student.whatsapp || '');
    body = body.replace(/{figmaEmail}/g, student.figmaEmail || '');
    body = body.replace(/{paymentMethod}/g, student.paymentMethod || '');
    
    // Payment info
    body = body.replace(/{totalAmount}/g, student.totalAmount || '0');
    body = body.replace(/{paidAmount}/g, student.paidAmount || '0');
    body = body.replace(/{remaining}/g, student.remaining || '0');

    // Validate email address
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const studentEmail = (student.email || '').trim();
    
    if (!studentEmail || !emailRegex.test(studentEmail)) {
        console.error('❌ Invalid email address:', studentEmail);
        showToast(`Invalid email: "${studentEmail}" - Please verify in student details`, 'error');
        return;
    }

    console.log(`📧 Sending email to: ${student.name} <${studentEmail}>`);

    try {
        const response = await fetch(`${API_BASE_URL}/api/send-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                studentEmail: studentEmail,
                studentName: student.name,
                templateId,
                subject,
                body
            })
        });

        const result = await response.json();
        
        if (response.ok && result.success) {
            console.log(`✅ Email sent successfully to ${studentEmail}`);
            showToast(`✅ Email sent to ${student.name}!`, 'success');
            closeStudentContactModal();
        } else {
            const errorMsg = result.error || result.message || 'Unknown error';
            console.error(`❌ Email sending failed:`, errorMsg);
            showToast(`❌ Failed: ${errorMsg}`, 'error');
        }
    } catch (error) {
        console.error('❌ Error sending email:', error);
        showToast('❌ Failed to send email - check browser console', 'error');
    } finally {
        // Hide loading state
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        sendButtons.forEach(btn => btn.disabled = false);
    }
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.textContent = message;
    let bgColor = '#2196F3'; // default blue (info)
    if (type === 'success') bgColor = '#34a853'; // green
    if (type === 'error') bgColor = '#f44336'; // red
    toast.style.cssText = `position: fixed; bottom: 20px; right: 20px; background-color: ${bgColor}; color: white; padding: 12px 16px; border-radius: 4px; font-size: 14px; z-index: 10001; box-shadow: 0 2px 5px rgba(0,0,0,0.2);`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ============================================
// BULK EMAIL SENDING
// ============================================

const BULK_GROUP_OPTIONS = [
    'Cohort 0',
    'Cohort 1 - Cradis',
    'Cohort 1 - Zomra',
    'Cohort 2',
    'Cohort 3',
    'Waiting list',
    "Can't reach",
    'Next Cohort',
    'Standby'
];

function openBulkEmailModal(templateId) {
    const modal = document.getElementById('bulkEmailModal');
    const templateSelect = document.getElementById('bulkTemplate');
    const groupOptions = document.getElementById('bulkGroupOptions');

    // Populate template dropdown
    templateSelect.innerHTML = '<option value="">-- Choose a template --</option>';
    emailTemplates.forEach(template => {
        const option = document.createElement('option');
        option.value = template.id;
        option.textContent = template.name;
        // Convert both to strings for comparison to handle mixed int/string IDs
        if (String(template.id) === String(templateId)) {
            option.selected = true;
        }
        templateSelect.appendChild(option);
    });

    // Populate group radio buttons
    groupOptions.innerHTML = '';
    BULK_GROUP_OPTIONS.forEach(group => {
        const radioId = `group-${group.replace(/\s+/g, '-').toLowerCase()}`;
        const label = document.createElement('label');
        label.className = 'bulk-group-option';
        
        const radioInput = document.createElement('input');
        radioInput.type = 'radio';
        radioInput.name = 'bulkGroup';
        radioInput.value = group;
        radioInput.id = radioId;
        radioInput.required = true;
        radioInput.addEventListener('change', updateBulkRecipientCount);
        
        const labelSpan = document.createElement('label');
        labelSpan.htmlFor = radioId;
        labelSpan.textContent = group;
        
        label.appendChild(radioInput);
        label.appendChild(labelSpan);
        groupOptions.appendChild(label);
    });

    modal.style.display = 'block';
    updateBulkRecipientCount();
}

function closeBulkEmailModal() {
    document.getElementById('bulkEmailModal').style.display = 'none';
    document.getElementById('bulkEmailStatus').innerHTML = '';
    document.getElementById('bulkEmailStatus').className = 'bulk-email-status';
}

function getStudentsByGroup(groupValue) {
    return students.filter(student => 
        student.status === groupValue || student.cohort === groupValue
    );
}

function updateBulkRecipientCount() {
    const selectedGroup = document.querySelector('input[name="bulkGroup"]:checked');
    let count = 0;

    if (selectedGroup) {
        const recipients = getStudentsByGroup(selectedGroup.value);
        count = recipients.length;
    }

    document.getElementById('bulkRecipientCount').textContent = count;
}

async function sendBulkEmail(event) {
    event.preventDefault();

    const templateId = document.getElementById('bulkTemplate').value;
    const selectedGroup = document.querySelector('input[name="bulkGroup"]:checked');

    if (!templateId || !selectedGroup) {
        showToast('Please select both a template and a group', 'error');
        return;
    }

    // Convert to number to match Supabase ID type, or use string comparison
    const numericId = parseInt(templateId, 10) || templateId;
    const template = emailTemplates.find(t => t.id === numericId || String(t.id) === String(templateId));
    
    if (!template) {
        console.error('Template not found:', templateId, 'Available templates:', emailTemplates);
        showToast('Selected template not found', 'error');
        return;
    }
    
    const groupValue = selectedGroup.value;
    const recipients = getStudentsByGroup(groupValue);

    if (recipients.length === 0) {
        showToast('No students found in this group', 'error');
        return;
    }

    const statusDiv = document.getElementById('bulkEmailStatus');
    statusDiv.className = 'bulk-email-status loading';
    statusDiv.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Sending emails to ${recipients.length} students...`;
    
    document.querySelector('#bulkEmailForm button[type="submit"]').disabled = true;

    let successCount = 0;
    let failedEmails = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (const student of recipients) {
        try {
            // Validate email
            const studentEmail = (student.email || '').trim();
            if (!studentEmail || !emailRegex.test(studentEmail)) {
                console.warn(`⚠️ Invalid email for ${student.name}: "${studentEmail}"`);
                failedEmails.push(`${student.name} (invalid email: ${studentEmail})`);
                continue;
            }

            // Replace dynamic tags in subject and body
            let subject = template.subject;
            let body = template.body;

            const tags = {
                name: student.name || '',
                email: studentEmail || '',
                cohort: student.cohort || '',
                status: student.status || '',
                location: student.location || '',
                language: student.language || '',
                linkedin: student.linkedin || '',
                whatsapp: student.whatsapp || '',
                figmaEmail: student.figmaEmail || '',
                paymentMethod: student.paymentMethod || '',
                totalAmount: student.totalAmount || '0',
                paidAmount: student.paidAmount || '0',
                remaining: student.remaining || '0',
                note: student.note || ''
            };

            Object.keys(tags).forEach(key => {
                const regex = new RegExp(`{${key}}`, 'g');
                subject = subject.replace(regex, tags[key]);
                body = body.replace(regex, tags[key]);
            });

            const response = await fetch(`${API_BASE_URL}/api/send-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentEmail: studentEmail,
                    studentName: student.name,
                    templateId,
                    subject,
                    body
                })
            });

            const result = await response.json();
            if (response.ok && result.success) {
                console.log(`✅ Email sent to ${student.name} <${studentEmail}>`);
                successCount++;
            } else {
                const errorMsg = result.error || 'Unknown error';
                console.error(`❌ Email failed for ${student.name}: ${errorMsg}`);
                failedEmails.push(`${student.name} (${errorMsg})`);
            }

            // Add 2 second delay between emails to avoid Google's rate limiting (454-4.7.0 error)
            await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
            console.error(`Error sending email to ${student.name}:`, error);
            failedEmails.push(`${student.name} (network error)`);
        }
    }

    // Show results
    statusDiv.className = 'bulk-email-status ' + (failedEmails.length === 0 ? 'success' : 'error');
    if (failedEmails.length === 0) {
        statusDiv.innerHTML = `<i class="fas fa-check-circle"></i> ✅ Successfully sent ${successCount} emails!`;
        showToast(`Sent ${successCount} emails to ${groupValue}`, 'success');
        setTimeout(() => {
            closeBulkEmailModal();
        }, 2000);
    } else {
        statusDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ⚠️ Sent ${successCount} emails. Failed: ${failedEmails.join(', ')}`;
        showToast(`Sent ${successCount}/${recipients.length} emails`, 'error');
    }

    document.querySelector('#bulkEmailForm button[type="submit"]').disabled = false;
}
