<#
.SYNOPSIS
VelaDesk - Windows Server/Desktop Install Script
.DESCRIPTION
Installs VelaDesk on Windows via Docker. 
Usage: irm https://raw.githubusercontent.com/unpaved028/VelaDesk/refs/heads/master/install.ps1 | iex
#>

# --- Branding Colors (ANSI True Color for Windows 10/11) ---
$ESC = [char]27
$CYAN = "$ESC[38;2;0;255;255m"
$WHITE = "$ESC[38;2;255;255;255m"
$GREEN = "$ESC[38;2;16;185;129m"
$RED = "$ESC[38;2;248;113;113m"
$DIM = "$ESC[2m"
$RESET = "$ESC[0m"

# --- Helper Functions ---
function Write-Step ($msg) { Write-Host -NoNewline "$WHITE➜ $msg$RESET`n" }
function Write-Success ($msg) { Write-Host -NoNewline "$GREEN✔ $msg$RESET`n" }
function Write-ErrorMsg ($msg) { Write-Host -NoNewline "$RED✖ $msg$RESET`n"; exit 1 }

# --- UI: Clear & Logo ---
Clear-Host
Write-Host -NoNewline $CYAN
Write-Host @"
 __     __    _       ____            _    
 \ \   / /___| | __ _|  _ \  ___  ___| | __
  \ \ / / _ \ |/ _` | | | |/ _ \/ __| |/ /
   \ V /  __/ | (_| | |_| |  __/\__ \   < 
    \_/ \___|_|\__,_|____/ \___||___/_|\_\
                                           
"@
Write-Host -NoNewline "$WHITE Enterprise Service Management Cloud$RESET`n`n"
Write-Host -NoNewline "$DIM Initializing Zero-Touch Deployment...$RESET`n`n"

# 1. Require Admin
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-ErrorMsg "Please run PowerShell as Administrator to install VelaDesk!"
}

$InstallDir = "C:\VelaDesk"
$RepoRawUrl = "https://raw.githubusercontent.com/unpaved028/VelaDesk/refs/heads/master"

# 2. Check Docker
Write-Step "Checking for Docker 🐳"
try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Docker not running."
    }
    Write-Success "Docker is installed and running."
} catch {
    Write-ErrorMsg "Docker is not installed or not running. Please install Docker Desktop and enable WSL2 integration, then rerun this script."
}

# 3. Setup Directory
Write-Step "Setting up installation directory at $InstallDir 📁"
if (-not (Test-Path -Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir | Out-Null
}
Set-Location -Path $InstallDir
Write-Success "Directory ready."

# 4. Download docker-compose.yml
Write-Step "Downloading docker-compose.yml 🌐"
try {
    Invoke-WebRequest -Uri "$RepoRawUrl/docker-compose.yml" -OutFile "docker-compose.yml" -UseBasicParsing | Out-Null
    Write-Success "docker-compose.yml downloaded."
} catch {
    Write-ErrorMsg "Download failed. Please check your internet connection."
}

# 5. Generate Environment Variables
Write-Step "Generating secure environment variables 🔑"
if (-not (Test-Path -Path ".env")) {
    
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

# Cloudflare Tunnel Token (optional, for external access)
CLOUDFLARE_TUNNEL_TOKEN=
"@
    Set-Content -Path ".env" -Value $envContent
    Write-Success "Generated .env successfully with secure keys."
} else {
    Write-Success ".env file already exists. Skipping key generation."
}

# 6. Configure Firewall
Write-Step "Configuring Windows Firewall for Port 3000 🛡️"
$ruleName = "VelaDesk Web Interface (Port 3000)"
$existingRule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
if (-not $existingRule) {
    New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow | Out-Null
    Write-Success "Firewall rule added."
} else {
    Write-Success "Firewall rule already exists."
}

# 7. Start VelaDesk using Docker Compose
Write-Step "Pulling and starting VelaDesk containers 🚀"
docker compose pull -q
docker compose up -d | Out-Null
Write-Success "Containers started successfully."

# --- Success Screen ---
$IpAddress = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi","Ethernet" -ErrorAction SilentlyContinue | Select-Object -First 1).IPAddress
if (-not $IpAddress) { $IpAddress = "localhost" }

Write-Host "`n$CYAN====================================================$RESET"
Write-Host "$WHITE ✨ VelaDesk Installation Complete! ✨$RESET"
Write-Host "$CYAN====================================================$RESET`n"
Write-Host " $WHITE▶ Local Access:$RESET    http://${IpAddress}:3000"
Write-Host " $WHITE▶ Configuration:$RESET   $InstallDir"
Write-Host " $WHITE▶ External Access:$RESET Add your Cloudflare Token to the"
Write-Host "                    ${DIM}.env$RESET file and restart the tunnel.`n"
Write-Host "$DIM VelaDesk is now running via Docker.$RESET`n"