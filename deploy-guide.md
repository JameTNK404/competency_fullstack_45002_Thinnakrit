# DevOps & Deployment Guide
This guide details how to deploy the Teacher Evaluation System onto an Ubuntu VPS (e.g. EC2, DigitalOcean).

## 1. Environment Setup

**Node.js & PM2:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
```

**Nginx:**
```bash
sudo apt-get update
sudo apt-get install -y nginx
```

**MySQL:**
```bash
sudo apt-get install -y mysql-server
sudo mysql_secure_installation
```

## 2. Backend Setup
1. Clone the repository to `/var/www/competency2568`
2. Enter `/var/www/competency2568/backend`
3. Run `npm install`
4. Setup the `.env` file based on `.env.example`
5. Map Nginx to the `uploads` directory (or ensure PM2 node process serves it).
6. Run `pm2 start app.js --name "competency-api"`

## 3. Frontend Setup
1. Enter `/var/www/competency2568/frontend`
2. Run `npm install`
3. Create `.env` or set `NITRO_PORT=3000` and `NUXT_PUBLIC_API_BASE="/api"`
4. Run `npm run build`
5. Run `pm2 start .output/server/index.mjs --name "competency-web"`
6. `pm2 save` to persist across reboots.

## 4. Nginx Reverse Proxy Configuration
Create a config at `/etc/nginx/sites-available/competency`:

```nginx
server {
    listen 80;
    server_name your_domain.com;

    # Backend API Requests
    location /api/ {
        proxy_pass http://localhost:7000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads (static assets mapped directly to node OR via nginx)
    location /uploads/ {
        proxy_pass http://localhost:7000;
        # OR static route: alias /var/www/competency2568/backend/uploads/;
    }

    # Nuxt Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable & Restart:
```bash
sudo ln -s /etc/nginx/sites-available/competency /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

You are now successfully deployed.
