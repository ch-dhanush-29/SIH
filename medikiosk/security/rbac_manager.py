"""
MediKiosk Role-Based Access Control (RBAC) & Security Policy Manager.
Enforces least-privilege security boundaries across Kiosk, Nurse, Physician, and Admin roles.
"""

import time
import hmac
import hashlib
import json
import secrets
from typing import Dict, Any, List, Optional, Set, Tuple


# ─── Permission Matrix ────────────────────────────────────────────────────────
PERMISSIONS_REGISTRY = {
    # Patient Kiosk permissions
    "consent:grant": "Grant granular DPDP consent parameters",
    "consent:revoke": "Revoke consent and trigger selective memory wipes",
    "dialogue:speak": "Interact with multilingual voice/touch conversational intake",
    "ocr:upload": "Scan prescription or lab report document",

    # Nurse / Triage permissions
    "vitals:record": "Input verified patient vital signs (BP, SpO2, Pulse)",
    "queue:manage": "View and route patient OPD token numbers",
    "redflag:acknowledge": "Receive real-time emergency red-flag triage alert",

    # Attending Physician permissions
    "summary:read": "View structured bilingual clinical summary",
    "summary:edit": "Edit extracted diagnoses, medications, and clinical notes",
    "summary:confirm": "Execute mandatory physician gate confirmation",
    "his:submit": "Authorize transmission of FHIR/HL7 record to Hospital HIS",

    # Administrator & Auditor permissions
    "kiosk:config": "Configure kiosk language packs and hardware peripherals",
    "his:configure": "Manage HIS MLLP/FHIR endpoints and certificates",
    "audit:view_chain": "Inspect immutable cryptographic audit ledger",
    "audit:verify_integrity": "Execute zero-tamper cryptographic integrity check",
    "compliance:export": "Generate DPDP Act 2023 / ISO 27799 compliance certifications"
}

ROLE_PERMISSIONS: Dict[str, Set[str]] = {
    "PATIENT_KIOSK": {
        "consent:grant", "consent:revoke", "dialogue:speak", "ocr:upload"
    },
    "TRIAGE_NURSE": {
        "consent:grant", "dialogue:speak", "ocr:upload", "vitals:record",
        "queue:manage", "redflag:acknowledge"
    },
    "ATTENDING_PHYSICIAN": {
        "summary:read", "summary:edit", "summary:confirm", "his:submit",
        "redflag:acknowledge", "vitals:record"
    },
    "HOSPITAL_ADMIN": {
        "kiosk:config", "his:configure", "audit:view_chain", "compliance:export"
    },
    "AUDIT_OFFICER": {
        "audit:view_chain", "audit:verify_integrity", "compliance:export"
    }
}


class RBACManager:
    """
    Role-Based Access Control and Session Authorization Gatekeeper.
    Generates HMAC-signed session tokens and enforces permission boundaries.
    """

    def __init__(self, secret_key: Optional[str] = None):
        self._secret_key = (secret_key or secrets.token_hex(32)).encode('utf-8')
        self._active_tokens: Dict[str, Dict[str, Any]] = {}

    def issue_token(self, user_id: str, role: str, session_id: str = "GLOBAL", ttl_seconds: int = 1800) -> Dict[str, Any]:
        """Issues an HMAC-signed role authorization token."""
        if role not in ROLE_PERMISSIONS:
            raise ValueError(f"Invalid role: {role}. Valid roles: {list(ROLE_PERMISSIONS.keys())}")

        issued_at = time.time()
        expires_at = issued_at + ttl_seconds
        payload = {
            "sub": user_id,
            "role": role,
            "session_id": session_id,
            "iat": issued_at,
            "exp": expires_at,
            "permissions": list(ROLE_PERMISSIONS[role])
        }

        payload_bytes = json.dumps(payload, sort_keys=True).encode('utf-8')
        signature = hmac.new(self._secret_key, payload_bytes, hashlib.sha256).hexdigest()
        token_str = f"{secrets.token_hex(8)}.{signature}"

        self._active_tokens[token_str] = {
            "payload": payload,
            "signature": signature
        }

        return {
            "access_token": token_str,
            "token_type": "Bearer",
            "role": role,
            "user_id": user_id,
            "session_id": session_id,
            "expires_at": expires_at,
            "expires_in_seconds": ttl_seconds,
            "permissions_count": len(ROLE_PERMISSIONS[role])
        }

    def verify_permission(self, token: str, required_permission: str) -> Tuple[bool, Optional[str]]:
        """Verifies if the given token is valid and possesses the required permission."""
        if token not in self._active_tokens:
            return False, "Invalid or unrecognized security token."

        entry = self._active_tokens[token]
        payload = entry["payload"]

        # Check expiration
        if time.time() > payload["exp"]:
            del self._active_tokens[token]
            return False, "Security token has expired. Please re-authenticate."

        # Check permission
        if required_permission not in payload.get("permissions", []):
            return False, f"Access Denied: Role '{payload['role']}' lacks required permission '{required_permission}'."

        return True, None

    def get_role_catalog(self) -> Dict[str, Any]:
        """Returns the full RBAC permission matrix for administrative inspection."""
        return {
            "roles": [
                {
                    "role_name": role,
                    "permissions": sorted(list(perms)),
                    "description": self._get_role_description(role)
                }
                for role, perms in ROLE_PERMISSIONS.items()
            ],
            "total_permissions": len(PERMISSIONS_REGISTRY),
            "registry": PERMISSIONS_REGISTRY
        }

    def _get_role_description(self, role: str) -> str:
        descriptions = {
            "PATIENT_KIOSK": "Autonomous patient terminal — restricted to consent intake, voice/touch Q&A, and document scanning.",
            "TRIAGE_NURSE": "Triage desk terminal — manages OPD token flow, records vitals, and receives red-flag emergency alarms.",
            "ATTENDING_PHYSICIAN": "Doctor consultation dashboard — reviews bilingual summary, modifies diagnoses/Rx, and authorizes HIS write.",
            "HOSPITAL_ADMIN": "Kiosk facility management — configures hardware, Indic language packs, and HIS endpoints.",
            "AUDIT_OFFICER": "Compliance & security auditor — inspects cryptographic ledger and verifies ISO 27799 / DPDP non-repudiation."
        }
        return descriptions.get(role, "")
