<div align="center">

# 🛡️ C5ISR Zero Trust Platform

### Military-Grade Command & Control Dashboard Built on Zero Trust Architecture
*Real-Time Situational Awareness • Bell-LaPadula MLS • Dynamic TOTP MFA • NIST SP 800-207*

<br/>

[![C5ISR Zero Trust](https://img.shields.io/badge/C5ISR-ZERO%20TRUST-00ff9d?style=for-the-badge&logo=shield&logoColor=black)](https://github.com/Shashivanth009/cztisr)
[![NIST SP 800-207](https://img.shields.io/badge/SECURITY-NIST%20SP%20800--207-00d9f9?style=for-the-badge&logo=security-scorecard&logoColor=black)](https://csrc.nist.gov/publications/detail/sp/800-207/final)
[![TOTP MFA](https://img.shields.io/badge/AUTH-TOTP%20MFA-ff2a6d?style=for-the-badge&logo=authy&logoColor=white)](https://github.com/Shashivanth009/cztisr)
[![Docker Orchestration](https://img.shields.io/badge/STACK-DOCKER%20COMPOSE-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://github.com/Shashivanth009/cztisr)

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react" alt="React 19"/>
  <img src="https://img.shields.io/badge/Vite-7.3-646CFF?style=flat-square&logo=vite" alt="Vite 7"/>
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/FastAPI-0.109-009688?style=flat-square&logo=fastapi" alt="FastAPI"/>
  <img src="https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python" alt="Python 3.11"/>
  <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat-square&logo=postgresql" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis" alt="Redis"/>
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License"/>
</p>

---

</div>

## 🎯 Executive Summary

The **C5ISR Zero Trust Platform** is a unified command and control (C2) interface integrating **Combat Systems (C5)**, **Intelligence, Surveillance & Reconnaissance (ISR)**, and **Zero Trust Architecture (ZTA)** into a single pane of glass.

Designed under the **"Never Trust, Always Verify"** standard ([NIST SP 800-207](https://csrc.nist.gov/publications/detail/sp/800-207/final)), every inbound request undergoes 3-stage authentication (Passphrase $\rightarrow$ Contextual Device Trust $\rightarrow$ RFC 6238 TOTP MFA), continuous authorization via Mandatory Access Control (Bell-LaPadula MLS), and immutable audit trail generation.

```
+-----------------------------------------------------------------------+
|                         SYSTEM OPERATIONAL STATUS                      |
+-----------------------------------------------------------------------+
| DEFCON LEVEL     : 3 (ROUND HOUSE)                                    |
| POLICY ENGINE    : ARMED & ENFORCING (Bell-LaPadula + RBAC)          |
| AUTH PIPELINE    : 3-STEP (Creds -> Device Trust -> TOTP MFA)         |
| TELEMETRY STREAM : ACTIVE (1Hz WebSocket Battlespace Stream)          |
| DATA ENCRYPTION  : AES-256-GCM / TLS 1.3 / mTLS                        |
+-----------------------------------------------------------------------+
```

---

## 🏛️ System Architecture

```mermaid
flowchart TB
    subgraph PRESENTATION["🌐 Presentation Layer (Frontend SPA)"]
        UI["React 19 + TypeScript + Vite 7<br/>Cyberpunk Glassmorphic Control Center<br/>11 Modules • 9 RBAC Tabs • GlassExpand Overlays"]
    end

    subgraph PEP["🛡️ Policy Enforcement Point — PEP (Gateway Service)"]
        GW["FastAPI API Gateway (:8020)<br/>REST Endpoints • JWT Authorization • Audit Logger"]
        WS["WebSocket Telemetry Engine<br/>1Hz Live Asset Coordinate Stream"]
        SIM["Internal Simulation Engine<br/>Land (6) • Air (4) • Naval (3) Asset Trackers"]
    end

    subgraph PDP["🔑 Policy Decision Point — PDP (Identity Service)"]
        IDP["Identity Provider (:8001)<br/>Credential Hash Verifier & TOTP Engine"]
        POLICY["Policy Engine<br/>Bell-LaPadula Model & RBAC Rule Inspector"]
    end

    subgraph DATA["💾 Data & Session Layer"]
        PG[("PostgreSQL 15<br/>Users, Roles & Security Policies")]
        RD[("Redis 7<br/>Session Cache & Telemetry Channel")]
    end

    UI -->|"HTTPS / REST API"| GW
    UI -->|"WSS Telemetry Stream"| WS
    GW -->|"Token Verification & Policy Query"| IDP
    IDP --> POLICY
    IDP --> PG
    IDP --> RD
    SIM -->|"Broadcasting Coordinates"| WS

    classDef presentation fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;
    classDef pep fill:#0f172a,stroke:#34d399,stroke-width:2px,color:#f8fafc;
    classDef pdp fill:#0f172a,stroke:#f43f5e,stroke-width:2px,color:#f8fafc;
    classDef data fill:#0f172a,stroke:#facc15,stroke-width:2px,color:#f8fafc;

    class UI presentation;
    class GW,WS,SIM pep;
    class IDP,POLICY pdp;
    class PG,RD data;
```

---

## 🔒 3-Step Zero Trust Authentication Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor Operator as 👤 Operator
    participant UI as 🖥️ Client UI
    participant IDP as 🔑 Identity Service (PDP)
    participant GW as 🛡️ Gateway Service (PEP)

    Note over Operator,IDP: STEP 1: CREDENTIAL VALIDATION
    Operator->>UI: Input Username & Passphrase
    UI->>IDP: POST /auth/step1 (form-urlencoded)
    IDP->>IDP: Check Lockout (Max 5 attempts / 300s lockout)
    IDP->>IDP: Verify Passphrase Hash (bcrypt)
    IDP->>IDP: Calculate Device Trust Score (Browser, TLS, Hours, Origin)
    IDP-->>UI: Return Session Token + Device Trust Evaluation

    Note over Operator,UI: STEP 2: CONTEXTUAL DEVICE TRUST EVALUATION
    UI->>UI: Display Trust Score Breakdown & Risk Factors

    Note over Operator,IDP: STEP 3: MULTI-FACTOR AUTHENTICATION
    Operator->>UI: Input 6-Digit TOTP Code
    UI->>IDP: POST /auth/step2 (JSON + Session Token)
    IDP->>IDP: Validate TOTP (RFC 6238 pyotp)
    IDP->>IDP: Generate Signed JWT (HS256, 30-min TTL)
    IDP-->>UI: Return Access Token & User Clearance Profile

    Note over UI,GW: AUTHORIZED TACTICAL SESSION
    UI->>GW: REST Requests with Bearer JWT
    GW->>IDP: Verify Token & Evaluate Clearance Level
    GW-->>UI: Serve Authorized Payload
```

---

## 🎛️ Feature & Tactical Component Catalog

### 🔴 Combat Systems (C5)

| Module | Component | Capabilities | Minimum Clearance |
|:---|:---|:---|:---:|
| **C1 — Command** | `CommanderDashboard.tsx` | DEFCON status indicator, live force counters, signal intel ticker, personnel tracking | `TOP_SECRET` |
| **C2 — Control** | `MissionControl.tsx` | Mission lifecycle CRUD (Planning $\rightarrow$ Active $\rightarrow$ Complete), priority & classification tagging | `TOP_SECRET` |
| **C3 — Computers** | `InfrastructureView.tsx` | Service mesh health monitoring, CPU/Memory resource telemetry, TLS/mTLS certificate tracking | `SECRET` |
| **C4 — Comms** | `Communications.tsx` | Encrypted channel management (HF, VHF, SATCOM), secure inter-operator messaging | `SECRET` |
| **C5 — Cyber** | `SOCDashboard.tsx` | Network traffic telemetry, MITRE ATT&CK threat mapping, CVE vulnerability scanner, interactive SOC terminal | `CONFIDENTIAL` |

### 🟢 Intelligence & Reconnaissance (ISR)

| Module | Component | Capabilities | Minimum Clearance |
|:---|:---|:---|:---:|
| **I — Intelligence** | `Intelligence.tsx` | Multi-INT reports (SIGINT, HUMINT, IMINT, OSINT, ELINT) with dynamic confidence scoring (0–100%) | `SECRET` |
| **S — Surveillance** | `SurveillanceRecon.tsx` | Sensor zone monitoring (Ground, Aerial, Naval, Satellite), active sensor counts, coverage heatmaps | `CONFIDENTIAL` |
| **R — Reconnaissance** | `SurveillanceRecon.tsx` | UAV (MQ-9 Reaper), Satellite (KH-11), and Ground Team telemetry (speed, fuel, imagery, targets) | `CONFIDENTIAL` |

### 🔵 Zero Trust Architecture (ZTA)

| Module | Component | Capabilities |
|:---|:---|:---|
| **Policy Engine** | `PolicyEngine.tsx` | Bell-LaPadula MLS rule verification, clearance level visualizer, RBAC matrix engine |
| **Audit Trail** | `AuditLog.tsx` | Immutable access log recording PERMIT/DENY decisions, risk scores (0–95), actor IDs, and timestamps |

---

## 👥 Role-Based Access Control (RBAC) Matrix

Access permissions strictly follow **Bell-LaPadula Mandatory Access Control (No Read Up)**:

| Tactical Module | COMMANDER | SOC_ANALYST | RED_TEAM | SOLDIER |
|:---|:---:|:---:|:---:|:---:|
| **C1 — Command** | ✅ Authorized | 🔒 Locked | 🔒 Locked | 🔒 Locked |
| **C2 — Control** | ✅ Authorized | 🔒 Locked | 🔒 Locked | 🔒 Locked |
| **C3 — Computers** | ✅ Authorized | ✅ Authorized | 🔒 Locked | 🔒 Locked |
| **C4 — Comms** | ✅ Authorized | ✅ Authorized | 🔒 Locked | 🔒 Locked |
| **C5 — Cyber Def** | ✅ Authorized | ✅ Authorized | ✅ Authorized | 🔒 Locked |
| **I — Intelligence** | ✅ Authorized | ✅ Authorized | 🔒 Locked | 🔒 Locked |
| **S/R — Recon** | ✅ Authorized | 🔒 Locked | ✅ Authorized | 🔒 Locked |
| **Zero Trust Policy** | ✅ Authorized | ✅ Authorized | 🔒 Locked | 🔒 Locked |
| **Audit Trail** | ✅ Authorized | ✅ Authorized | 🔒 Locked | 🔒 Locked |
| **Authorized Tabs** | **9 / 9** | **7 / 9** | **3 / 9** | **0 / 9** |

---

## 🛠️ Technology Stack

```
+-----------------------------------------------------------------------+
| FRONTEND     : React 19 • TypeScript 5.9 • Vite 7 • TailwindCSS 3     |
| UX / UI      : Framer Motion • Recharts • Lucide Icons • GlassExpand   |
| BACKEND      : FastAPI 0.109 • Pydantic 2.6 • Uvicorn • Asyncio      |
| AUTH & DATA  : python-jose (JWT) • passlib (bcrypt) • pyotp (TOTP)     |
| STORAGE      : PostgreSQL 15 • Redis 7 • asyncpg • SQLAlchemy       |
| INFRA        : Docker Compose • Render.com IaC • Vercel SPA          |
+-----------------------------------------------------------------------+
```

---

## 🚀 Quick Start

### Option A: Docker Compose (Recommended)

```bash
# 1. Clone repository
git clone https://github.com/Shashivanth009/cztisr.git
cd cztisr/c5isr-zero-trust

# 2. Launch 6-container stack
docker-compose up --build
```

**Local Endpoints:**
- 🖥️ **Frontend App**: `http://localhost:5173`
- 🛡️ **Gateway Service**: `http://localhost:8020`
- 🔑 **Identity Provider**: `http://localhost:8001`

---

### Option B: Manual Execution Setup

```bash
# Backend Setup
cd backend
pip install -r requirements.txt

# Terminal 1: Identity Service (PDP)
uvicorn identity.main:app --port 8001 --reload

# Terminal 2: Gateway Service (PEP)
uvicorn gateway.main:app --port 8020 --reload

# Frontend Setup (Terminal 3)
cd ../frontend
npm install
npm run dev
```

---

## 🔑 Demonstration Operator Credentials

Test dynamic RBAC tab-locking by logging in with different clearance tiers:

| Call-Sign | Username | Passphrase | Clearance Level | Tab Access |
|:---|:---|:---|:---|:---:|
| 🔴 **General Shepard** | `commander` | `password` | `TOP_SECRET` | **9 / 9** |
| 🟡 **Analyst Jack** | `analyst` | `password` | `SECRET` | **7 / 9** |
| 🟢 **Red Agent 1** | `redteam` | `password` | `CONFIDENTIAL` | **3 / 9** |

> 📲 **TOTP Setup**: Scan TOTP QR code at `GET /auth/totp/qr/{username}` or use your authenticator app code during Step 3 login.

---

## 📡 API Reference Summary

| Method | Endpoint | Description | Layer |
|:---:|:---|:---|:---:|
| `POST` | `/auth/step1` | Verify credentials & compute device trust score | PDP |
| `POST` | `/auth/step2` | Validate TOTP MFA code & issue signed JWT | PDP |
| `GET` | `/auth/totp/qr/{username}` | Generate TOTP QR code PNG stream | PDP |
| `POST` | `/policy/evaluate` | Evaluate Bell-LaPadula clearance & RBAC rules | PDP |
| `GET` | `/api/system-status` | DEFCON level, active missions, threat count | PEP |
| `GET` | `/api/missions` | Active mission catalog & progress stats | PEP |
| `GET` | `/api/infrastructure` | Service mesh health, CPU/Mem telemetry, TLS certs | PEP |
| `GET` | `/api/communications` | HF/VHF/SATCOM channel telemetry & encrypted log | PEP |
| `GET` | `/api/threats` | Active MITRE ATT&CK cyber threat database | PEP |
| `GET` | `/api/intelligence` | Multi-INT intelligence report stream | PEP |
| `GET` | `/api/surveillance` | Sensor zone coverage & heatmap alerts | PEP |
| `GET` | `/api/reconnaissance` | UAV & satellite flight paths & asset telemetry | PEP |
| `GET` | `/api/audit-logs` | Immutable audit log trail (PERMIT/DENY) | PEP |
| `WS` | `/ws/telemetry` | Real-time 1Hz WebSocket asset position stream | PEP |

---

## 🌐 Production Deployment

- **Backend (Render.com)**: Connect repo to Render Blueprint; it auto-executes `render.yaml` to spin up `c5isr-identity`, `c5isr-gateway`, and `c5isr-postgres`.
- **Frontend (Vercel)**: Import `frontend/` directory into Vercel, set `VITE_IDENTITY_URL`, `VITE_GATEWAY_URL`, and `VITE_WS_GATEWAY_URL` environment variables, and deploy.

---

<div align="center">

Built with 🛡️ by **[Shashivanth](https://github.com/Shashivanth009)**

<sub>NIST SP 800-207 • Bell-LaPadula MLS • RFC 6238 TOTP • AES-256-GCM</sub>

</div>
