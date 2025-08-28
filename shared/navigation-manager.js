// 전역 네비게이션 관리자
class NavigationManager {
    constructor() {
        this.navigation = null;
        this.currentUser = null;
        this.authListeners = [];
    }
    
    // 네비게이션 초기화
    init() {
        if (!this.navigation) {
            this.navigation = new WorkoutNavigation();
            
            // 로그아웃 콜백 설정
            this.navigation.setLogoutCallback(() => this.handleLogout());
        }
        
        // 기존 네비게이션 제거 (중복 방지)
        const existingNavs = document.querySelectorAll('.workout-nav');
        existingNavs.forEach(nav => nav.remove());
        
        // 페이지별 사용자 정보 동기화 시도
        this.syncUserInfo();
        
        return this.navigation;
    }
    
    // 사용자 정보 동기화 (탭 간 로그인 상태 유지)
    syncUserInfo() {
        try {
            // localStorage에서 사용자 정보 확인
            const userDataStr = localStorage.getItem('workout-user-info');
            if (userDataStr && userDataStr !== 'null' && userDataStr !== 'undefined') {
                const userData = JSON.parse(userDataStr);
                // 사용자 데이터 유효성 검사
                if (userData && (userData.uid || userData.email)) {
                    this.updateUser(userData);
                    console.log('localStorage에서 사용자 정보 복원:', userData.email || userData.uid);
                }
            }
            
            // storage 이벤트 리스너 등록 (다른 탭에서 로그인/로그아웃 감지)
            window.addEventListener('storage', (e) => {
                if (e.key === 'workout-user-info') {
                    if (e.newValue && e.newValue !== 'null' && e.newValue !== 'undefined') {
                        try {
                            const userData = JSON.parse(e.newValue);
                            if (userData && (userData.uid || userData.email)) {
                                this.updateUser(userData);
                                console.log('다른 탭에서 로그인 감지:', userData.email || userData.uid);
                            }
                        } catch (error) {
                            console.error('탭 간 사용자 정보 동기화 실패:', error);
                        }
                    } else {
                        // 로그아웃된 경우
                        console.log('다른 탭에서 로그아웃 감지');
                        this.updateUser(null);
                    }
                }
            });
        } catch (error) {
            console.log('사용자 정보 동기화 실패 (정상적인 경우일 수 있음):', error);
        }
    }
    
    // 사용자 정보 업데이트
    updateUser(user) {
        this.currentUser = user;
        
        // localStorage에 사용자 정보 저장
        if (user && (user.uid || user.email)) {
            try {
                const userInfo = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    isAnonymous: user.isAnonymous || false
                };
                localStorage.setItem('workout-user-info', JSON.stringify(userInfo));
                console.log('사용자 정보 localStorage 저장:', user.email || user.uid);
            } catch (error) {
                console.error('사용자 정보 저장 실패:', error);
            }
        } else {
            try {
                localStorage.removeItem('workout-user-info');
                console.log('사용자 정보 localStorage 제거');
            } catch (error) {
                console.error('사용자 정보 제거 실패:', error);
            }
        }
        
        // 네비게이션 업데이트
        if (this.navigation) {
            this.navigation.updateUser(user);
        }
        
        // 인증 리스너들에게 알림
        this.authListeners.forEach(callback => {
            try {
                callback(user);
            } catch (error) {
                console.error('인증 리스너 실행 실패:', error);
            }
        });
    }
    
    // 인증 상태 변화 리스너 등록
    onAuthStateChanged(callback) {
        this.authListeners.push(callback);
        // 현재 상태로 즉시 콜백 실행
        callback(this.currentUser);
    }
    
    // 로그아웃 처리
    async handleLogout() {
        const confirmMessage = this.currentUser?.isAnonymous 
            ? '익명 세션을 종료하시겠습니까?' 
            : '로그아웃 하시겠습니까?';
            
        if (!confirm(confirmMessage)) return;
        
        try {
            // Firebase 로그아웃 함수가 있으면 실행
            if (this.firebaseLogout) {
                await this.firebaseLogout();
            }
            
            // 사용자 정보 초기화
            this.updateUser(null);
            
            // 성공 메시지
            console.log('로그아웃 완료');
            
            // KPR 추적기 페이지에서 로그아웃한 경우, 메인으로 이동
            if (window.location.pathname.includes('claude.html')) {
                window.location.href = 'index.html';
            } else {
                // 다른 페이지에서는 페이지 새로고침
                window.location.reload();
            }
        } catch (error) {
            console.error('로그아웃 처리 실패:', error);
            // Firebase 오류가 있어도 로컬 로그아웃은 진행
            this.updateUser(null);
            
            // 페이지 이동/새로고침 진행
            if (window.location.pathname.includes('claude.html')) {
                window.location.href = 'index.html';
            } else {
                window.location.reload();
            }
        }
    }
    
    // 현재 사용자 정보 반환
    getCurrentUser() {
        return this.currentUser;
    }
    
    // 로그인 상태 확인
    isLoggedIn() {
        return !!this.currentUser;
    }
}

// 전역 인스턴스 생성
window.navigationManager = new NavigationManager();
window.NavigationManager = NavigationManager;