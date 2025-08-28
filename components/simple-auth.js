// 간단한 인증 시스템 (Firebase 없이)
class SimpleAuth {
    constructor() {
        this.currentUser = this.loadUser();
        this.isAuthenticated = !!this.currentUser;
    }
    
    // 사용자 정보 로드
    loadUser() {
        try {
            const userData = localStorage.getItem('simple-auth-user');
            return userData ? JSON.parse(userData) : null;
        } catch {
            return null;
        }
    }
    
    // 사용자 정보 저장
    saveUser(user) {
        localStorage.setItem('simple-auth-user', JSON.stringify(user));
        this.currentUser = user;
        this.isAuthenticated = true;
    }
    
    // 익명 로그인
    async signInAnonymously() {
        const anonymousUser = {
            uid: 'anonymous_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            email: null,
            displayName: '익명 사용자',
            isAnonymous: true,
            photoURL: null,
            createdAt: new Date().toISOString()
        };
        
        this.saveUser(anonymousUser);
        return anonymousUser;
    }
    
    // 가짜 Google 로그인 (시뮬레이션)
    async signInWithGoogle() {
        // 실제로는 사용자 입력을 받아야 하지만, 데모용으로 자동 생성
        const googleUser = {
            uid: 'google_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            email: 'demo@example.com',
            displayName: '데모 사용자',
            isAnonymous: false,
            photoURL: 'https://via.placeholder.com/40',
            createdAt: new Date().toISOString()
        };
        
        this.saveUser(googleUser);
        return googleUser;
    }
    
    // 로그아웃
    async signOut() {
        localStorage.removeItem('simple-auth-user');
        this.currentUser = null;
        this.isAuthenticated = false;
    }
    
    // 현재 사용자 반환
    getCurrentUser() {
        return this.currentUser;
    }
    
    // 로그인 상태 확인
    isLoggedIn() {
        return this.isAuthenticated;
    }
    
    // 인증 상태 변화 리스너 (Firebase와 호환성을 위해)
    onAuthStateChanged(callback) {
        // 즉시 현재 상태로 콜백 실행
        setTimeout(() => callback(this.currentUser), 0);
        
        // 상태 변화 감지를 위한 이벤트 리스너
        window.addEventListener('simple-auth-state-changed', (event) => {
            callback(event.detail.user);
        });
    }
    
    // 상태 변화 알림
    notifyAuthStateChanged(user) {
        const event = new CustomEvent('simple-auth-state-changed', {
            detail: { user }
        });
        window.dispatchEvent(event);
    }
}

// Firebase 호환 인터페이스를 제공하는 래퍼
class SimpleCloudDataManager {
    constructor() {
        this.auth = new SimpleAuth();
        this.currentUser = null;
        this.localDataManager = null;
        
        // 인증 상태 변화 감지
        this.auth.onAuthStateChanged((user) => {
            this.currentUser = user;
        });
    }
    
    setLocalDataManager(localManager) {
        this.localDataManager = localManager;
    }
    
    async signInWithGoogle() {
        const user = await this.auth.signInWithGoogle();
        this.auth.notifyAuthStateChanged(user);
        return user;
    }
    
    async signInAnonymously() {
        const user = await this.auth.signInAnonymously();
        this.auth.notifyAuthStateChanged(user);
        return user;
    }
    
    async signOutUser() {
        await this.auth.signOut();
        this.auth.notifyAuthStateChanged(null);
    }
    
    getUserId() {
        return this.currentUser?.uid || 'anonymous';
    }
    
    // 데이터 저장은 모두 로컬로
    async saveWorkoutRecord(record) {
        if (this.localDataManager) {
            return this.localDataManager.addWorkoutRecord([record]);
        }
        return null;
    }
    
    async getWorkoutRecords() {
        return this.localDataManager?.getWorkoutRecords() || [];
    }
    
    async savePersonalRecord(exercise, record) {
        if (this.localDataManager) {
            const personalRecords = this.localDataManager.getPersonalRecords();
            personalRecords[exercise] = record;
            this.localDataManager.setData('personalRecords', personalRecords);
        }
        return record;
    }
    
    async getPersonalRecords() {
        return this.localDataManager?.getPersonalRecords() || {};
    }
    
    async syncLocalToCloud() {
        // 로컬 전용이므로 동기화 불필요
        console.log('로컬 전용 모드: 클라우드 동기화 생략');
    }
    
    calculateOneRM(weight, reps) {
        if (reps === 1) return weight;
        return Math.round(weight * (1 + (reps / 30)));
    }
}

// 전역에서 사용할 수 있도록 export
window.SimpleAuth = SimpleAuth;
window.SimpleCloudDataManager = SimpleCloudDataManager;