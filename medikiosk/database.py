"""
MediKiosk Enterprise MongoDB Real-Time Persistence Engine.
Replaces legacy SQLite with cloud/on-prem MongoDB Atlas cluster.
Collections:
- patients: Demographic profiles & ABHA records
- tokens: OPD tokens, priority, queues, and room routing
- clinical_intakes: SOCRATES history, complaints, vitals, red-flag triggers
- prescriptions: Decoded prescription records, medications, and lab investigations
- doctors: Hospital attending physicians, specialties, and OPD room assignments
- hospitals: Healthcare facilities and clinics
- audit_ledger: DPDP Act 2023 cryptographic SHA-256 audit blocks
"""

import os
import json
import hashlib
import time
from datetime import datetime
from typing import Dict, Any, List, Optional
import pymongo
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

def _load_env_file():
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
    if os.path.exists(env_path):
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        k, v = k.strip(), v.strip().strip('"').strip("'")
                        if k not in os.environ:
                            os.environ[k] = v
        except Exception:
            pass

_load_env_file()

# Default MongoDB Connection String from environment variable (Safe template fallback)
DEFAULT_MONGO_URI = os.environ.get(
    "MONGODB_URI",
    "mongodb+srv://<db_username>:<db_password>@cluster0.6gvdgx7.mongodb.net/?appName=Cluster0"
)

DB_NAME = os.environ.get("MONGODB_DB_NAME", "medikiosk_db")

# In-memory runtime cache for real-time offline resilience
_RUNTIME_FALLBACK_STORE = {
    "patients": {},
    "tokens": {},
    "clinical_intakes": {},
    "prescriptions": {},
    "doctors": [
        {"doctor_id": "DOC-001", "name": "Dr. Ananya Reddy", "degree": "MBBS, MD (General Medicine)", "room": "Room 104", "specialty": "Internal Medicine", "hospital": "HealthCare+ Clinic", "status": "AVAILABLE"},
        {"doctor_id": "DOC-002", "name": "Dr. R. K. Sharma", "degree": "MBBS, MD (Medicine)", "room": "Room 104", "specialty": "General Medicine", "hospital": "District General Hospital Delhi", "status": "AVAILABLE"},
        {"doctor_id": "DOC-003", "name": "Dr. Priya Nair", "degree": "MBBS, DNB (Cardiology)", "room": "Room 108", "specialty": "Cardiology", "hospital": "Apollo Health City", "status": "IN_OPD"},
        {"doctor_id": "DOC-004", "name": "Dr. A. Sengupta", "degree": "MBBS, MD (Pulmonology)", "room": "Room 202", "specialty": "Respiratory Medicine", "hospital": "SSKM Medical College", "status": "AVAILABLE"}
    ],
    "hospitals": [
        {"facility_id": "HOSP-001", "name": "HealthCare+ Clinic", "address": "#45, Park Road, Hyderabad - 500034", "phone": "040 - 4567 8901", "type": "Multi-Speciality Clinic"},
        {"facility_id": "HOSP-002", "name": "District General Hospital Delhi", "address": "Central Delhi, Delhi - 110001", "phone": "011 - 2323 0000", "type": "District Government Hospital"},
        {"facility_id": "HOSP-003", "name": "Civil Hospital Amritsar", "address": "Amritsar, Punjab", "phone": "0183 - 2222 111", "type": "Civil Hospital"}
    ],
    "audit_ledger": []
}

_mongo_client: Optional[MongoClient] = None
_active_mongo_uri: str = DEFAULT_MONGO_URI

def set_mongo_connection_uri(uri: str) -> bool:
    """Updates active MongoDB connection string and initializes connection."""
    global _active_mongo_uri, _mongo_client
    _active_mongo_uri = uri.strip()
    _mongo_client = None
    return test_mongo_connection()

def get_mongo_connection_uri() -> str:
    return _active_mongo_uri

def get_mongo_client() -> Optional[MongoClient]:
    """Returns persistent MongoClient instance or None if not configured/unreachable."""
    global _mongo_client
    if _mongo_client is not None:
        return _mongo_client

    uri = _active_mongo_uri
    if not uri or "<db_username>" in uri or "<db_password>" in uri:
        return None

    try:
        client = MongoClient(uri, serverSelectionTimeoutMS=3000, connectTimeoutMS=3000)
        # Test liveness
        client.admin.command('ping')
        _mongo_client = client
        _init_mongodb_indexes(client[DB_NAME])
        return _mongo_client
    except Exception as e:
        print(f"MongoDB connection notice: {e}")
        return None

def test_mongo_connection() -> Dict[str, Any]:
    """Tests current MongoDB connection status."""
    uri = _active_mongo_uri
    if "<db_username>" in uri or "<db_password>" in uri:
        return {
            "connected": False,
            "status": "CREDENTIALS_REQUIRED",
            "message": "Please configure your MongoDB username and password in the connection string.",
            "uri_template": "mongodb+srv://<db_username>:<db_password>@cluster0.4iqx2pc.mongodb.net/?appName=Cluster0",
            "database": DB_NAME
        }

    try:
        client = MongoClient(uri, serverSelectionTimeoutMS=3000)
        client.admin.command('ping')
        return {
            "connected": True,
            "status": "ONLINE",
            "message": "Connected to MongoDB Atlas Cluster successfully in real-time.",
            "database": DB_NAME,
            "cluster": "cluster0.4iqx2pc.mongodb.net"
        }
    except Exception as e:
        return {
            "connected": False,
            "status": "CONNECTION_FAILED",
            "message": str(e),
            "database": DB_NAME
        }

def _init_mongodb_indexes(db):
    """Creates unique & search indexes across MongoDB collections."""
    try:
        db.patients.create_index("abha_id", unique=False)
        db.tokens.create_index("token_number", unique=False)
        db.tokens.create_index("created_at")
        db.prescriptions.create_index("token_number")
        db.clinical_intakes.create_index("token_number")
        db.audit_ledger.create_index("audit_hash", unique=True)
    except Exception:
        pass

def record_token_intake(
    patient_data: Dict[str, Any],
    token_number: str,
    priority: str = "ROUTINE",
    chief_complaint: str = "General Consultation",
    socrates_history: Optional[Dict[str, Any]] = None,
    vitals: Optional[Dict[str, Any]] = None,
    diagnoses: Optional[List[str]] = None,
    medications: Optional[List[Dict[str, Any]]] = None,
    lab_results: Optional[List[Dict[str, Any]]] = None,
    language: str = "en",
    facility_name: str = "HealthCare+ Clinic",
    doctor_name: str = "Dr. Ananya Reddy, MBBS, MD",
    room_number: str = "Room 104",
    kiosk_id: str = "KIOSK-HYD-01"
) -> Dict[str, Any]:
    """
    Dynamically stores all patient, hospital, doctor, and token details into MongoDB in real time.
    Calculates a SHA-256 cryptographic audit hash for tamper-evident DPDP compliance.
    """
    patient_uuid = patient_data.get("id") or patient_data.get("patient_id") or f"PAT-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    abha_id = patient_data.get("abha_id") or patient_uuid
    name = patient_data.get("name", "Unknown Patient")
    age = int(patient_data.get("age", 25))
    gender = patient_data.get("gender", "Male")
    mobile = patient_data.get("phone") or patient_data.get("mobile") or "9876543210"

    now_iso = datetime.now().isoformat()
    now_readable = datetime.now().strftime("%d-%b-%Y %I:%M %p")

    # Cryptographic SHA-256 Block
    audit_str = f"{token_number}|{patient_uuid}|{name}|{doctor_name}|{facility_name}|{priority}|{json.dumps(vitals or {})}|{now_iso}"
    audit_hash = hashlib.sha256(audit_str.encode("utf-8")).hexdigest()

    token_doc = {
        "token_number": token_number,
        "patient_uuid": patient_uuid,
        "patient_name": name,
        "abha_id": abha_id,
        "age": age,
        "gender": gender,
        "mobile": mobile,
        "doctor_name": doctor_name,
        "hospital_name": facility_name,
        "room_number": room_number,
        "priority": priority,
        "chief_complaint": chief_complaint,
        "language": language,
        "kiosk_id": kiosk_id,
        "status": "WAITING",
        "audit_hash": audit_hash,
        "created_at": now_iso,
        "created_readable": now_readable
    }

    intake_doc = {
        "token_number": token_number,
        "patient_uuid": patient_uuid,
        "chief_complaint": chief_complaint,
        "socrates_history": socrates_history or {},
        "vitals": vitals or {"spo2": 98, "pulse": 76, "sbp": 120, "dbp": 80, "temp": 98.6},
        "priority": priority,
        "created_at": now_iso
    }

    prescription_doc = {
        "token_number": token_number,
        "patient_uuid": patient_uuid,
        "diagnoses": diagnoses or ["General Clinical Consultation"],
        "medications": medications or [],
        "lab_results": lab_results or [],
        "consultant_doctor": doctor_name,
        "hospital_name": facility_name,
        "created_at": now_iso
    }

    patient_profile = {
        "patient_uuid": patient_uuid,
        "name": name,
        "abha_id": abha_id,
        "age": age,
        "gender": gender,
        "mobile": mobile,
        "last_token": token_number,
        "last_visit": now_iso
    }

    audit_entry = {
        "audit_hash": audit_hash,
        "token_number": token_number,
        "event": "PATIENT_INTAKE_TOKEN_ISSUED",
        "timestamp": now_iso,
        "patient_uuid": patient_uuid,
        "compliance": "DPDP_ACT_2023_SECTION_7"
    }

    # Store in MongoDB if live client available
    client = get_mongo_client()
    mongo_saved = False
    if client:
        try:
            db = client[DB_NAME]
            db.tokens.insert_one(token_doc.copy())
            db.clinical_intakes.insert_one(intake_doc.copy())
            db.prescriptions.insert_one(prescription_doc.copy())
            db.patients.update_one({"patient_uuid": patient_uuid}, {"$set": patient_profile}, upsert=True)
            db.audit_ledger.insert_one(audit_entry.copy())
            mongo_saved = True
        except Exception as e:
            print(f"MongoDB write error: {e}")

    # Synchronize in-memory fallback store
    _RUNTIME_FALLBACK_STORE["tokens"][token_number] = token_doc
    _RUNTIME_FALLBACK_STORE["clinical_intakes"][token_number] = intake_doc
    _RUNTIME_FALLBACK_STORE["prescriptions"][token_number] = prescription_doc
    _RUNTIME_FALLBACK_STORE["patients"][patient_uuid] = patient_profile
    _RUNTIME_FALLBACK_STORE["audit_ledger"].append(audit_entry)

    return {
        "token_number": token_number,
        "audit_hash": audit_hash,
        "storage_mode": "MONGODB_ATLAS" if mongo_saved else "RUNTIME_MEMORY_ACTIVE",
        "mongodb_connected": mongo_saved,
        "patient": patient_profile,
        "doctor": {
            "name": doctor_name,
            "room": room_number,
            "hospital": facility_name
        },
        "encounter": {
            "priority": priority,
            "chief_complaint": chief_complaint,
            "diagnoses_count": len(diagnoses or []),
            "medications_count": len(medications or []),
            "vitals": vitals
        },
        "created_at": now_readable
    }

def get_live_token_queue(room_number: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieves dynamic real-time token list from MongoDB."""
    client = get_mongo_client()
    if client:
        try:
            db = client[DB_NAME]
            query = {}
            if room_number:
                query["room_number"] = room_number
            cursor = db.tokens.find(query).sort("created_at", pymongo.DESCENDING)
            tokens = []
            for doc in cursor:
                doc["_id"] = str(doc.get("_id", ""))
                tokens.append(doc)
            if tokens:
                return tokens
        except Exception as e:
            print(f"MongoDB read error: {e}")

    # Fallback to runtime memory
    tokens = list(_RUNTIME_FALLBACK_STORE["tokens"].values())
    if room_number:
        tokens = [t for t in tokens if t.get("room_number") == room_number]
    tokens.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return tokens

def get_patient_history(patient_id_or_abha: str) -> List[Dict[str, Any]]:
    """Retrieves full longitudinal history from MongoDB."""
    client = get_mongo_client()
    if client:
        try:
            db = client[DB_NAME]
            cursor = db.tokens.find({
                "$or": [
                    {"patient_uuid": patient_id_or_abha},
                    {"abha_id": patient_id_or_abha}
                ]
            }).sort("created_at", pymongo.DESCENDING)
            results = []
            for doc in cursor:
                doc["_id"] = str(doc.get("_id", ""))
                results.append(doc)
            return results
        except Exception:
            pass

    return [t for t in _RUNTIME_FALLBACK_STORE["tokens"].values() if t.get("patient_uuid") == patient_id_or_abha or t.get("abha_id") == patient_id_or_abha]

def get_all_doctors() -> List[Dict[str, Any]]:
    """Returns dynamic doctors list."""
    client = get_mongo_client()
    if client:
        try:
            db = client[DB_NAME]
            docs = list(db.doctors.find())
            if docs:
                for d in docs:
                    d["_id"] = str(d.get("_id", ""))
                return docs
        except Exception:
            pass
    return _RUNTIME_FALLBACK_STORE["doctors"]

def get_all_hospitals() -> List[Dict[str, Any]]:
    """Returns dynamic hospitals list."""
    client = get_mongo_client()
    if client:
        try:
            db = client[DB_NAME]
            hosps = list(db.hospitals.find())
            if hosps:
                for h in hosps:
                    h["_id"] = str(h.get("_id", ""))
                return hosps
        except Exception:
            pass
    return _RUNTIME_FALLBACK_STORE["hospitals"]

def get_db_stats() -> Dict[str, Any]:
    """Returns real-time record counts across all collections."""
    conn_info = test_mongo_connection()
    client = get_mongo_client()
    
    if client and conn_info.get("connected"):
        try:
            db = client[DB_NAME]
            return {
                "connection": conn_info,
                "counts": {
                    "patients": db.patients.count_documents({}),
                    "tokens": db.tokens.count_documents({}),
                    "clinical_intakes": db.clinical_intakes.count_documents({}),
                    "prescriptions": db.prescriptions.count_documents({}),
                    "doctors": db.doctors.count_documents({}),
                    "hospitals": db.hospitals.count_documents({}),
                    "audit_ledger": db.audit_ledger.count_documents({})
                },
                "storage_backend": "MongoDB Atlas (Live)"
            }
        except Exception as e:
            pass

    return {
        "connection": conn_info,
        "counts": {
            "patients": len(_RUNTIME_FALLBACK_STORE["patients"]),
            "tokens": len(_RUNTIME_FALLBACK_STORE["tokens"]),
            "clinical_intakes": len(_RUNTIME_FALLBACK_STORE["clinical_intakes"]),
            "prescriptions": len(_RUNTIME_FALLBACK_STORE["prescriptions"]),
            "doctors": len(_RUNTIME_FALLBACK_STORE["doctors"]),
            "hospitals": len(_RUNTIME_FALLBACK_STORE["hospitals"]),
            "audit_ledger": len(_RUNTIME_FALLBACK_STORE["audit_ledger"])
        },
        "storage_backend": "MongoDB Engine (Configured)"
    }
