# Docker setup

Make sure you have a recent version of Docker installed (e.g. Docker Desktop for Windows of Mac).

We only support local Express server in docker configuration.

## 1. Clone the repository

```bash
  git clone https://github.com/alex3493/xavier-tax-down-senior-backend-challenge.git
  cd xavier-tax-down-senior-backend-challenge
```

## 2. Install Dependencies

Install the necessary dependencies:

```bash
  npm install -g typescript
  npm install
```

## 3. Create .env file in root directory

```bash
  cp .env.example .env
```

## 4. Build and start Docker containers

```bash
  docker-compose up -d
```

## 5. Browse OpenAPI docs

You can access the Swagger OpenAPI UI at: [http://localhost:4000/api-docs](http://localhost:4000/api-docs)

## 6. Stop containers

Stop and remove containers.

```bash
  docker-compose down --remove-orphans
```

# Notes

## Build targets

By default, we build the app in development mode (`npm run devExpress`). However, we can easily switch to production
mode if need be (`npm run startExpress`).

Open `.env` file in project root and update `BUILD_TARGET`:

- `BUILD_TARGET=dev-image` - dev mode.
- `BUILD_TARGET=prod-image` - prod mode.

Rebuild and start containers:

```
docker compose build
docker compose up -d
```

## Server port

By default, API is served on port 3000. However, it may cause conflicts with other containers, e.g. a React UI
application also running on port 3000. In docker environment we set API port to 4000. You can change this value setting
`DOCKER_API_PORT` in `.env`:

```
# DOCKER_API_PORT=4000
DOCKER_API_PORT=3001
```

## Running tests

Tests must be run inside Docker container:

```bash
  docker exec -it api sh
```

Then inside the shell:

```sh
  npm run test
```

## Known issues

MongoDB data is not persisted when container is destroyed and recreated. We can stop and start **database** container without losing
collection data. However, when we remove containers with `docker compose down` and recreate them with
`docker compose up -d` container data is wiped out.

Restarting **api** container also results in database data loss.

We will address this issue later.