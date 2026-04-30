$ErrorActionPreference = "Stop"

$AppDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Port = 5173
$LocalUrl = "http://127.0.0.1:$Port"
$Url = $LocalUrl
$LogFile = Join-Path $AppDir "startup-log.txt"
$ServiceTitle = "Kaoyan Checkin Service"

function Get-LanUrls {
  try {
    $addresses = [System.Net.Dns]::GetHostEntry($env:COMPUTERNAME).AddressList |
      Where-Object {
        $_.AddressFamily -eq [System.Net.Sockets.AddressFamily]::InterNetwork -and
        -not [System.Net.IPAddress]::IsLoopback($_) -and
        -not $_.ToString().StartsWith("169.254.")
      } |
      ForEach-Object { $_.ToString() } |
      Sort-Object -Unique

    return $addresses | ForEach-Object { "http://$($_):$Port" }
  } catch {
    return @()
  }
}

function Write-Step {
  param([string]$Message)
  Write-Host $Message
  Add-Content -LiteralPath $LogFile -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message"
}

function Wait-ForEnter {
  param([string]$Message = "Press Enter to close this launcher.")
  Write-Host ""
  Read-Host $Message | Out-Null
}

function Test-WebReady {
  try {
    $response = Invoke-WebRequest -UseBasicParsing $Url -TimeoutSec 2
    return $response.StatusCode -eq 200
  } catch {
    return $false
  }
}

Set-Location -LiteralPath $AppDir
"[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] launcher started" | Set-Content -LiteralPath $LogFile

Write-Host ""
Write-Host "========================================"
Write-Host "  AI Kaoyan Checkin System"
Write-Host "========================================"
Write-Host ""
Write-Host "Project: $AppDir"
Write-Host "PC URL:  $LocalUrl"
$LanUrls = @(Get-LanUrls)
if ($LanUrls.Count -gt 0) {
  Write-Host "Phone URL candidates:"
  foreach ($LanUrl in $LanUrls) {
    Write-Host "  $LanUrl"
  }
} else {
  Write-Host "Phone URL: not detected. Run ipconfig and use http://YOUR_IPV4:$Port"
}
Write-Host "Log:     $LogFile"
Write-Host ""

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Step "Node.js was not found. Please install Node.js LTS from https://nodejs.org/"
  Wait-ForEnter
  exit 1
}

if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
  Write-Step "npm.cmd was not found. Please reinstall Node.js."
  Wait-ForEnter
  exit 1
}

if (-not (Test-Path -LiteralPath (Join-Path $AppDir "node_modules"))) {
  Write-Step "node_modules not found. Installing dependencies. This may take a few minutes..."
  & npm.cmd install 2>&1 | Tee-Object -FilePath $LogFile -Append
  if ($LASTEXITCODE -ne 0) {
    Write-Step "Dependency installation failed. Please check startup-log.txt."
    Wait-ForEnter
    exit 1
  }
}

Write-Step "Checking whether the website is already running..."
if (Test-WebReady) {
  Write-Step "Website is already running. Opening browser..."
  Start-Process $LocalUrl
  Write-Host ""
  Write-Host "If your phone cannot open the Phone URL, close the old '$ServiceTitle' window and run this launcher again."
  if ($LanUrls.Count -gt 0) {
    Write-Host "Use one of these URLs on your phone while connected to the same Wi-Fi:"
    foreach ($LanUrl in $LanUrls) {
      Write-Host "  $LanUrl"
    }
  }
  Wait-ForEnter
  exit 0
}

Write-Step "Starting Vite dev server..."

$escapedAppDir = $AppDir.Replace("'", "''")
$escapedLogFile = $LogFile.Replace("'", "''")
$serviceCommand = @"
`$Host.UI.RawUI.WindowTitle = '$ServiceTitle'
Set-Location -LiteralPath '$escapedAppDir'
& npm.cmd run dev -- --host 0.0.0.0 --port $Port 2>&1 | Tee-Object -FilePath '$escapedLogFile' -Append
Write-Host ''
Read-Host 'Service stopped. Press Enter to close this service window' | Out-Null
"@

$encodedCommand = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($serviceCommand))
Start-Process -FilePath "powershell.exe" `
  -ArgumentList @("-NoExit", "-ExecutionPolicy", "Bypass", "-EncodedCommand", $encodedCommand) `
  -WorkingDirectory $AppDir

Write-Step "Waiting for website to become ready..."
for ($i = 1; $i -le 30; $i++) {
  if (Test-WebReady) {
    Write-Step "Website is ready. Opening browser..."
    Start-Process $LocalUrl
    Write-Host ""
    Write-Host "Keep the '$ServiceTitle' window open while using the website."
    if ($LanUrls.Count -gt 0) {
      Write-Host ""
      Write-Host "Use one of these URLs on your phone while connected to the same Wi-Fi:"
      foreach ($LanUrl in $LanUrls) {
        Write-Host "  $LanUrl"
      }
    }
    Write-Host ""
    Write-Host "If Windows Firewall asks for permission, allow Node.js on Private networks."
    Wait-ForEnter
    exit 0
  }
  Start-Sleep -Seconds 1
}

Write-Step "Website failed to start within 30 seconds."
Write-Host ""
Write-Host "Last log lines:"
Write-Host "----------------------------------------"
Get-Content -LiteralPath $LogFile -Tail 40
Write-Host "----------------------------------------"
Wait-ForEnter
exit 1
