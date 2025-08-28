// Firebase 설정 파일 (Compat 버전)
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
firebase.initializeApp(firebaseConfig);

// Firestore 데이터베이스 초기화
const db = firebase.firestore();

// Authentication 초기화
const auth = firebase.auth();

// 전역으로 export
window.firebaseApp = firebase;
window.db = db;
window.auth = auth;