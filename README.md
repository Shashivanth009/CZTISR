<p align="center">
  <img src="https://img.shields.io/badge/C5ISR-Zero%20Trust-00d9f9?style=for-the-badge&logo=shield&logoColor=white" alt="C5ISR Badge"/>
</p>

<h1 align="center">C5ISR Zero Trust Platform</h1>

<p align="center">
  A real-time military command & control dashboard built on Zero Trust Architecture
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react" alt="React"/>
  <img src="https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite" alt="Vite"/>
  <img src="https://img.shields.io/badge/FastAPI-0.109-009688?style=flat-square&logo=fastapi" alt="FastAPI"/>
  <img src="https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python" alt="Python"/>
  <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat-square&logo=postgresql" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker" alt="Docker"/>
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License"/>
</p>

---

## 🎯 Overview

The **C5ISR Zero Trust Platform** unifies **Combat Systems (C5)**, **Intelligence, Surveillance & Reconnaissance (ISR)**, and **Zero Trust Architecture (ZTA)** into a single-pane-of-glass command interface. It provides real-time situational awareness, dynamic access control, and immutable audit logging — all secured by a "Never Trust, Always Verify" policy engine.

---

## ✨ Features

### 🔴 Combat Systems (C5)
| Module | Component | Capabilities |
|--------|-----------|-------------|
| **C1 — Command** | `CommanderDashboard` | DEFCON status, live asset tracking, signal intel feed |
| **C2 — Control** | `MissionControl` | Mission lifecycle (Plan → Active → Complete), priority & classification |
| **C3 — Computers** | `InfrastructureView` | Service mesh health, CPU/MEM metrics, encryption & certificate status |
| **C4 — Comms** | `Communications` | Encrypted channel management, secure messaging, protocol badges |
| **C5 — Cyber** | `SOCDashboard` | Network traffic analysis, protocol breakdown, threat table, SOC terminal |

### 🟢 Intelligence & Recon (ISR)
| Module | Component | Capabilities |
|--------|-----------|-------------|
| **I — Intelligence** | `Intelligence` | SIGINT/HUMINT/IMINT/OSINT/ELINT reports with confidence scoring |
| **S — Surveillance** | `SurveillanceRecon` | Sensor zone monitoring, coverage heatmaps, alert management |
| **R — Recon** | `SurveillanceRecon` | UAV/Satellite/Ground asset tracking with fuel & imagery stats |

### 🔵 Zero Trust Architecture (ZTA)
| Module | Component | Capabilities |
|--------|-----------|-------------|
| **Policy Engine** | `PolicyEngine` | Bell-LaPadula model, RBAC rules, dynamic trust scoring |
| **Audit Trail** | `AuditLog` | Immutable PERMIT/DENY log with risk scores and actor tracking |

### 🎨 UI/UX
- **Glassmorphic Cyberpunk Theme** — Dark UI with neon accents (`#00d9f9`, `#ff2a6d`, `#00ff9d`)
- **GlassExpand** — Click any panel to expand it into a focused fullscreen overlay
- **Real-Time Charts** — Recharts-powered line, pie, and bar visualizations
- **Live Battlespace** — WebSocket-driven asset map with sub-second updates

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     FRONTEND (Vercel)                     │
│            React 18 · Vite · Tailwind · Framer Motion     │
└────────────────┬──────────────────────┬──────────────────┘
                 │ HTTPS/REST           │ WSS (WebSocket)
                 ▼                      ▼
┌──────────────────────────────────────────────────────────┐
│              GATEWAY SERVICE — PEP (Render)               │
│     FastAPI · JWT Validation · Policy Enforcement         │
│     Embedded Asset Simulator · Traffic Generator          │
├───────────────────────┬──────────────────────────────────┤
│                       │ Token Verification                │
│                       ▼                                   │
│           IDENTITY SERVICE — PDP (Render)                 │
│     User Auth · TOTP/MFA · Policy Evaluation              │
├───────────────────────────────────────────────────────────┤
│                   POSTGRESQL (Render)                      │
│           Users · Roles · Policies · Sessions              │
└──────────────────────────────────────────────────────────┘
```

> **PEP** = Policy Enforcement Point &nbsp;|&nbsp; **PDP** = Policy Decision Point &nbsp;|&nbsp; Based on [NIST SP 800-207](https://csrc.nist.gov/publications/detail/sp/800-207/final)

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 18** | Component-based UI with Hooks |
| **Vite 7** | Lightning-fast dev server & optimized builds |
| **TypeScript** | Type-safe development |
| **TailwindCSS 3** | Utility-first styling with custom cyberpunk theme |
| **Framer Motion** | Smooth animations & transitions (GlassExpand) |
| **Recharts** | Data visualization (Line, Pie, Bar charts) |
| **Lucide React** | Consistent military-grade iconography |

### Backend
| Technology | Purpose |
|-----------|---------|
| **FastAPI** | Async Python web framework (REST + WebSocket) |
| **Pydantic** | Request/response validation & serialization |
| **python-jose** | JWT token creation & verification |
| **passlib + bcrypt** | Secure password hashing |
| **pyotp + qrcode** | TOTP-based Multi-Factor Authentication |
| **SQLAlchemy + asyncpg** | Async PostgreSQL ORM |
| **Redis** | Session store & pub/sub telemetry (Docker mode) |
| **httpx** | Async inter-service communication |

### Infrastructure
| Technology | Purpose |
|-----------|---------|
| **Docker Compose** | Local multi-service orchestration (6 containers) |
| **Render.com** | Production backend hosting (Blueprint via `render.yaml`) |
| **Vercel** | Production frontend hosting (SPA with `vercel.json`) |
| **PostgreSQL 15** | Persistent data store |

---

## 📁 Project Structure

```
c5isr-zero-trust/
├── backend/
│   ├── gateway/              # Layer 2 — Policy Enforcement Point (PEP)
│   │   ├── main.py           #   REST APIs + WebSocket + Embedded Simulator
│   │   └── Dockerfile
│   ├── identity/             # Layer 0/1 — Identity & Policy Decision Point
│   │   ├── main.py           #   Auth, JWT, User Management
│   │   ├── policy_engine.py  #   Bell-LaPadula, RBAC, Trust Scoring
│   │   └── Dockerfile
│   ├── defense/              # Layer 3 — Cyber Defense Module
│   │   └── Dockerfile
│   ├── simulation/           # Layer 3 — Asset Simulation Engine
│   │   ├── main.py           #   Air/Land/Naval physics simulation
│   │   └── Dockerfile
│   ├── shared/               # Shared Pydantic models (User, Clearance)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/       # 11 Dashboard modules
│   │   │   ├── CommanderDashboard.tsx
│   │   │   ├── MissionControl.tsx
│   │   │   ├── InfrastructureView.tsx
│   │   │   ├── Communications.tsx
│   │   │   ├── SOCDashboard.tsx
│   │   │   ├── Intelligence.tsx
│   │   │   ├── SurveillanceRecon.tsx
│   │   │   ├── ThreatMap.tsx
│   │   │   ├── PolicyEngine.tsx
│   │   │   ├── AuditLog.tsx
│   │   │   └── GlassExpand.tsx   # Fullscreen overlay component
│   │   ├── pages/
│   │   │   └── LoginPage.tsx     # JWT authentication
│   │   ├── config.ts             # Centralized API config
│   │   └── App.tsx               # Main app with 9-tab navigation
│   ├── vercel.json
│   └── package.json
├── docker-compose.yml            # 6-container orchestration
├── render.yaml                   # Render.com IaC blueprint
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 18
- **Python** ≥ 3.11
- **Docker** & **Docker Compose** (for local full-stack)

### Option A: Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/Shashivanth009/cztisr.git
cd cztisr/c5isr-zero-trust

# Start all 6 services
docker-compose up --build

# Frontend:  http://localhost:5173
# Gateway:   http://localhost:8020
# Identity:  http://localhost:8001
```

### Option B: Manual Setup

**Backend:**
```bash
cd backend
pip install -r requirements.txt

# Start Identity Service
uvicorn identity.main:app --port 8001

# Start Gateway Service (in a separate terminal)
uvicorn gateway.main:app --port 8020
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

---

## 🌐 Deployment

### Backend → Render.com
1. Push code to GitHub
2. Create a **New Blueprint** on Render
3. Connect your repo — it auto-detects `render.yaml`
4. Services created: `c5isr-identity`, `c5isr-gateway`, `c5isr-postgres`

### Frontend → Vercel
1. Import from GitHub on Vercel
2. Set **Environment Variables**:
   | Variable | Value |
   |----------|-------|
   | `VITE_IDENTITY_URL` | `https://your-identity.onrender.com` |
   | `VITE_GATEWAY_URL` | `https://your-gateway.onrender.com` |
   | `VITE_WS_GATEWAY_URL` | `wss://your-gateway.onrender.com` |
3. Deploy & verify

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/token` | Authenticate & receive JWT |
| `GET` | `/api/system-status` | DEFCON level, mission & threat counts |
| `GET` | `/api/missions` | Active mission list |
| `POST` | `/api/missions/{id}/update` | Update mission status |
| `GET` | `/api/infrastructure` | Service mesh health metrics |
| `GET` | `/api/communications` | Encrypted channel status |
| `POST` | `/api/communications/send` | Send secure message |
| `GET` | `/api/threats` | Active cyber threats (MITRE ATT&CK mapped) |
| `GET` | `/api/network-stats` | Bandwidth, connections, protocols |
| `GET` | `/api/vulnerability-scan` | CVE findings & compliance score |
| `GET` | `/api/intelligence` | Intel reports (SIGINT/HUMINT/IMINT/OSINT/ELINT) |
| `GET` | `/api/surveillance` | Sensor zone data & coverage |
| `GET` | `/api/reconnaissance` | UAV/Satellite/Ground asset status |
| `GET` | `/api/policy-decisions` | Policy evaluation history |
| `GET` | `/api/audit-logs` | Immutable access trail |
| `WS` | `/ws/telemetry` | Real-time asset position stream |

---

## 🔒 Security Model

```
         ┌─────────────────────────────────────┐
         │       ZERO TRUST POLICY ENGINE       │
         │                                       │
         │  ┌─────────────┐  ┌──────────────┐   │
         │  │ Bell-LaPadula│  │  RBAC Check  │   │
         │  │ (No Read Up) │  │ (Role-Based) │   │
         │  └──────┬──────┘  └──────┬───────┘   │
         │         │                │            │
         │         ▼                ▼            │
         │  ┌─────────────────────────────┐     │
         │  │  Trust Score Evaluation     │     │
         │  │  (Identity + Context + Time)│     │
         │  └─────────────┬───────────────┘     │
         │                │                      │
         │         ┌──────┴──────┐               │
         │         │             │               │
         │      PERMIT        DENY               │
         │     (+ Audit)    (+ Audit + Alert)    │
         └─────────────────────────────────────┘
```

- **Authentication**: JWT (HS256) with TOTP/MFA support
- **Authorization**: Attribute-Based Access Control (ABAC)
- **Clearance Levels**: UNCLASSIFIED → CONFIDENTIAL → SECRET → TOP_SECRET
- **Audit**: Every decision logged with timestamp, actor, resource, and risk score

---

## 🗺️ Roadmap

- [ ] Persistent audit logs in PostgreSQL
- [ ] Kubernetes Helm charts for scalable deployment
- [ ] AI-powered threat analysis (LLM integration)
- [ ] Mobile command interface (React Native)
- [ ] Integration with real sensor feeds (MQTT/gRPC)

---

<p align="center">
  Built with 🛡️ by <strong>Shashivanth</strong>
</p>
