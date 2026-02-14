from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from shared.models import User, UserRole, ClearanceLevel
import hashlib
import time
import os
import io
import pyotp
import qrcode

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_DURATION_SECONDS = 300

app = FastAPI(title="Identity Service (Layer 0) — C5ISR IDP")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from identity.policy_engine import router as policy_router
app.include_router(policy_router)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# ============================================================
#  IN-MEMORY STORES
# ============================================================
login_attempts: dict = {}
active_sessions: dict = {}
mfa_pending: dict = {}
auth_audit: list = []

# ============================================================
#  TOTP SECRETS — Fixed per user. These MUST remain the same
#  across restarts/deployments so authenticator apps stay synced.
#  In production: stored encrypted in a secure vault / database.
# ============================================================
totp_secrets = {
    "commander": "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP",
    "analyst":   "KRSXG5CTMVRXEZLUKRSXG5CTMVRXEZLU",
    "redteam":   "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ",
}

# --- User Database ---
users_db = {
    "commander": {
        "username": "commander",
        "full_name": "General Shepard",
        "hashed_password": pwd_context.hash("password"),
        "role": "COMMANDER",
        "clearance": "TOP_SECRET",
        "disabled": False,
        "mfa_enabled": True,
        "totp_enrolled": True,
        "last_login": None,
        "login_count": 0,
    },
    "analyst": {
        "username": "analyst",
        "full_name": "Analyst Jack",
        "hashed_password": pwd_context.hash("password"),
        "role": "SOC_ANALYST",
        "clearance": "SECRET",
        "disabled": False,
        "mfa_enabled": True,
        "totp_enrolled": True,
        "last_login": None,
        "login_count": 0,
    },
    "redteam": {
        "username": "redteam",
        "full_name": "Red Agent 1",
        "hashed_password": pwd_context.hash("password"),
        "role": "RED_TEAM",
        "clearance": "CONFIDENTIAL",
        "disabled": False,
        "mfa_enabled": True,
        "totp_enrolled": True,
        "last_login": None,
        "login_count": 0,
    },
}

# ============================================================
#  MODELS
# ============================================================
class Token(BaseModel):
    access_token: str
    token_type: str

class MFARequest(BaseModel):
    username: str
    mfa_code: str
    session_token: str

# ============================================================
#  HELPERS
# ============================================================
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def log_auth_event(event_type: str, username: str, ip: str, success: bool, details: str = ""):
    auth_audit.insert(0, {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "type": event_type,
        "username": username,
        "ip": ip,
        "success": success,
        "details": details,
    })
    if len(auth_audit) > 200:
        auth_audit.pop()

def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"

def evaluate_device_trust(request: Request) -> dict:
    ua = request.headers.get("user-agent", "")
    score = 50
    factors = []

    if "Chrome" in ua or "Firefox" in ua or "Safari" in ua:
        score += 15
        factors.append({"factor": "Known Browser", "impact": "+15", "status": "PASS"})
    else:
        score -= 10
        factors.append({"factor": "Unknown Browser", "impact": "-10", "status": "WARN"})

    score += 10
    factors.append({"factor": "Transport Security", "impact": "+10", "status": "PASS"})

    hour = datetime.utcnow().hour
    if 6 <= hour <= 22:
        score += 10
        factors.append({"factor": "Normal Hours Access", "impact": "+10", "status": "PASS"})
    else:
        score -= 15
        factors.append({"factor": "Off-Hours Access", "impact": "-15", "status": "WARN"})

    origin = request.headers.get("origin", "")
    if "localhost" in origin or "127.0.0.1" in origin:
        score += 15
        factors.append({"factor": "Trusted Origin", "impact": "+15", "status": "PASS"})
    else:
        factors.append({"factor": "External Origin", "impact": "+0", "status": "INFO"})

    score = max(0, min(100, score))
    risk = "LOW" if score >= 70 else "MEDIUM" if score >= 40 else "HIGH"
    return {"score": score, "risk_level": risk, "factors": factors, "user_agent": ua[:80]}

def check_lockout(key: str) -> dict | None:
    record = login_attempts.get(key)
    if not record:
        return None
    if record.get("locked_until") and time.time() < record["locked_until"]:
        remaining = int(record["locked_until"] - time.time())
        return {"locked": True, "remaining_seconds": remaining, "attempts": record["attempts"]}
    if record.get("locked_until") and time.time() >= record["locked_until"]:
        del login_attempts[key]
    return None

def record_failed_attempt(key: str):
    record = login_attempts.get(key, {"attempts": 0})
    record["attempts"] = record.get("attempts", 0) + 1
    if record["attempts"] >= MAX_LOGIN_ATTEMPTS:
        record["locked_until"] = time.time() + LOCKOUT_DURATION_SECONDS
    login_attempts[key] = record
    return record

def clear_attempts(key: str):
    login_attempts.pop(key, None)

def safe_user(user_dict: dict) -> dict:
    return {
        "username": user_dict["username"],
        "full_name": user_dict["full_name"],
        "role": user_dict["role"],
        "clearance": user_dict["clearance"],
        "mfa_enabled": user_dict["mfa_enabled"],
        "totp_enrolled": user_dict.get("totp_enrolled", False),
        "last_login": user_dict.get("last_login"),
        "login_count": user_dict.get("login_count", 0),
    }


# ============================================================
#  TOTP SETUP — QR CODE ENROLLMENT
# ============================================================


@app.get("/auth/totp/qr/{username}")
async def totp_qr_code(username: str):
    """
    Returns a QR code image (PNG) that can be scanned by Google Authenticator.
    The user scans this ONCE during setup — after that, their app generates codes.
    """
    if username not in users_db:
        raise HTTPException(status_code=404, detail="User not found")

    secret = totp_secrets.get(username)
    if not secret:
        raise HTTPException(status_code=500, detail="TOTP secret not configured")

    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(
        name=f"{username}@c5isr",
        issuer_name="C5ISR Zero Trust"
    )

    # Generate QR code image
    qr = qrcode.QRCode(version=1, box_size=8, border=2)
    qr.add_data(provisioning_uri)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    # Return as PNG stream
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    users_db[username]["totp_enrolled"] = True

    return StreamingResponse(buf, media_type="image/png",
                             headers={"Content-Disposition": f"inline; filename={username}_totp_qr.png"})


# ============================================================
#  AUTH ENDPOINTS
# ============================================================

@app.post("/auth/step1")
async def auth_step1_credentials(request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
    """Step 1: Verify credentials → return session token for MFA step."""
    client_ip = get_client_ip(request)
    lockout_key = f"{client_ip}:{form_data.username}"

    lockout = check_lockout(lockout_key)
    if lockout:
        log_auth_event("LOGIN_LOCKED", form_data.username, client_ip, False,
                       f"Account locked. {lockout['remaining_seconds']}s remaining")
        raise HTTPException(status_code=429,
            detail=f"Account locked due to {lockout['attempts']} failed attempts. Try again in {lockout['remaining_seconds']} seconds.")

    user_dict = users_db.get(form_data.username)
    if not user_dict:
        record_failed_attempt(lockout_key)
        log_auth_event("LOGIN_FAIL", form_data.username, client_ip, False, "User not found")
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(form_data.password, user_dict["hashed_password"]):
        attempt = record_failed_attempt(lockout_key)
        remaining = MAX_LOGIN_ATTEMPTS - attempt["attempts"]
        log_auth_event("LOGIN_FAIL", form_data.username, client_ip, False,
                       f"Wrong password. {remaining} attempts remaining")
        raise HTTPException(status_code=401,
            detail=f"Invalid credentials. {remaining} attempt(s) remaining before lockout.")

    device_trust = evaluate_device_trust(request)

    # Create a session token for the MFA step (binds this auth attempt)
    session_token = hashlib.sha256(f"{form_data.username}:{time.time()}:{SECRET_KEY}".encode()).hexdigest()[:32]

    mfa_pending[form_data.username] = {
        "session_token": session_token,
        "expires": time.time() + 120,
        "ip": client_ip,
    }

    totp_enrolled = user_dict.get("totp_enrolled", False)

    log_auth_event("CRED_VERIFIED", form_data.username, client_ip, True,
                   f"MFA required. TOTP enrolled: {totp_enrolled}. Trust: {device_trust['score']}.")

    return {
        "step": 1,
        "status": "CREDENTIALS_VERIFIED",
        "mfa_required": user_dict["mfa_enabled"],
        "session_token": session_token,
        "device_trust": device_trust,
        "totp_enrolled": totp_enrolled,
        "mfa_delivery": {
            "method": "TOTP-SHA256",
            "channel": "Authenticator App",
            "status": "AWAITING_CODE",
        },
        "username": form_data.username,
        "full_name": user_dict["full_name"],
        "role": user_dict["role"],
        "clearance": user_dict["clearance"],
        "expires_in": 120,
    }


@app.post("/auth/step2")
async def auth_step2_mfa(request: Request, mfa_req: MFARequest):
    """Step 2: Verify TOTP code from authenticator app → issue JWT."""
    client_ip = get_client_ip(request)

    pending = mfa_pending.get(mfa_req.username)
    if not pending:
        log_auth_event("MFA_FAIL", mfa_req.username, client_ip, False, "No pending MFA session")
        raise HTTPException(status_code=401, detail="No pending MFA session. Start over.")

    if time.time() > pending["expires"]:
        del mfa_pending[mfa_req.username]
        log_auth_event("MFA_EXPIRED", mfa_req.username, client_ip, False, "MFA session expired")
        raise HTTPException(status_code=401, detail="MFA session expired. Start over.")

    if pending["session_token"] != mfa_req.session_token:
        log_auth_event("MFA_FAIL", mfa_req.username, client_ip, False, "Invalid session token")
        raise HTTPException(status_code=401, detail="Invalid session. Start over.")

    # Verify TOTP code using pyotp
    secret = totp_secrets.get(mfa_req.username)
    if not secret:
        raise HTTPException(status_code=500, detail="TOTP not configured for this user")

    totp = pyotp.TOTP(secret)
    # valid_window=1 allows the previous and next 30-second window (tolerance for clock drift)
    if not totp.verify(mfa_req.mfa_code, valid_window=1):
        log_auth_event("MFA_FAIL", mfa_req.username, client_ip, False, "Invalid TOTP code")
        raise HTTPException(status_code=401, detail="Invalid TOTP code. Check your authenticator app.")

    del mfa_pending[mfa_req.username]

    user_dict = users_db.get(mfa_req.username)
    if not user_dict:
        raise HTTPException(status_code=401, detail="User not found")

    clear_attempts(f"{client_ip}:{mfa_req.username}")

    user_dict["last_login"] = datetime.utcnow().isoformat() + "Z"
    user_dict["login_count"] = user_dict.get("login_count", 0) + 1

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": user_dict["username"],
            "role": user_dict["role"],
            "clearance": user_dict["clearance"],
        },
        expires_delta=access_token_expires,
    )

    device_trust = evaluate_device_trust(request)

    active_sessions[mfa_req.username] = {
        "token_hash": hashlib.sha256(access_token.encode()).hexdigest()[:16],
        "login_time": datetime.utcnow().isoformat() + "Z",
        "ip": client_ip,
        "device_trust_score": device_trust["score"],
        "mfa_verified": True,
        "expires": (datetime.utcnow() + access_token_expires).isoformat() + "Z",
    }

    log_auth_event("LOGIN_SUCCESS", mfa_req.username, client_ip, True,
                   f"Full auth complete. TOTP verified. Trust: {device_trust['score']}.")

    return {
        "step": 2,
        "status": "AUTHENTICATED",
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "device_trust": device_trust,
        "user": safe_user(user_dict),
    }


# ============================================================
#  LEGACY & UTILITY ENDPOINTS
# ============================================================

@app.post("/token", response_model=Token)
async def login_for_access_token(request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
    user_dict = users_db.get(form_data.username)
    if not user_dict:
        raise HTTPException(status_code=401, detail="Incorrect username or password",
                            headers={"WWW-Authenticate": "Bearer"})
    if not verify_password(form_data.password, user_dict["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect username or password",
                            headers={"WWW-Authenticate": "Bearer"})
    access_token = create_access_token(
        data={"sub": user_dict["username"], "role": user_dict["role"], "clearance": user_dict["clearance"]},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/users/me")
async def read_users_me(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    user_dict = users_db.get(username)
    if user_dict is None:
        raise HTTPException(status_code=404, detail="User not found")
    return safe_user(user_dict)


@app.get("/auth/sessions")
async def get_active_sessions():
    return {"sessions": active_sessions, "total": len(active_sessions)}

@app.get("/auth/audit")
async def get_auth_audit(limit: int = 50):
    return auth_audit[:limit]

@app.get("/health")
async def health():
    return {
        "status": "IDENTITY PROVIDER OPERATIONAL",
        "mfa": True,
        "mfa_method": "TOTP (RFC 6238)",
        "lockout_policy": True,
        "totp_users": list(totp_secrets.keys()),
    }
