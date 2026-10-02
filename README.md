# BDPS eBill - Hostinger Setup

This repository contains the complete website:

- `frontend/` is the React website.
- `backend/` is the Node.js API and MySQL database schema.

## Before starting

Ask the hosting account owner to confirm the plan supports a **Node.js web
application**. FTP or static website hosting alone cannot run this backend.
Hostinger Node.js Web Apps are available on supported Business and Cloud
hosting plans. An Agency static-site service does not run the Express API.

## Set it up in Hostinger

### 1. Create the database

In hPanel, open the website dashboard and go to **Databases → Management**.
Create a MySQL database and database user. Save the full database name, full
username, and password shown by Hostinger. The database host is usually
`localhost`; confirm the value shown in the panel.

### 2. Create the Node.js website from GitHub

In hPanel, choose **Websites → Create Website → Web App**, then connect this
GitHub repository. Use the repository's top-level folder as the application
root.

Set the commands to:

```text
Build command: npm run build
Start command: npm start
```

Use Node.js 22 or newer (22.12+ recommended).

### 3. Deploy the frontend with the backend

The frontend is the website visitors see. It is in `frontend/`, but it is not
deployed as a separate Hostinger website. The Node.js app builds and serves it
alongside the API:

1. Connect the GitHub repository's top-level folder as the Node.js app root.
   Do not choose only `frontend/` or only `backend/`.
2. Set the build command to `npm run build`. Hostinger installs the root
   project's dependencies, then this command builds the React website into
   `backend/public/`.
3. Set the start command to `npm start`. This starts the backend, which serves
   both the frontend pages and `/api` requests on the same domain.
4. Assign `bdps-ebill.in` to this Node.js app in hPanel and enable HTTPS.
5. Do not upload the frontend separately with FTP or create a separate static
   website for it. Do not commit or upload the generated `backend/public/`
   folder; the build creates it during deployment.

After deployment, opening `https://bdps-ebill.in` should show the frontend,
while `https://bdps-ebill.in/api/health` should show the API health response.
The frontend uses the same domain for API calls; no localhost URL needs to be
entered in the frontend settings.

### 4. Add the app's environment settings

In the Node.js app's **Environment Variables** section, add:

```text
NODE_ENV=production
DB_HOST=localhost
DB_PORT=3306
DB_NAME=the-full-database-name-from-Hostinger
DB_USER=the-full-database-username-from-Hostinger
DB_PASSWORD=the-database-password
CORS_ORIGINS=https://bdps-ebill.in
AUTH_COOKIE_SAME_SITE=lax
```

Use the actual values shown in hPanel. If the website also uses the `www`
domain, add its exact HTTPS origin to `CORS_ORIGINS`, separated by a comma.
Let Hostinger set `PORT` if it provides one.

Never add real passwords to GitHub or frontend files. Do not upload a `.env`
file.

### 5. Create the database tables

After setting the environment variables, open the Node app's terminal and
change to the repository/application root. Run:

```sh
npm run db:migrate
```

This creates the MySQL tables and relationships. The local business tables
are empty, so there is no customer or invoice data to import. Do not run
migrations against a different or existing database without checking it
first.

### 6. Start and check the website

Start or restart the Node.js app in hPanel, then open:

- `https://bdps-ebill.in/api/health` - should report that the API is running.
- `https://bdps-ebill.in` - should show the website.

Test login, products, and billing before removing any old static website files.
Keep access restricted until the first admin account has been created. Anyone
who reaches the app before the first admin is registered could create that
first account.

## How the build works

Hostinger runs `npm run build`, which builds the React frontend into
`backend/public/`. The Express app serves that website and the `/api` endpoints
from the same domain. `npm start` starts the backend, so browser requests use
`https://bdps-ebill.in/api/...` automatically.

## Local checks

From this repository's top-level folder:

```sh
npm install
npm run build
npm test
```

Configure the backend's database environment variables before running the
server or migrations locally.
