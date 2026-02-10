# Shadow Bot 🤖

An automated, high-fidelity Google Meet recording, transcription, and summarization platform. Shadow Bot leverages Docker orchestrated containers, Redis-based distributed queueing, and state-of-the-art AI to transform your meetings into actionable knowledge.

## 🚀 Core Features

-   **Isolated Recording**: Spins up ephemeral Docker containers for each meeting, ensuring isolated browser sessions and reliable capture.
-   **Streaming AI Transcription**: Uses ElevenLabs Scribe v2 with async streaming (`createReadStream`) for memory-efficient, high-fidelity speech-to-text.
-   **Smart Summarization**: Automatically generates titles and bulleted summaries with timestamps using Google Gemini.
-   **Chat with Transcript**: Ask questions about your meetings (e.g., "What was the budget decision?") and get answers based on the full transcript using Gemini's 1M token window.
-   **Distributed Architecture**: Decoupled services (HTTP, Docker Manager, Transcribe Service) communicate via Redis for high scalability.
-   **Unified Monorepo**: Built with Turborepo and `pnpm` for efficient workspace management.

## 🛠 Project Structure

This project is a Turborepo monorepo:

### Apps
-   `http`: An Express-based API gateway to trigger and manage recording sessions.
-   `docker-manager`: Orchestrates the lifecycle of recorder containers and manages task handoffs.
-   `transcribe-service`: A dedicated worker that processes recordings using ElevenLabs and Gemini.
-   `web`: Next.js dashboard for viewing transcripts and managing recordings.

### Packages
-   `@repo/db`: Shared Prisma client and schema for centralized postgres storage.
-   `@repo/types`: Shared TypeScript definitions across all services.
-   `@repo/typescript-config`: Reusable base `tsconfig.json`.

## 🔄 How It Works (End-to-End Workflow)

1.  **Trigger**: An external request (HTTP POST) hits the `http` service with a Meet link.
2.  **Queue**: The meeting is registered in the DB and added to the `join_meet_queue` in Redis.
3.  **Record**: `docker-manager` picks up the task, starts a Docker container that joins the Meet, records the session, and saves a `.webm` file.
4.  **Handover**: Once the container exits, `docker-manager` pushes a task to the `transcription-queue`.
5.  **Transcribe**: `transcribe-service` picks up the task, **streams** the audio to ElevenLabs for transcription.
6.  **Summarize & Save**: The transcript is passed to Gemini for summarization, and all results are updated in the database.

## 📦 Getting Started

### Prerequisites
-   [pnpm](https://pnpm.io/)
-   [Docker](https://www.docker.com/)
-   [Redis](https://redis.io/)
-   [PostgreSQL](https://www.postgresql.org/)

### Docker Setup

The following containers must be running for the platform to function:

1. **PostgreSQL** (Database):
   ```bash
   docker run -d --name shadowdb -p 5432:5432 -e POSTGRES_PASSWORD=yourpassword postgres:latest
   ```

2. **Redis** (Queues):
   ```bash
   docker run -d --name drawr-redis -p 6379:6379 redis
   ```

3. **Qdrant** (Vector Search):
   ```bash
   docker run -d --name qdrant -p 6333:6333 -p 6334:6334 -v qdrant_storage:/qdrant/storage qdrant/qdrant
   ```

### Setup

1.  Install dependencies:
    ```bash
    pnpm install
    ```

2.  Configure Environment:
    Create `.env` files for each service.
    -   `packages/db/.env`: `DATABASE_URL` (Required **only** here; apps inherit the client)
    -   `apps/transcribe-service/.env`: `ELEVENLABS_API_KEY`, `GEMINI_API_KEY`
    -   `apps/http/.env`: `GEMINI_API_KEY`

3.  Initialize Database:
    ```bash
    pnpm --filter @repo/db run db:push
    ```

### Running the Services

To start the Entire platform in development mode:
```bash
pnpm dev
```

Alternatively, start individual services for debugging:
```bash
pnpm --filter http run dev
pnpm --filter docker-manager run dev
pnpm --filter transcribe-service run dev
```

## 🧪 API Usage

### 1. Trigger a Recording
```bash
curl -X POST http://localhost:3005/api/v1/join-meeting \
     -H "Content-Type: application/json" \
     -d '{"link": "https://meet.google.com/your-meet-id"}'
```

### 2. Chat with Transcript
Ask questions about a specific recording:
```bash
curl -X POST http://localhost:3005/api/v1/chat \
     -H "Content-Type: application/json" \
     -d '{
       "recordingId": "YOUR_RECORDING_ID",
       "message": "What were the key action items?"
     }'
```

---
Built with ❤️ using Turborepo, Node.js, and AI.
