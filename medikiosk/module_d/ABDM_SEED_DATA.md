# 🏥 MediKiosk Module D — ABDM Simulation Seed Patient Catalog

> **Notice**: All records in this catalog are **100% fictional test scaffolding**. Generated ABHA numbers carry the `SIM-` prefix to guarantee non-collision with the live National Health Authority (NHA) production network.

---

## 📋 Quick Demo Cheatsheet

Use these seeded patient credentials during presentations or evaluation demos:

| Patient Type | Fake ABHA ID | Patient Name | Age/Sex | Location | Past Medical History & Prior Visits | Demo Purpose |
|---|---|---|---|---|---|---|
| 🔄 **Returning Patient** | `SIM-91-2001-0000-0001` | **Rameshwar Prasad** | 58 / M | Varanasi, UP | • **Visit 1 (Nov 2025)**: T2DM, HTN, Knee OA (Metformin 500mg, Telmisartan 40mg, HbA1c 8.4%)<br>• **Visit 2 (Mar 2026)**: Stable Angina / CAD (Atorvastatin 20mg, Sorbitrate 5mg) | **Step 1 Returning Patient Path**: Demonstrates instant recall of 2 prior care contexts, prior medications, and baseline lab values. |
| 🔄 **Returning Patient** | `SIM-91-2002-0000-0002` | **Sunita Devi** | 47 / F | Patna, Bihar | • **Visit 1 (Dec 2025)**: Bronchial Asthma & Allergic Rhinitis (Salbutamol Inhaler, Montelukast 10mg, AEC 650) | **Pulmonary Follow-up Path**: Shows previous inhaler prescriptions and allergy history pre-populated on kiosk. |
| 🔄 **Returning Patient** | `SIM-91-2003-0000-0003` | **Gurpreet Singh** | 64 / M | Amritsar, Punjab | • **Visit 1 (Sep 2024)**: Post-PTCA LAD Drug-Eluting Stent, Dyslipidemia (Aspirin 75mg, Clopidogrel 75mg, Rosuvastatin 20mg) | **Cardiology Post-PCI Path**: Demonstrates cardiac history recall and dual antiplatelet drug alerts. |
| 🔄 **Returning Patient (AYUSH)** | `SIM-91-2004-0000-0004` | **Lakshmi Narayanan** | 52 / F | Madurai, TN | • **Visit 1 (Oct 2025)**: Sandhigata Vata / Lumbar Spondylosis (Yogaraja Guggulu, Mahanarayana Taila) | **AYUSH Mode Path**: Demonstrates Ayurvedic Dashavidha Pariksha integration and herbal drug history. |
| 🆕 **New Patient** | `SIM-91-1001-0000-0001` | **Ananya Sharma** | 28 / F | Jaipur, Rajasthan | • **Zero Prior History**: Clean slate registration | **Step 1 New Patient Path**: Demonstrates instant ABHA profile creation, fresh consent grant, and brand new intake. |
| 🆕 **New Patient** | `SIM-91-1002-0000-0002` | **Mohammed Farhan** | 33 / M | Hyderabad, Telangana | • **Zero Prior History**: Clean slate registration | **New Acute Triage Path**: Demonstrates fresh acute symptoms intake. |
| 🆕 **New Patient** | `SIM-91-1003-0000-0003` | **Arun Chatterjee** | 40 / M | Kolkata, WB | • **Zero Prior History**: Clean slate registration | **Bilingual Bengali / Hindi Path**. |

---

## ⚙️ Architecture & Swappability Guarantee

### How to Switch Between Simulation and Live ABDM Gateway

The dependency direction is strictly decoupled via `get_abdm_client()` in `medikiosk/module_d/abdm_client.py`:

```python
from medikiosk.module_d.abdm_client import get_abdm_client

# Automatically resolves SimulatedABDMClient or LiveABDMClient based on environment:
abdm = get_abdm_client()
```

1. **Simulated Mode (Default)**:
   ```bash
   export ABDM_MODE=simulated
   # or leave unset — defaults to in-memory zero-network simulation
   ```
2. **Live Production Mode**:
   ```bash
   export ABDM_MODE=live
   export ABDM_CLIENT_ID=your_nha_client_id
   export ABDM_CLIENT_SECRET=your_nha_client_secret
   export ABDM_FACILITY_ID=IN-DL-00104-DISTRICT-HOSPITAL
   ```

Swapping the client requires **zero changes** to any other application code, state machines, or dialogue engines.
