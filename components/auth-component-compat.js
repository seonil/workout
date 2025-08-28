// 사용자 인증 컴포넌트 (Compat 버전)
class AuthComponent {
    constructor(cloudDataManager) {
        this.cloudDataManager = cloudDataManager;
        this.currentUser = null;
        this.isInitialized = false;
        this.auth = window.auth;
        this.init();
    }
    
    init() {
        // 인증 상태 변화 감지
        if (this.auth) {
            this.auth.onAuthStateChanged((user) => {
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
        console.log('사용자 로그인:', user.email || user.uid);
        // 데이터 동기화 시작
        if (this.cloudDataManager) {
            this.cloudDataManager.syncLocalToCloud();
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
                
                <div class="auth-benefits">
                    <div class="benefit-item">
                        <span class="benefit-icon">☁️</span>
                        <span>클라우드 백업</span>
                    </div>
                    <div class="benefit-item">
                        <span class="benefit-icon">📱</span>
                        <span>기기 간 동기화</span>
                    </div>
                    <div class="benefit-item">
                        <span class="benefit-icon">📊</span>
                        <span>진행 상황 분석</span>
                    </div>
                </div>
                
                <div class="auth-buttons">
                    <button class="btn-google" id="google-login-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Google 계정으로 계속하기
                    </button>
                    
                    <div class="auth-divider">
                        <span>또는</span>
                    </div>
                    
                    <button class="btn-anonymous" id="anonymous-login-btn">
                        👤 익명으로 사용하기
                    </button>
                </div>
                
                <div class="auth-note">
                    <p>익명 사용 시 데이터가 기기에만 저장되며, 앱 삭제 시 사라집니다.</p>
                </div>
            </div>
        `;
    }
    
    // 로그인된 상태 UI
    createLoggedInUI() {
        const user = this.currentUser;
        const isAnonymous = user.isAnonymous;
        
        return `
            <div class="user-info">
                <div class="user-avatar">
                    ${isAnonymous ? '👤' : (user.photoURL ? `<img src="${user.photoURL}" alt="프로필">` : '👤')}
                </div>
                <div class="user-details">
                    <div class="user-name">${isAnonymous ? '익명 사용자' : (user.displayName || user.email)}</div>
                    <div class="user-status">
                        <span class="status-indicator ${navigator.onLine ? 'online' : 'offline'}"></span>
                        ${navigator.onLine ? '온라인' : '오프라인'}
                    </div>
                </div>
                <div class="user-actions">
                    ${isAnonymous ? `
                        <button class="btn-upgrade" id="upgrade-account-btn">
                            🔄 Google 계정 연결
                        </button>
                    ` : ''}
                    <button class="btn-logout" id="logout-btn">로그아웃</button>
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
            await this.cloudDataManager.signInWithGoogle();
            this.showSuccess('로그인 성공!');
        } catch (error) {
            if (error.code === 'auth/configuration-not-found') {
                this.showError('Firebase 프로젝트 설정에 문제가 있습니다.\n지금은 익명 로그인을 사용하세요.');
            } else {
                this.showError('로그인 실패: ' + error.message);
            }
        } finally {
            this.hideLoading();
        }
    }
    
    // 익명 로그인 처리
    async handleAnonymousLogin() {
        try {
            this.showLoading('익명 계정으로 시작 중...');
            await this.cloudDataManager.signInAnonymously();
            this.showSuccess('익명 로그인 성공!');
        } catch (error) {
            this.showError('로그인 실패: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }
    
    // 로그아웃 처리
    async handleLogout() {
        try {
            this.showLoading('로그아웃 중...');
            await this.cloudDataManager.signOutUser();
            this.showSuccess('로그아웃되었습니다');
        } catch (error) {
            this.showError('로그아웃 실패: ' + error.message);
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
            <div class="loading-spinner"></div>
            <div class="loading-message">${message}</div>
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
        this.showToast(message, 'success');
    }
    
    // 에러 메시지
    showError(message) {
        this.showToast(message, 'error');
    }
    
    // 토스트 메시지
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `auth-toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
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