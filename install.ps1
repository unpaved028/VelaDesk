<#
.SYNOPSIS
VelaDesk - Windows Server/Desktop Install Script
.DESCRIPTION
Installs VelaDesk on Windows via Docker. 
Usage: irm https://raw.githubusercontent.com/rene-jung/VelaDesk/main/install.ps1 | iex
#>

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "   VelaDesk - ITSM/CSM System - Windows Installer       " -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

# 1. Require Admin
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Warning "Please run PowerShell as Administrator to install VelaDesk!"
    exit 1
}

$InstallDir = "C:\VelaDesk"
$RepoRawUrl = "https://raw.githubusercontent.com/rene-jung/VelaDesk/main"

# 2. Check Docker
Write-Host "[+] Checking for Docker..."
try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Docker not running."
    }
    Write-Host "[+] Docker is installed and running." -ForegroundColor Green
} catch {
    Write-Warning "[-] Docker is not installed or not running."
    Write-Warning "[-] Please install Docker Desktop and enable WSL2 integration, then rerun this script."
    exit 1
}

# 3. Setup Directory
Write-Host "[+] Setting up installation directory at $InstallDir..."
if (-not (Test-Path -Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir | Out-Null
}
Set-Location -Path $InstallDir

# 4. Download docker-compose.yml
Write-Host "[+] Downloading docker-compose.yml..."
Invoke-WebRequest -Uri "$RepoRawUrl/docker-compose.yml" -OutFile "docker-compose.yml"

# 5. Generate Environment Variables
if (-not (Test-Path -Path ".env")) {
    Write-Host "[+] Generating .env file with secure keys..."
    
    # Generate Hex Keys (simulating openssl rand -hex)
    $masterKeyBytes = New-Object Byte[] 32
    $dbPassBytes = New-Object Byte[] 16
    $rand = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rand.GetBytes($masterKeyBytes)
    $rand.GetBytes($dbPassBytes)
    
    $masterKey = [System.BitConverter]::ToString($masterKeyBytes).Replace("-","").ToLower()
    $dbPass = [System.BitConverter]::ToString($dbPassBytes).Replace("-","").ToLower()

    $envContent = @"
# VelaDesk Environment Settings
NODE_ENV=production

# Security
VELADESK_MASTER_KEY=$masterKey

# Database Configuration
POSTGRES_USER=veladesk_user
POSTGRES_PASSWORD=$dbPass
POSTGRES_DB=veladesk_db

# The URL of your application
NEXT_PUBLIC_APP_URL=http://localhost:3000
"@
    Set-Content -Path ".env" -Value $envContent
    Write-Host "[+] Generated .env successfully." -ForegroundColor Green
} else {
    Write-Host "[+] .env file already exists. Skipping key generation." -ForegroundColor Yellow
}

# 6. Configure Firewall
Write-Host "[+] Configuring Windows Firewall for Port 3000..."
$ruleName = "VelaDesk Web Interface (Port 3000)"
$existingRule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
if (-not $existingRule) {
    New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow | Out-Null
    Write-Host "[+] Firewall rule added." -ForegroundColor Green
} else {
    Write-Host "[+] Firewall rule already exists." -ForegroundColor Yellow
}

# 7. Start VelaDesk using Docker Compose
Write-Host "[+] Pulling and starting VelaDesk containers..."
docker compose pull
docker compose up -d

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host " VelaDesk Installation Complete!                        " -ForegroundColor Cyan
Write-Host ""
Write-Host " VelaDesk is now running via Docker."
Write-Host " You can access your application at: http://localhost:3000"
Write-Host " Configuration is located at: $InstallDir"
Write-Host "=====================================================" -ForegroundColor Cyan
