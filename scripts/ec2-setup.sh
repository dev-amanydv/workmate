#!/usr/bin/env bash
# ==============================================================================
# Workmate - AWS EC2 Free Tier Initial Server Setup Script
# Target OS: Ubuntu 22.04 LTS / 24.04 LTS
# ==============================================================================

set -euo pipefail

echo "=========================================================="
echo " Starting Workmate EC2 Server Setup"
echo "=========================================================="

# 0. Configure non-interactive frontend and disable needrestart prompts (Ubuntu 24.04)
export DEBIAN_FRONTEND=noninteractive
if [ -f /etc/needrestart/needrestart.conf ]; then
    sudo sed -i "s/#\$nrconf{restart} = 'i';/\$nrconf{restart} = 'a';/g" /etc/needrestart/needrestart.conf 2>/dev/null || true
fi

# Fix any interrupted dpkg states from previously aborted runs
sudo dpkg --configure -a || true

# 1. Update and install basic dependencies
echo "[1/5] Updating system packages..."
sudo apt-get update -y
sudo apt-get install -y curl wget git jq htop ca-certificates gnupg lsb-release

# 2. Configure 3GB Swap file (Critical for AWS Free Tier 1GB RAM instances)
echo "[2/5] Configuring 3GB Swap space to prevent out-of-memory errors..."
if [ ! -f /swapfile ]; then
    sudo fallocate -l 3G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=3072
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    sudo sysctl vm.swappiness=20
    echo 'vm.swappiness=20' | sudo tee -a /etc/sysctl.conf
    echo " Swap file created and activated successfully."
else
    # Ensure swap is on even if file already existed
    sudo swapon /swapfile 2>/dev/null || true
    echo " Swap file already exists and active."
fi

# 3. Install Docker and Docker Compose plugin
echo "[3/5] Installing Docker CE and Docker Compose..."
if ! command -v docker &> /dev/null; then
    # Add Docker official GPG key & repository with visible progress
    sudo install -m 0755 -d /etc/apt/keyrings
    sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    sudo chmod a+r /etc/apt/keyrings/docker.asc
    
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Enable docker service
    sudo systemctl enable docker
    sudo systemctl start docker
    echo " Docker installed successfully."
else
    echo " Docker is already installed."
fi

# 4. Add current user to docker group
echo "[4/5] Configuring Docker permissions for user: $(whoami)..."
sudo groupadd docker 2>/dev/null || true
sudo usermod -aG docker "$USER" || true

# 5. Configure Basic Firewall (UFW)
echo "[5/5] Configuring firewall rules (SSH: 22, HTTP: 80, HTTPS: 443)..."
if command -v ufw &> /dev/null; then
    sudo ufw allow 22/tcp comment 'SSH'
    sudo ufw allow 80/tcp comment 'HTTP'
    sudo ufw allow 443/tcp comment 'HTTPS'
    # Enable UFW without prompting
    echo "y" | sudo ufw enable || true
    sudo ufw status verbose
fi

echo "=========================================================="
echo " EC2 Setup Completed Successfully!"
echo ""
echo " IMPORTANT: To use Docker without 'sudo', please log out"
echo " and reconnect to your SSH session, or run:"
echo "   newgrp docker"
echo "=========================================================="
