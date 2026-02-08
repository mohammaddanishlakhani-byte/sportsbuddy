/**
 * Firebase Configuration for SportsBuddy v3.2
 * Enhanced with better error handling and admin features
 */

// Firebase configuration - Using your existing project
const firebaseConfig = {
    apiKey: "AIzaSyDlv5Ts3613LNGkgTzmnaAmAs4x2N1QhNQ",
    authDomain: "sports-buddy-6318f.firebaseapp.com",
    projectId: "sports-buddy-6318f",
    storageBucket: "sports-buddy-6318f.firebasestorage.app",
    messagingSenderId: "269708690682",
    appId: "1:269708690682:web:34b1fcc1c35bed7646f543"
};

// Initialize Firebase with error handling
try {
    // Check if Firebase is already initialized
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log('🔥 Firebase initialized successfully');
    } else {
        firebase.app(); // Use existing app
        console.log('🔥 Firebase already initialized');
    }
} catch (error) {
    console.error('Firebase initialization error:', error);
    
    // Show user-friendly error message
    if (typeof showToast === 'function') {
        showToast('Firebase Error', 'Unable to connect to database. Please check your connection.', 'error');
    }
}

// Make Firebase globally available
window.firebase = firebase;

// Firebase Services
const auth = firebase.auth();
const firestore = firebase.firestore();
const storage = firebase.storage ? firebase.storage() : null;

// Export Firebase services for use in app.js
window.firebaseAuth = auth;
window.firebaseFirestore = firestore;
window.firebaseStorage = storage;

// Firebase Emulator Settings (for development)
if (window.location.hostname === 'localhost') {
    console.log('🔧 Running on localhost - Using Firebase emulators');
    
    // Uncomment these lines if you have Firebase emulators running
    /*
    auth.useEmulator('http://localhost:9099');
    firestore.useEmulator('localhost', 8080);
    if (storage) {
        storage.useEmulator('localhost', 9199);
    }
    */
}

// Firebase Performance Monitoring (if available)
if (firebase.performance) {
    const perf = firebase.performance();
    console.log('📊 Firebase Performance Monitoring enabled');
}

// Firebase Analytics (if available)
if (firebase.analytics) {
    const analytics = firebase.analytics();
    console.log('📈 Firebase Analytics enabled');
}

// Error handling for Firebase services
auth.onAuthStateChanged((user) => {
    console.log('Auth state changed:', user ? 'User signed in' : 'No user');
}, (error) => {
    console.error('Auth state change error:', error);
});

// Firestore settings for better performance
firestore.settings({
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
    experimentalForceLongPolling: true // Better for some networks
});

// Export a helper function to check Firebase connection
window.checkFirebaseConnection = async function() {
    try {
        await firestore.collection('test').doc('test').get();
        return true;
    } catch (error) {
        console.error('Firebase connection test failed:', error);
        return false;
    }
};

// Initialize connection test on page load
window.addEventListener('load', async () => {
    const isConnected = await window.checkFirebaseConnection();
    if (!isConnected && typeof showToast === 'function') {
        setTimeout(() => {
            showToast('Connection Warning', 'Having trouble connecting to database', 'warning');
        }, 2000);
    }
});

// Add timestamp converter for Firestore
firebase.firestore.FieldValue.serverTimestamp();

// Helper function to convert Firestore timestamps to readable dates
window.formatFirebaseTimestamp = function(timestamp) {
    if (!timestamp) return 'N/A';
    
    try {
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Error formatting timestamp:', error);
        return 'Invalid date';
    }
};

// Export Firebase configuration for debugging
window.firebaseConfig = firebaseConfig;