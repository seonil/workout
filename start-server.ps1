# PowerShell 버전의 서버 시작 스크립트
Write-Host "로컬 웹 서버를 시작합니다..." -ForegroundColor Green
Write-Host ""
Write-Host "브라우저에서 http://localhost:8000/claude.html 로 접속하세요" -ForegroundColor Yellow
Write-Host "서버를 중지하려면 Ctrl+C를 누르세요" -ForegroundColor Yellow
Write-Host ""

try {
    # Python 서버 시작
    python -m http.server 8000
} catch {
    Write-Host "Python이 설치되어 있지 않습니다. Node.js 서버를 시도합니다..." -ForegroundColor Red
    
    try {
        # Node.js 서버 시작 (http-server가 설치된 경우)
        npx http-server -p 8000
    } catch {
        Write-Host "Node.js도 사용할 수 없습니다. 다음 중 하나를 설치하세요:" -ForegroundColor Red
        Write-Host "1. Python: https://python.org" -ForegroundColor White
        Write-Host "2. Node.js: https://nodejs.org" -ForegroundColor White
    }
}