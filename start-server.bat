@echo off
echo 로컬 웹 서버를 시작합니다...
echo.
echo 브라우저에서 http://localhost:8000/claude.html 로 접속하세요
echo 서버를 중지하려면 Ctrl+C를 누르세요
echo.
python -m http.server 8000
pause