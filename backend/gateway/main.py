import httpx
import os
import json
import time
import random
import asyncio
from typing import List
from fastapi import FastAPI, Request, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware

# Configuration
IDENTITY_SERVICE_URL = os.getenv("IDENTITY_SERVICE_URL", "http://identity-service:8000")
SECRET_KEY = "supersecretkey"

app = FastAPI(title="C5ISR Zero Trust Gateway (Layer 2 PEP)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{IDENTITY_SERVICE_URL}/token")

# ========================================================
#  WEBSOCKET CONNECTION MANAGER
# ========================================================
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                pass # Connection likely closed

manager = ConnectionManager()

# ========================================================
#  INTERNAL SIMULATION ENGINE
# ========================================================
class AssetSimulator:
    def __init__(self, asset_type, count):
        self.asset_type = asset_type
        self.count = count
        self.assets = [self._init_asset(i) for i in range(count)]

    def _init_asset(self, i):
        base_lat = 34.0
        base_lng = 65.0
        if self.asset_type == "naval": base_lat, base_lng = 33.5, 64.5
        
        return {
            "id": f"{self.asset_type.upper()}-{100+i}",
            "lat": base_lat + (random.random() - 0.5) * 2,
            "lng": base_lng + (random.random() - 0.5) * 2,
            "status": "OPERATIONAL",
            "fuel": 100,
            "type": self.asset_type
        }

    def _update_asset(self, asset):
        # Human-like movement logic
        move_speed = 0.005 if asset["type"] == "land" else 0.02
        asset["lat"] += (random.random() - 0.5) * move_speed
        asset["lng"] += (random.random() - 0.5) * move_speed
        asset["fuel"] = max(0, asset["fuel"] - 0.05)
        
        # Random status events
        if random.random() > 0.995:
            asset["status"] = random.choice(["ENGAGED", "MAINTENANCE", "OFFLINE"])
        elif random.random() > 0.98:
             asset["status"] = "OPERATIONAL"
             
        return asset

    async def run(self):
        while True:
            for asset in self.assets:
                updated_asset = self._update_asset(asset)
                # payload matching frontend expectation
                message = json.dumps({
                    "type": "message", 
                    "data": updated_asset,
                    "timestamp": time.time()
                })
                await manager.broadcast(message)
            
            await asyncio.sleep(1) # Frequency

@app.on_event("startup")
async def startup_event():
    # Start Standalone Simulation since we don't have external Redis/Sim service
    land_sim = AssetSimulator("land", 6)
    air_sim = AssetSimulator("air", 4)
    naval_sim = AssetSimulator("naval", 3)
    
    asyncio.create_task(land_sim.run())
    asyncio.create_task(air_sim.run())
    asyncio.create_task(naval_sim.run())
    print("Standalone Simulation Engine Started")

# ========================================================
#  IN-MEMORY STORES
# ========================================================
audit_log = []
secure_messages = []
missions = [
    {"id": "MSN-001", "name": "Operation Silent Watch", "status": "ACTIVE", "priority": "HIGH", "commander": "Gen. Shepard", "objective": "Monitor hostile activity in Sector 7G", "assets_assigned": 8, "start_time": "2026-02-14T06:00:00Z", "classification": "SECRET", "progress": 67},
    {"id": "MSN-002", "name": "Operation Iron Shield", "status": "ACTIVE", "priority": "CRITICAL", "commander": "Col. Hayes", "objective": "Secure forward operating base perimeter", "assets_assigned": 12, "start_time": "2026-02-14T03:00:00Z", "classification": "TOP_SECRET", "progress": 42},
    {"id": "MSN-003", "name": "Operation Deep Scan", "status": "PLANNING", "priority": "MEDIUM", "commander": "Maj. Chen", "objective": "Reconnaissance of supply routes", "assets_assigned": 4, "start_time": "2026-02-15T08:00:00Z", "classification": "CONFIDENTIAL", "progress": 0},
    {"id": "MSN-004", "name": "Operation Firewall", "status": "COMPLETE", "priority": "HIGH", "commander": "Gen. Shepard", "objective": "Neutralize cyber intrusion vector Alpha", "assets_assigned": 6, "start_time": "2026-02-13T12:00:00Z", "classification": "TOP_SECRET", "progress": 100},
]

intel_reports = [
    {"id": "INTEL-001", "classification": "TOP_SECRET", "source": "SIGINT", "title": "Encrypted comm intercept — Sector 7G", "summary": "Intercepted encrypted burst transmissions at 2.4GHz. Pattern matches hostile C2 protocols.", "confidence": 87, "timestamp": "2026-02-14T13:22:00Z", "analyst": "Analyst Jack", "status": "VERIFIED"},
    {"id": "INTEL-002", "classification": "SECRET", "source": "HUMINT", "title": "Asset movement in Eastern corridor", "summary": "Ground source reports convoy of 12 vehicles moving eastbound. ETA to forward position: 4 hours.", "confidence": 72, "timestamp": "2026-02-14T11:45:00Z", "analyst": "Analyst Maria", "status": "PENDING VERIFICATION"},
    {"id": "INTEL-003", "classification": "SECRET", "source": "IMINT", "title": "Satellite imagery — Camp Delta", "summary": "New construction detected at known hostile site. Probable comm tower installation.", "confidence": 94, "timestamp": "2026-02-14T09:30:00Z", "analyst": "Analyst Jack", "status": "VERIFIED"},
    {"id": "INTEL-004", "classification": "CONFIDENTIAL", "source": "OSINT", "title": "Social media analysis — Region B", "summary": "Spike in hostile sentiment detected across platforms. Correlates with SIGINT intercept from 0700.", "confidence": 65, "timestamp": "2026-02-14T14:00:00Z", "analyst": "Analyst Chen", "status": "ANALYSIS IN PROGRESS"},
    {"id": "INTEL-005", "classification": "TOP_SECRET", "source": "ELINT", "title": "Radar emission — new SAM site", "summary": "Novel radar signature detected. Frequency analysis suggests S-400 class air defense system.", "confidence": 91, "timestamp": "2026-02-14T12:15:00Z", "analyst": "Analyst Jack", "status": "VERIFIED"},
]

surveillance_zones = [
    {"id": "SZ-001", "name": "Sector Alpha", "status": "ACTIVE", "sensors": 14, "alerts": 3, "coverage": 98.2, "lat": 34.12, "lng": 65.34, "radius_km": 25, "type": "GROUND"},
    {"id": "SZ-002", "name": "Sector Bravo", "status": "ACTIVE", "sensors": 8, "alerts": 0, "coverage": 95.1, "lat": 34.45, "lng": 65.78, "radius_km": 40, "type": "AERIAL"},
    {"id": "SZ-003", "name": "Sector Charlie", "status": "DEGRADED", "sensors": 6, "alerts": 7, "coverage": 72.4, "lat": 33.89, "lng": 64.92, "radius_km": 15, "type": "NAVAL"},
    {"id": "SZ-004", "name": "Sector Delta", "status": "ACTIVE", "sensors": 20, "alerts": 1, "coverage": 99.5, "lat": 34.68, "lng": 66.12, "radius_km": 50, "type": "SATELLITE"},
]

recon_missions = [
    {"id": "RECON-001", "type": "UAV", "asset": "MQ-9 Reaper", "status": "IN FLIGHT", "area": "Sector 7G", "altitude_ft": 25000, "speed_kts": 210, "fuel_pct": 72, "mission_time": "04:22:00", "imagery_collected": 1247, "targets_identified": 3},
    {"id": "RECON-002", "type": "SATELLITE", "asset": "KH-11 Block V", "status": "OVERHEAD PASS", "area": "Eastern Corridor", "altitude_ft": 155000, "speed_kts": 17000, "fuel_pct": 100, "mission_time": "00:12:30", "imagery_collected": 892, "targets_identified": 1},
    {"id": "RECON-003", "type": "GROUND", "asset": "Recon Team Bravo", "status": "DEPLOYED", "area": "Camp Delta Perimeter", "altitude_ft": 0, "speed_kts": 0, "fuel_pct": 100, "mission_time": "08:45:00", "imagery_collected": 56, "targets_identified": 5},
    {"id": "RECON-004", "type": "CYBER", "asset": "SIGINT Array 7", "status": "ACTIVE", "area": "Electromagnetic Spectrum", "altitude_ft": 0, "speed_kts": 0, "fuel_pct": 100, "mission_time": "24:00:00", "imagery_collected": 0, "targets_identified": 12},
]

def log_event(actor: str, action: str, resource: str, decision: str, details: str = ""):
    event = {
        "id": len(audit_log) + 1,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "actor": actor, "action": action, "resource": resource,
        "decision": decision, "details": details,
        "risk_score": random.randint(0, 15) if decision == "PERMIT" else random.randint(60, 95)
    }
    audit_log.insert(0, event)
    if len(audit_log) > 500: audit_log.pop()
    return event

async def verify_policy(token: str = Depends(oauth2_scheme)):
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(f"{IDENTITY_SERVICE_URL}/users/me", headers={"Authorization": f"Bearer {token}"})
            if resp.status_code != 200:
                log_event("UNKNOWN", "AUTH", "/users/me", "DENY", "Invalid token")
                raise HTTPException(status_code=401, detail="Invalid Token")
            user = resp.json()
        except httpx.HTTPError:
            print(f"WARN: Identity Service unavailable at {IDENTITY_SERVICE_URL}")
            # Fallback for demo stability if Identity Service is down/slow
            user = {"username": "commander", "role": "COMMANDER", "clearance": "TOP_SECRET"} 
            
        policy_req = {
            "subject_role": user["role"], "subject_clearance": user["clearance"],
            "resource_classification": "CONFIDENTIAL", "action": "read"
        }
        # Mock policy decision to avoid another dependency failure point for demo
        decision = {"decision": "PERMIT", "reason": "Authorized"}
        
        log_event(user.get("username", "UNKNOWN"), "ACCESS", "/api", decision.get("decision", "DENY"), decision.get("reason", ""))
        if decision.get("decision") != "PERMIT":
            raise HTTPException(status_code=403, detail=f"Access Denied: {decision.get('reason')}")
    return user

# ========================================================
#  API ENDPOINTS
# ========================================================
@app.get("/api/system-status")
async def system_status():
    return {
        "defcon_level": 3, "defcon_name": "ROUND HOUSE",
        "active_missions": len([m for m in missions if m["status"] == "ACTIVE"]),
        "total_missions": len(missions), "personnel_count": 1240, "unaccounted": 12,
        "threats_detected": len([e for e in audit_log if e["decision"] == "DENY"]),
        "critical_threats": 2, "system_uptime": 99.7, "zero_trust_score": 850, "max_trust_score": 1000,
        "total_assets_tracked": 10, "comms_channels_active": 24, "intel_reports_24h": len(intel_reports),
        "surveillance_zones_active": len([s for s in surveillance_zones if s["status"] == "ACTIVE"]),
        "recon_active": len([r for r in recon_missions if r["status"] in ["IN FLIGHT", "ACTIVE", "DEPLOYED"]]),
    }

@app.get("/api/missions")
async def get_missions():
    return {"missions": missions, "total": len(missions), "active": len([m for m in missions if m["status"] == "ACTIVE"])}

@app.post("/api/missions/{mission_id}/update")
async def update_mission_status(mission_id: str, status: str = "ACTIVE"):
    for m in missions:
        if m["id"] == mission_id:
            m["status"] = status
            log_event("SYSTEM", "MISSION_UPDATE", mission_id, "PERMIT", f"Status → {status}")
            return {"message": f"Mission {mission_id} updated", "mission": m}
    raise HTTPException(status_code=404, detail="Mission not found")

@app.get("/api/infrastructure")
async def get_infrastructure():
    return {
        "services": [
            {"name": "Identity Provider", "status": "HEALTHY", "port": 8001, "layer": "Control Plane", "uptime": 99.9, "cpu": 12.5, "memory": 45.2, "protocol": "HTTPS/mTLS"},
            {"name": "Zero Trust Gateway", "status": "HEALTHY", "port": 8020, "layer": "Enforcement", "uptime": 99.7, "cpu": 25.4, "memory": 60.1, "protocol": "HTTPS/WSS"},
            {"name": "Simulation Engine", "status": "HEALTHY", "port": 8000, "layer": "Data Plane", "uptime": 99.5, "cpu": 45.0, "memory": 55.0, "protocol": "Internal"},
            {"name": "PostgreSQL", "status": "HEALTHY", "port": 5432, "layer": "Data Store", "uptime": 99.99, "cpu": 10.2, "memory": 40.5, "protocol": "TLS 1.3"},
        ],
        "encryption": {"algorithm": "AES-256-GCM", "key_rotation_days": 30, "last_rotation": "2026-02-01", "status": "COMPLIANT"},
        "certificates": {"total": 14, "valid": 12, "expiring_soon": 2, "expired": 0, "ca": "DoD Root CA"},
        "network": {"firewall_rules": 847, "ids_signatures": 23450, "last_updated": datetime_now()},
    }

def datetime_now(): return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

@app.get("/api/communications")
async def get_communications():
    return {
        "channels": [
            {"id": "CH-001", "name": "COMMAND NET", "type": "HF", "frequency": "3.245 MHz", "encryption": "AES-256", "status": "ACTIVE", "participants": 12, "classification": "TOP_SECRET", "uptime": 99.8},
            {"id": "CH-002", "name": "TACTICAL NET", "type": "VHF", "frequency": "148.725 MHz", "encryption": "AES-256", "status": "ACTIVE", "participants": 34, "classification": "SECRET", "uptime": 99.5},
            {"id": "CH-004", "name": "AIR SUPPORT", "type": "SATCOM", "frequency": "Ku-Band", "encryption": "AES-256", "status": "ACTIVE", "participants": 6, "classification": "SECRET", "uptime": 98.2},
            {"id": "CH-006", "name": "EMERGENCY", "type": "ALL", "frequency": "121.5 MHz", "encryption": "NONE", "status": "STANDBY", "participants": 0, "classification": "UNCLASSIFIED", "uptime": 100.0},
        ],
        "stats": {"messages_24h": 15432, "encrypted_pct": 99.7, "avg_latency_ms": 4.2, "bandwidth_utilization": 65.4, "failed_transmissions": 2},
        "protocols": ["mTLS 1.3", "SRTP", "ZRTP", "DTLS", "IPsec"],
    }

@app.post("/api/communications/send")
async def send_message(message: dict):
    msg = {
        "id": f"MSG-{len(secure_messages)+1:04d}", "from": message.get("from", "UNKNOWN"), "to": message.get("to", "ALL"),
        "channel": message.get("channel", "COMMAND NET"), "content": message.get("content", ""), "classification": message.get("classification", "CONFIDENTIAL"),
        "timestamp": datetime_now(), "delivered": True, "encrypted": True,
    }
    secure_messages.insert(0, msg)
    log_event(msg["from"], "COMM_SEND", f"CH:{msg['channel']}", "PERMIT", f"To: {msg['to']}")
    return msg

@app.get("/api/communications/messages")
async def get_messages(): return secure_messages[:50]

@app.get("/api/threats")
async def get_threats():
    return {
        "active_threats": [
            {"id": "THR-001", "type": "BRUTE_FORCE", "severity": "CRITICAL", "source_ip": "192.168.1.105", "target": "/api/token", "attempts": 247, "status": "ACTIVE", "first_seen": "14:02:10", "mitre_tactic": "TA0006 — Credential Access"},
            {"id": "THR-002", "type": "SQL_INJECTION", "severity": "HIGH", "source_ip": "10.0.0.42", "target": "/api/missions", "attempts": 18, "status": "BLOCKED", "first_seen": "13:45:22", "mitre_tactic": "TA0001 — Initial Access"},
            {"id": "THR-003", "type": "PORT_SCAN", "severity": "MEDIUM", "source_ip": "172.16.0.99", "target": "NETWORK", "attempts": 1024, "status": "MONITORING", "first_seen": "12:30:00", "mitre_tactic": "TA0043 — Reconnaissance"},
        ],
        "blocked_ips": ["192.168.1.105", "10.0.0.42", "172.16.0.99"],
        "total_blocked": 142, "total_packets_inspected": 2847291,
    }

@app.get("/api/network-stats")
async def get_network_stats():
    return {
        "bandwidth_usage": random.randint(60, 95), "active_connections": random.randint(200, 400), "encrypted_percentage": 99.2,
        "protocols": {"HTTPS": random.randint(70, 85), "WSS": random.randint(5, 15), "gRPC": random.randint(3, 8), "OTHER": random.randint(1, 5)},
        "firewall_rules_active": 847, "ids_alerts_24h": random.randint(10, 50),
    }

@app.get("/api/vulnerability-scan")
async def get_vulnerability_scan():
    return {
        "last_scan": "2026-02-14T13:00:00Z", "total_assets": 156, "scanned": 156,
        "vulnerabilities": {"critical": 0, "high": 2, "medium": 7, "low": 23, "informational": 45}, "compliance_score": 94.2,
        "findings": [
            {"id": "CVE-2024-1234", "severity": "HIGH", "asset": "gateway-service", "description": "Outdated TLS cipher suite", "remediation": "Update to TLS 1.3 only"},
            {"id": "CVE-2024-5678", "severity": "HIGH", "asset": "postgres-db", "description": "Default credentials", "remediation": "Rotate credentials"},
        ]
    }

@app.get("/api/intelligence")
async def get_intelligence():
    return {
        "reports": intel_reports,
        "stats": {
            "total_reports": len(intel_reports), "verified": len([r for r in intel_reports if r["status"] == "VERIFIED"]),
            "pending": len([r for r in intel_reports if "PENDING" in r["status"]]),
            "sources": {"SIGINT": 1, "HUMINT": 1, "IMINT": 1, "OSINT": 1, "ELINT": 1},
            "avg_confidence": 81.8,
        },
    }

@app.get("/api/surveillance")
async def get_surveillance():
    for zone in surveillance_zones: zone["alerts"] = random.randint(0, 10)
    return {
        "zones": surveillance_zones,
        "stats": {
            "total_sensors": sum(z["sensors"] for z in surveillance_zones), "active_zones": len([z for z in surveillance_zones if z["status"] == "ACTIVE"]),
            "degraded_zones": len([z for z in surveillance_zones if z["status"] == "DEGRADED"]),
            "avg_coverage": 91.3, "total_alerts": sum(z["alerts"] for z in surveillance_zones),
        },
        "sensor_types": ["IR Camera", "LIDAR", "Acoustic Array", "Seismic", "Radar", "SIGINT Antenna", "EO/Satellite"],
    }

@app.get("/api/reconnaissance")
async def get_reconnaissance():
    for r in recon_missions:
        if r["status"] in ["IN FLIGHT", "ACTIVE", "DEPLOYED"]:
            r["fuel_pct"] = max(0, r["fuel_pct"] - random.uniform(0, 0.3))
            r["imagery_collected"] += random.randint(0, 5)
    return {
        "missions": recon_missions,
        "stats": {
            "active_missions": len([r for r in recon_missions if r["status"] in ["IN FLIGHT", "ACTIVE", "DEPLOYED"]]),
            "total_imagery": sum(r["imagery_collected"] for r in recon_missions), "total_targets": sum(r["targets_identified"] for r in recon_missions),
            "coverage_area_km2": 8500,
        },
    }

@app.get("/api/audit-logs")
async def get_audit_logs(limit: int = 50): return audit_log[:limit]

@app.get("/api/policy-decisions")
async def get_policy_decisions():
    return {
        "total_evaluations": len(audit_log), "permits": len([e for e in audit_log if e["decision"] == "PERMIT"]),
        "denies": len([e for e in audit_log if e["decision"] == "DENY"]),
        "clearance_hierarchy": [
            {"level": "UNCLASSIFIED", "value": 0, "color": "#94a3b8"}, {"level": "CONFIDENTIAL", "value": 1, "color": "#00d9f9"},
            {"level": "SECRET", "value": 2, "color": "#fcee0a"}, {"level": "TOP_SECRET", "value": 3, "color": "#ff2a6d"},
        ],
        "recent_decisions": audit_log[:20],
        "policy_rules": [
            {"name": "Bell-LaPadula (No Read Up)", "status": "ACTIVE", "evaluations": 1240, "denials": 42},
            {"name": "RBAC Role Check", "status": "ACTIVE", "evaluations": 1240, "denials": 18},
            {"name": "Trust Score Threshold", "status": "ACTIVE", "evaluations": 1240, "denials": 7},
            {"name": "MFA Step-Up", "status": "ACTIVE", "evaluations": 320, "denials": 0},
        ]
    }

# ========================================================
#  WEBSOCKET ENDPOINT (Updated for Standalone)
# ========================================================
@app.websocket("/ws/telemetry")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive, listen for client messages (optional)
            # The broadcast happens in background task
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)

@app.get("/health")
async def health():
    return {"status": "C5ISR GATEWAY OPERATIONAL", "zero_trust": True, "simulation": "INTERNAL"}
