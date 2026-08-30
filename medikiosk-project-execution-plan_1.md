# MediKiosk — End-to-End Project Execution Plan

A phased roadmap for taking MediKiosk from concept to a hospital-deployed, ABDM-integrated clinical intake platform, with built-in checkpoints to catch mistakes before they compound.

---

## Phase 0 — Discovery & Validation (Weeks 1–4)

**Goal:** Confirm the problem and constraints before writing a line of code.

1. **Site visits and shadowing** — Spend time in 2–3 target OPDs (a general hospital and an AYUSH hospital) observing actual consultation flow, patient literacy levels, language mix, and where time is really lost.
2. **Stakeholder interviews** — Talk to physicians, nurses, registration staff, hospital IT/HIS administrators, and patients themselves. Physicians will tell you what they actually want in a summary; IT will tell you what your HIS integration is really up against.
3. **Regulatory scoping** — Map every requirement under the Digital Personal Data Protection Act 2023 and the ABDM consent framework before design starts, not after. Retrofitting consent architecture is expensive.
4. **Define success metrics up front** — e.g., average consultation time saved, % of history captured without staff assistance, document digitization accuracy rate, patient completion rate without abandonment. Without these, you can't tell later whether the pilot worked.

**Common mistake this avoids:** building the full four-module system before confirming physicians will actually trust and use an AI-drafted summary.

---

## Phase 1 — Requirements & Architecture (Weeks 3–8, overlapping Phase 0)

1. **Write a clinical ontology spec first.** Before any dialogue AI is built, define the structured data model: every field in Chief Complaint, HPI (SOCRATES), Past History, Drug/Allergy, Family, Personal, ROS, and the AYUSH Dashavidha Pariksha parameters. This ontology is the backbone every other module depends on.
2. **Design the FHIR data model** to match ABDM's Health Information Exchange standards from day one, so the structured summary can be pushed without a translation layer bolted on later.
3. **Architecture decisions to lock early:**
   - Where does ASR/OCR inference run (on-device kiosk vs. cloud) — this affects privacy, latency, and offline resilience in low-connectivity hospitals.
   - Session data lifecycle — what's cached, for how long, and how it's purged after submission.
   - HIS integration pattern — API push, HL7/FHIR bridge, or middleware, depending on what the target hospital's existing HIS supports.
4. **Threat model the consent and data flow** with a security reviewer before build starts, since this is the hardest thing to fix after deployment.

---

## Phase 2 — Build Module by Module (Weeks 6–20)

Build in this order — each module de-risks the next:

1. **Module D (Consent & ABDM) first, even though it's listed last.** Authentication, consent capture, and the FHIR push pipeline are the plumbing everything else depends on, and they're the most regulation-sensitive. Get this right and independently tested before layering clinical AI on top.
2. **Module B (Document Digitization) second.** OCR and entity extraction can be built and validated against real (anonymized) sample documents largely independent of the conversational engine. Test accuracy against handwritten Indian prescriptions specifically — this is where generic OCR models fail hardest.
3. **Module A (Conversational History Engine) third.** Build the dialogue manager against the ontology from Phase 1. Start with a narrow set of chief complaints (e.g., 5–10 common presenting complaints) fully validated before expanding breadth. Build red-flag detection as a hard-coded safety layer, not a soft AI judgment call — false negatives here are dangerous.
4. **Module C (Summary Generator) last.** It depends on structured output from A and B, so building it last means you're summarizing real, tested data rather than guessing at format.

**At every module:** build the physician-facing edit/override UI alongside the AI output, never after. Physicians must never see an AI summary they can't correct in one tap.

---

## Phase 3 — Integration Testing (Weeks 18–24)

1. **End-to-end dry runs with staff volunteers**, not real patients, walking the full 5-step journey (Identify → Converse → Scan → Summarize & Route → Consult).
2. **Load and stress testing** at realistic OPD volumes (thousands of daily sessions) — this is where kiosk hardware and cloud inference costs get validated.
3. **Multilingual and accent testing** across Hindi, English, and target regional languages, specifically with elderly and low-literacy speech patterns, not just clean studio audio.
4. **Failure-mode testing** — what happens when ASR mishears, OCR fails on a torn document, or connectivity drops mid-session. Every failure path needs a graceful fallback (e.g., "ask a staff member" prompt), not a silent error.

---

## Phase 4 — Clinical & Compliance Validation (Weeks 20–26, overlapping Phase 3)

1. **Clinical accuracy audit** — have independent physicians compare AI-generated summaries against their own manual history-taking on the same patients, and score for omissions or misrepresentation.
2. **Bias and equity check** — verify the system performs equally well across languages, dialects, age groups, and literacy levels rather than only for urban, English-comfortable users.
3. **Formal DPDP/ABDM compliance sign-off** from legal and the hospital's data protection officer before any real patient data flows through the system.
4. **Ethics/IRB review** if this is being piloted as part of a research study at an academic hospital.

---

## Phase 5 — Pilot Deployment (Weeks 24–30)

1. **Single-site, limited-hours pilot** — one OPD counter, a few hours a day, with a staff member present to assist and observe (not to do the work for the patient — to catch failure points).
2. **Shadow mode for the summary** — for the first few weeks, have the AI-generated summary sit alongside the physician's own manual note without replacing it, so you can measure agreement rate before trusting it standalone.
3. **Daily debrief loop** with physicians and staff to catch usability issues fast — kiosk placement, noise interference, queue confusion.
4. **Track your Phase 0 success metrics rigorously** from day one of the pilot.

---

## Phase 6 — Scale-Up & HIS/ABDM Rollout (Months 7–12)

1. **Expand to full OPD hours**, then additional departments, then additional hospital sites — one variable at a time so you can attribute any drop in performance correctly.
2. **Formalize the HIS and ABDM integration** as a production pipeline with monitoring, not a pilot script — set up alerting for failed pushes to the hospital record system.
3. **AYUSH mode rollout** as a separate track once the core allopathic flow is stable, since it has its own extended ontology and validation needs.
4. **Train hospital staff formally** — kiosk troubleshooting, escalation paths for red-flag alerts, and how to handle patients who need extra assistance.

---

## Phase 7 — Post-Launch Monitoring & Iteration (Ongoing)

1. **Continuous accuracy monitoring** — sample and audit a percentage of AI summaries against physician edits weekly; a high edit rate on any field signals a model or ontology gap.
2. **Red-flag alert audit** — review every triggered emergency alert (and periodically sample non-triggers) to tune sensitivity/specificity.
3. **Security and consent audits** on a fixed schedule (e.g., quarterly), not just at launch.
4. **Patient feedback loop** — short exit survey on ease of use, specifically tracking abandonment and staff-assistance rates as leading indicators of accessibility failure.

---

## Cross-Cutting Practices to Avoid Mistakes Throughout

- **Never let the AI summary auto-save without physician confirmation** — this is a hard product rule, not just a UX nicety, and should be enforced at the architecture level so it can't be bypassed by a future feature request.
- **Version and log every model output** tied to a session ID, so any disputed summary can be traced back to exactly what the AI heard/read and generated.
- **Keep a human escalation path visible on every kiosk screen** at all times — for patients who get stuck, and for any red-flag emergency.
- **Treat the ontology (Phase 1) as the single source of truth.** If a new field is needed later, update the ontology first, then propagate to modules — never patch a module's output format directly.

Let me know if you'd like this broken out into a timeline chart, a RACI/roles table, or a PowerPoint deck for stakeholder review.
