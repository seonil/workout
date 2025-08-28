# 🔥 Firebase Google 인증 설정 가이드

현재 `auth/configuration-not-found` 에러가 발생하고 있습니다.
Firebase Console에서 다음 설정을 확인하고 수정해야 합니다.

## ✅ 1단계: Firebase Console 접속
1. https://console.firebase.google.com 접속
2. `healthproject-e682c` 프로젝트 선택

## ✅ 2단계: Authentication 설정
1. 좌측 메뉴에서 **"Authentication"** 클릭
2. **"Sign-in method"** 탭 클릭
3. **"Google"** 제공업체 클릭
4. **"Enable"** 토글을 **ON**으로 설정
5. **"Project public-facing name"**: `KPR 추적기` 입력
6. **"Project support email"**: 본인 이메일 주소 입력
7. **"Save"** 클릭

## ✅ 3단계: 승인된 도메인 추가
1. Authentication > Settings > **"Authorized domains"** 섹션
2. **"Add domain"** 클릭
3. 다음 도메인들을 추가:
   ```
   localhost
   127.0.0.1
   ```

## ✅ 4단계: OAuth 동의 화면 설정 (Google Cloud Console)
1. https://console.cloud.google.com 접속
2. `healthproject-e682c` 프로젝트 선택
3. **"APIs & Services"** > **"OAuth consent screen"** 이동
4. **"User Type"**: External 선택
5. **"App name"**: `KPR 추적기` 입력
6. **"User support email"**: 본인 이메일 주소
7. **"Developer contact information"**: 본인 이메일 주소
8. **"Save and Continue"** 클릭

## ✅ 5단계: 테스트 사용자 추가 (개발 중)
1. OAuth consent screen > **"Test users"** 탭
2. **"Add users"** 클릭
3. 테스트에 사용할 Google 계정 이메일 주소 추가

## ⚠️ 문제 해결

### 현재 발생 중인 에러들:
- `CONFIGURATION_NOT_FOUND`: Google 인증이 활성화되지 않음
- `400 Bad Request`: 프로젝트 설정 오류

### 해결 방법:
1. **즉시 해결**: 위의 1-3단계 필수 완료
2. **완전한 해결**: 1-5단계 모두 완료

## 🚀 설정 완료 후 테스트

설정 완료 후:
1. 브라우저 새로고침 (`Ctrl + F5`)
2. `http://localhost:8000/claude.html` 접속
3. Google 로그인 버튼 클릭
4. Google 계정으로 로그인 테스트

## 📋 체크리스트

- [ ] Firebase Authentication 활성화
- [ ] Google 로그인 제공업체 활성화
- [ ] 승인된 도메인 추가 (localhost, 127.0.0.1)
- [ ] OAuth 동의 화면 설정
- [ ] 테스트 사용자 추가
- [ ] 브라우저 새로고침 후 테스트

## 💡 추가 팁

- **개발 환경**: `localhost:8000`에서 테스트
- **실제 배포 시**: 실제 도메인도 승인된 도메인에 추가 필요
- **보안**: API 키는 공개 저장소에 업로드하지 마세요

위 설정을 완료하시면 Google 인증이 정상 작동할 것입니다! 🎉