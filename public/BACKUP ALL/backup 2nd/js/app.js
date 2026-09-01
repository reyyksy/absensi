// ===========================
// STATE MANAGEMENT
// ===========================

let allMembers = [];
let selectedMember = null;

const states = {
    search: 'search-state',
    confirmation: 'confirmation-state',
    success: 'success-state',
    attended: 'attended-state',
    error: 'error-state'
};

// ===========================
// DOM ELEMENTS
// ===========================

const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
const emptyState = document.getElementById('empty-state');
const confirmName = document.getElementById('confirm-name');
const confirmNumber = document.getElementById('confirm-number');
const confirmClass = document.getElementById('confirm-class');
const confirmAvatar = document.getElementById('confirm-avatar');
const successName = document.getElementById('success-name');
const successNumber = document.getElementById('success-number');
const successTime = document.getElementById('success-time');
const errorMessage = document.getElementById('error-message');

// ===========================
// INITIALIZATION
// ===========================

document.addEventListener('DOMContentLoaded', () => {
    loadMembers();
    setupEventListeners();
});

// ===========================
// LOAD MEMBERS
// ===========================

async function loadMembers() {
    try {
        const response = await fetch('/api/members');
        if (!response.ok) throw new Error('Gagal memuat data');

        allMembers = await response.json();
        showState('search');
        setTimeout(() => {
            if (searchInput) searchInput.focus();
        }, 100);
    } catch (error) {
        showError('Gagal memuat data anggota. Periksa koneksi internet dan refresh halaman.');
    }
}

// ===========================
// STATE MANAGEMENT
// ===========================

function showState(stateName) {
    if (!states[stateName]) return;

    Object.values(states).forEach(id => {
        document.getElementById(id).classList.add('hidden');
    });

    document.getElementById(states[stateName]).classList.remove('hidden');
}

// ===========================
// SEARCH
// ===========================

function handleSearch(query) {
    const trimmed = query.trim().toLowerCase();

    if (!trimmed) {
        searchResults.innerHTML = '';
        emptyState.classList.add('hidden');
        return;
    }

    const filtered = allMembers.filter(member => {
        const name = member.name.toLowerCase();
        const number = member.attendance_number.toString();
        const kelas = member.class_name.toLowerCase();

        return (
            name.includes(trimmed) ||
            number.includes(trimmed) ||
            kelas.includes(trimmed)
        );
    });

    if (filtered.length === 0) {
        searchResults.innerHTML = '';
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        renderResults(filtered);
    }
}

function renderResults(members) {
    searchResults.innerHTML = members
        .map(member => {
            const initials = getInitials(member.name);
            return `
            <div class="result-item" data-member-id="${member.id}" tabindex="0" aria-label="${member.name}, nomor absen ${member.attendance_number}, kelas ${member.class_name}">
                <div class="result-item-left">
                    <div class="result-avatar" aria-hidden="true">${initials}</div>
                    <div>
                        <div class="result-item-name">${escapeHtml(member.name)}</div>
                        <div class="result-item-meta">
                            <span>No. ${member.attendance_number}</span>
                            <span>${escapeHtml(member.class_name)}</span>
                        </div>
                    </div>
                </div>
                <span class="result-arrow" aria-hidden="true">&#8250;</span>
            </div>
        `;
        })
        .join('');

    document.querySelectorAll('.result-item').forEach(item => {
        item.addEventListener('click', () => {
            const memberId = parseInt(item.dataset.memberId);
            selectMember(memberId);
        });
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const memberId = parseInt(item.dataset.memberId);
                selectMember(memberId);
            }
        });
    });
}

function getInitials(name) {
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function selectMember(memberId) {
    selectedMember = allMembers.find(m => m.id === memberId);
    if (selectedMember) {
        showConfirmation();
    }
}

// ===========================
// CONFIRMATION
// ===========================

function showConfirmation() {
    if (!selectedMember) return;

    confirmName.textContent = selectedMember.name;
    confirmNumber.textContent = selectedMember.attendance_number;
    confirmClass.textContent = selectedMember.class_name;
    confirmAvatar.textContent = getInitials(selectedMember.name);

    showState('confirmation');
}

function goBackToSearch() {
    selectedMember = null;
    searchInput.value = '';
    searchResults.innerHTML = '';
    emptyState.classList.add('hidden');
    showState('search');
    setTimeout(() => {
        if (searchInput) searchInput.focus();
    }, 100);
}

// ===========================
// SUBMIT ATTENDANCE
// ===========================

async function submitAttendance() {
    if (!selectedMember) return;

    const confirmBtn = document.getElementById('btn-confirm');
    const originalText = confirmBtn.innerHTML;

    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<span class="spinner-inline"></span>Memproses...';

    try {
        const response = await fetch('/api/attendance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                member_id: selectedMember.id
            })
        });

        const data = await response.json();

        if (response.status === 409) {
            showState('attended');
        } else if (!response.ok) {
            showError(data.message || 'Gagal menyimpan absensi. Coba lagi.');
        } else {
            successName.textContent = data.member.name;
            successNumber.textContent = data.member.attendance_number;
            successTime.textContent = new Date().toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            showState('success');
        }
    } catch (error) {
        showError('Koneksi bermasalah. Periksa internet dan coba lagi.');
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = originalText;
    }
}

// ===========================
// ERROR HANDLING
// ===========================

function showError(message) {
    errorMessage.textContent = message;
    showState('error');
}

function goBackFromError() {
    selectedMember = null;
    searchInput.value = '';
    searchResults.innerHTML = '';
    emptyState.classList.add('hidden');
    showState('search');
    setTimeout(() => {
        if (searchInput) searchInput.focus();
    }, 100);
}

function goBackFromAttended() {
    selectedMember = null;
    searchInput.value = '';
    searchResults.innerHTML = '';
    emptyState.classList.add('hidden');
    showState('search');
    setTimeout(() => {
        if (searchInput) searchInput.focus();
    }, 100);
}

function attendAgain() {
    selectedMember = null;
    searchInput.value = '';
    searchResults.innerHTML = '';
    emptyState.classList.add('hidden');
    showState('search');
    setTimeout(() => {
        if (searchInput) searchInput.focus();
    }, 100);
}

// ===========================
// EVENT LISTENERS
// ===========================

function setupEventListeners() {
    searchInput.addEventListener('input', (e) => {
        handleSearch(e.target.value);
    });

    document.getElementById('btn-back').addEventListener('click', goBackToSearch);
    document.getElementById('btn-confirm').addEventListener('click', submitAttendance);
    document.getElementById('btn-absen-lagi').addEventListener('click', attendAgain);
    document.getElementById('btn-back-from-attended').addEventListener('click', goBackFromAttended);
    document.getElementById('btn-back-from-error').addEventListener('click', goBackFromError);
}

// Prevent autocomplete
searchInput.addEventListener('focus', () => {
    searchInput.setAttribute('autocomplete', 'off');
});