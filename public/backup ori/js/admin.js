// ===========================
// STATE MANAGEMENT
// ===========================

let allAttendance = [];
let filteredAttendance = [];
let isAuthenticated = false;
let selectedMemberId = null;

// ===========================
// DOM ELEMENTS
// ===========================

const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const passwordInput = document.getElementById('password-input');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const searchFilter = document.getElementById('search-filter');
const classFilter = document.getElementById('class-filter');
const statusFilter = document.getElementById('status-filter');
const attendanceTbody = document.getElementById('attendance-tbody');
const loadingIndicator = document.getElementById('loading-indicator');

const statHadir = document.getElementById('stat-hadir');
const statIzin = document.getElementById('stat-izin');
const statSakit = document.getElementById('stat-sakit');
const statTanpaKeterangan = document.getElementById('stat-tanpa-keterangan');
const statBelumAbsen = document.getElementById('stat-belum-absen');

const statusModal = document.getElementById('status-modal');
const modalOverlay = document.getElementById('modal-overlay');
const modalClose = document.getElementById('modal-close');
const modalMemberName = document.getElementById('modal-member-name');
const modalMemberNumber = document.getElementById('modal-member-number');
const statusBtns = document.querySelectorAll('.status-btn');

// ===========================
// INITIALIZATION
// ===========================

document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
    setupEventListeners();
});

// ===========================
// AUTHENTICATION
// ===========================

async function checkAuthentication() {
    try {
        const response = await fetch('/api/admin/session');

        if (response.ok) {
            isAuthenticated = true;
            showDashboard();
            loadAttendanceData();
        } else {
            showLogin();
        }
    } catch (error) {
        showLogin();
    }
}

async function login(password) {
    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password })
        });

        const data = await response.json();

        if (response.ok) {
            isAuthenticated = true;
            showDashboard();
            loadAttendanceData();
            passwordInput.value = '';
            loginError.classList.add('hidden');
        } else {
            loginError.textContent = 'Password salah';
            loginError.classList.remove('hidden');
        }
    } catch (error) {
        loginError.textContent = 'Terjadi kesalahan saat login';
        loginError.classList.remove('hidden');
    }
}

async function logout() {
    try {
        await fetch('/api/admin/logout', {
            method: 'POST'
        });

        isAuthenticated = false;
        showLogin();
        allAttendance = [];
        filteredAttendance = [];
    } catch (error) {
        console.error('Logout error:', error);
    }
}

function showLogin() {
    loginSection.classList.remove('hidden');
    dashboardSection.classList.add('hidden');
}

function showDashboard() {
    loginSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
}

// ===========================
// LOAD ATTENDANCE DATA
// ===========================

async function loadAttendanceData() {
    loadingIndicator.classList.remove('hidden');

    try {
        const response = await fetch('/api/admin/attendance');

        if (response.status === 401) {
            showLogin();
            return;
        }

        if (!response.ok) throw new Error('Gagal memuat data');

        allAttendance = await response.json();
        filteredAttendance = [...allAttendance];

        renderTable();
        updateStatistics();
        loadingIndicator.classList.add('hidden');
    } catch (error) {
        console.error('Load error:', error);
        loadingIndicator.classList.add('hidden');
    }
}

// ===========================
// FILTERING
// ===========================

function applyFilters() {
    const searchTerm = searchFilter.value.toLowerCase();
    const classValue = classFilter.value;
    const statusValue = statusFilter.value;

    filteredAttendance = allAttendance.filter(row => {
        const matchSearch = row.name.toLowerCase().includes(searchTerm) ||
            row.attendance_number.toString().includes(searchTerm);

        const matchClass = !classValue || row.class_name === classValue;

        const matchStatus = !statusValue || row.status === statusValue;

        return matchSearch && matchClass && matchStatus;
    });

    renderTable();
}

// ===========================
// RENDER TABLE
// ===========================

function renderTable() {
    attendanceTbody.innerHTML = filteredAttendance
        .map((row, index) => `
            <tr>
                <td>${row.attendance_number}</td>
                <td>${row.name}</td>
                <td>${row.class_name}</td>
                <td>${row.timestamp || '-'}</td>
                <td>
                    <span class="status-cell status-${row.status}">
                        ${formatStatus(row.status)}
                    </span>
                </td>
                <td>
                    <button class="action-btn" data-member-id="${row.attendance_number}" onclick="openStatusModal(${row.attendance_number}, '${row.name}')">
                        Ubah
                    </button>
                </td>
            </tr>
        `)
        .join('');
}

function formatStatus(status) {
    const statusMap = {
        'hadir': 'Hadir',
        'izin': 'Izin',
        'sakit': 'Sakit',
        'tanpa_keterangan': 'Tanpa Keterangan',
        'belum_absen': 'Belum Absen'
    };

    return statusMap[status] || status;
}

// ===========================
// UPDATE STATISTICS
// ===========================

function updateStatistics() {
    const stats = {
        hadir: 0,
        izin: 0,
        sakit: 0,
        tanpa_keterangan: 0,
        belum_absen: 0
    };

    allAttendance.forEach(row => {
        if (stats.hasOwnProperty(row.status)) {
            stats[row.status]++;
        }
    });

    statHadir.textContent = stats.hadir;
    statIzin.textContent = stats.izin;
    statSakit.textContent = stats.sakit;
    statTanpaKeterangan.textContent = stats.tanpa_keterangan;
    statBelumAbsen.textContent = stats.belum_absen;
}

// ===========================
// STATUS MODAL
// ===========================

function openStatusModal(memberId, memberName) {
    selectedMemberId = memberId;
    modalMemberName.textContent = memberName;
    modalMemberNumber.textContent = memberId;

    // Reset button states
    statusBtns.forEach(btn => btn.classList.remove('active'));

    // Find current status
    const current = allAttendance.find(a => a.attendance_number === memberId);
    if (current) {
        const activeBtn = document.querySelector(`[data-status="${current.status}"]`);
        if (activeBtn) activeBtn.classList.add('active');
    }

    statusModal.classList.remove('hidden');
    modalOverlay.classList.remove('hidden');
}

function closeStatusModal() {
    statusModal.classList.add('hidden');
    modalOverlay.classList.add('hidden');
    selectedMemberId = null;
}

async function changeStatus(newStatus) {
    if (!selectedMemberId) return;

    try {
        const response = await fetch(`/api/admin/attendance/${selectedMemberId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: newStatus
            })
        });

        if (response.status === 401) {
            showLogin();
            return;
        }

        if (response.ok) {
            // Update local data
            const attendance = allAttendance.find(a => a.attendance_number === selectedMemberId);
            if (attendance) {
                attendance.status = newStatus;
            }

            renderTable();
            updateStatistics();
            closeStatusModal();
        }
    } catch (error) {
        console.error('Change status error:', error);
    }
}

// ===========================
// EVENT LISTENERS
// ===========================

function setupEventListeners() {
    // Login
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        login(passwordInput.value);
    });

    // Logout
    logoutBtn.addEventListener('click', logout);

    // Filters
    searchFilter.addEventListener('input', applyFilters);
    classFilter.addEventListener('change', applyFilters);
    statusFilter.addEventListener('change', applyFilters);

    // Status modal
    statusBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const status = btn.dataset.status;

            // Update active state
            statusBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Change status
            changeStatus(status);
        });
    });

    modalClose.addEventListener('click', closeStatusModal);
    modalOverlay.addEventListener('click', closeStatusModal);
}

// ===========================
// KEYBOARD SHORTCUTS
// ===========================

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeStatusModal();
    }
});
