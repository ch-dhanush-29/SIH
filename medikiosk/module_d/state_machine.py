"""
MediKiosk Session State Machine.
Enforces the mandatory physician confirmation rule and manages clinical states.
"""

from typing import List

class StateMachineError(Exception):
    pass

class SessionStateMachine:
    # Defined States
    IDLE = "IDLE"
    CONSENT_PENDING = "CONSENT_PENDING"
    IDENTIFICATION = "IDENTIFICATION"
    INTAKE_ACTIVE = "INTAKE_ACTIVE"
    OCR_PROCESSING = "OCR_PROCESSING"
    SUMMARY_PENDING_REVIEW = "SUMMARY_PENDING_REVIEW"
    PHYSICIAN_EDITING = "PHYSICIAN_EDITING"
    CONFIRMED = "CONFIRMED"
    SUBMITTED = "SUBMITTED"
    RED_FLAG_ALERT = "RED_FLAG_ALERT"

    VALID_TRANSITIONS = {
        IDLE: [CONSENT_PENDING, RED_FLAG_ALERT],
        CONSENT_PENDING: [IDENTIFICATION, IDLE, RED_FLAG_ALERT],
        IDENTIFICATION: [INTAKE_ACTIVE, CONSENT_PENDING, IDLE, RED_FLAG_ALERT],
        INTAKE_ACTIVE: [OCR_PROCESSING, SUMMARY_PENDING_REVIEW, IDLE, RED_FLAG_ALERT],
        OCR_PROCESSING: [SUMMARY_PENDING_REVIEW, INTAKE_ACTIVE, IDLE, RED_FLAG_ALERT],
        SUMMARY_PENDING_REVIEW: [PHYSICIAN_EDITING, CONFIRMED, IDLE, RED_FLAG_ALERT],
        PHYSICIAN_EDITING: [CONFIRMED, SUMMARY_PENDING_REVIEW, IDLE, RED_FLAG_ALERT],
        CONFIRMED: [SUBMITTED, IDLE, RED_FLAG_ALERT],
        SUBMITTED: [IDLE],
        RED_FLAG_ALERT: [IDLE]  # Once alert is raised, it must be cleared/handled before returning to IDLE
    }

    def __init__(self):
        self.state = self.IDLE
        self.physician_confirmed = False

    def transition_to(self, new_state: str):
        """
        Transitions the state machine to a new state.
        Enforces allowed transitions and the confirm-before-submit rule.
        """
        # Hard safety override: RED_FLAG_ALERT can be transitioned to from any state
        if new_state == self.RED_FLAG_ALERT:
            self.state = self.RED_FLAG_ALERT
            return

        allowed_next = self.VALID_TRANSITIONS.get(self.state, [])
        if new_state not in allowed_next:
            raise StateMachineError(
                f"Invalid transition: Cannot go from {self.state} to {new_state}."
            )

        # Enforce hard-constraint: Submit is only allowed if confirmed by a physician
        if new_state == self.SUBMITTED and not self.physician_confirmed:
            raise StateMachineError(
                "Hard Constraint Violation: Cannot transition to SUBMITTED without physician confirmation."
            )

        self.state = new_state

    def confirm_physician(self):
        """Action representing the physician's explicit confirmation of the clinical summary."""
        if self.state not in [self.SUMMARY_PENDING_REVIEW, self.PHYSICIAN_EDITING]:
            raise StateMachineError(
                f"Cannot confirm physician summary in state {self.state}. "
                f"Must be in SUMMARY_PENDING_REVIEW or PHYSICIAN_EDITING."
            )
        self.physician_confirmed = True
        self.transition_to(self.CONFIRMED)

    def reset(self):
        """Resets the state machine to IDLE."""
        self.state = self.IDLE
        self.physician_confirmed = False
