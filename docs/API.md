# 📡 C5ISR Zero Trust — API Reference

> Complete REST & WebSocket API documentation for all backend services.

---

## Base URLs

| Service | Local | Production |
|:--------|:------|:-----------|
| **Identity Service** | `http://localhost:8001` | `https://your-identity.onrender.com` |
| **Gateway Service** | `http://localhost:8020` | `https://your-gateway.onrender.com` |

---

## Identity Service API

### `POST /auth/step1` — Credential Verification

Step 1 of 3-step Zero Trust authentication. Verifies username and password, evaluates device trust, and returns a session token for MFA.

**Request:**
```
Content-Type: application/x-www-form-urlencoded

username=commander&password=password
```

**Response (200):**
```json
{
  "step": 1,
  "status": "CREDENTIALS_VERIFIED",
  "mfa_required": true,
  "session_token": "a1b2c3d4e5f6...",
  "device_trust": {
    "score": 75,
    "risk_level": "LOW",
    "factors": [
      {"factor": "Known Browser", "impact": "+15", "status": "PASS"},
      {"factor": "Transport Security (TLS)", "impact": "+10", "status": "PASS"},
      {"factor": "Normal Hours Access", "impact": "+10", "status": "PASS"},
      {"factor": "Trusted Origin", "impact": "+15", "status": "PASS"}
    ],
    "user_agent": "Mozilla/5.0..."
  },
  "totp_enrolled": true,
  "mfa_delivery": {
    "method": "TOTP-SHA256",
    "channel": "Authenticator App",
    "status": "AWAITING_CODE"
  },
  "username": "commander",
  "full_name": "General Shepard",
  "role": "COMMANDER",
  "clearance": "TOP_SECRET",
  "expires_in": 120
}
```

**Error Responses:**

| Code | Detail | Cause |
|:----:|:-------|:------|
| 401 | `Invalid credentials` | Wrong username or password |
| 401 | `Invalid credentials. N attempt(s) remaining` | Wrong password with lockout warning |
| 429 | `Account locked due to N failed attempts` | Brute force lockout (300s) |

---

### `POST /auth/step2` — TOTP MFA Verification

Step 3 of authentication. Verifies TOTP code from authenticator app and issues JWT.

**Request:**
```json
{
  "username": "commander",
  "mfa_code": "123456",
  "session_token": "a1b2c3d4e5f6..."
}
```

**Response (200):**
```json
{
  "step": 2,
  "status": "AUTHENTICATED",
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 1800,
  "device_trust": { "score": 75, "risk_level": "LOW", "factors": [...] },
  "user": {
    "username": "commander",
    "full_name": "General Shepard",
    "role": "COMMANDER",
    "clearance": "TOP_SECRET",
    "mfa_enabled": true,
    "totp_enrolled": true,
    "last_login": "2026-02-14T13:00:00Z",
    "login_count": 5
  }
}
```

**Error Responses:**

| Code | Detail | Cause |
|:----:|:-------|:------|
| 401 | `No pending MFA session` | Step 1 not completed |
| 401 | `MFA session expired` | 120-second window expired |
| 401 | `Invalid session` | Session token mismatch |
| 401 | `Invalid TOTP code` | Wrong authenticator code |

---

### `GET /auth/totp/qr/{username}` — TOTP QR Code

Returns a PNG QR code image for authenticator app enrollment.

**Response:** `image/png` (binary)

Scan with Google Authenticator, Authy, or any TOTP-compatible app.

---

### `POST /token` — Legacy Auth (No MFA)

Single-step authentication for backward compatibility.

**Request:**
```
Content-Type: application/x-www-form-urlencoded

username=commander&password=password
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer"
}
```

---

### `GET /users/me` — Current User Profile

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "username": "commander",
  "full_name": "General Shepard",
  "role": "COMMANDER",
  "clearance": "TOP_SECRET",
  "mfa_enabled": true,
  "totp_enrolled": true,
  "last_login": "2026-02-14T13:00:00Z",
  "login_count": 5
}
```

---

### `POST /policy/evaluate` — Policy Decision Point

Evaluates access based on Bell-LaPadula clearance model and RBAC.

**Request:**
```json
{
  "subject_role": "SOC_ANALYST",
  "subject_clearance": "SECRET",
  "resource_classification": "TOP_SECRET",
  "action": "read"
}
```

**Response (200):**
```json
{
  "decision": "DENY",
  "reason": "Insufficient Clearance"
}
```

**Decision Rules:**
1. **Bell-LaPadula**: `user_clearance >= resource_classification` → else DENY
2. **RBAC**: `execute` actions require COMMANDER or RED_TEAM role
3. **Context**: Time-of-day checks (placeholder for future expansion)

---

## Gateway Service API

### `GET /api/system-status` — System Overview

**Response (200):**
```json
{
  "defcon_level": 3,
  "defcon_name": "ROUND HOUSE",
  "active_missions": 2,
  "total_missions": 4,
  "personnel_count": 1240,
  "unaccounted": 12,
  "threats_detected": 5,
  "critical_threats": 2,
  "system_uptime": 99.7,
  "zero_trust_score": 850,
  "max_trust_score": 1000,
  "total_assets_tracked": 10,
  "comms_channels_active": 24,
  "intel_reports_24h": 5,
  "surveillance_zones_active": 3,
  "recon_active": 3
}
```

---

### `GET /api/missions` — Mission List

**Response (200):**
```json
{
  "missions": [
    {
      "id": "MSN-001",
      "name": "Operation Silent Watch",
      "status": "ACTIVE",
      "priority": "HIGH",
      "commander": "Gen. Shepard",
      "objective": "Monitor hostile activity in Sector 7G",
      "assets_assigned": 8,
      "start_time": "2026-02-14T06:00:00Z",
      "classification": "SECRET",
      "progress": 67
    }
  ],
  "total": 4,
  "active": 2
}
```

---

### `GET /api/intelligence` — Intel Reports

Returns SIGINT, HUMINT, IMINT, OSINT, and ELINT intelligence reports.

**Response (200):**
```json
{
  "reports": [
    {
      "id": "INTEL-001",
      "classification": "TOP_SECRET",
      "source": "SIGINT",
      "title": "Encrypted comm intercept — Sector 7G",
      "summary": "Intercepted encrypted burst transmissions...",
      "confidence": 87,
      "timestamp": "2026-02-14T13:22:00Z",
      "analyst": "Analyst Jack",
      "status": "VERIFIED"
    }
  ],
  "stats": {
    "total_reports": 5,
    "verified": 3,
    "pending": 1,
    "sources": {"SIGINT": 1, "HUMINT": 1, "IMINT": 1, "OSINT": 1, "ELINT": 1},
    "avg_confidence": 81.8
  }
}
```

---

### `GET /api/threats` — Active Cyber Threats

**Response (200):**
```json
{
  "active_threats": [
    {
      "id": "THR-001",
      "type": "BRUTE_FORCE",
      "severity": "CRITICAL",
      "source_ip": "192.168.1.105",
      "target": "/api/token",
      "attempts": 247,
      "status": "ACTIVE",
      "first_seen": "14:02:10",
      "mitre_tactic": "TA0006 — Credential Access"
    }
  ],
  "blocked_ips": ["192.168.1.105", "10.0.0.42", "172.16.0.99"],
  "total_blocked": 142,
  "total_packets_inspected": 2847291
}
```

---

### `GET /api/audit-logs` — Immutable Audit Trail

**Query Parameters:** `limit` (int, default: 50)

**Response (200):**
```json
[
  {
    "id": 1,
    "timestamp": "2026-02-14T14:30:00Z",
    "actor": "Gen. Shepard",
    "action": "ACCESS",
    "resource": "/api/missions",
    "decision": "PERMIT",
    "details": "Authorized via RBAC",
    "risk_score": 5
  }
]
```

---

### `WS /ws/telemetry` — Real-Time Asset Stream

WebSocket endpoint for real-time military asset position updates.

**Connection:** `ws://localhost:8020/ws/telemetry` or `wss://your-gateway.onrender.com/ws/telemetry`

**Message Format (Server → Client):**
```json
{
  "type": "message",
  "data": {
    "id": "LAND-100",
    "lat": 34.0123,
    "lng": 65.0456,
    "status": "OPERATIONAL",
    "fuel": 97.5,
    "type": "land"
  },
  "timestamp": 1707912345.678
}
```

**Asset Types:** `land` (6), `air` (4), `naval` (3)  
**Update Frequency:** 1 Hz (13 messages per second total)

---

### Additional Endpoints

| Method | Endpoint | Description |
|:------:|:---------|:------------|
| `POST` | `/api/missions/{id}/update?status=ACTIVE` | Update mission status |
| `GET` | `/api/infrastructure` | Service mesh health, certs, encryption |
| `GET` | `/api/communications` | Channel status (HF/VHF/SATCOM) |
| `POST` | `/api/communications/send` | Send encrypted message |
| `GET` | `/api/communications/messages` | Recent secure messages |
| `GET` | `/api/network-stats` | Bandwidth, connections, protocols |
| `GET` | `/api/vulnerability-scan` | CVE findings & compliance |
| `GET` | `/api/surveillance` | Sensor zones & coverage |
| `GET` | `/api/reconnaissance` | UAV/Satellite/Ground recon |
| `GET` | `/api/policy-decisions` | Policy evaluation history |
| `GET` | `/health` | Service health check |

---

## Health Check Endpoints

Both services expose `/health` for monitoring:

**Identity Service:**
```json
{
  "status": "IDENTITY PROVIDER OPERATIONAL",
  "mfa": true,
  "mfa_method": "TOTP (RFC 6238)",
  "lockout_policy": true,
  "totp_users": ["commander", "analyst", "redteam"]
}
```

**Gateway Service:**
```json
{
  "status": "C5ISR GATEWAY OPERATIONAL",
  "zero_trust": true,
  "simulation": "INTERNAL"
}
```

---

<div align="center">
  <sub>📡 API documentation for C5ISR Zero Trust Platform</sub>
</div>
