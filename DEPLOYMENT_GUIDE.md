# Complete AWS EC2 Free Tier Deployment Guide for Workmate

This guide takes you step-by-step from a brand-new AWS Free Tier account to a fully running production instance of **Workmate** with:
- **MySQL 8** (with memory-optimized settings for 1GB RAM)
- **NestJS API + Socket.IO WebSockets**
- **Next.js Frontend** (production standalone build)
- **Caddy Reverse Proxy** (with automated SSL certificates via Let's Encrypt)
- **3GB Swap Space** (prevents Out-Of-Memory errors on Free Tier instances)

---

## Part 1: Launch Your Free Tier EC2 Instance

1. Log in to the [AWS Management Console](https://console.aws.amazon.com/).
2. In the top right corner, select your preferred AWS Region (e.g., **Mumbai (`ap-south-1`)**, **N. Virginia (`us-east-1`)**, or the region closest to you).
3. In the search bar at the top, type **EC2** and click **EC2**.
4. In the EC2 Dashboard, click the orange **Launch Instance** button.

### 1. Name and OS Image
- **Name**: `workmate-server`
- **Application and OS Images (Amazon Machine Image)**:
  - Select **Ubuntu**.
  - Choose **Ubuntu Server 24.04 LTS (HVM)** or **Ubuntu Server 22.04 LTS (HVM)**.
  - Ensure it shows the badge: **"Free tier eligible"**.
  - Architecture: **64-bit (x86)**.

### 2. Instance Type
- Select **`t2.micro`** or **`t3.micro`** (whichever shows **"Free tier eligible"** in your selected region).
- *Specs*: 1 vCPU, 1 GiB Memory.

### 3. Key Pair (Login)
- Click **Create new key pair**.
- **Key pair name**: `workmate-key`
- **Key pair type**: RSA
- **Private key file format**: `.pem` (for Mac/Linux/OpenSSH)
- Click **Create key pair**.
- *Save the downloaded `workmate-key.pem` to your local `~/.ssh/` directory.*

### 4. Network Settings
Click **Edit** on the right side of Network settings:
- **Auto-assign public IP**: **Enable**
- **Firewall (security groups)**: Select **Create security group**.
- **Security group name**: `workmate-security-group`
- **Inbound Security Group Rules**:
  1. **Rule 1 (SSH)**:
     - Type: `SSH`
     - Port: `22`
     - Source: `My IP` (Recommended for security) or `Anywhere (0.0.0.0/0)`
  2. **Rule 2 (HTTP)**: Click **Add security group rule**:
     - Type: `HTTP`
     - Port: `80`
     - Source: `Anywhere (0.0.0.0/0)`
  3. **Rule 3 (HTTPS)**: Click **Add security group rule**:
     - Type: `HTTPS`
     - Port: `443`
     - Source: `Anywhere (0.0.0.0/0)`

> [!NOTE]
> Do NOT expose port 3306 (MySQL). MySQL remains secure inside the internal Docker network.

### 5. Configure Storage
- By default, it may say `8 GiB gp3`.
- Change this to **`30 GiB`** of **`gp3`**.
- *AWS Free Tier allows up to 30 GiB of EBS storage free of charge for 12 months.*

### 6. Launch
- Review the summary on the right panel and click **Launch Instance**.
- Wait 1–2 minutes until the instance state changes to **Running**.

---

## Part 2: (Optional but Recommended) Assign an Elastic IP

AWS regular public IPs can change when an instance is stopped and started. An Elastic IP is permanent and free while attached to a running Free Tier instance.

1. In the EC2 left sidebar, navigate to **Network & Security** → **Elastic IPs**.
2. Click **Allocate Elastic IP address** → Click **Allocate**.
3. Select the allocated IP, click **Actions** → **Associate Elastic IP address**.
4. Choose your `workmate-server` instance and click **Associate**.
5. Note your permanent **Public IPv4 Address**.

*(If you have a domain like `workmate.amanydv.in`, create an **A Record** in your DNS provider pointing to this IP).*

---

## Part 3: Connect to Your EC2 Instance

On your local machine, open your terminal:

```bash
# 1. Set read-only permissions for your private key
chmod 400 ~/.ssh/workmate-key.pem

# 2. Connect via SSH (replace with your Elastic IP or Public IPv4)
ssh -i ~/.ssh/workmate-key.pem ubuntu@<YOUR_EC2_PUBLIC_IP>
```

---

## Part 4: Run Automated Server Setup

Once connected to your EC2 instance:

```bash
# 1. Clone your repository (or push your repository to GitHub and clone it)
git clone https://github.com/<your-username>/workmate.git
cd workmate

# 2. Run the automated setup script
chmod +x scripts/ec2-setup.sh scripts/deploy.sh
./scripts/ec2-setup.sh

# 3. Activate docker group permissions for the current shell session
newgrp docker
```

What `ec2-setup.sh` does automatically:
- Creates a **3GB swap file** (crucial to prevent Free Tier 1GB RAM machines from crashing during Docker builds or runtime).
- Installs the official **Docker Engine** & **Docker Compose v2**.
- Configures the firewall (`ufw`) allowing ports 22, 80, and 443.

---

## Part 5: Configure Production Environment Variables

1. Copy the production environment template:
   ```bash
   cp .env.production.example .env.production
   ```

2. Generate two secure 32-character random strings for your JWT secrets:
   ```bash
   openssl rand -hex 32
   openssl rand -hex 32
   ```

3. Open `.env.production` in an editor:
   ```bash
   nano .env.production
   ```

4. Fill in the values:
   - **`DOMAIN`**:
     - If using a domain (e.g. `workmate.amanydv.in`), set `DOMAIN=workmate.amanydv.in` *(Caddy will automatically generate and renew Let's Encrypt SSL!)*
     - If using IP only without a domain, leave it blank: `DOMAIN=`
   - **`MYSQL_PASSWORD`** & **`MYSQL_ROOT_PASSWORD`**: Set secure passwords.
   - **`JWT_ACCESS_SECRET`** & **`JWT_REFRESH_SECRET`**: Paste the secrets generated in step 2.
   - **`FRONTEND_URL`**:
     - If with domain: `https://workmate.amanydv.in`
     - If with IP: `http://<YOUR_EC2_PUBLIC_IP>`
   - **`GOOGLE_CLIENT_ID`** & **`GOOGLE_CLIENT_SECRET`**: Your Google OAuth app credentials.
   - **`GOOGLE_CALLBACK_URL`**:
     - If with domain: `https://workmate.amanydv.in/api/auth/google/callback`
     - If with IP: `http://<YOUR_EC2_PUBLIC_IP>/api/auth/google/callback`
   - **`R2_*` variables**: Your Cloudflare R2 bucket credentials (or leave the defaults for local storage fallback).

5. Save and exit (`Ctrl + O`, `Enter`, `Ctrl + X`).

---

## Part 6: Update Google Cloud Console

Google OAuth requires matching callback URLs:
1. Go to the [Google Cloud Console Credentials Page](https://console.cloud.google.com/apis/credentials).
2. Edit your OAuth 2.0 Client ID:
   - **Authorized JavaScript origins**:
     - Add `https://<YOUR_DOMAIN>` (or `http://<YOUR_EC2_PUBLIC_IP>`)
   - **Authorized redirect URIs**:
     - Add `https://<YOUR_DOMAIN>/api/auth/google/callback` (or `http://<YOUR_EC2_PUBLIC_IP>/api/auth/google/callback`)
3. Click **Save**.

---

## Part 7: Launch the Application

Run the deployment script:

```bash
./scripts/deploy.sh
```

This will:
1. Build the production multi-stage Next.js frontend image.
2. Build the production NestJS backend image.
3. Start the memory-optimized MySQL container.
4. Run Prisma database migrations automatically.
5. Start Caddy reverse proxy on ports 80 & 443.
6. Verify service health checks.

Check running containers:
```bash
docker compose -f docker-compose.prod.yml ps
```

You should see 4 healthy containers:
- `workmate-caddy` (Ports 80, 443)
- `workmate-web` (Port 3000 internal)
- `workmate-backend` (Port 4000 internal)
- `workmate-mysql` (Port 3306 internal)

---

## Part 8: Helpful Management Commands

```bash
# View live logs for all services
docker compose -f docker-compose.prod.yml logs -f

# View backend logs specifically
docker compose -f docker-compose.prod.yml logs -f backend

# Restart all services
docker compose -f docker-compose.prod.yml restart

# Stop all services
docker compose -f docker-compose.prod.yml down

# Update to latest code and redeploy
git pull
./scripts/deploy.sh
```
