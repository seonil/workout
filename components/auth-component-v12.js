// 사용자 인증 컴포넌트 (Firebase v12)
class AuthComponent {
    constructor(cloudDataManager) {
        this.cloudDataManager = cloudDataManager;
        this.currentUser = null;
        this.isInitialized = false;
        this.init();
    }
    
    init() {
        // 인증 상태 변화 감지
        if (this.cloudDataManager) {
            this.cloudDataManager.onAuthStateChanged((user) => {
                this.currentUser = user;
                this.updateUI();
                
                if (user && !this.isInitialized) {
                    this.isInitialized = true;
                    this.onUserLoggedIn(user);
                }
            });
        }
    }
    
    // 사용자 로그인 후 콜백
    onUserLoggedIn(user) {
        const displayName = user.displayName || user.email || '사용자';
        console.log('🎉 사용자 로그인 완료:', displayName);
        
        // 환영 메시지
        this.showSuccess(`환영합니다, ${displayName}님! 🎉`);
        
        // 데이터 동기화 시작
        if (this.cloudDataManager) {
            setTimeout(() => {
                this.cloudDataManager.syncLocalToCloud();
            }, 1000);
        }
    }
    
    // 인증 UI 생성
    createAuthUI() {
        const authContainer = document.createElement('div');
        authContainer.className = 'auth-container';
        authContainer.id = 'auth-container';
        
        if (this.currentUser) {
            authContainer.innerHTML = this.createLoggedInUI();
        } else {
            authContainer.innerHTML = this.createLoginUI();
        }
        
        this.attachEventListeners(authContainer);
        return authContainer;
    }
    
    // 로그인 UI
    createLoginUI() {
        return `
            <div class="auth-card">
                <div class="auth-header">
                    <h3>🏋️ KPR 추적기</h3>
                    <p>클라우드 동기화로 어디서나 운동 기록을 관리하세요</p>
                </div>

                
                <div class="auth-buttons">
                    <button class="btn-google" id="google-login-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Google 계정으로 로그인
                    </button>
                    
                    <div class="auth-divider">
                        <span>또는</span>
                    </div>
                    
                    <button class="btn-anonymous" id="anonymous-login-btn">
                        👤 익명으로 시작하기
                    </button>
                </div>
                
                <div class="auth-note">
                    <p><strong>Google 로그인 권장:</strong> 데이터 백업과 모든 기기에서의 동기화가 지원됩니다.</p>
                    <p><strong>익명 사용:</strong> 이 기기에만 데이터가 저장되며, 앱 삭제 시 데이터가 사라집니다.</p>
                </div>
            </div>
        `;
    }
    
    // 로그인된 상태 UI
    createLoggedInUI() {
        const user = this.currentUser;
        const isAnonymous = user.isAnonymous;
        const userName = user.displayName || user.email || '사용자';
        
        return `
            <div class="user-info">
                <div class="user-avatar">
                    ${isAnonymous ? '👤' : (user.photoURL ? `<img src="${user.photoURL}" alt="프로필" referrerpolicy="no-referrer">` : '👤')}
                </div>
                <div class="user-details">
                    <div class="user-name">${isAnonymous ? '익명 사용자' : userName}</div>
                    <div class="user-email">${isAnonymous ? 'guest@local' : (user.email || '')}</div>
                    <div class="user-status">
                        <span class="status-indicator ${navigator.onLine ? 'online' : 'offline'}"></span>
                        ${navigator.onLine ? '온라인 - 동기화 활성' : '오프라인 - 로컬 저장'}
                    </div>
                </div>
                <div class="user-actions">
                    ${isAnonymous ? `
                        <button class="btn-upgrade" id="upgrade-account-btn">
                            🔄 Google 계정 연결
                        </button>
                    ` : ''}
                    <button class="btn-logout" id="logout-btn">
                        ${isAnonymous ? '종료' : '로그아웃'}
                    </button>
                </div>
            </div>
        `;
    }
    
    // 이벤트 리스너 연결
    attachEventListeners(container) {
        // Google 로그인
        const googleBtn = container.querySelector('#google-login-btn');
        if (googleBtn) {
            googleBtn.addEventListener('click', () => this.handleGoogleLogin());
        }
        
        // 익명 로그인
        const anonymousBtn = container.querySelector('#anonymous-login-btn');
        if (anonymousBtn) {
            anonymousBtn.addEventListener('click', () => this.handleAnonymousLogin());
        }
        
        // 로그아웃
        const logoutBtn = container.querySelector('#logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
        
        // 계정 업그레이드
        const upgradeBtn = container.querySelector('#upgrade-account-btn');
        if (upgradeBtn) {
            upgradeBtn.addEventListener('click', () => this.handleGoogleLogin());
        }
    }
    
    // Google 로그인 처리
    async handleGoogleLogin() {
        try {
            this.showLoading('Google 계정으로 로그인 중...');
            
            const user = await this.cloudDataManager.signInWithGoogle();
            
            this.showSuccess(`Google 로그인 성공! 환영합니다, ${user.displayName || user.email}님! 🎉`);
            
        } catch (error) {
            console.error('Google 로그인 에러:', error);
            
            if (error.code === 'auth/configuration-not-found') {
                this.showError(`🔧 Firebase 설정이 필요합니다!\n\n다음 단계를 완료해 주세요:\n1. Firebase Console > Authentication 활성화\n2. Google 로그인 제공업체 활성화\n3. 승인된 도메인에 'localhost' 추가\n\n자세한 내용은 FIREBASE-SETUP.md 파일을 확인하세요.`);
            } else if (error.code === 'auth/popup-closed-by-user') {
                this.showError('로그인 창이 닫혔습니다. 다시 시도해 주세요.');
            } else if (error.code === 'auth/popup-blocked') {
                this.showError('팝업이 차단되었습니다. 브라우저 설정을 확인해 주세요.');
            } else if (error.code === 'auth/network-request-failed') {
                this.showError('네트워크 연결을 확인해 주세요.');
            } else {
                this.showError(`로그인 실패: ${error.message}\n\n에러 코드: ${error.code}`);
            }
        } finally {
            this.hideLoading();
        }
    }
    
    // 익명 로그인 처리
    async handleAnonymousLogin() {
        try {
            this.showLoading('익명 계정으로 시작 중...');
            
            const user = await this.cloudDataManager.signInAnonymously();
            
            this.showSuccess('익명 로그인 성공! 바로 시작하실 수 있습니다. 👤');
            
        } catch (error) {
            console.error('익명 로그인 에러:', error);
            this.showError(`익명 로그인 실패: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }
    
    // 로그아웃 처리
    async handleLogout() {
        const isAnonymous = this.currentUser?.isAnonymous;
        const confirmMessage = isAnonymous 
            ? '익명 세션을 종료하시겠습니까?' 
            : '로그아웃 하시겠습니까? 로컬 데이터는 보존됩니다.';
            
        if (!confirm(confirmMessage)) return;
        
        try {
            this.showLoading('로그아웃 중...');
            
            await this.cloudDataManager.signOutUser();
            
            this.showSuccess(isAnonymous ? '세션이 종료되었습니다.' : '로그아웃되었습니다. 👋');
            
        } catch (error) {
            console.error('로그아웃 에러:', error);
            this.showError(`로그아웃 실패: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }
    
    // UI 업데이트
    updateUI() {
        const authContainer = document.getElementById('auth-container');
        if (authContainer) {
            if (this.currentUser) {
                authContainer.innerHTML = this.createLoggedInUI();
            } else {
                authContainer.innerHTML = this.createLoginUI();
            }
            this.attachEventListeners(authContainer);
        }
    }
    
    // 로딩 표시
    showLoading(message) {
        const loadingEl = document.createElement('div');
        loadingEl.id = 'auth-loading';
        loadingEl.className = 'auth-loading';
        loadingEl.innerHTML = `
            <div class="loading-overlay">
                <div class="loading-spinner"></div>
                <div class="loading-message">${message}</div>
                <div class="loading-tip">잠시만 기다려 주세요...</div>
            </div>
        `;
        document.body.appendChild(loadingEl);
    }
    
    // 로딩 숨김
    hideLoading() {
        const loadingEl = document.getElementById('auth-loading');
        if (loadingEl) {
            loadingEl.remove();
        }
    }
    
    // 성공 메시지
    showSuccess(message) {
        this.showToast(message, 'success', 4000);
    }
    
    // 에러 메시지
    showError(message) {
        this.showToast(message, 'error', 6000);
    }
    
    // 토스트 메시지
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `auth-toast toast-${type}`;
        
        const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
        toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-message">${message}</span>`;
        
        document.body.appendChild(toast);
        
        // 애니메이션
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
        
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, duration);
        
        // 클릭시 즉시 닫기
        toast.addEventListener('click', () => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        });
    }
    
    // 사용자 정보 반환
    getCurrentUser() {
        return this.currentUser;
    }
    
    // 로그인 상태 확인
    isLoggedIn() {
        return !!this.currentUser;
    }
}

// 전역에서 사용할 수 있도록 export
window.AuthComponent = AuthComponent;
export default AuthComponent;