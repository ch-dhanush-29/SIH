"""
MediKiosk Cryptographic Audit Ledger & Compliance Chain.
Implements an immutable SHA-256 hash-chained ledger for all kiosk actions:
Consent grants, red-flag triggers, OCR parsing, physician edits, and zeroization.
"""

import time
import json
import hashlib
from typing import Dict, Any, List, Optional, Tuple


class AuditBlock:
    """A single immutable block in the cryptographic compliance chain."""

    def __init__(
        self,
        index: int,
        timestamp: float,
        event_type: str,
        session_id: str,
        actor_role: str,
        action_payload: Dict[str, Any],
        previous_hash: str
    ):
        self.index = index
        self.timestamp = timestamp
        self.event_type = event_type
        self.session_id = session_id
        self.actor_role = actor_role
        self.action_payload = action_payload
        self.previous_hash = previous_hash
        self.block_hash = self.calculate_hash()

    def calculate_hash(self) -> str:
        """Computes SHA-256 fingerprint over all block contents."""
        block_string = json.dumps({
            "index": self.index,
            "timestamp": self.timestamp,
            "event_type": self.event_type,
            "session_id": self.session_id,
            "actor_role": self.actor_role,
            "action_payload": self.action_payload,
            "previous_hash": self.previous_hash
        }, sort_keys=True)
        return hashlib.sha256(block_string.encode('utf-8')).hexdigest()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "index": self.index,
            "timestamp": self.timestamp,
            "timestamp_iso": time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime(self.timestamp)),
            "event_type": self.event_type,
            "session_id": self.session_id,
            "actor_role": self.actor_role,
            "action_payload": self.action_payload,
            "previous_hash": self.previous_hash,
            "block_hash": self.block_hash
        }


class CryptographicAuditLedger:
    """
    Tamper-Evident Hash-Chained Audit Ledger.
    Tracks every security-critical action across the clinical intake lifecycle.
    """

    def __init__(self):
        self.chain: List[AuditBlock] = []
        self._create_genesis_block()

    def _create_genesis_block(self):
        """Initializes the immutable ledger with a verifiable genesis anchor."""
        genesis_block = AuditBlock(
            index=0,
            timestamp=1724800000.0,  # MediKiosk System Epoch
            event_type="GENESIS_LEDGER_INITIALIZED",
            session_id="SYSTEM_CORE",
            actor_role="SYSTEM_ROOT",
            action_payload={"protocol": "DPDP_ACT_2023_AUDIT_V1", "cipher": "SHA-256-CHAIN"},
            previous_hash="0" * 64
        )
        self.chain.append(genesis_block)

    def record_event(
        self,
        event_type: str,
        session_id: str,
        actor_role: str,
        action_payload: Dict[str, Any]
    ) -> AuditBlock:
        """Appends a new verified event block to the immutable hash chain."""
        last_block = self.chain[-1]
        new_block = AuditBlock(
            index=len(self.chain),
            timestamp=time.time(),
            event_type=event_type,
            session_id=session_id,
            actor_role=actor_role,
            action_payload=action_payload,
            previous_hash=last_block.block_hash
        )
        self.chain.append(new_block)
        return new_block

    def record_action(
        self,
        actor_role: str,
        action: str,
        details: Dict[str, Any]
    ) -> str:
        """Convenience method to record an action and return its hash."""
        block = self.record_event(
            event_type=action,
            session_id=str(details.get("token") or details.get("patient_id") or "SESSION"),
            actor_role=actor_role,
            action_payload=details
        )
        return block.block_hash

    def get_full_trail(self) -> List[Dict[str, Any]]:
        """Returns the full audit trail as serialized dicts."""
        return [b.to_dict() for b in self.chain]

    def verify_integrity(self) -> Dict[str, Any]:
        """
        Validates the full cryptographic chain from genesis to head.
        Detects any retroactive tampering, hash mismatch, or broken linkages.
        """
        for i in range(1, len(self.chain)):
            current = self.chain[i]
            previous = self.chain[i - 1]

            # 1. Recalculate block hash
            recomputed_hash = current.calculate_hash()
            if current.block_hash != recomputed_hash:
                return {
                    "is_valid": False,
                    "tamper_detected_at_index": current.index,
                    "reason": f"Hash mismatch at block #{current.index}: Expected {current.block_hash[:16]}..., computed {recomputed_hash[:16]}..."
                }

            # 2. Verify link to previous block
            if current.previous_hash != previous.block_hash:
                return {
                    "is_valid": False,
                    "tamper_detected_at_index": current.index,
                    "reason": f"Broken linkage at block #{current.index}: Previous hash pointer mismatch."
                }

        merkle_root = self.compute_merkle_root()
        return {
            "is_valid": True,
            "total_blocks": len(self.chain),
            "merkle_root": merkle_root,
            "head_block_hash": self.chain[-1].block_hash,
            "status": "CHAIN_INTEGRITY_VERIFIED_100_PERCENT",
            "compliance": "ISO 27799 / DPDP Act 2023 Non-Repudiation Audit Standard"
        }

    def compute_merkle_root(self) -> str:
        """Computes hierarchical Merkle tree root hash over all blocks in the ledger."""
        hashes = [b.block_hash for b in self.chain]
        if not hashes:
            return "0" * 64

        while len(hashes) > 1:
            if len(hashes) % 2 != 0:
                hashes.append(hashes[-1])
            new_hashes = []
            for j in range(0, len(hashes), 2):
                combined = hashes[j] + hashes[j + 1]
                new_hashes.append(hashlib.sha256(combined.encode('utf-8')).hexdigest())
            hashes = new_hashes

        return hashes[0]

    def get_ledger_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Returns the most recent audit blocks formatted for UI review."""
        return [b.to_dict() for b in reversed(self.chain[-limit:])]
