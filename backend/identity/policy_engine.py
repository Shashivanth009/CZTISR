from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from shared.models import ClearanceLevel, UserRole

router = APIRouter(prefix="/policy", tags=["policy"])

class AccessRequest(BaseModel):
    subject_role: UserRole
    subject_clearance: ClearanceLevel
    resource_classification: ClearanceLevel
    action: str  # read, write, execute

@router.post("/evaluate")
async def evaluate_access(request: AccessRequest):
    """
    Zero Trust Policy Decision Point (PDP)
    Evaluates access based on Clearance and Role.
    """
    
    # 1. Clearance Check (Bell-LaPadula Model: No Read Up)
    # Map clearance to integer for comparison
    clearance_map = {
        ClearanceLevel.UNCLASSIFIED: 0,
        ClearanceLevel.CONFIDENTIAL: 1,
        ClearanceLevel.SECRET: 2,
        ClearanceLevel.TOP_SECRET: 3
    }
    
    user_level = clearance_map.get(request.subject_clearance, 0)
    resource_level = clearance_map.get(request.resource_classification, 0)
    
    if user_level < resource_level:
        return {"decision": "DENY", "reason": "Insufficient Clearance"}
    
    # 2. Role Check (Simple RBAC)
    if request.action == "execute" and request.subject_role not in [UserRole.COMMANDER, UserRole.RED_TEAM]:
         return {"decision": "DENY", "reason": "Only Commanders/RedTeam can Execute actions"}

    # 3. Time of Day / Context (Placeholder)
    # In a full impl, we'd check time, location, etc. here.
    
    return {"decision": "PERMIT", "reason": "Policy Checks Passed"}
