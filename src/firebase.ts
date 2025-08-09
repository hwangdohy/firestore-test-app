import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase 설정
// 실제 프로젝트에서는 환경변수로 관리하는 것을 권장합니다
const firebaseConfig = {
  apiKey: "AIzaSyAJa0OimjMiuxlg3Nt6r_E_RjN9KgET4nw",
  authDomain: "where-s-d-class.firebaseapp.com",
  projectId: "where-s-d-class",
  storageBucket: "where-s-d-class.firebasestorage.app",
  messagingSenderId: "618518853469",
  appId: "1:618518853469:web:d7ac3f1cf66fb5f9485ab4",
  measurementId: "G-C6QG6SWEX1"
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// Firestore 데이터베이스 초기화
export const db = getFirestore(app);

export default app;
