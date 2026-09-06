# 24/7 Cloud Deployment Guide

## Why the ERP Goes Offline When Your Laptop Closes
When running locally via `npm run dev` or Cloudflare Quick Tunnel, the server is hosted on your laptop's CPU and RAM. When you close the lid or disconnect from Wi-Fi, the laptop enters sleep/standby mode, cutting all active TCP connections.

To keep the School ERP online **24 hours a day, 7 days a week, 365 days a year**, the application must be hosted on a dedicated cloud infrastructure.

---

## Option A: 1-Click Free / Low-Cost Deployment via Render.com (Recommended)
Render is a cloud platform that manages database backups, SSL certificates, zero-downtime deploys, and automated scaling without requiring you to configure Linux servers.

### Steps to Deploy (Takes ~5 Minutes):
1. **Push your code to GitHub**:
   - Create a private repository on GitHub (e.g. `github.com/your-username/school-erp`).
   - Push your project code to `main`.
2. **Sign up at [Render.com](https://render.com)**.
3. **Deploy with Blueprint**:
   - In Render Dashboard, click **New +** $\to$ **Blueprint**.
   - Select your GitHub repository.
   - Render will automatically read [`render.yaml`](../render.yaml) from the repository root.
   - It will automatically spin up:
     1. **Managed PostgreSQL Database** (`school-erp-db`)
     2. **NestJS API Service** (`school-erp-api`)
     3. **React Vite Web SPA** (`school-erp-web`)
4. **Initial Data Seeding**:
   - In the Render Dashboard under `school-erp-api` $\to$ **Shell**, run:
     ```bash
     pnpm --filter api db:seed
     ```
   - This provisions your initial Super Admin account (`admin@schoolerp.com`), permissions, and branches.
5. **Done!** Your school ERP is now live 24/7 with an SSL-secured URL like:
   `https://school-erp-web.onrender.com`

---

## Option B: VPS Deployment via Docker Compose (AWS / DigitalOcean / Linode / Hostinger)
If you prefer full control on a Virtual Private Server (VPS) costing \$4–\$6/month:

1. **Order any Ubuntu 22.04 or 24.04 VPS** with at least 2GB RAM.
2. **Install Docker & Docker Compose**:
   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER
   ```
3. **Clone your repository on the server**:
   ```bash
   git clone https://github.com/your-username/school-erp.git
   cd school-erp
   ```
4. **Start the Multi-Container Cluster**:
   ```bash
   docker compose up -d --build
   ```
5. **Run database migrations and seed**:
   ```bash
   docker compose exec api pnpm --filter api db:migrate
   docker compose exec api pnpm --filter api db:seed
   ```
6. The system is now live on `http://your-server-ip`.

---

## Custom Domain & Free SSL (e.g. `erp.yourschool.edu`)
1. In your domain DNS manager (GoDaddy, Namecheap, Cloudflare DNS), add a `CNAME` or `A` record pointing to your cloud service.
2. On Render.com:
   - Go to **Settings** $\to$ **Custom Domains** $\to$ Enter `erp.yourschool.edu`.
   - Render automatically provisions and renews a free Let's Encrypt SSL certificate.

---

## Daily Backups
The database volume (`postgres_data`) persists all student, fee, mark, and attendance records even during server restarts or reboots.