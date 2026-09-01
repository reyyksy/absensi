// ===========================
// STATE MANAGEMENT
// ===========================

let allMembers = [];
let selectedMember = null;
let currentState = 'loading';

const states = {
    loading: 'loading-state',
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
    } catch (error) {
        showError('Gagal memuat data siswa. Silakan refresh halaman.');
    }
}

// ===========================
// STATE MANAGEMENT
// ===========================

function showState(stateName) {
    if (!states[stateName]) return;

    // Hide all states
    Object.values(states).forEach(id => {
        document.getElementById(id).classList.add('hidden');
    });

    // Show the desired state
    document.getElementById(states[stateName]).classList.remove('hidden');
    currentState = stateName;
}

// ===========================
// SEARCH FUNCTIONALITY
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
        renderSearchResults(filtered);
    }
}

function renderSearchResults(members) {
    searchResults.innerHTML = members
        .map(member => `
            <div class="member-item" data-member-id="${member.id}">
                <div class="member-item-name">${member.name}</div>
                <div class="member-item-info">
                    <span>No. ${member.attendance_number}</span>
                    <span>${member.class_name}</span>
                </div>
            </div>
        `)
        .join('');

    // Add event listeners to member items
    document.querySelectorAll('.member-item').forEach(item => {
        item.addEventListener('click', () => {
            const memberId = parseInt(item.dataset.memberId);
            selectMember(memberId);
        });
    });
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

    showState('confirmation');
}

function goBackToSearch() {
    selectedMember = null;
    searchInput.value = '';
    searchResults.innerHTML = '';
    emptyState.classList.add('hidden');
    showState('search');
}

// ===========================
// SUBMIT ATTENDANCE
// ===========================

async function submitAttendance() {
    if (!selectedMember) return;

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
            // Already attended
            showState('attended');
        } else if (!response.ok) {
            showError(data.message || 'Gagal menyimpan absensi');
        } else {
            // Success
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
        showError('Terjadi kesalahan. Silakan coba lagi.');
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
}

function goBackFromAttended() {
    selectedMember = null;
    searchInput.value = '';
    searchResults.innerHTML = '';
    emptyState.classList.add('hidden');
    showState('search');
}

// ===========================
// ATTENDED AGAIN
// ===========================

function attendAgain() {
    selectedMember = null;
    searchInput.value = '';
    searchResults.innerHTML = '';
    emptyState.classList.add('hidden');
    showState('search');
}

// ===========================
// EVENT LISTENERS
// ===========================

function setupEventListeners() {
    // Search
    searchInput.addEventListener('input', (e) => {
        handleSearch(e.target.value);
    });

    // Confirmation
    document.getElementById('btn-back').addEventListener('click', goBackToSearch);
    document.getElementById('btn-confirm').addEventListener('click', submitAttendance);

    // Success
    document.getElementById('btn-absen-lagi').addEventListener('click', attendAgain);

    // Attended
    document.getElementById('btn-back-from-attended').addEventListener('click', goBackFromAttended);

    // Error
    document.getElementById('btn-back-from-error').addEventListener('click', goBackFromError);
}

// ===========================
// UTILITIES
// ===========================

// Prevent autocomplete on search
searchInput.addEventListener('focus', () => {
    searchInput.setAttribute('autocomplete', 'off');
});
