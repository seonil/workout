# 🔥 Firebase Google 로그인 사용 방법

Firebase Google 로그인은 보안상 `file://` 프로토콜을 지원하지 않습니다.
따라서 로컬 웹 서버를 통해 접속해야 합니다.

## 📋 해결 방법

### 방법 1: Python 사용 (권장)
```bash
# 1. 명령 프롬프트(cmd)를 열고 프로젝트 폴더로 이동
cd C:\Users\DesingLab3070\Documents\workout

# 2. Python 웹 서버 실행
python -m http.server 8000

# 3. 브라우저에서 접속
http://localhost:8000/claude.html
```

### 방법 2: 배치 파일 사용
1. `start-server.bat` 파일을 더블클릭
2. 브라우저에서 `http://localhost:8000/claude.html`로 접속

### 방법 3: PowerShell 사용
1. PowerShell을 관리자 권한으로 실행
2. `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
3. `.\start-server.ps1` 실행

### 방법 4: Node.js 사용
```bash
# npx 사용 (Node.js 설치 필요)
npx http-server -p 8000

# 또는 http-server 글로벌 설치 후 사용
npm install -g http-server
http-server -p 8000
```

### 방법 5: Live Server (VS Code 확장)
1. VS Code에서 "Live Server" 확장 설치
2. `claude.html` 파일을 우클릭 → "Open with Live Server"

## ⚠️ 중요 사항

- **절대 `file://`로 직접 열지 마세요**
- **반드시 `http://` 또는 `https://`로 접속하세요**
- 서버 실행 중에는 명령 프롬프트/PowerShell 창을 닫지 마세요

## 🎯 접속 URL

서버 실행 후 다음 URL로 접속:
- **KPR 추적기**: http://localhost:8000/claude.html
- **메인 대시보드**: http://localhost:8000/index.html
- **운동 티어리스트**: http://localhost:8000/tier.html
- **루틴 플래너**: http://localhost:8000/routine.html
- **스트레칭 가이드**: http://localhost:8000/stretching.html

## 🔧 문제 해결

### Python이 설치되어 있지 않은 경우:
1. https://python.org 에서 Python 다운로드 및 설치
2. 설치 시 "Add Python to PATH" 옵션 체크

### 포트 8000이 사용 중인 경우:
```bash
python -m http.server 8080  # 다른 포트 사용
# 접속 URL: http://localhost:8080/claude.html
```

이제 로컬 서버를 통해 Firebase Google 로그인이 정상 작동합니다! 🚀