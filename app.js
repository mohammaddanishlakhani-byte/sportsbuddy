/**
 * SportsBuddy v3.2 - Enhanced Application
 * Professional Sports Matchmaking Platform with Admin Features
 */

// Global Variables
let currentUser = null;
let currentUserData = null;
let currentFilter = 'all';
let currentSkillFilter = 'all';
let matches = [];
let unsubscribeMatches = null;
let isAdmin = false;
let searchDebounceTimer = null;

// DOM Elements
const elements = {
    // Loading
    loadingScreen: document.getElementById('loadingScreen'),
    
    // Admin
    adminPanel: document.getElementById('adminPanel'),
    totalMatches: document.getElementById('totalMatches'),
    totalUsers: document.getElementById('totalUsers'),
    todayMatches: document.getElementById('todayMatches'),
    adminBtn: document.getElementById('adminBtn'),
    mobileAdminBtn: document.getElementById('mobileAdminBtn'),
    
    // Navigation
    userInfo: document.getElementById('userInfo'),
    userName: document.getElementById('userName'),
    userStatus: document.getElementById('userStatus'),
    userAvatar: document.getElementById('userAvatar'),
    authBtn: document.getElementById('authBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    mobileMenu: document.getElementById('mobileMenu'),
    mobileUser: document.getElementById('mobileUser'),
    
    // Search & Filters
    searchInput: document.getElementById('searchInput'),
    filterPanel: document.getElementById('filterPanel'),
    refreshBtn: document.getElementById('refreshBtn'),
    
    // Content
    matchesGrid: document.getElementById('matchesGrid'),
    emptyState: document.getElementById('emptyState'),
    loadMore: document.getElementById('loadMore'),
    loadMoreIcon: document.getElementById('loadMoreIcon'),
    
    // Modals
    authModal: document.getElementById('authModal'),
    eventModal: document.getElementById('eventModal'),
    forgotPasswordModal: document.getElementById('forgotPasswordModal'),
    matchDetailsModal: document.getElementById('matchDetailsModal'),
    
    // Auth Forms
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    loginEmail: document.getElementById('loginEmail'),
    loginPassword: document.getElementById('loginPassword'),
    loginBtn: document.getElementById('loginBtn'),
    loginBtnText: document.getElementById('loginBtnText'),
    loginSpinner: document.getElementById('loginSpinner'),
    registerName: document.getElementById('registerName'),
    registerEmail: document.getElementById('registerEmail'),
    registerPassword: document.getElementById('registerPassword'),
    registerConfirmPassword: document.getElementById('registerConfirmPassword'),
    registerLocation: document.getElementById('registerLocation'),
    registerBtn: document.getElementById('registerBtn'),
    registerBtnText: document.getElementById('registerBtnText'),
    registerSpinner: document.getElementById('registerSpinner'),
    
    // Match Form
    matchForm: document.getElementById('matchForm'),
    matchSport: document.getElementById('matchSport'),
    matchCity: document.getElementById('matchCity'),
    matchArea: document.getElementById('matchArea'),
    matchSkill: document.getElementById('matchSkill'),
    matchDate: document.getElementById('matchDate'),
    matchTime: document.getElementById('matchTime'),
    matchDescription: document.getElementById('matchDescription'),
    matchVenueDetails: document.getElementById('matchVenueDetails'),
    matchDuration: document.getElementById('matchDuration'),
    matchPlayers: document.getElementById('matchPlayers'),
    createMatchBtn: document.getElementById('createMatchBtn')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    console.log('🚀 SportsBuddy v3.2 Initializing...');
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    elements.matchDate.min = today;
    elements.matchDate.value = today;
    elements.matchDate.addEventListener('change', validateMatchDate);
    
    // Set default time to next hour
    const nextHour = new Date();
    nextHour.setHours(nextHour.getHours() + 1);
    nextHour.setMinutes(0);
    elements.matchTime.value = nextHour.toTimeString().slice(0, 5);
    
    // Initialize Firebase Auth listener
    firebase.auth().onAuthStateChanged(handleAuthStateChange);
    
    // Set up real-time matches listener
    setupMatchesListener();
    
    // Initialize UI components
    initializeSearch();
    initializeFilters();
    initializeMobileMenu();
    initializeModals();
    
    // Hide loading screen
    setTimeout(() => {
        elements.loadingScreen.style.opacity = '0';
        setTimeout(() => {
            elements.loadingScreen.style.display = 'none';
        }, 300);
    }, 1000);
    
    console.log('✅ SportsBuddy initialized successfully');
}

// ===== AUTHENTICATION =====

async function handleAuthStateChange(user) {
    currentUser = user;
    
    if (user) {
        console.log(`🔑 User authenticated: ${user.email}`);
        
        // Load user data from Firestore
        await loadUserData(user.uid);
        
        // Check if user is admin
        await checkAdminStatus(user.uid);
        
        // Update UI
        updateUIForAuth(user);
        showToast('Welcome!', `Signed in as ${user.displayName || user.email.split('@')[0]}`, 'success');
    } else {
        console.log('👤 No user signed in');
        currentUserData = null;
        isAdmin = false;
        updateUIForAuth(null);
    }
}

async function loadUserData(userId) {
    try {
        const userDoc = await firebase.firestore()
            .collection('users')
            .doc(userId)
            .get();
        
        if (userDoc.exists) {
            currentUserData = userDoc.data();
            console.log('📊 User data loaded:', currentUserData);
        } else {
            // Create user document if it doesn't exist
            currentUserData = {
                email: currentUser.email,
                displayName: currentUser.displayName || currentUser.email.split('@')[0],
                location: '',
                sports: [],
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                role: 'user'
            };
            
            await firebase.firestore()
                .collection('users')
                .doc(userId)
                .set(currentUserData);
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

async function checkAdminStatus(userId) {
    try {
        const userDoc = await firebase.firestore()
            .collection('users')
            .doc(userId)
            .get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            isAdmin = userData.role === 'admin';
            
            if (isAdmin) {
                elements.adminBtn.style.display = 'flex';
                elements.mobileAdminBtn.style.display = 'block';
                console.log('👑 User is admin');
            }
        }
    } catch (error) {
        console.error('Error checking admin status:', error);
    }
}

function updateUIForAuth(user) {
    if (user) {
        // User is signed in
        const displayName = user.displayName || user.email.split('@')[0];
        
        elements.userName.textContent = displayName;
        elements.userStatus.innerHTML = '<span class="status-dot"></span> Online';
        
        // Update avatar
        elements.userAvatar.innerHTML = '<i class="fas fa-user-check"></i>';
        elements.userAvatar.style.background = 'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-700) 100%)';
        elements.userAvatar.style.color = 'white';
        
        // Update mobile user info
        const mobileUser = elements.mobileUser;
        if (mobileUser) {
            mobileUser.querySelector('.mobile-user-name').textContent = displayName;
            mobileUser.querySelector('.mobile-user-status').textContent = 'Online';
            mobileUser.querySelector('.mobile-user-status').style.color = 'var(--success-500)';
        }
        
        // Update buttons
        elements.authBtn.style.display = 'none';
        elements.logoutBtn.style.display = 'flex';
        
        // Hide mobile auth button
        const mobileAuthBtn = document.querySelector('#mobileAuthBtn');
        if (mobileAuthBtn) mobileAuthBtn.style.display = 'none';
        
    } else {
        // User is not signed in
        elements.userName.textContent = 'Guest';
        elements.userStatus.innerHTML = '<span class="status-dot" style="background: var(--gray-400);"></span> Not signed in';
        
        // Reset avatar
        elements.userAvatar.innerHTML = '<i class="fas fa-user"></i>';
        elements.userAvatar.style.background = '';
        elements.userAvatar.style.color = '';
        
        // Reset mobile user info
        const mobileUser = elements.mobileUser;
        if (mobileUser) {
            mobileUser.querySelector('.mobile-user-name').textContent = 'Guest User';
            mobileUser.querySelector('.mobile-user-status').textContent = 'Tap to sign in';
            mobileUser.querySelector('.mobile-user-status').style.color = '';
        }
        
        // Update buttons
        elements.authBtn.style.display = 'flex';
        elements.logoutBtn.style.display = 'none';
        elements.adminBtn.style.display = 'none';
        elements.mobileAdminBtn.style.display = 'none';
        
        // Show mobile auth button
        const mobileAuthBtn = document.querySelector('#mobileAuthBtn');
        if (mobileAuthBtn) mobileAuthBtn.style.display = 'flex';
    }
}

// ===== MATCHES MANAGEMENT =====

function setupMatchesListener() {
    const matchesRef = firebase.firestore().collection('global_matches');
    
    unsubscribeMatches = matchesRef
        .orderBy('createdAt', 'desc')
        .onSnapshot((snapshot) => {
            matches = [];
            snapshot.forEach((doc) => {
                matches.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            renderMatches(matches);
            updateEmptyState();
            
            // Update admin stats
            if (isAdmin) {
                updateAdminStats();
            }
        }, (error) => {
            console.error('Error listening to matches:', error);
            showToast('Connection Error', 'Unable to load matches', 'error');
        });
}

function renderMatches(matchesToRender) {
    const filteredMatches = filterMatches(matchesToRender);
    
    if (filteredMatches.length === 0) {
        elements.matchesGrid.innerHTML = '';
        return;
    }
    
    const matchesHTML = filteredMatches.map(match => createMatchCardHTML(match)).join('');
    elements.matchesGrid.innerHTML = matchesHTML;
    
    // Show/Hide load more button
    if (filteredMatches.length > 6) {
        elements.loadMore.style.display = 'block';
    } else {
        elements.loadMore.style.display = 'none';
    }
}

function createMatchCardHTML(match) {
    const createdAt = match.createdAt ? 
        (match.createdAt.toDate ? match.createdAt.toDate() : new Date(match.createdAt)) : 
        new Date();
    
    const timeAgo = getTimeAgo(createdAt);
    const formattedDate = formatMatchDate(match.date, match.time);
    const skillClass = `skill-${match.skill.toLowerCase()}`;
    
    // Get sport icon
    const sportIcons = {
        'Football': 'fa-futbol',
        'Basketball': 'fa-basketball-ball',
        'Tennis': 'fa-baseball-ball',
        'Cricket': 'fa-baseball-ball',
        'Badminton': 'fa-table-tennis',
        'Volleyball': 'fa-volleyball-ball',
        'Swimming': 'fa-swimmer',
        'Running': 'fa-running',
        'Cycling': 'fa-bicycle',
        'Yoga': 'fa-spa',
        'Gym': 'fa-dumbbell',
        'Boxing': 'fa-boxing-glove',
        'Martial Arts': 'fa-user-ninja'
    };
    
    const sportIcon = sportIcons[match.sport] || 'fa-running';
    const creatorName = match.createdByEmail ? match.createdByEmail.split('@')[0] : 'Anonymous';
    
    return `
        <div class="match-card" data-id="${match.id}">
            <div class="match-card-header">
                <div class="sport-icon">
                    <i class="fas ${sportIcon}"></i>
                </div>
                <div class="match-actions">
                    <button class="action-btn" onclick="viewMatchDetails('${match.id}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn" onclick="shareMatch('${match.id}')" title="Share">
                        <i class="fas fa-share-alt"></i>
                    </button>
                    ${currentUser && (currentUser.uid === match.createdBy || isAdmin) ? `
                        <button class="action-btn" onclick="deleteMatch('${match.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
            
            <div class="match-card-body">
                <div class="match-title">
                    <span class="match-sport">${match.sport}</span>
                    <span class="skill-badge ${skillClass}">${match.skill}</span>
                </div>
                
                <div class="match-details">
                    <div class="detail-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${match.area}, ${match.city}</span>
                    </div>
                    
                    <div class="detail-item">
                        <i class="fas fa-clock"></i>
                        <span>${formattedDate}</span>
                    </div>
                    
                    ${match.venueDetails ? `
                        <div class="detail-item">
                            <i class="fas fa-info-circle"></i>
                            <span>${match.venueDetails}</span>
                        </div>
                    ` : ''}
                    
                    ${match.duration ? `
                        <div class="detail-item">
                            <i class="fas fa-hourglass"></i>
                            <span>${match.duration} hour${match.duration > 1 ? 's' : ''}</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="match-creator">
                    <div class="creator-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div>
                        <div class="creator-name">${creatorName}</div>
                        <div class="creator-time">Created ${timeAgo}</div>
                    </div>
                </div>
            </div>
            
            <div class="match-card-footer">
                <div class="participants">
                    <i class="fas fa-users"></i>
                    <span>${match.participants ? match.participants.length : 0} / ${match.playersNeeded || 8} joined</span>
                </div>
                <button class="join-btn" onclick="joinMatch('${match.id}')">
                    <i class="fas fa-user-plus"></i>
                    Join Match
                </button>
            </div>
        </div>
    `;
}

// ===== FILTERS & SEARCH =====

function initializeSearch() {
    // Fixed: Changed from 'debouncedSearch' to 'handleSearch'
    elements.searchInput.addEventListener('input', function() {
        if (searchDebounceTimer) {
            clearTimeout(searchDebounceTimer);
        }
        searchDebounceTimer = setTimeout(() => {
            renderMatches(matches);
            updateEmptyState();
        }, 300);
    });
}

// Fixed: Added the missing handleSearch function
function handleSearch() {
    if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
    }
    searchDebounceTimer = setTimeout(() => {
        renderMatches(matches);
        updateEmptyState();
    }, 300);
}

function initializeFilters() {
    // Set up filter toggles
    document.querySelectorAll('.filter-tag').forEach(tag => {
        tag.addEventListener('click', function() {
            document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    document.querySelectorAll('.skill-filter').forEach(filter => {
        filter.addEventListener('click', function() {
            document.querySelectorAll('.skill-filter').forEach(f => f.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function filterMatches(matchesList) {
    let filtered = [...matchesList];
    
    // Apply sport filter
    if (currentFilter !== 'all') {
        filtered = filtered.filter(match => 
            match.sport.toLowerCase() === currentFilter.toLowerCase()
        );
    }
    
    // Apply skill filter
    if (currentSkillFilter !== 'all') {
        filtered = filtered.filter(match => 
            match.skill.toLowerCase() === currentSkillFilter.toLowerCase()
        );
    }
    
    // Apply search filter
    const searchTerm = elements.searchInput.value.toLowerCase().trim();
    if (searchTerm) {
        filtered = filtered.filter(match =>
            match.sport.toLowerCase().includes(searchTerm) ||
            match.city.toLowerCase().includes(searchTerm) ||
            match.area.toLowerCase().includes(searchTerm) ||
            match.skill.toLowerCase().includes(searchTerm) ||
            (match.description && match.description.toLowerCase().includes(searchTerm))
        );
    }
    
    return filtered;
}

function filterBySport(sport) {
    currentFilter = sport;
    renderMatches(matches);
    updateEmptyState();
}

function filterBySkill(skill) {
    currentSkillFilter = skill;
    renderMatches(matches);
    updateEmptyState();
}

function clearAllFilters() {
    currentFilter = 'all';
    currentSkillFilter = 'all';
    elements.searchInput.value = '';
    
    document.querySelectorAll('.filter-tag, .skill-filter').forEach(el => {
        el.classList.remove('active');
    });
    
    document.querySelector('.filter-tag[onclick="filterBySport(\'all\')"]').classList.add('active');
    document.querySelector('.skill-filter[data-skill="all"]').classList.add('active');
    
    renderMatches(matches);
    updateEmptyState();
}

function quickSearch(sport) {
    elements.searchInput.value = sport;
    currentFilter = 'all';
    filterBySport('all');
    renderMatches(matches);
    updateEmptyState();
}

function clearSearch() {
    elements.searchInput.value = '';
    renderMatches(matches);
    updateEmptyState();
}

function toggleFilters() {
    elements.filterPanel.classList.toggle('active');
}

function applyFilters() {
    renderMatches(matches);
    updateEmptyState();
    toggleFilters();
}

// ===== MATCH ACTIONS =====

async function joinMatch(matchId) {
    if (!currentUser) {
        showToast('Sign In Required', 'Please sign in to join matches', 'warning');
        toggleAuthModal();
        return;
    }
    
    try {
        const matchRef = firebase.firestore().collection('global_matches').doc(matchId);
        const matchDoc = await matchRef.get();
        
        if (!matchDoc.exists) {
            showToast('Match Not Found', 'This match no longer exists', 'error');
            return;
        }
        
        const matchData = matchDoc.data();
        const participants = matchData.participants || [];
        const maxPlayers = matchData.playersNeeded || 8;
        
        // Check if match is full
        if (participants.length >= maxPlayers) {
            showToast('Match Full', 'This match has reached maximum players', 'warning');
            return;
        }
        
        // Check if user already joined
        if (participants.includes(currentUser.uid)) {
            showToast('Already Joined', 'You are already part of this match', 'info');
            return;
        }
        
        // Add user to participants
        await matchRef.update({
            participants: firebase.firestore.FieldValue.arrayUnion(currentUser.uid)
        });
        
        showToast('Success!', `You've joined the ${matchData.sport} match`, 'success');
        
        // Send notification to match creator
        if (matchData.createdBy !== currentUser.uid) {
            await firebase.firestore().collection('notifications').add({
                type: 'join_request',
                matchId: matchId,
                sport: matchData.sport,
                fromUserId: currentUser.uid,
                fromUserEmail: currentUser.email,
                fromUserName: currentUser.displayName || currentUser.email.split('@')[0],
                toUserId: matchData.createdBy,
                read: false,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
    } catch (error) {
        console.error('Error joining match:', error);
        showToast('Join Failed', 'Could not join match', 'error');
    }
}

async function viewMatchDetails(matchId) {
    try {
        const matchDoc = await firebase.firestore()
            .collection('global_matches')
            .doc(matchId)
            .get();
        
        if (!matchDoc.exists) {
            showToast('Match Not Found', 'This match no longer exists', 'error');
            return;
        }
        
        const matchData = matchDoc.data();
        const createdAt = matchData.createdAt ? 
            (matchData.createdAt.toDate ? matchData.createdAt.toDate() : new Date(matchData.createdAt)) : 
            new Date();
        
        const formattedDate = formatMatchDate(matchData.date, matchData.time);
        const participantsCount = matchData.participants ? matchData.participants.length : 0;
        const maxPlayers = matchData.playersNeeded || 8;
        
        // Load participants details
        let participantsHTML = '<div class="participants-list">';
        if (matchData.participants && matchData.participants.length > 0) {
            for (const userId of matchData.participants.slice(0, 5)) {
                try {
                    const userDoc = await firebase.firestore()
                        .collection('users')
                        .doc(userId)
                        .get();
                    
                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        participantsHTML += `
                            <div class="participant">
                                <i class="fas fa-user"></i>
                                <span>${userData.displayName || userData.email.split('@')[0]}</span>
                            </div>
                        `;
                    }
                } catch (error) {
                    console.error('Error loading participant:', error);
                }
            }
            
            if (matchData.participants.length > 5) {
                participantsHTML += `<div class="participant-more">+${matchData.participants.length - 5} more</div>`;
            }
        } else {
            participantsHTML += '<div class="no-participants">No participants yet</div>';
        }
        participantsHTML += '</div>';
        
        // Create match details HTML
        const detailsHTML = `
            <div class="match-details-content">
                <div class="match-header">
                    <h3>${matchData.sport} Match</h3>
                    <div class="match-meta">
                        <span class="skill-badge skill-${matchData.skill.toLowerCase()}">${matchData.skill}</span>
                        <span class="match-date">${formattedDate}</span>
                    </div>
                </div>
                
                <div class="details-section">
                    <h4><i class="fas fa-map-marker-alt"></i> Location</h4>
                    <p>${matchData.area}, ${matchData.city}</p>
                    ${matchData.venueDetails ? `<p class="venue-details">${matchData.venueDetails}</p>` : ''}
                </div>
                
                <div class="details-section">
                    <h4><i class="fas fa-info-circle"></i> Match Details</h4>
                    <div class="match-specs">
                        ${matchData.duration ? `<div><i class="fas fa-hourglass"></i> ${matchData.duration} hour${matchData.duration > 1 ? 's' : ''}</div>` : ''}
                        <div><i class="fas fa-users"></i> ${participantsCount} / ${maxPlayers} players</div>
                        ${matchData.equipmentProvided ? `<div><i class="fas fa-dumbbell"></i> Equipment provided</div>` : ''}
                        ${matchData.parkingAvailable ? `<div><i class="fas fa-parking"></i> Parking available</div>` : ''}
                    </div>
                </div>
                
                ${matchData.description ? `
                    <div class="details-section">
                        <h4><i class="fas fa-align-left"></i> Description</h4>
                        <p>${matchData.description}</p>
                    </div>
                ` : ''}
                
                <div class="details-section">
                    <h4><i class="fas fa-users"></i> Participants (${participantsCount})</h4>
                    ${participantsHTML}
                </div>
                
                <div class="details-section">
                    <h4><i class="fas fa-user"></i> Organizer</h4>
                    <div class="organizer">
                        <i class="fas fa-user-circle"></i>
                        <div>
                            <div class="organizer-name">${matchData.createdByEmail ? matchData.createdByEmail.split('@')[0] : 'Anonymous'}</div>
                            <div class="organizer-time">Created ${getTimeAgo(createdAt)}</div>
                        </div>
                    </div>
                </div>
                
                <div class="details-actions">
                    <button class="btn btn-primary" onclick="joinMatch('${matchId}')">
                        <i class="fas fa-user-plus"></i>
                        Join Match
                    </button>
                    <button class="btn btn-outline" onclick="shareMatch('${matchId}')">
                        <i class="fas fa-share-alt"></i>
                        Share
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('matchDetailsTitle').textContent = `${matchData.sport} Match Details`;
        document.getElementById('matchDetailsContent').innerHTML = detailsHTML;
        
        // Show modal
        elements.matchDetailsModal.classList.add('active');
        
    } catch (error) {
        console.error('Error loading match details:', error);
        showToast('Error', 'Could not load match details', 'error');
    }
}

function closeMatchDetails() {
    elements.matchDetailsModal.classList.remove('active');
}

async function deleteMatch(matchId) {
    if (!confirm('Are you sure you want to delete this match? This action cannot be undone.')) {
        return;
    }
    
    try {
        await firebase.firestore().collection('global_matches').doc(matchId).delete();
        showToast('Match Deleted', 'The match has been removed', 'success');
    } catch (error) {
        console.error('Error deleting match:', error);
        showToast('Deletion Failed', 'Could not delete match', 'error');
    }
}

function shareMatch(matchId) {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;
    
    const shareData = {
        title: `Join ${match.sport} Match on SportsBuddy`,
        text: `Join ${match.createdByEmail ? match.createdByEmail.split('@')[0] : 'someone'} for ${match.sport} in ${match.city}. Skill level: ${match.skill}`,
        url: `${window.location.origin}?match=${matchId}`
    };
    
    if (navigator.share) {
        navigator.share(shareData)
            .then(() => console.log('Shared successfully'))
            .catch((error) => console.log('Error sharing:', error));
    } else {
        navigator.clipboard.writeText(shareData.url)
            .then(() => showToast('Link Copied', 'Match link copied to clipboard', 'success'))
            .catch(() => showToast('Copy Failed', 'Could not copy link', 'error'));
    }
}

// ===== MATCH CREATION =====

function validateMatchDate() {
    const selectedDate = new Date(elements.matchDate.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
        showToast('Invalid Date', 'Please select today or a future date', 'warning');
        elements.matchDate.value = today.toISOString().split('T')[0];
    }
}

async function createMatch(event) {
    event.preventDefault();
    
    if (!currentUser) {
        showToast('Sign In Required', 'Please sign in to create matches', 'error');
        toggleAuthModal();
        return;
    }
    
    const matchData = {
        sport: elements.matchSport.value,
        city: elements.matchCity.value.trim(),
        area: elements.matchArea.value.trim(),
        skill: elements.matchSkill.value,
        date: elements.matchDate.value,
        time: elements.matchTime.value,
        duration: elements.matchDuration.value,
        playersNeeded: elements.matchPlayers.value,
        description: elements.matchDescription.value.trim(),
        venueDetails: elements.matchVenueDetails.value.trim(),
        equipmentProvided: document.getElementById('equipmentProvided').checked,
        parkingAvailable: document.getElementById('parkingAvailable').checked,
        changingRooms: document.getElementById('changingRooms').checked,
        createdBy: currentUser.uid,
        createdByEmail: currentUser.email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        participants: [],
        status: 'active'
    };
    
    // Validation
    if (!matchData.sport || !matchData.city || !matchData.area) {
        showToast('Missing Information', 'Please fill all required fields (*)', 'warning');
        return;
    }
    
    // Validate date and time
    const matchDateTime = new Date(`${matchData.date}T${matchData.time}`);
    if (matchDateTime < new Date()) {
        showToast('Invalid Time', 'Please select a future date and time', 'warning');
        return;
    }
    
    // Show loading state
    elements.createMatchBtn.disabled = true;
    const originalText = elements.createMatchBtn.innerHTML;
    elements.createMatchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
    
    try {
        // Add match to Firestore
        await firebase.firestore().collection('global_matches').add(matchData);
        
        // Show success message
        showToast('Match Created!', 'Your match has been published successfully', 'success');
        
        // Close modal and reset form
        toggleEventModal();
        elements.matchForm.reset();
        
        // Reset to defaults
        const today = new Date().toISOString().split('T')[0];
        elements.matchDate.value = today;
        const nextHour = new Date();
        nextHour.setHours(nextHour.getHours() + 1);
        nextHour.setMinutes(0);
        elements.matchTime.value = nextHour.toTimeString().slice(0, 5);
        
        // Update user's sports interests
        if (currentUserData) {
            if (!currentUserData.sports) {
                currentUserData.sports = [];
            }
            if (!currentUserData.sports.includes(matchData.sport)) {
                currentUserData.sports.push(matchData.sport);
                await firebase.firestore()
                    .collection('users')
                    .doc(currentUser.uid)
                    .update({
                        sports: currentUserData.sports,
                        location: matchData.city
                    });
            }
        }
        
    } catch (error) {
        console.error('Error creating match:', error);
        showToast('Creation Failed', 'Could not create match. Please try again.', 'error');
        
    } finally {
        // Reset button state
        elements.createMatchBtn.disabled = false;
        elements.createMatchBtn.innerHTML = originalText;
    }
}

// ===== AUTH FUNCTIONS =====

function handleLogin(event) {
    event.preventDefault();
    
    const email = elements.loginEmail.value.trim();
    const password = elements.loginPassword.value;
    
    if (!validateEmail(email)) {
        showToast('Invalid Email', 'Please enter a valid email address', 'error');
        return;
    }
    
    if (password.length < 6) {
        showToast('Invalid Password', 'Password must be at least 6 characters', 'error');
        return;
    }
    
    // Show loading state
    elements.loginBtn.disabled = true;
    elements.loginBtnText.textContent = 'Signing In...';
    elements.loginSpinner.style.display = 'inline-block';
    
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log('✅ User logged in:', userCredential.user.email);
            toggleAuthModal();
            elements.loginForm.reset();
        })
        .catch((error) => {
            console.error('Login error:', error);
            handleAuthError(error);
        })
        .finally(() => {
            elements.loginBtn.disabled = false;
            elements.loginBtnText.textContent = 'Sign In';
            elements.loginSpinner.style.display = 'none';
        });
}

async function handleRegister(event) {
    event.preventDefault();
    
    const name = elements.registerName.value.trim();
    const email = elements.registerEmail.value.trim();
    const password = elements.registerPassword.value;
    const confirmPassword = elements.registerConfirmPassword.value;
    const location = elements.registerLocation.value.trim();
    
    // Validation
    if (!name || !email || !password || !confirmPassword || !location) {
        showToast('Missing Information', 'Please fill all fields', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showToast('Invalid Email', 'Please enter a valid email address', 'error');
        return;
    }
    
    if (password.length < 8) {
        showToast('Weak Password', 'Password must be at least 8 characters', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showToast('Password Mismatch', 'Passwords do not match', 'error');
        return;
    }
    
    // Show loading state
    elements.registerBtn.disabled = true;
    elements.registerBtnText.textContent = 'Creating Account...';
    elements.registerSpinner.style.display = 'inline-block';
    
    try {
        // Create user with Firebase Auth
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        
        // Update user profile
        await userCredential.user.updateProfile({
            displayName: name
        });
        
        // Create user document in Firestore
        await firebase.firestore().collection('users').doc(userCredential.user.uid).set({
            email: email,
            displayName: name,
            location: location,
            sports: [],
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            role: 'user'
        });
        
        console.log('✅ New user registered:', email);
        
        // Close modal and reset form
        toggleAuthModal();
        elements.registerForm.reset();
        
        showToast('Welcome!', 'Account created successfully', 'success');
        
    } catch (error) {
        console.error('Registration error:', error);
        handleAuthError(error);
    } finally {
        elements.registerBtn.disabled = false;
        elements.registerBtnText.textContent = 'Create Account';
        elements.registerSpinner.style.display = 'none';
    }
}

function handleAuthError(error) {
    let message = 'Authentication failed';
    
    switch (error.code) {
        case 'auth/email-already-in-use':
            message = 'Email already registered';
            break;
        case 'auth/user-not-found':
            message = 'No account found with this email';
            break;
        case 'auth/wrong-password':
            message = 'Incorrect password';
            break;
        case 'auth/too-many-requests':
            message = 'Too many attempts. Try again later';
            break;
        case 'auth/network-request-failed':
            message = 'Network error. Check your connection';
            break;
        default:
            message = error.message;
    }
    
    showToast('Authentication Failed', message, 'error');
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function togglePassword(passwordId) {
    const passwordField = document.getElementById(passwordId);
    const toggleIcon = passwordField.nextElementSibling.querySelector('i');
    
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        toggleIcon.className = 'fas fa-eye-slash';
    } else {
        passwordField.type = 'password';
        toggleIcon.className = 'fas fa-eye';
    }
}

function switchAuthTab(tab) {
    // Update tabs
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    
    document.querySelector(`.auth-tab[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(`${tab}Form`).classList.add('active');
}

function showForgotPassword() {
    toggleAuthModal();
    setTimeout(() => {
        elements.forgotPasswordModal.classList.add('active');
    }, 300);
}

function closeForgotPassword() {
    elements.forgotPasswordModal.classList.remove('active');
}

async function resetPassword() {
    const email = document.getElementById('resetEmail').value.trim();
    
    if (!validateEmail(email)) {
        showToast('Invalid Email', 'Please enter a valid email address', 'error');
        return;
    }
    
    try {
        await firebase.auth().sendPasswordResetEmail(email);
        showToast('Reset Email Sent', 'Check your email for reset instructions', 'success');
        closeForgotPassword();
    } catch (error) {
        console.error('Reset password error:', error);
        showToast('Reset Failed', 'Could not send reset email', 'error');
    }
}

// Social login functions (stub implementation)
function signInWithGoogle() {
    showToast('Coming Soon', 'Google sign-in will be available soon', 'info');
}

function signInWithFacebook() {
    showToast('Coming Soon', 'Facebook sign-in will be available soon', 'info');
}

// ===== ADMIN FUNCTIONS =====

function toggleAdminPanel() {
    if (!isAdmin) {
        showToast('Access Denied', 'Admin features require admin privileges', 'warning');
        return;
    }
    
    elements.adminPanel.classList.toggle('active');
    
    if (elements.adminPanel.classList.contains('active')) {
        updateAdminStats();
    }
}

async function updateAdminStats() {
    try {
        // Get total matches
        const matchesSnapshot = await firebase.firestore()
            .collection('global_matches')
            .get();
        elements.totalMatches.textContent = matchesSnapshot.size;
        
        // Get total users
        const usersSnapshot = await firebase.firestore()
            .collection('users')
            .get();
        elements.totalUsers.textContent = usersSnapshot.size;
        
        // Get today's matches
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const todayMatchesSnapshot = await firebase.firestore()
            .collection('global_matches')
            .where('createdAt', '>=', today)
            .where('createdAt', '<', tomorrow)
            .get();
        
        elements.todayMatches.textContent = todayMatchesSnapshot.size;
        
    } catch (error) {
        console.error('Error updating admin stats:', error);
    }
}

function manageUsers() {
    showToast('Coming Soon', 'User management panel will be available soon', 'info');
}

function viewReports() {
    showToast('Coming Soon', 'Reports dashboard will be available soon', 'info');
}

function exportData() {
    showToast('Coming Soon', 'Data export feature will be available soon', 'info');
}

async function clearTestData() {
    if (!confirm('WARNING: This will delete all matches created by test users. This action cannot be undone!')) {
        return;
    }
    
    try {
        // Get all matches
        const matchesSnapshot = await firebase.firestore()
            .collection('global_matches')
            .get();
        
        let deletedCount = 0;
        
        for (const doc of matchesSnapshot.docs) {
            const matchData = doc.data();
            // Delete matches created by test users
            if (matchData.createdByEmail && (
                matchData.createdByEmail.includes('test') || 
                matchData.createdByEmail.includes('example')
            )) {
                await doc.ref.delete();
                deletedCount++;
            }
        }
        
        showToast('Test Data Cleared', `Deleted ${deletedCount} test matches`, 'success');
        
    } catch (error) {
        console.error('Error clearing test data:', error);
        showToast('Clear Failed', 'Could not clear test data', 'error');
    }
}

// ===== UI FUNCTIONS =====

function initializeMobileMenu() {
    elements.mobileMenuBtn.addEventListener('click', openMobileMenu);
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (event) => {
        if (!elements.mobileMenu.contains(event.target) && 
            !elements.mobileMenuBtn.contains(event.target) &&
            elements.mobileMenu.classList.contains('active')) {
            closeMobileMenu();
        }
    });
}

function openMobileMenu() {
    elements.mobileMenu.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
    elements.mobileMenu.classList.remove('active');
    document.body.style.overflow = '';
}

function initializeModals() {
    // Close modals on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
    
    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.classList.remove('active');
    });
    
    if (elements.adminPanel.classList.contains('active')) {
        elements.adminPanel.classList.remove('active');
    }
    
    if (elements.mobileMenu.classList.contains('active')) {
        closeMobileMenu();
    }
}

function toggleAuthModal() {
    elements.authModal.classList.toggle('active');
    if (elements.authModal.classList.contains('active')) {
        elements.loginEmail.focus();
    }
}

function toggleEventModal() {
    if (!currentUser) {
        showToast('Sign In Required', 'Please sign in to create matches', 'warning');
        toggleAuthModal();
        return;
    }
    
    elements.eventModal.classList.toggle('active');
    if (elements.eventModal.classList.contains('active')) {
        elements.matchSport.focus();
    }
}

function logoutUser() {
    if (confirm('Are you sure you want to sign out?')) {
        firebase.auth().signOut()
            .then(() => {
                showToast('Signed Out', 'You have been successfully signed out', 'info');
            })
            .catch((error) => {
                console.error('Logout error:', error);
                showToast('Logout Failed', 'Could not sign out', 'error');
            });
    }
}

// ===== UTILITY FUNCTIONS =====

function updateEmptyState() {
    const filteredMatches = filterMatches(matches);
    
    if (filteredMatches.length === 0) {
        elements.emptyState.style.display = 'block';
    } else {
        elements.emptyState.style.display = 'none';
    }
}

function syncFeed() {
    const originalHTML = elements.refreshBtn.innerHTML;
    
    // Show loading state
    elements.refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    elements.refreshBtn.disabled = true;
    
    // Force a re-render
    renderMatches(matches);
    
    // Show success animation
    document.querySelectorAll('.match-card').forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('animate-up');
        setTimeout(() => card.classList.remove('animate-up'), 1000);
    });
    
    // Show success message
    showToast('Feed Updated', 'Latest matches loaded successfully', 'success');
    
    // Restore button state
    setTimeout(() => {
        elements.refreshBtn.innerHTML = originalHTML;
        elements.refreshBtn.disabled = false;
    }, 1000);
}

function loadMoreMatches() {
    // In a real app, this would load more matches from the server
    // For now, we'll just show a toast
    showToast('Coming Soon', 'Pagination feature will be available soon', 'info');
}

function showMyMatches() {
    if (!currentUser) {
        showToast('Sign In Required', 'Please sign in to view your matches', 'warning');
        toggleAuthModal();
        return;
    }
    
    // Filter matches created by current user
    const myMatches = matches.filter(match => match.createdBy === currentUser.uid);
    renderMatches(myMatches);
    
    if (myMatches.length === 0) {
        showToast('No Matches', "You haven't created any matches yet", 'info');
    } else {
        showToast('My Matches', `Showing ${myMatches.length} matches you created`, 'success');
    }
}

function showLeaderboard() {
    showToast('Coming Soon', 'Leaderboard feature will be available soon', 'info');
}

function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatMatchDate(date, time) {
    if (!date) return 'Flexible schedule';
    
    const matchDate = new Date(date);
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    const formattedDate = matchDate.toLocaleDateString('en-US', options);
    
    if (time) {
        return `${formattedDate} at ${time}`;
    }
    
    return formattedDate;
}

// ===== TOAST SYSTEM =====

function showToast(title, message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${icons[type]}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto-remove toast after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.parentElement.removeChild(toast);
                }
            }, 300);
        }
    }, 5000);
}

// ===== ERROR HANDLING =====

window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    showToast('Application Error', 'Something went wrong. Please refresh the page.', 'error');
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    showToast('Application Error', 'An unexpected error occurred', 'error');
});

// Online/Offline detection
window.addEventListener('online', function() {
    showToast('Back Online', 'Your connection has been restored', 'success');
});

window.addEventListener('offline', function() {
    showToast('Connection Lost', 'You are currently offline', 'warning');
});

// Prevent accidental navigation
window.addEventListener('beforeunload', function(e) {
    if (currentUser && !document.querySelector('.modal-overlay.active')) {
        e.preventDefault();
        e.returnValue = '';
    }
});

// ===== EXPORT FUNCTIONS =====
// Export functions for use in HTML onclick attributes
window.toggleAuthModal = toggleAuthModal;
window.toggleEventModal = toggleEventModal;
window.toggleAdminPanel = toggleAdminPanel;
window.logoutUser = logoutUser;
window.syncFeed = syncFeed;
window.filterBySport = filterBySport;
window.filterBySkill = filterBySkill;
window.clearAllFilters = clearAllFilters;
window.applyFilters = applyFilters;
window.toggleFilters = toggleFilters;
window.quickSearch = quickSearch;
window.clearSearch = clearSearch;
window.joinMatch = joinMatch;
window.shareMatch = shareMatch;
window.deleteMatch = deleteMatch;
window.viewMatchDetails = viewMatchDetails;
window.closeMatchDetails = closeMatchDetails;
window.loadMoreMatches = loadMoreMatches;
window.showMyMatches = showMyMatches;
window.showLeaderboard = showLeaderboard;
window.manageUsers = manageUsers;
window.viewReports = viewReports;
window.exportData = exportData;
window.clearTestData = clearTestData;
window.showForgotPassword = showForgotPassword;
window.closeForgotPassword = closeForgotPassword;
window.resetPassword = resetPassword;
window.signInWithGoogle = signInWithGoogle;
window.signInWithFacebook = signInWithFacebook;
window.switchAuthTab = switchAuthTab;
window.togglePassword = togglePassword;
window.openMobileMenu = openMobileMenu;
window.closeMobileMenu = closeMobileMenu;
window.handleSearch = handleSearch;  // Fixed: Added this export

// Handle login and register form submission
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.createMatch = createMatch;