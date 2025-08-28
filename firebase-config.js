// Firebase 설정 파일
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase 설정 정보 (실제 사용 시 환경변수로 관리하세요)
const firebaseConfig = {
  // 여기에 Firebase Console에서 받은 설정 정보를 입력하세요
  // apiKey: "your-api-key",
  // authDomain: "your-project.firebaseapp.com",
  // projectId: "your-project-id",
  // storageBucket: "your-project.appspot.com",
  // messagingSenderId: "123456789",
  // appId: "your-app-id"
  
  // 개발용 더미 설정 (실제 Firebase 프로젝트 생성 후 교체 필요)
  apiKey: "demo-api-key",
  authDomain: "workout-kpr-tracker.firebaseapp.com",
  projectId: "workout-kpr-tracker",
  storageBucket: "workout-kpr-tracker.appspot.com",
  messagingSenderId: "123456789",
  appId: "demo-app-id"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Firestore 데이터베이스 초기화
export const db = getFirestore(app);

// Authentication 초기화
export const auth = getAuth(app);

// 기본 앱 export
export default app;