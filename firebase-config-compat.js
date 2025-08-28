// Firebase 설정 파일 (Compat 버전)
const firebaseConfig = {
    // 데모용 설정 - 실제 Firebase 프로젝트 설정으로 교체하세요
    apiKey: "demo-api-key-replace-with-your-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
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