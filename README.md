# Kinetix

![CI Status](https://github.com/Y1lion/Kinetix/actions/workflows/ci.yml/badge.svg)
![Backend Status](https://github.com/Y1lion/Kinetix/actions/workflows/deploy-backend.yml/badge.svg)
![Frontend Status](https://github.com/Y1lion/Kinetix/actions/workflows/deploy-frontend.yml/badge.svg)

Kinetix is a full-stack web application developed for the **Database Systems II** course.

The project simulates an e-commerce platform for sports products, integrating a modern frontend, a REST API backend, a cloud database, a search engine, AI-based product tagging, session-based authentication, and an automated CI Pipeline.

The repository follows a structured workflow based on Issues, Branches, Pull Requests, code reviews, and traceability of changes.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Main Features](#main-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Available Services](#available-services)
- [API Documentation](#api-documentation)
- [CI Pipeline](#ci-pipeline)
- [Project Workflow](#project-workflow)
- [Useful Commands](#useful-commands)
- [Troubleshooting](#troubleshooting)
- [AI Usage Disclosure](#ai-usage-disclosure)
- [Authors](#authors)

---

## Project Overview

Kinetix is composed of three main services:

1. **Frontend**
   - Built with Next.js.
   - Provides the user interface for browsing products, authentication, basket management, and admin operations.

2. **Backend**
   - Built with Node.js, Express, and Mongoose.
   - Exposes REST API endpoints for authentication, products, basket, users, admin operations, and Swagger documentation.

3. **Meilisearch**
   - Local search engine container used to provide fast and relevant product search.

The main database is hosted on **MongoDB Atlas**, while Meilisearch runs locally through Docker.

---

## Main Features

- User registration and login.
- Session-based authentication using cookies.
- Password hashing with bcrypt.
- Persistent sessions stored in MongoDB.
- Product catalogue.
- Basket system linked to authenticated users.
- Admin dashboard.
- Admin-only product management.
- Admin-only user management.
- Role-based authorization.
- Product search powered by Meilisearch.
- AI-generated product tags using Azure services.
- Swagger API documentation.
- Dockerized development environment.
- GitHub Actions CI Pipeline.
- MongoDB Atlas connectivity verification.

---

## Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend

- Node.js
- Express
- Mongoose
- express-session
- connect-mongo
- bcrypt

### Database

- MongoDB Atlas

### Search Engine

- Meilisearch v1.7

### AI Services

- Azure AI Language
- Azure AI Vision

### DevOps

- Docker
- Docker Compose
- GitHub Actions

---

## Architecture

```text
Kinetix
│
├── frontend
│   └── Next.js application
│
├── backend
│   ├── Express API
│   ├── Controllers
│   ├── Models
│   ├── Routes
│   ├── Middlewares
│   ├── Services
│   └── Swagger documentation
│
├── meilisearch
│   └── Local search engine container
│
└── MongoDB Atlas
    └── Cloud database
```

Runtime architecture:

```text
Browser
  │
  ▼
Next.js Frontend
http://localhost:3000
  │
  ▼
Express Backend API
http://localhost:3001
  │
  ├── MongoDB Atlas
  │
  ├── Meilisearch
  │
  └── Azure AI Services
```

---

## Environment Variables

The project requires a `.env` file in the root directory.

The `.env` file must not be committed to GitHub.

Create a file named `.env` in the project root:

```env
PORT=3001

MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/kinetix?retryWrites=true&w=majority

SESSION_SECRET=your_session_secret

FRONTEND_URL=http://localhost:3000
NODE_ENV=development

MEILI_HOST=http://meilisearch:7700
MEILI_MASTER_KEY=your_meilisearch_master_key

AZURE_LANGUAGE_ENDPOINT=your_azure_language_endpoint
AZURE_LANGUAGE_KEY=your_azure_language_key

AZURE_VISION_ENDPOINT=your_azure_vision_endpoint
AZURE_VISION_KEY=your_azure_vision_key
```

For local development outside Docker, Meilisearch may be reachable at:

```env
MEILI_HOST=http://localhost:7700
```

Inside Docker, the correct value is:

```env
MEILI_HOST=http://meilisearch:7700
```

---

## Getting Started

### Prerequisites

You need:

- Docker
- Docker Compose
- Git
- A MongoDB Atlas database
- A valid `.env` file

---

### Clone the Repository

```bash
git clone https://github.com/2026-BD/Kinetix.git
cd Kinetix
```

---

### Configure Environment

Create a `.env` file in the root directory and add the required variables.

Do not commit `.env`.

Only safe examples should be committed, such as:

```text
.env.example
```

---

### Start the Project

```bash
docker compose up --build
```

Or in detached mode:

```bash
docker compose up -d --build
```

---

## Available Services

After startup, the services are available at:

| Service     | URL                              |
| ----------- | -------------------------------- |
| Frontend    | `http://localhost:3000`          |
| Backend API | `http://localhost:3001`          |
| Swagger UI  | `http://localhost:3001/api-docs` |
| Meilisearch | `http://localhost:7700`          |

---

## API Documentation

The backend exposes Swagger documentation at:

```text
http://localhost:3001/api-docs
```

Swagger documents the main API routes, including:

- Authentication routes.
- Product routes.
- Basket routes.
- Admin product management.
- Admin user management.

---

## CI Pipeline

The project includes a GitHub Actions CI Pipeline.

The workflow is triggered on:

```text
push to master
pull request to master
manual workflow dispatch
```

The CI Pipeline performs the following operations:

1. Checks out the repository.
2. Retrieves the temporary GitHub runner IP.
3. Adds the runner IP to MongoDB Atlas Network Access.
4. Builds and starts the Docker containers.
5. Checks whether the backend is running.
6. Checks whether Swagger UI is reachable.
7. Checks whether the frontend is running.
8. Executes database verification.
9. Shows logs if a failure occurs.
10. Shuts down the containers.
11. Removes the runner IP from MongoDB Atlas Network Access.

---

### Required GitHub Secrets

The CI Pipeline requires the following GitHub repository secrets:

```text
MONGO_URI
SESSION_SECRET

MEILI_HOST
MEILI_MASTER_KEY

FRONTEND_URL
NODE_ENV

ATLAS_PUBLIC_KEY
ATLAS_PRIVATE_KEY
ATLAS_PROJECT_ID

AZURE_LANGUAGE_ENDPOINT
AZURE_LANGUAGE_KEY
AZURE_VISION_ENDPOINT
AZURE_VISION_KEY
```

Recommended CI values:

```env
MEILI_HOST=http://meilisearch:7700
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

The `ATLAS_*` secrets are not required for local development.
They are used only by GitHub Actions to temporarily authorize the runner IP in MongoDB Atlas.

---

## Project Workflow

The project follows a structured GitHub workflow:

- Every task is documented through an Issue.
- Development is performed on dedicated branches.
- Pull Requests are used to merge changes.
- PRs are reviewed before being merged.
- PRs are linked to issues using the `Closes #ID` syntax.
- The CI Pipeline checks that the project can be built and started correctly.

Recommended branch naming:

```text
issue-<ID>-<short-description>
```

Example:

```text
issue-12-admin-dashboard
```

---

## Useful Commands

### Start containers

```bash
docker compose up --build
```

### Start containers in background

```bash
docker compose up -d --build
```

### Stop containers

```bash
docker compose down
```

### Show backend logs

```bash
docker logs kinetix-app
```

### Show frontend logs

```bash
docker logs kinetix-frontend
```

### Run database verification

```bash
docker exec -it kinetix-app npm run verify-db
```

### Check Git status

```bash
git status
```

---

## Troubleshooting

### Backend does not start

Check backend logs:

```bash
docker logs kinetix-app
```

Common causes:

- Missing `.env` file.
- Invalid `MONGO_URI`.
- MongoDB Atlas IP not whitelisted.
- Missing `SESSION_SECRET`.
- Wrong `MEILI_HOST`.
- Missing `MEILI_MASTER_KEY`.

---

### Meilisearch invalid URL error

If you see:

```text
MeilisearchError: The provided host is not valid
Invalid URL
```

check `MEILI_HOST`.

Inside Docker it must be:

```env
MEILI_HOST=http://meilisearch:7700
```

Not:

```env
MEILI_HOST=meilisearch:7700
```

and not:

```env
MEILI_HOST=http://localhost:7700
```

---

### MongoDB connection timeout

If you see errors such as:

```text
MongoServerSelectionError
ReplicaSetNoPrimary
products.find() buffering timed out
```

check:

- `MONGO_URI`
- MongoDB Atlas username and password
- MongoDB Atlas Network Access
- GitHub Actions secrets
- Whether the GitHub runner IP is whitelisted

For quick testing, MongoDB Atlas can temporarily allow:

```text
0.0.0.0/0
```

This allows access from any IP and is useful for debugging CI connectivity issues.

---

### Login or register does not persist session

Check that the backend CORS configuration allows credentials and that frontend requests use:

```js
credentials: "include";
```

Also verify:

```env
FRONTEND_URL=http://localhost:3000
```

---

### Admin link does not appear

Check that the user has:

```json
{
  "role": "admin"
}
```

Then log out and log in again.

---

## Benchmarks and Verification

The project includes a database verification script:

```bash
docker exec -it kinetix-app npm run verify-db
```

This is used by the CI Pipeline to verify that the backend can interact correctly with the database.

| Test                       | Objective                             | Status      |
| -------------------------- | ------------------------------------- | ----------- |
| Docker startup             | Build and run all containers          | Implemented |
| Backend health check       | Verify backend availability           | Implemented |
| Swagger check              | Verify API documentation availability | Implemented |
| Frontend health check      | Verify frontend availability          | Implemented |
| Database verification      | Verify MongoDB connectivity           | Implemented |
| Meilisearch initialization | Configure and sync search index       | Implemented |

---

## AI Usage Disclosure

Generative AI tools were used during the development of this project to support:

- Code generation.
- Debugging.
- Refactoring.
- Documentation.
- README updates.
- CI troubleshooting.
- API design.
- Explanation of technical concepts.

All AI-generated suggestions were reviewed, adapted, and integrated by the project contributors.

---

## Authors

- **C4MRS** - Developer
- **Y1lion** - Developer
