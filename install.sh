#!/usr/bin/env bash
set -e

# --- Branding Colors (True Color) ---
CYAN="\e[38;2;0;255;255m"
WHITE="\e[38;2;255;255;255m"
GREEN="\e[38;2;16;185;129m"
RED="\e[38;2;248;113;113m"
DIM="\e[2m"
RESET="\e[0m"

# --- Helper Functions ---
print_step() { echo -e "${WHITE}➜ $1${RESET}"; }
print_success() { echo -e "${GREEN}✔ $1${RESET}"; }
print_error() { echo -e "${RED}✖ $1${RESET}"; exit 1; }

# --- UI: Clear & Logo ---
clear
echo -e "${CYAN}"
cat << "EOF"
 __     __    _       ____            _    
 \ \   / /___| | __ _|  _ \  ___  ___| | __
  \ \ / / _ \ |/ _` | | | |/ _ \/ __| |/ /
   \ V /  __/ | (_| | |_| |  __/\__ \   < 
    \_/ \___|_|\__,_|____/ \___||___/_|\_\
                                           
EOF
echo -e "${WHITE} Enterprise Service Management Cloud${RESET}\n"
echo -e "${DIM} Initializing Zero-Touch Deployment...${RESET}\n"

# Require root
if [ "$EUID" -ne 0 ]; then
  print_error "Please run as root (e.g., sudo bash install.sh)"
fi

VELADESK_DIR="/opt/VelaDesk"
REPO_RAW_URL="https://raw.githubusercontent.com/unpaved028/VelaDesk/refs/heads/master"

# 1. Install Docker if not present
print_step "Checking Docker availability 🐳"
if ! command -v docker &> /dev/null; then
  echo -e "${DIM}  Docker is not installed. Installing Docker...${RESET}"
  curl -fsSL https://get.docker.com -o get-docker.sh
  sh get-docker.sh > /dev/null 2>&1
  rm get-docker.sh
  systemctl enable --now docker > /dev/null 2>&1
  print_success "Docker installed successfully."
else
  print_success "Docker is already installed."
fi

# Ensure Docker Compose plugin is available
if ! docker compose version &> /dev/null; then
  print_error "Docker Compose plugin not found. Please install docker-compose-plugin."
else
  print_success "Docker Compose is available."
fi

# 2. Setup Directory
print_step "Setting up VelaDesk directory at $VELADESK_DIR 📁"
mkdir -p "$VELADESK_DIR"
cd "$VELADESK_DIR"
print_success "Directory ready."

# 3. Download docker-compose.yml
print_step "Downloading docker-compose.yml 🌐"
curl -fsSL "$REPO_RAW_URL/docker-compose.yml" -o docker-compose.yml
print_success "docker-compose.yml downloaded."

# 4. Generate Master Key & Environment Variables
print_step "Generating secure environment variables 🔑"
if [ ! -f ".env" ]; then
  VELADESK_MASTER_KEY=$(openssl rand -hex 32)
  
  cat <<EOF > .env
# VelaDesk Environment Settings
NODE_ENV=production

# Security
VELADESK_MASTER_KEY=$VELADESK_MASTER_KEY

# Database Configuration
POSTGRES_USER=veladesk_user
POSTGRES_PASSWORD=$(openssl rand -hex 16)
POSTGRES_DB=veladesk_db

# The URL of your application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cloudflare Tunnel Token (optional, for external access)
CLOUDFLARE_TUNNEL_TOKEN=
EOF
  print_success "Done. Your VELADESK_MASTER_KEY has been generated."
else
  print_success ".env file already exists. Skipping key generation."
fi

# 5. Start VelaDesk using Docker Compose
print_step "Pulling and starting VelaDesk containers 🚀"
docker compose pull -q
docker compose up -d > /dev/null 2>&1
print_success "Containers started successfully."

# --- Success Screen ---
IP_ADDRESS=$(hostname -I | awk '{print $1}')
echo -e "\n${CYAN}====================================================${RESET}"
echo -e "${WHITE} ✨ VelaDesk Installation Complete! ✨${RESET}"
echo -e "${CYAN}====================================================${RESET}\n"
echo -e " ${WHITE}▶ Local Access:${RESET}    http://${IP_ADDRESS}:3000"
echo -e " ${WHITE}▶ Configuration:${RESET}   ${VELADESK_DIR}"
echo -e " ${WHITE}▶ External Access:${RESET} Add your Cloudflare Token to the"
echo -e "                    ${DIM}.env${RESET} file and restart the tunnel.\n"
echo -e "${DIM} VelaDesk is now running in the background.${RESET}"
echo -e "\n"