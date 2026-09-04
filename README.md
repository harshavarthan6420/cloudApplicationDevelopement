# GameVault

GameVault is a cloud-based personal video game collection management application built for an academic full-stack project. It uses a React frontend and Flask REST API backend, with MongoDB Atlas for persistence and RAWG as the external game metadata source.

## Technology Stack

- Frontend: React, Vite, React Router, Axios, Material UI, Recharts
- Backend: Flask, Flask Blueprints, Flask-CORS, PyMongo
- Database: MongoDB Atlas
- External API: RAWG
- Testing: Pytest, Cypress
- CI: GitHub Actions
- Deployment target: Render

## Architecture

Frontend (React) -> Backend (Flask REST API) -> MongoDB Atlas

RAWG is used through backend proxy endpoints. The API key is never exposed to the frontend.

## Folder Structure

- backend
  - app
    - database
    - routes
    - services
    - utils
  - tests
  - app.py
  - config.py
  - requirements.txt
  - .env.example
- frontend
  - src
    - components
    - context
    - pages
    - services
  - cypress
  - package.json
  - vite.config.js
  - .env.example
- .github/workflows/ci.yml
- render.yaml

## Environment Variables

### Backend (.env)

Copy backend/.env.example to backend/.env and set:

- FLASK_ENV=development
- MONGO_URI=<your_mongodb_atlas_connection_string>
- MONGO_DB=gamevault
- FRONTEND_URL=http://localhost:5173
- RAWG_API_KEY=<your_rawg_api_key>
- HTTP_TIMEOUT_SECONDS=10

### Frontend (.env)

Copy frontend/.env.example to frontend/.env and set:

- VITE_API_BASE_URL=http://127.0.0.1:5000

For production deployment, point VITE_API_BASE_URL to your deployed Flask backend URL.

## Local Setup

### 1) Backend setup

```powershell
cd backend
py -3 -m pip install -r requirements.txt
```

### 2) Frontend setup

```powershell
cd frontend
"C:\Program Files\nodejs\npm.cmd" install
```

## Running the Backend

```powershell
cd backend
py -3 app.py
```

Backend runs on http://127.0.0.1:5000

## Running the Frontend

```powershell
cd frontend
"C:\Program Files\nodejs\npm.cmd" run dev
```

Frontend runs on http://localhost:5173

## Running Pytest

```powershell
cd backend
python -m pytest -q
```

## Running Cypress

```powershell
cd frontend
"C:\Program Files\nodejs\npm.cmd" run cypress:run -- --browser electron --headless
```

## MongoDB Atlas Setup

1. Create a MongoDB Atlas cluster.
2. Create a database user and allow network access from your environment.
3. Copy the connection URI into MONGO_URI.
4. Set MONGO_DB to your database name (for this project: gamevault).

## RAWG API Setup

1. Create a RAWG account and generate an API key.
2. Add the key to backend/.env as RAWG_API_KEY.
3. The frontend never stores or sends this key directly.

## Backend API Overview

### Existing and auth

- GET /health
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/profile

### RAWG proxy

- GET /api/games/search?query=<term>
- GET /api/games/<rawg_id>

### Library

- GET /api/library
- POST /api/library
- PUT /api/library/<item_id>
- DELETE /api/library/<item_id>

### Wishlist

- GET /api/wishlist
- POST /api/wishlist
- DELETE /api/wishlist/<item_id>

### Reviews

- GET /api/reviews
- POST /api/reviews
- PUT /api/reviews/<review_id>
- DELETE /api/reviews/<review_id>

### Dashboard

- GET /api/dashboard/stats

## GitHub Actions

Workflow: .github/workflows/ci.yml

Runs on push and pull_request:

1. Install backend dependencies
2. Run pytest
3. Install frontend dependencies
4. Build frontend
5. Run Cypress end-to-end tests

The pipeline fails if tests or build fail.

## Render Deployment

This repo includes render.yaml for backend + frontend services.

### Required Render environment variables

- Backend:
  - MONGO_URI
  - MONGO_DB
  - RAWG_API_KEY
  - FRONTEND_URL
- Frontend:
  - VITE_API_BASE_URL (point to backend public URL)

Use Render's GitHub integration to auto-deploy on successful push/merge.

## Public URL Placeholder

- Frontend: <render_frontend_url>
- Backend: <render_backend_url>

## Notes for Academic Demonstration

- Authentication state is intentionally simple (username in localStorage).
- Passwords are hashed on backend with Werkzeug.
- Game metadata comes from RAWG via backend proxy.
- Library, wishlist, and reviews store user to RAWG ID relationships, not duplicated RAWG catalog data.
