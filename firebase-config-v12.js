// Firebase v12 모던 SDK 설정
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore, connectFirestoreEmulator } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { getAuth, connectAuthEmulator } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js";

// Firebase 설정 (실제 프로젝트 설정값)
const firebaseConfig = {
    apiKey: "AIzaSyBSt4LChzWMoH7GC4L4IttIkAgArci4Gss",
    authDomain: "healthproject-e682c.firebaseapp.com",
    projectId: "healthproject-e682c",
    storageBucket: "healthproject-e682c.firebasestorage.app",
    messagingSenderId: "192611227289",
    appId: "1:192611227289:web:7b68f366cefb3ba7018a08",
    measurementId: "G-H97Z9HGD55"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// 서비스 초기화
const db = getFirestore(app);
const auth = getAuth(app);
let analytics = null;

// Analytics 초기화 (HTTPS 환경에서만)
try {
    if (location.protocol === 'https:') {
        analytics = getAnalytics(app);
    }
} catch (error) {
    console.warn('Analytics 초기화 실패 (개발 환경에서는 정상):', error.message);
}

// 전역으로 export
window.firebaseApp = app;
window.db = db;
window.auth = auth;
window.analytics = analytics;

console.log('Firebase v12 초기화 완료');

export { app, db, auth, analytics };