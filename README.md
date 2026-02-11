# Shadow Bot 🤖

An automated, end-to-end Google Meet **recording → transcription → summarization → AI chat** platform. Shadow Bot dispatches ephemeral Docker containers that silently join your meetings, records them, and pipes the audio through a multi-stage AI pipeline (ElevenLabs Scribe → Gemini Flash → Qdrant Vector Search) so every meeting becomes instantly searchable and conversational.

---

## Table of Contents

- [Architecture Overview](#-architecture-overview)
- [Core Features](#-core-features)
- [Tech Stack & Techniques](#-tech-stack--techniques)
- [Project Structure](#-project-structure)
- [End-to-End Workflow](#-end-to-end-workflow)
- [AI Pipeline Deep Dive](#-ai-pipeline-deep-dive)
- [API Reference](#-api-reference)
- [Getting Started](#-getting-started)
- [Chrome Extension](#-chrome-extension)
- [Environment Variables](#-environment-variables)

---

## 🏗 Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer"
        A["Next.js Web App<br/>(React + Tailwind)"]
        B["Chrome Extension<br/>(Manifest V3)"]
    end

    subgraph "API Gateway"
        C["HTTP Service<br/>(Express v5)"]
    end

    subgraph "Workers"
        D["Docker Manager<br/>(Dockerode)"]
        E["Transcribe Service"]
    end

    subgraph "External AI APIs"
        J["ElevenLabs<br/>Scribe v2"]
        K["Google Gemini<br/>Flash"]
    end

    subgraph "Infrastructure"
        F[("PostgreSQL<br/>(Prisma ORM)")]
        G[("Redis<br/>(Queue Broker)")]
        H[("Qdrant<br/>(Vector DB)")]
        I["Docker Engine<br/>(gmeet-recorder)"]
    end

    A -->|REST API| C
    B -->|REST API| C
    C -->|Read/Write| F
    C -->|Enqueue Join| G
    C -->|Vector Search| H
    C -->|LLM Chat| K
    G -->|BLPOP join_meet_queue| D
    D -->|Start Container| I
    D -->|Update Status| F
    D -->|Enqueue Transcription| G
    G -->|BLPOP transcription-queue| E
    E -->|Stream Audio| J
    E -->|Summarize + Tag + Embed| K
    E -->|Store Vectors| H
    E -->|Save Results| F
```

---

## 🚀 Core Features

### 1. 🎙️ Isolated Meeting Recording
- **Ephemeral Docker Containers**: Each recording spins up a dedicated browser container (`rahmatdeep/gmeet-recorder`) that joins the meeting as "Shadow Bot" and records audio/video.
- **Per-User Limits**: Configurable concurrent container cap (`MAX_CONCURRENT_CONTAINERS`, default 2) with per-user single-container enforcement.
- **Auto-Cleanup**: Containers are `AutoRemove: true`. Invalid meeting links trigger automatic file deletion and status updates.
- **Status Tracking**: Real-time status progression: `PENDING → ASKING_TO_JOIN → JOINED → COMPLETED/FAILED/TIMEOUT`. Updated via Docker container log stream monitoring.
- **Retry Logic**: Up to 3 attempts to start a recorder with 2-second backoff between failures.

### 2. 🗣️ Streaming AI Transcription
- **ElevenLabs Scribe v2**: High-fidelity speech-to-text using `scribe_v2` model.
- **Memory-Efficient Streaming**: Uses Node.js `createReadStream` instead of loading the full `.webm` file into memory.
- **Timestamped Output**: Every utterance is tagged with precise `[HH:MM:SS]` timestamps in a separate `transcriptWithTimeStamps` field.
- **Dual Format**: Both raw transcript and timestamped transcript are stored for different use cases.

### 3. 📝 Multi-Stage Summarization
- **Executive Summary** (Structured JSON): Extracts `title`, `goal`, `keyPoints[]`, and `actionItems[]` using Gemini Flash with Zod-validated structured output.
- **Detailed Summary** (Free-Text): Comprehensive, chronological, lossless summary that preserves every statement, including side conversations and tone — formatted as readable paragraphs.

### 4. 🏷️ AI-Generated Tags
- Generates 3–7 specific, searchable tags per meeting (e.g., `product-roadmap`, `alex`, `sprint-review`).
- Tags are normalized (lowercase, hyphenated, deduplicated) using a shared utility in `@repo/common`.
- Validated against a Zod schema (`TagsSchema`) for type safety.

### 5. 🧠 Vector Embeddings & Semantic Search
- Transcripts are chunked (500 words, 50-word overlap) and embedded using `gemini-embedding-001`.
- Stored in **Qdrant** vector database with `recordingId` and `chunkIndex` metadata.
- Powers the **Global Query Router** for cross-meeting semantic search.

### 6. 💬 Per-Recording Chat
- Ask questions about any specific recording (e.g., *"What was the budget decision?"*).
- Uses **LangChain** with full conversation history + transcript-as-system-context.
- Automatic chat title generation from the first message.
- Classified LLM error handling with exponential backoff retries.

### 7. 🔍 Global Query Router (Cross-Meeting Search)
- Ask questions across **all your meetings** (e.g., *"When did we last discuss the product launch?"*).
- **Time-Aware Filtering**: Automatically parses time filters from natural language queries (e.g., "last week", "in January").
- **RAG Pipeline**: Retrieves relevant transcript chunks via Qdrant vector search, then generates answers with Gemini Flash.
- **Session Persistence**: Maintains conversation history across multiple queries in a session.
- **Performance Instrumented**: Every step (session setup, time filter parsing, vector search, LLM response) is timed and logged.

### 8. 🔐 Authentication
- **Email/Password**: Signup with bcrypt-hashed passwords, login with JWT (7-day expiry).
- **Google OAuth**: One-click Google sign-in with automatic account creation/linking.
- **JWT Middleware**: All API routes (except auth) are protected by Bearer token verification.
- **Ownership Enforcement**: Every resource access verifies the requesting user owns the recording/chat.

### 9. 🌐 Next.js Web Dashboard
- **Meeting Library**: View all recordings with status badges, transcription progress, and tags.
- **Transcript Viewer**: Read full transcripts with timestamps and summaries.
- **Chat Interface**: Interactive AI chat per recording and global query across all meetings.
- **Design System**: Premium Terracotta/cream palette with Framer Motion animations, glassmorphism, and responsive layouts.

### 10. 🧩 Chrome Extension
- **Manifest V3**: Modern Chrome extension architecture.
- **Session Sharing**: Automatically reuses the login session from `localhost:3000`.
- **URL Auto-Detection**: Detects Google Meet links in the active tab and offers one-click join.
- **Active Meetings Display**: Shows currently recording meetings with live status badges.
- **Premium UI**: Ghibli-inspired professional partner logo with GPU-accelerated spring animations.

---

## 🔧 Tech Stack & Techniques

### Languages & Runtimes
| Component | Technology |
|---|---|
| Backend Services | TypeScript + Node.js |
| Web Frontend | TypeScript + React 19 |
| Chrome Extension | Vanilla JS (Manifest V3) |
| Recording Container | TypeScript + Bun |

### Frameworks & Libraries
| Purpose | Technology |
|---|---|
| API Server | Express v5 |
| Web Dashboard | Next.js 16 + Tailwind CSS v4 + DaisyUI |
| Animations | Framer Motion |
| AI / LLM | LangChain + Google Gemini Flash |
| Transcription | ElevenLabs Scribe v2 |
| Embeddings | Google `gemini-embedding-001` |
| Database ORM | Prisma |
| Schema Validation | Zod |
| Auth | JSON Web Tokens (JWT) + bcryptjs |
| Container Orchestration | Dockerode |
| Queue Broker | Redis (BLPOP/RPUSH FIFO) |
| Vector Search | Qdrant |
| Monorepo Tooling | Turborepo + pnpm workspaces |

### Key Techniques
| Technique | Where Used |
|---|---|
| **Distributed FIFO Queues** | Redis `BLPOP` / `RPUSH` for `join_meet_queue` and `transcription-queue` |
| **Ephemeral Container Orchestration** | Dockerode with `AutoRemove`, IPC host mode, 2 GB memory cap |
| **Container Log Stream Monitoring** | Real-time status updates by parsing Docker `stdout`/`stderr` streams |
| **Streaming File Upload** | `createReadStream` → ElevenLabs API for memory-efficient transcription |
| **Structured LLM Output** | Gemini Flash + Zod schemas for type-safe AI responses |
| **RAG (Retrieval-Augmented Generation)** | Qdrant vector search + LangChain context injection for query answering |
| **Overlapping Text Chunking** | 500-word chunks with 50-word overlap for better semantic search recall |
| **LLM Error Classification & Retry** | Rate limit detection, exponential backoff, classified error types |
| **JWT Session Sharing** | Chrome extension reads JWT from web app's localStorage |
| **GPU-Accelerated CSS** | `translate3d()`, `will-change`, spring-based cubic-bezier easing in extension |

---

## 📁 Project Structure

```
shadow-bot/
├── apps/
│   ├── http/                    # Express API gateway
│   │   ├── src/
│   │   │   ├── routes/v1/
│   │   │   │   ├── auth.ts      # Signup, Login, Google OAuth
│   │   │   │   ├── meeting.ts   # CRUD, Join, Status, Transcript
│   │   │   │   ├── chat.ts      # Per-recording AI chat
│   │   │   │   └── query.ts     # Global cross-meeting query router
│   │   │   ├── middleware/
│   │   │   │   └── auth.ts      # JWT verification middleware
│   │   │   └── utils/
│   │   │       └── ownership.ts # Resource ownership verification
│   │   └── __tests__/           # Jest test suite
│   │
│   ├── docker-manager/          # Container orchestration worker
│   │   └── src/
│   │       ├── index.ts         # Redis queue listener + container lifecycle
│   │       └── dockerService.ts # DockerService class (start, limits, pull)
│   │
│   ├── transcribe-service/      # AI processing worker
│   │   └── src/
│   │       ├── index.ts         # Queue listener + processing pipeline
│   │       ├── summarize.ts     # Executive summary (structured JSON)
│   │       ├── detailedSummarize.ts  # Comprehensive prose summary
│   │       ├── tags.ts          # AI tag generation
│   │       └── embed.ts         # Qdrant vector embedding + search
│   │
│   ├── web/                     # Next.js 16 dashboard
│   │   └── src/
│   │       ├── app/             # App router pages
│   │       ├── components/      # React components
│   │       └── lib/api/         # Axios API client
│   │
│   └── chrome-extension/        # Browser extension (Manifest V3)
│       ├── manifest.json
│       ├── popup.html / popup.js / style.css
│       ├── background.js        # Service worker
│       └── icons/               # PNG icons (16, 48, 128)
│
├── packages/
│   ├── db/                      # Prisma client + schema
│   │   └── prisma/schema.prisma # 7 models, 3 enums
│   ├── types/                   # Shared Zod schemas & TypeScript types
│   ├── common/                  # Shared utilities (tag normalization, LLM error handling)
│   ├── ui/                      # Shared React UI components
│   ├── eslint-config/           # Shared ESLint configuration
│   └── typescript-config/       # Shared base tsconfig
│
├── recordings/                  # Downloaded .webm files (volume-mounted)
├── turbo.json                   # Turborepo pipeline config
└── pnpm-workspace.yaml          # Workspace definition
```

---

## 🔄 End-to-End Workflow

```mermaid
sequenceDiagram
    participant User
    participant WebApp as Web App / Extension
    participant API as HTTP Service
    participant Redis
    participant DockerMgr as Docker Manager
    participant Container as Recorder Container
    participant TransSvc as Transcribe Service
    participant ElevenLabs
    participant Gemini as Gemini Flash
    participant Qdrant
    participant DB as PostgreSQL

    User->>WebApp: Submit meeting link
    WebApp->>API: POST /api/v1/meeting/join
    API->>DB: Create Recording (PENDING)
    API->>Redis: RPUSH join_meet_queue
    API-->>WebApp: { status: "queued", recordingId }

    Redis->>DockerMgr: BLPOP join_meet_queue
    DockerMgr->>Container: Start gmeet-recorder
    DockerMgr->>DB: Update status → ASKING_TO_JOIN
    Container-->>DockerMgr: Log: "Bot admitted"
    DockerMgr->>DB: Update status → JOINED

    Note over Container: Recording in progress...

    Container-->>DockerMgr: Container exits (code 0)
    DockerMgr->>DB: Update status → COMPLETED
    DockerMgr->>Redis: RPUSH transcription-queue

    Redis->>TransSvc: BLPOP transcription-queue
    TransSvc->>DB: Transcription → IN_PROGRESS
    TransSvc->>ElevenLabs: Stream .webm file
    ElevenLabs-->>TransSvc: Transcription result
    TransSvc->>DB: Save transcript + timestamps

    TransSvc->>Gemini: Executive summary
    Gemini-->>TransSvc: { title, goal, keyPoints, actionItems }
    TransSvc->>DB: Save summary

    par Parallel AI Processing
        TransSvc->>Gemini: Detailed summary
        Gemini-->>TransSvc: Prose summary
        TransSvc->>DB: Save detailed summary
    and
        TransSvc->>Gemini: Generate tags
        Gemini-->>TransSvc: ["tag1", "tag2", ...]
        TransSvc->>DB: Save tags
    and
        TransSvc->>Gemini: Generate embeddings
        Gemini-->>TransSvc: Vector embeddings
        TransSvc->>Qdrant: Store chunks + metadata
        TransSvc->>DB: embeddingStatus → COMPLETED
    end
```

---

## 🤖 AI Pipeline Deep Dive

```mermaid
flowchart LR
    subgraph "Input"
        A[".webm Recording"]
    end

    subgraph "Stage 1: Transcription"
        B["ElevenLabs Scribe v2<br/>createReadStream()"]
    end

    subgraph "Stage 2: Summarization"
        C["Executive Summary<br/>(Gemini + Zod Schema)"]
        D["Detailed Summary<br/>(Gemini Free-Text)"]
    end

    subgraph "Stage 3: Enrichment"
        E["Tag Generation<br/>(Gemini + Zod)"]
        F["Vector Embeddings<br/>(gemini-embedding-001)"]
    end

    subgraph "Storage"
        G[("PostgreSQL<br/>Transcript Table")]
        H[("Qdrant<br/>transcript_chunks")]
    end

    A --> B
    B --> C
    B --> D
    C --> E
    B --> F
    C --> G
    D --> G
    E --> G
    F --> H
```

Each stage updates a dedicated status field in the database:

| Stage | Status Field | Values |
|---|---|---|
| Transcription | `transcriptionStatus` | `PENDING → IN_PROGRESS → COMPLETED / FAILED` |
| Executive Summary | `summaryStatus` | `PENDING → IN_PROGRESS → COMPLETED / FAILED` |
| Detailed Summary | `detailedSummaryStatus` | `PENDING → IN_PROGRESS → COMPLETED / FAILED` |
| Tags | `tagsStatus` | `PENDING → IN_PROGRESS → COMPLETED / FAILED` |
| Embeddings | `embeddingStatus` | `PENDING → IN_PROGRESS → COMPLETED / FAILED` |

---

## 📡 API Reference

All endpoints (except auth) require: `Authorization: Bearer <JWT>`

### Auth (`/api/v1/auth`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/signup` | Register with email, password, name |
| `POST` | `/login` | Login with email + password → JWT |
| `POST` | `/google-auth` | Google OAuth sign-in / account linking |

### Meetings (`/api/v1/meeting`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | List all user recordings with statuses |
| `GET` | `/:id` | Get recording details + transcript + recent chats |
| `GET` | `/:id/status` | Poll recording + transcription status |
| `GET` | `/:id/transcript` | Get full transcript, timestamps, and summary |
| `POST` | `/join` | Queue a new meeting recording |

### Chat (`/api/v1/chat`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/start` | Create a new chat session for a recording |
| `POST` | `/message` | Send a message, get AI response with full history |
| `GET` | `/` | List all chat sessions (optionally filter by recording) |
| `GET` | `/:chatId` | Get chat session with full message history |

### Query (`/api/v1/query`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/` | Ask a question across all meetings (RAG pipeline) |
| `GET` | `/` | List all query sessions |
| `GET` | `/:querySessionId` | Get query session with conversation history |

---

## 📦 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **pnpm** 9.x (`npm install -g pnpm`)
- **Docker** (running)
- **PostgreSQL**, **Redis**, **Qdrant** (via Docker, see below)

### 1. Start Infrastructure Containers

```bash
# PostgreSQL
docker run -d --name shadowdb \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=yourpassword \
  postgres:latest

# Redis
docker run -d --name shadow-redis \
  -p 6379:6379 \
  redis

# Qdrant (Vector Search)
docker run -d --name qdrant \
  -p 6333:6333 -p 6334:6334 \
  -v qdrant_storage:/qdrant/storage \
  qdrant/qdrant
```

### 2. Pull the Recorder Image

```bash
docker pull rahmatdeep/gmeet-recorder:latest
```

### 3. Install Dependencies

```bash
git clone https://github.com/your-repo/shadow-bot.git
cd shadow-bot
pnpm install
```

### 4. Configure Environment Variables

Create `.env` files for each service (see [Environment Variables](#-environment-variables) below):

```bash
# packages/db/.env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/shadowbot"

# apps/http/.env
JWT_SECRET="your-jwt-secret"
GEMINI_API_KEY="your-gemini-api-key"
HTTP_PORT=3005

# apps/transcribe-service/.env
ELEVENLABS_API_KEY="your-elevenlabs-api-key"
GEMINI_API_KEY="your-gemini-api-key"

# apps/web/.env
NEXT_PUBLIC_API_URL="http://localhost:3005"

# apps/docker-manager/.env
MAX_CONCURRENT_CONTAINERS=2
```

### 5. Initialize Database

```bash
pnpm --filter @repo/db run db:push
```

### 6. Start All Services

```bash
# Start everything (http, docker-manager, transcribe-service, web)
pnpm dev
```

Or start individual services:

```bash
pnpm --filter http run dev              # API on :3005
pnpm --filter docker-manager run dev    # Container orchestrator
pnpm --filter transcribe-service run dev # AI pipeline worker
pnpm --filter web run dev               # Web dashboard on :3000
```

### 7. Verify

```bash
# Health check
curl http://localhost:3005/health

# API status
curl http://localhost:3005/api/v1/status
```

---

## 🧩 Chrome Extension

### Installation

1. Open Chrome → `chrome://extensions/`
2. Enable **Developer Mode** (top-right toggle)
3. Click **"Load unpacked"**
4. Select `apps/chrome-extension/`
5. Pin the extension (🧩 → 📌)

### Usage

1. **Login** on `http://localhost:3000` first (the extension shares your session)
2. Navigate to any Google Meet tab — the extension auto-detects the link
3. Click **"Use"** to fill the meeting URL, then **"Join Meeting"** to start recording
4. Active recordings show as live status cards in the popup

---

## 🔑 Environment Variables

| Variable | Service | Required | Description |
|---|---|---|---|
| `DATABASE_URL` | `packages/db` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | `http` | ✅ | Secret for signing JWTs |
| `HTTP_PORT` | `http` | ❌ | API port (default: `3000`) |
| `GEMINI_API_KEY` | `http`, `transcribe-service` | ✅ | Google AI API key |
| `ELEVENLABS_API_KEY` | `transcribe-service` | ✅ | ElevenLabs API key |
| `RECORDINGS_DIR` | `transcribe-service` | ❌ | Custom recordings path |
| `MAX_CONCURRENT_CONTAINERS` | `docker-manager` | ❌ | Container limit (default: `2`) |
| `NEXT_PUBLIC_API_URL` | `web` | ✅ | API URL for the frontend |

---

## 🗂️ Database Schema

```mermaid
erDiagram
    User ||--o{ Recording : has
    User ||--o{ QuerySession : has
    Recording ||--o| Transcript : has
    Recording ||--o{ ChatSession : has
    ChatSession ||--o{ ChatMessage : contains
    QuerySession ||--o{ QueryMessage : contains

    User {
        string id PK
        string email UK
        string password
        string name
        string provider
        string providerAccountId
    }

    Recording {
        string id PK
        string userId FK
        string link
        string fileName
        string title
        RecordingStatus status
        json errorMetadata
    }

    Transcript {
        string id PK
        string recordingId FK
        string transcript
        string transcriptWithTimeStamps
        json summary
        string detailedSummary
        string[] tags
        TranscriptStatus transcriptionStatus
        TranscriptStatus summaryStatus
        TranscriptStatus detailedSummaryStatus
        TranscriptStatus tagsStatus
        TranscriptStatus embeddingStatus
        string failureReason
    }

    ChatSession {
        string id PK
        string recordingId FK
        string title
    }

    ChatMessage {
        string id PK
        string chatSessionId FK
        ChatRole role
        string content
    }

    QuerySession {
        string id PK
        string userId FK
        string title
    }

    QueryMessage {
        string id PK
        string querySessionId FK
        ChatRole role
        string content
    }
```

---

Built with ❤️ using Turborepo, Node.js, and Langchain.
