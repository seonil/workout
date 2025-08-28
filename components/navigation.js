// 공통 네비게이션 컴포넌트
class WorkoutNavigation {
    constructor() {
        this.currentPage = this.getCurrentPage();
        this.currentUser = null;
        this.isLoggedIn = false;
    }
    
    // 사용자 정보 업데이트
    updateUser(user) {
        this.currentUser = user;
        this.isLoggedIn = !!user;
        this.updateNavigationTheme();
        this.updateUserInfo();
    }
    
    getCurrentPage() {
        const path = window.location.pathname.toLowerCase();
        if (path.includes('claude')) return 'workout';
        if (path.includes('tier')) return 'tierlist';
        if (path.includes('index')) return 'dashboard';
        if (path.includes('routine')) return 'routine';
        if (path.includes('stretching')) return 'stretching';
        return 'dashboard';
    }
    
    render() {
        const navItems = [
            { id: 'dashboard', href: 'index.html', icon: '🏠', label: '홈' },
            { id: 'tierlist', href: 'tier.html', icon: '📊', label: '운동 티어리스트' },
            { id: 'workout', href: 'claude.html', icon: '🏋️', label: '운동 관리' },
            { id: 'routine', href: 'routine.html', icon: '💪', label: '하이브리드 루틴' },
            { id: 'stretching', href: 'stretching.html', icon: '🧘', label: '스트레칭' }
        ];
        
        const navHtml = `
            <nav class="workout-nav ${this.isLoggedIn ? 'logged-in' : ''}">
                <div class="nav-container">
                    <div class="nav-items">
                        ${navItems.map(item => this.renderNavItem(item)).join('')}
                    </div>
                    <div class="nav-user">
                        ${this.renderUserSection()}
                    </div>
                </div>
            </nav>
        `;
        
        return navHtml;
    }
    
    renderUserSection() {
        if (this.isLoggedIn) {
            const displayName = this.currentUser.displayName || this.currentUser.email || '사용자';
            const isAnonymous = this.currentUser.isAnonymous;
            
            return `
                <div class="user-info-nav">
                    <div class="user-avatar-nav">
                        ${isAnonymous ? '👤' : (this.currentUser.photoURL ? 
                            `<img src="${this.currentUser.photoURL}" alt="프로필" referrerpolicy="no-referrer">` : 
                            displayName.charAt(0).toUpperCase())}
                    </div>
                    <span class="user-name-nav">${isAnonymous ? '익명' : displayName}</span>
                    <button class="logout-btn-nav" id="nav-logout-btn" title="로그아웃">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M16 17v-3H9v-4h7V7l5 5-5 5M14 2a2 2 0 012 2v2h-2V4H5v16h9v-2h2v2a2 2 0 01-2 2H5a2 2 0 01-2-2V4a2 2 0 012-2h9z"/>
                        </svg>
                    </button>
                </div>
            `;
        } else {
            return `
                <button class="login-btn-nav" id="nav-login-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10a10 10 0 0 0 10-10A10 10 0 0 0 12 2Z"/>
                    </svg>
                    로그인
                </button>
            `;
        }
    }
    
    renderNavItem(item) {
        const isActive = this.currentPage === item.id;
        const activeClass = isActive ? 'active' : '';
        
        return `
            <a href="${item.href}" class="nav-item ${activeClass}">
                <span class="nav-icon">${item.icon}</span>
                <span class="nav-label">${item.label}</span>
            </a>
        `;
    }
    
    // 네비게이션을 DOM에 삽입
    init() {
        const existingNav = document.querySelector('.workout-nav');
        if (existingNav) {
            existingNav.remove();
        }
        
        document.body.insertAdjacentHTML('afterbegin', this.render());
        this.attachEventListeners();
    }
    
    attachEventListeners() {
        // 기존 네비게이션 아이템 이벤트
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                console.log('Navigating to:', e.currentTarget.href);
            });
        });
        
        // 로그인 버튼 이벤트
        const loginBtn = document.querySelector('#nav-login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                // KPR 추적기 페이지로 이동 (로그인 화면)
                window.location.href = 'claude.html';
            });
        }
        
        // 로그아웃 버튼 이벤트
        const logoutBtn = document.querySelector('#nav-logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.onLogout) {
                    this.onLogout();
                }
            });
        }
    }
    
    // 로그아웃 콜백 설정
    setLogoutCallback(callback) {
        this.onLogout = callback;
    }
    
    // 네비게이션 테마 업데이트
    updateNavigationTheme() {
        const nav = document.querySelector('.workout-nav');
        if (nav) {
            if (this.isLoggedIn) {
                nav.classList.add('logged-in');
            } else {
                nav.classList.remove('logged-in');
            }
        }
    }
    
    // 사용자 정보 업데이트
    updateUserInfo() {
        const userSection = document.querySelector('.nav-user');
        if (userSection) {
            userSection.innerHTML = this.renderUserSection();
            // 이벤트 리스너 다시 연결
            this.attachEventListeners();
        }
    }
}

// 전역에서 사용할 수 있도록 export
window.WorkoutNavigation = WorkoutNavigation;