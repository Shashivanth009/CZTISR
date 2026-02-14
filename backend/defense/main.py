from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import time
import random

app = FastAPI(title="Cyber Defense Service (Layer 3)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Simulated Threat Intelligence Database ---
THREAT_DB = [
    {"id": "THR-001", "type": "BRUTE_FORCE", "severity": "CRITICAL", "source_ip": "192.168.1.105", "target": "/api/token", "attempts": 247, "status": "ACTIVE"},
    {"id": "THR-002", "type": "SQL_INJECTION", "severity": "HIGH", "source_ip": "10.0.0.42", "target": "/api/missions", "attempts": 18, "status": "BLOCKED"},
    {"id": "THR-003", "type": "PORT_SCAN", "severity": "MEDIUM", "source_ip": "172.16.0.99", "target": "NETWORK", "attempts": 1024, "status": "MONITORING"},
]

BLOCKED_IPS = ["192.168.1.105", "10.0.0.42", "172.16.0.99"]

@app.get("/")
async def root():
    return {"message": "Cyber Defense Service Operational", "status": "active", "threats_active": len(THREAT_DB)}

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "defense", "uptime_pct": 99.97}

@app.get("/threats")
async def get_threats():
    return {
        "active": THREAT_DB,
        "blocked_ips": BLOCKED_IPS,
        "total_blocked_24h": 142,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }

@app.get("/network-stats")
async def network_stats():
    return {
        "packets_inspected": random.randint(2800000, 3000000),
        "bandwidth_mbps": round(random.uniform(450, 900), 1),
        "active_connections": random.randint(180, 400),
        "encrypted_pct": 99.2,
        "dropped_packets": random.randint(50, 200),
    }

@app.get("/vulnerability-scan")
async def vulnerability_scan():
    return {
        "last_scan": "2026-02-14T13:00:00Z",
        "total_assets": 156,
        "scanned": 156,
        "critical": 0,
        "high": 2,
        "medium": 7,
        "low": 23,
        "compliance_score": 94.2,
    }
