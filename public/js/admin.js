// ===========================
// STATE MANAGEMENT
// ===========================

let allAttendance = [];
let filteredAttendance = [];
let isAuthenticated = false;
let selectedMemberId = null;
const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:3000`;

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
        const response = await fetch(`${API_BASE_URL}/api/admin/session`, {
            credentials: 'include'
        });

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
        const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
            method: 'POST',
            credentials: 'include',
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
            loginError.textContent = 'Password salah. Silakan coba lagi.';
            loginError.classList.remove('hidden');
        }
    } catch (error) {
        loginError.textContent = 'Terjadi kesalahan saat login. Periksa koneksi internet.';
        loginError.classList.remove('hidden');
    }
}

async function logout() {
    try {
        await fetch(`${API_BASE_URL}/api/admin/logout`, {
            method: 'POST',
            credentials: 'include'
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
    attendanceTbody.innerHTML = '';

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/attendance`, {
            credentials: 'include'
        });

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
        attendanceTbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;padding:40px;color:var(--color-text-muted);">
                    Gagal memuat data. <button onclick="loadAttendanceData()" style="background:none;border:none;color:var(--color-primary);text-decoration:underline;cursor:pointer;font-weight:600;">Coba lagi</button>
                </td>
            </tr>
        `;
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
    if (filteredAttendance.length === 0) {
        attendanceTbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;padding:40px;color:var(--color-text-muted);">
                    Tidak ada data yang sesuai dengan filter
                </td>
            </tr>
        `;
        return;
    }

    attendanceTbody.innerHTML = filteredAttendance
        .map((row) => `
            <tr>
                <td data-label="No Absen">${row.attendance_number}</td>
                <td data-label="Nama">${escapeHtml(row.name)}</td>
                <td data-label="Kelas">${escapeHtml(row.class_name)}</td>
                <td data-label="Jam">${row.timestamp || '-'}</td>
                <td data-label="Status">
                    <span class="status-badge status-${row.status}">
                        ${formatStatus(row.status)}
                    </span>
                </td>
                <td data-label="Aksi">
                    <button class="action-btn" data-member-id="${row.attendance_number}" onclick="openStatusModal(${row.attendance_number}, '${escapeHtml(row.name)}')" type="button">
                        Ubah
                    </button>
                </td>
            </tr>
        `)
        .join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
    document.body.style.overflow = 'hidden';
}

function closeStatusModal() {
    statusModal.classList.add('hidden');
    modalOverlay.classList.add('hidden');
    document.body.style.overflow = '';
    selectedMemberId = null;
}

async function changeStatus(newStatus) {
    if (!selectedMemberId) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/attendance/${selectedMemberId}`, {
            method: 'PUT',
            credentials: 'include',
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