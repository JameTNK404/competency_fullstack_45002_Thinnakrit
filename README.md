# Teacher Evaluation System (Competency 2568)

This project is a comprehensive Teacher Evaluation System developed as a fullstack application. It allows administrators to manage evaluation periods, assignments, and indicators, while evaluators can assess evaluatees (teachers) based on specific criteria. Evaluatees can also upload their evidence and view evaluation results.

## Tech Stack

**Frontend:**
- Nuxt 3 (Vue 3)
- Vuetify 3
- Tailwind CSS

**Backend:**
- Node.js & Express 4
- Knex.js SQL Query Builder
- MySQL / MariaDB

**Infrastructure & DevOps:**
- Docker & Docker Compose
- Nginx Reverse Proxy
- PM2 (for bare-metal deployments)

## Features

- **Role-Based Access Control (RBAC):** Separate interfaces and functionalities for Admin, Evaluator, and Evaluatee.
- **Evaluation Management:** Configurable Evaluation Topics, Indicators (Scoring or Yes/No), and weight distribution.
- **Process Automation:** Create periods and assign evaluators to specific evaluatees seamlessly.
- **Reporting & Normalized Scores:** View normalized scores out of 60 automatically calculated based on criteria.
- **Evidence Management:** Upload, validate, and manage file attachments for specific evaluation indicators.

## Getting Started Locally

### Prerequisites
- Node.js (v18+)
- MySQL or MariaDB

### 1. Database Setup
Execute the SQL dump file `schema.sql` into your empty database to set up the default tables and initial structure.

### 2. Backend Installation
```bash
cd backend
npm install
# Copy over .env and adjust your DB credentials
npm start # or npm run dev
```

### 3. Frontend Installation
```bash
cd frontend
npm install
# Adjust .env variables if necessary (e.g. NUXT_PUBLIC_API_BASE)
npm run dev
```

### 4. Running via Docker
If you prefer running using Docker Compose:
```bash
docker-compose up -d
```
*Note: Make sure to check the specific `docker-compose.yml` configurations for database and API ports.*

## Deployment
For advanced production server setup using Ubuntu, PM2, and Nginx, please refer to the detailed **[deploy-guide.md](./deploy-guide.md)**.

## Project Structure
- `frontend/` - Contains the Nuxt 3 application with Vue components, layouts, and Vuetify styling.
- `backend/` - Contains the Express APIs, routing logic, middlewares, knex query configurations, and file upload handlers.
- `readme-plan.md` - Complete requirement outline and system specs.
- `evidence_plan.md` - Testing evidence and acceptance reports.
