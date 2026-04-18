#!/usr/bin/env bash
set -e

# VelaDesk - Linux Install Script
# Usage: curl -fsSL https://raw.githubusercontent.com/unpaved028/VelaDesk/refs/heads/master/install.sh | sudo bash

echo "====================================================="
echo "   VelaDesk - ITSM/CSM System - Installer               "
echo "====================================================="

# Require root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (e.g., sudo bash install.sh)"
  exit 1
fi

VELADESK_DIR="/opt/VelaDesk"
REPO_RAW_URL="https://raw.githubusercontent.com/unpaved028/VelaDesk/refs/heads/master"

# 1. Install Docker if not present
if ! command -v docker &> /dev/null; then
  echo "[+] Docker is not installed. Installing Docker..."
  curl -fsSL https://get.docker.com -o get-docker.sh
  sh get-docker.sh
  rm get-docker.sh
  systemctl enable --now docker
else
  echo "[+] Docker is already installed."
fi

# Ensure Docker Compose plugin is available
if ! docker compose version &> /dev/null; then
  echo "[-] Docker Compose plugin not found. Please install docker-compose-plugin."
  exit 1
else
  echo "[+] Docker Compose is available."
fi

# 2. Setup Directory
echo "[+] Setting up VelaDesk directory at $VELADESK_DIR..."
mkdir -p "$VELADESK_DIR"
cd "$VELADESK_DIR"

# 3. Download docker-compose.yml
echo "[+] Downloading docker-compose.yml..."
curl -fsSL "$REPO_RAW_URL/docker-compose.yml" -o docker-compose.yml

# 4. Generate Master Key & Environment Variables
if [ ! -f ".env" ]; then
  echo "[+] Generating .env file with a secure MASTER_KEY..."
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
EOF
  echo "[+] Done. Your VELADESK_MASTER_KEY has been generated."
else
  echo "[+] .env file already exists. Skipping key generation."
fi

# 5. Start VelaDesk using Docker Compose
echo "[+] Pulling and starting VelaDesk containers..."
docker compose pull
docker compose up -d

echo "====================================================="
echo " VelaDesk Installation Complete!                        "
echo ""
echo " VelaDesk is now running in the background."
echo " You can access your application at: http://localhost:3000"
echo " Configuration is located at: $VELADESK_DIR"
echo "====================================================="
