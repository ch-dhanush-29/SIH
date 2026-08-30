"""
DPDP Act 2023 Compliant Consent Manager for MediKiosk.
Handles granular consent states, logging of consent actions, and session data purging.
"""

import time
import os
import csv
from typing import Dict, Optional

class ConsentManager:
    def __init__(self, log_file_path: str = "consent_audit_log.csv"):
        self.log_file_path = log_file_path
        self.session_active = False
        
        # Granular consent flags
        self.consent_demographics = False
        self.consent_document_scan = False
        self.consent_voice_intake = False
        self.consent_his_abdm_share = False
        
        # Patient session cache (cleared on purge)
        self.session_data: Dict[str, Dict[str, str]] = {}
        
        # Initialize audit log file if it does not exist
        if not os.path.exists(self.log_file_path):
            with open(self.log_file_path, mode='w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow(["timestamp", "session_id", "patient_id", "consent_type", "action", "purpose"])

    def start_session(self, session_id: str, patient_id: str):
        """Starts a new patient clinical history session."""
        self.session_id = session_id
        self.patient_id = patient_id
        self.session_active = True
        self.consent_demographics = False
        self.consent_document_scan = False
        self.consent_voice_intake = False
        self.consent_his_abdm_share = False
        self.session_data = {
            "demographics": {},
            "clinical_history": {},
            "ocr_documents": {}
        }
        self.log_action("SESSION_START", "Initiate new clinical intake session")

    def grant_consent(self, consent_type: str, purpose: str):
        """Grants a specific granular consent."""
        if not self.session_active:
            raise ValueError("No active session.")
            
        if consent_type == "demographics":
            self.consent_demographics = True
        elif consent_type == "document_scan":
            self.consent_document_scan = True
        elif consent_type == "voice_intake":
            self.consent_voice_intake = True
        elif consent_type == "his_abdm_share":
            self.consent_his_abdm_share = True
        else:
            raise ValueError(f"Unknown consent type: {consent_type}")
            
        self.log_action(f"GRANT_{consent_type.upper()}", purpose)

    def revoke_consent(self, consent_type: str, purpose: str):
        """Revokes a specific granular consent and triggers appropriate logic."""
        if not self.session_active:
            raise ValueError("No active session.")
            
        if consent_type == "demographics":
            self.consent_demographics = False
        elif consent_type == "document_scan":
            self.consent_document_scan = False
            # Immediately clear scanned docs from cache
            if "ocr_documents" in self.session_data:
                self.session_data["ocr_documents"] = {}
        elif consent_type == "voice_intake":
            self.consent_voice_intake = False
            # Immediately clear intake voice transcriptions from cache
            if "clinical_history" in self.session_data:
                self.session_data["clinical_history"] = {}
        elif consent_type == "his_abdm_share":
            self.consent_his_abdm_share = False
        else:
            raise ValueError(f"Unknown consent type: {consent_type}")
            
        self.log_action(f"REVOKE_{consent_type.upper()}", purpose)

    def log_action(self, action: str, purpose: str):
        """Logs a consent action to the audit trail with timestamp and purpose."""
        timestamp = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime())
        with open(self.log_file_path, mode='a', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow([timestamp, self.session_id, self.patient_id, action, "SUCCESS", purpose])

    def update_session_data(self, key: str, value: dict):
        """Updates transient session data during clinical intake."""
        if not self.session_active:
            raise ValueError("No active session to write data.")
        if key not in self.session_data:
            self.session_data[key] = {}
        self.session_data[key].update(value)

    def purge_session(self):
        """
        Explicitly purges all session data and patient identifiers from memory.
        This must be called immediately after successful submission or session exit.
        """
        self.log_action("SESSION_PURGE", "Purging session details from memory (DPDP requirement)")
        self.session_data.clear()
        self.consent_demographics = False
        self.consent_document_scan = False
        self.consent_voice_intake = False
        self.consent_his_abdm_share = False
        self.session_active = False
        self.session_id = ""
        self.patient_id = ""
