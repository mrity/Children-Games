param(
  [int]$Port = 8080
)

$ErrorActionPreference = "Stop"

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$pidFile = Join-Path $projectDir ".lan-server.pid"
$stdoutLog = Join-Path $projectDir ".lan-server.stdout.log"
$stderrLog = Join-Path $projectDir ".lan-server.stderr.log"

function Get-LanIps {
  Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object {
      $_.IPAddress -notlike "127.*" -and
      $_.IPAddress -notlike "169.254*" -and
      $_.PrefixOrigin -ne "WellKnown"
    } |
    Select-Object -ExpandProperty IPAddress -Unique
}

function Remove-StalePidFile {
  if (-not (Test-Path -LiteralPath $pidFile)) {
    return
  }

  $rawPid = (Get-Content -LiteralPath $pidFile -Raw).Trim()
  if (-not $rawPid) {
    Remove-Item -LiteralPath $pidFile -Force
    return
  }

  $running = Get-Process -Id ([int]$rawPid) -ErrorAction SilentlyContinue
  if (-not $running) {
    Remove-Item -LiteralPath $pidFile -Force
  }
}

function Show-Urls {
  param([int]$ListenPort)

  $ips = Get-LanIps
  Write-Host ""
  Write-Host "本机访问：" -ForegroundColor Cyan
  Write-Host "  http://127.0.0.1:$($ListenPort)/index.html"
  if ($ips) {
    Write-Host ""
    Write-Host "局域网访问：" -ForegroundColor Cyan
    foreach ($ip in $ips) {
      Write-Host "  http://$($ip):$($ListenPort)/index.html"
    }
  }
  Write-Host ""
}

Remove-StalePidFile

if (Test-Path -LiteralPath $pidFile) {
  $existingPid = (Get-Content -LiteralPath $pidFile -Raw).Trim()
  $process = Get-Process -Id ([int]$existingPid) -ErrorAction SilentlyContinue
  if ($process) {
    Write-Host "局域网服务器已经在运行，PID: $existingPid" -ForegroundColor Yellow
    Show-Urls -ListenPort $Port
    exit 0
  }
  Remove-Item -LiteralPath $pidFile -Force
}

$tcpInUse = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($tcpInUse) {
  Write-Error "端口 $Port 已被其他程序占用，请换一个端口重新启动。"
}

$python = (Get-Command python -ErrorAction Stop).Source
$pythonDir = Split-Path -Parent $python
$pythonw = Join-Path $pythonDir "pythonw.exe"
$pythonExe = if (Test-Path -LiteralPath $pythonw) { $pythonw } else { $python }

if (Test-Path -LiteralPath $stdoutLog) {
  Remove-Item -LiteralPath $stdoutLog -Force
}
if (Test-Path -LiteralPath $stderrLog) {
  Remove-Item -LiteralPath $stderrLog -Force
}

$arguments = @("-m", "http.server", "$Port", "--bind", "0.0.0.0")
$process = Start-Process `
  -FilePath $pythonExe `
  -ArgumentList $arguments `
  -WorkingDirectory $projectDir `
  -PassThru `
  -WindowStyle Hidden `
  -RedirectStandardOutput $stdoutLog `
  -RedirectStandardError $stderrLog

$process.Id | Set-Content -LiteralPath $pidFile -Encoding ASCII

Start-Sleep -Milliseconds 700

$running = Get-Process -Id $process.Id -ErrorAction SilentlyContinue
if (-not $running) {
  Write-Error "服务器启动失败，请检查 .lan-server.stderr.log。"
}

Write-Host "局域网服务器已启动，PID: $($process.Id)" -ForegroundColor Green
Show-Urls -ListenPort $Port
