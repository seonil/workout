// Runtime patch to enhance Google login robustness (popup fallback + timeout)
// This extends AuthComponent to add a safe handler and redirects existing
// handleGoogleLogin calls to the safer implementation without touching the original file.

function installAuthComponentPatch() {
  const AC = window.AuthComponent;
  if (!AC) return;
  if (AC.prototype.handleGoogleLoginSafe) return; // already installed

  AC.prototype.handleGoogleLoginSafe = async function () {
    try {
      this.showLoading('Google 계정으로 로그인 중..');
      let loginTimeout = setTimeout(() => {
        try { this.hideLoading(); } catch (e) {}
        this.showError('로그인 응답이 지연됩니다. 팝업 허용과 인터넷 연결을 확인하세요.');
      }, 15000);

      const user = await this.cloudDataManager.signInWithGoogle();
      if (!user) {
        // Redirect flow is taking over
        this.showSuccess('Google 로그인 페이지로 이동합니다...');
        clearTimeout(loginTimeout);
        return;
      }
      this.showSuccess(`Google 로그인 성공! 환영합니다 ${user.displayName || user.email} 님`);
      clearTimeout(loginTimeout);

    } catch (error) {
      console.error('Google 로그인 에러:', error);
      if (error?.code === 'auth/configuration-not-found') {
        this.showError(
          "Firebase 설정이 필요합니다\n\n다음 단계를 확인해 주세요\n1. Firebase Console > Authentication 활성화\n2. Google 로그인 공급자 활성화\n3. 허용된 도메인에 'localhost' 추가\n\n자세한 내용은 FIREBASE-SETUP.md 파일을 확인하세요"
        );
      } else if (
        ['auth/popup-blocked','auth/cancelled-popup-request','auth/operation-not-supported-in-this-environment','auth/internal-error']
          .includes(error?.code)
      ) {
        try {
          const m = await import('https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js');
          await m.signInWithRedirect(window.auth, new m.GoogleAuthProvider());
          return;
        } catch (redirectErr) {
          console.error('Redirect 로그인도 실패:', redirectErr);
          this.showError('로그인 창이 차단되었거나 환경에서 지원되지 않습니다. 다른 브라우저를 사용하거나 팝업을 허용해 주세요.');
        }
      } else if (error?.code === 'auth/popup-closed-by-user') {
        this.showError('로그인 창이 닫혔습니다. 다시 시도해 주세요');
      } else if (error?.code === 'auth/popup-blocked') {
        this.showError('팝업이 차단되었습니다. 브라우저 설정을 확인해 주세요');
      } else if (error?.code === 'auth/network-request-failed') {
        this.showError('네트워크 연결을 확인해 주세요');
      } else {
        this.showError(`로그인 실패: ${error?.message || error}`);
      }
    } finally {
      try { this.hideLoading(); } catch (e) {}
    }
  };

  // Redirect original method to safe version so existing listeners work
  AC.prototype.handleGoogleLogin = function (...args) {
    return this.handleGoogleLoginSafe(...args);
  };
}

// Install when definitions are ready
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  installAuthComponentPatch();
} else {
  document.addEventListener('DOMContentLoaded', installAuthComponentPatch);
}

export {};

