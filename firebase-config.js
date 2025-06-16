// Replace these values with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDz_QSjc9_pWWZSc1oQfcxuM6VWJRzNvPI",
  authDomain: "patient-portal-app-48bce.firebaseapp.com",
  projectId: "patient-portal-app-48bce",
  storageBucket: "patient-portal-app-48bce.firebasestorage.app",
  messagingSenderId: "36675680327",
  appId: "1:36675680327:web:d38c1bbc7cb1f600b85962"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
