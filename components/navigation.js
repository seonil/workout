// 공통 네비게이션 컴포넌트
class WorkoutNavigation {
    constructor() {
        this.currentPage = this.getCurrentPage();
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
            <nav class="workout-nav">
                <div class="nav-container">
                    ${navItems.map(item => this.renderNavItem(item)).join('')}
                </div>
            </nav>
        `;
        
        return navHtml;
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
        // 필요시 추가적인 이벤트 리스너 등록
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                // 페이지 전환 시 데이터 동기화나 기타 로직 실행 가능
                console.log('Navigating to:', e.currentTarget.href);
            });
        });
    }
}

// 전역에서 사용할 수 있도록 export
window.WorkoutNavigation = WorkoutNavigation;