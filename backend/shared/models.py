from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum

class ClearanceLevel(str, Enum):
    UNCLASSIFIED = "UNCLASSIFIED"
    CONFIDENTIAL = "CONFIDENTIAL"
    SECRET = "SECRET"
    TOP_SECRET = "TOP_SECRET"

class UserRole(str, Enum):
    COMMANDER = "COMMANDER"
    SOC_ANALYST = "SOC_ANALYST"
    SOLDIER = "SOLDIER"
    RED_TEAM = "RED_TEAM"

class User(BaseModel):
    id: str
    username: str
    role: UserRole
    clearance: ClearanceLevel
    mission_id: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class TrustScore(BaseModel):
    subject_id: str
    score: int  # 0-100
    factors: Dict[str, float]
    timestamp: datetime
