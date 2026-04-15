param()

$ErrorActionPreference = "Stop"

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$pidFile = Join-Path $projectDir ".lan-server.pid"

if (-not (Test-Path -LiteralPath $pidFile)) {
  Write-Host "没有发现正在运行的局域网服务器。" -ForegroundColor Yellow
  exit 0
}

$rawPid = (Get-Content -LiteralPath $pidFile -Raw).Trim()
if (-not $rawPid) {
  Remove-Item -LiteralPath $pidFile -Force
  Write-Host "PID 文件为空，已清理。" -ForegroundColor Yellow
  exit 0
}

$process = Get-Process -Id ([int]$rawPid) -ErrorAction SilentlyContinue
if ($process) {
  Stop-Process -Id ([int]$rawPid) -Force
  Write-Host "局域网服务器已停止，PID: $rawPid" -ForegroundColor Green
} else {
  Write-Host "服务器进程已不存在，已清理 PID 文件。" -ForegroundColor Yellow
}

Remove-Item -LiteralPath $pidFile -Force
