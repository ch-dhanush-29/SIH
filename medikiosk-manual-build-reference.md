# MediKiosk — Manual Build Reference (Info Only, No Code)

This is a knowledge reference for building each phase yourself. It covers what each
module actually depends on: which government infrastructure to register for, which
standards to implement against, what the real technical decisions are, and where to
find the official documentation. No code is included — this is the "what you need to
know before you start typing" layer.

---

## Phase 1 — Ontology & Data Model

Before touching any AI, define your clinical data schema. This becomes the contract
every module reads/writes against.

- **Structure to define:** Chief Complaint → HPI (use the SOCRATES framework: Site,
  Onset, Character, Radiation, Associated symptoms, Timing, Exacerbating/relieving
  factors, Severity) → Past medical/surgical history → Drug & allergy history → Family
  history → Personal history → Review of systems → Prior investigations.
- **AYUSH extension:** Dashavidha Pariksha has ten fixed parameters (Prakriti, Vikriti,
  Sara, Samhanana, Pramana, Satmya, Sattva, Ahara Shakti, Vyayama Shakti, Vaya) plus
  Ahara-Vihara (diet/lifestyle). Treat this as a separate optional schema extension
  enabled per department, not a bolt-on field.
- **Map to FHIR early.** ABDM requires HL7 **FHIR R4** with **India-specific profiles**
  (the "ABDM Implementation Guide"). Decide now which FHIR resource each ontology field
  maps to (e.g., Condition, MedicationStatement, AllergyIntolerance, Observation,
  DocumentReference) so you're not doing a painful retrofit in Phase 4.
- **Red-flag rules belong here too** — write them as explicit trigger conditions (e.g.,
  chest pain + breathlessness → possible ACS; unilateral weakness + slurred speech →
  stroke/FAST criteria), not as a soft LLM judgment call. This is a safety-critical
  rules table, version it like code.

---

## Phase 2 — Module A: Conversational History Engine

**Speech recognition — Bhashini.**
Bhashini (bhashini.gov.in) is the Government of India's National Language Translation
Mission infrastructure under MeitY. As of 2026 it hosts 300+ models across ASR,
Machine Translation, TTS, OCR, and transliteration, covering the 22 scheduled Indian
languages (and Bhashini is expanding toward 100+ dialects). Key facts to know:
- Access is via REST APIs; you request a **Service ID** per language/task combination
  through their developer portal — each Service ID maps to a specific underlying
  model.
- Free tier available for developers/startups to prototype; commercial use has
  discounted paid tiers.
- Alternative/complementary option: **AI4Bharat** (IIT Madras) has released
  production-quality open-source Indic ASR and TTS models under permissive licenses
  (useful if you want on-device/offline inference for low-connectivity hospitals rather
  than a cloud API dependency).
- Decide early: cloud API call (simpler, needs connectivity) vs. self-hosted
  open-source model (more engineering, works offline, lower per-call cost at scale).

**Dialogue management.**
This is the part you build yourself — a state machine or LLM-driven dialogue manager
constrained to only ask questions defined in your Phase 1 ontology. Practical
approach: start with 5–10 common chief complaints, hand-write the SOCRATES-style
follow-up branches for each, and only expand breadth after those are clinically
validated. An LLM can generate natural-language phrasing of the questions, but the
*decision of what to ask next* should be driven by your ontology/rules, not free-form
LLM reasoning — this keeps the interview auditable and prevents the AI from wandering
into unvalidated clinical territory.

**Red-flag detection.**
Implement as hard-coded rule matching against the red-flag table from Phase 1, run on
every turn of the conversation, independent of the summarization LLM. This should be
the one piece of the system that never depends on a probabilistic model's judgment
call for triggering an alert.

---

## Phase 3 — Module B: Document Digitization

**OCR options to evaluate:**
- **Bhashini's own OCR models** — already in the same ecosystem as your ASR, worth
  testing first for Indian-script and multilingual documents.
- **Commercial vendors** (Google Document AI, AWS Textract, Azure Document
  Intelligence) — generally stronger on structured document parsing (tables, forms)
  but weaker on messy handwriting; test against real (anonymized) sample prescriptions
  before committing.
- **Specialized medical/handwriting OCR** — handwritten Indian prescriptions are a
  known hard case for generic OCR; budget real time for accuracy testing here
  specifically, since this is the most likely module to underperform if adopted
  off-the-shelf without validation.

**Entity extraction after OCR.**
Once you have raw text, you need a second pass (rules + LLM, or a fine-tuned NER
model) to pull out: diagnoses, medications with dosages, investigation results with
values and reference ranges, and procedure/surgery history. Map every extracted field
back to your Phase 1 FHIR mapping.

**Abnormal-value flagging** needs a reference-range table (by test name, and ideally
by patient age/sex where ranges differ) to compare extracted lab values against —
this is a data resource you'll need to source and maintain, not something OCR gives
you for free.

---

## Phase 4 — Module C: Summary Generator

This module has the least new infrastructure and the most process risk: it's an LLM
summarization step over structured data from Modules A and B, but the product
requirement is strict — **the physician must be able to edit or reject it in one tap,
and it must never auto-save without physician confirmation.** Design the UI contract
before the model, not after.

Output should be bilingual: physician-facing in English/Hindi, and a patient-facing
audio confirmation in the patient's chosen language (this loops back to Bhashini TTS).

---

## Phase 5 — Module D: Consent, Privacy & ABDM Integration

This is the module to start building **first** in practice, even though it's Module D
in the spec, because everything else depends on this plumbing and it's the hardest to
retrofit.

**Step-by-step registration path (per ABDM's own documentation):**
1. **Register on the ABDM Sandbox** at `sandbox.abdm.gov.in` — fill out an
   organization/motivation form; NHA (National Health Authority) typically responds
   with sandbox credentials within 3–4 days.
2. **Choose your integration role:** HIP (Health Information Provider — you create
   records), HIU (Health Information User — you consume records with consent), or
   both. MediKiosk is primarily an HIP (it generates the structured history) but may
   also act as an HIU if pulling a patient's existing linked records.
3. **Milestone M1 — ABHA & Scan-and-Share:** implement ABHA ID creation/verification
   and QR-code-based patient identification. This is the entry-level milestone and
   where most integrations start.
4. **Milestone M2 — Care context linking:** register the health records you hold so
   they become discoverable and linkable to a patient's ABHA account.
5. **Milestone M3 — Data exchange:** implement the full HIU/HIP consent-mediated
   exchange, including consent manager (HIE-CM) integration, FHIR bundle generation,
   and encryption/decryption of health information in transit.
6. **Important architectural note:** ABDM integration is NOT a simple client calling
   an API — the gateway calls *you* back for consent callbacks, so your service has to
   become an addressable node on the network, not just an outbound API consumer. Build
   your callback endpoints and JWT-signed request handling accordingly.
7. **Facility & provider registration:** register your hospital in the **Health
   Facility Registry (HFR)** and doctors in the **Healthcare Providers Registry
   (HPR)** — required before your FHIR bundles are considered valid participants in
   the network.
8. **Exit sandbox / go to production:** after passing NHA's test cases at each
   milestone, you apply to exit sandbox and receive production credentials. This is a
   compliance review, not just a technical switch — budget real time for it.

**Consent & data protection layer (parallel to ABDM):**
- Build against the **Digital Personal Data Protection Act, 2023 (DPDP Act)**
  requirements: purpose limitation, explicit and granular consent, data minimization,
  and a documented data retention/purge policy.
- Consent must be revocable and explained audibly for low-literacy patients — this is
  both an ABDM consent-manager requirement and a DPDP requirement, so design one
  consent UX that satisfies both rather than two parallel systems.
- Session data purge: define exactly what's cached during a kiosk session and ensure
  it's cleared immediately after the FHIR push succeeds — write this into your data
  handling policy document, not just your code.

---

## Phase 6 — HIS Integration

Every hospital's Hospital Information System is different — there's no single
standard here. Practical approach:
- Ask your pilot hospital's IT team what their HIS supports: a REST API, an HL7 v2
  message interface, or a database-level integration.
- If the HIS is ABDM-integrated already (increasingly common, and mandatory for
  PMJAY-empanelled hospitals), you may be able to push through the same FHIR bundle
  you're already building for ABDM, rather than maintaining two separate integration
  formats.
- If not, you'll need a translation layer from your FHIR bundle to whatever format
  their HIS expects (often HL7 v2 for older systems).

---

## Phase 7 — Testing & Validation

- **Clinical accuracy audit:** have independent physicians compare AI-drafted
  summaries against their own manual history-taking on the same patients; track
  omission and misrepresentation rates as your core quality metric.
- **Multilingual/accent testing:** test ASR specifically against elderly and
  low-literacy speech patterns, not just clean studio audio — this is where most ASR
  systems underperform in real deployment.
- **ABDM certification testing:** NHA provides defined test cases per milestone (M1,
  M2, M3) that you must pass before sandbox exit — treat these as your integration
  test suite rather than writing your own from scratch.
- **DPDP compliance sign-off:** get formal legal/DPO review before any real patient
  data flows through the system, not after pilot launch.

---

## Key Reference Links to Bookmark

- Bhashini developer portal: `bhashini.gov.in`
- ABDM Sandbox registration: `sandbox.abdm.gov.in`
- ABDM official documentation (APIs, standards, FHIR profiles, sandbox process):
  search "ABDM documentation" on the National Health Authority site — this is the
  authoritative source and changes periodically, so check it directly rather than
  relying on third-party summaries when you're implementing.
- AI4Bharat (open-source Indic ASR/TTS alternative): IIT Madras' public model
  releases.
- HL7 FHIR R4 base spec: `hl7.org/fhir/R4` — needed alongside the ABDM
  implementation guide since ABDM profiles extend the base FHIR resources.

---

## Sequencing Summary (Build Order)

1. Ontology + FHIR field mapping (Phase 1)
2. ABDM sandbox registration + consent/DPDP design (Module D) — start this
   immediately, it has the longest external lead time (NHA approval, milestone
   certification)
3. Document OCR + entity extraction (Module B) — can be built and tested in parallel,
   largely independent of the conversational engine
4. Conversational history engine + red-flag rules (Module A) — narrow scope first (5–10
   chief complaints), expand after validation
5. Summary generator (Module C) — built last since it consumes validated output from A
   and B
6. HIS integration — depends on your specific pilot hospital's system
7. Testing, clinical audit, DPDP sign-off
8. Pilot → scale-up

This ordering exists because ABDM's approval and certification cycle (step 2) is the
longest external dependency in the whole project — starting it late is the single most
common cause of project delay in this space.
