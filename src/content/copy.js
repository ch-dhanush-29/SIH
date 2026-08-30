/**
 * MediKiosk site copy — single source of truth.
 * All statistics and claims sourced from:
 *   - medikiosk-project-execution-plan_1.md
 *   - medikiosk-manual-build-reference.md
 * Do not invent figures or features not present in those documents.
 */

export const siteCopy = {

  nav: {
    brand: 'MediKiosk',
    links: [
      { label: 'The Problem', href: '#problem' },
      { label: 'How It Works', href: '#modules' },
      { label: 'Patient Journey', href: '#journey' },
      { label: 'Standards', href: '#trust' },
    ],
    cta: 'Request a Demo',
  },

  hero: {
    eyebrow: 'AI-Powered Clinical Intake · Indian OPDs',
    headline: 'History captured before the consultation begins.',
    subhead:
      'MediKiosk is a patient-facing kiosk for Indian hospital outpatient departments. Walk up, speak your complaint, scan your prescription — and the physician sees a structured, FHIR-formatted clinical history in their queue before you enter the room.',
    ctaPrimary:  'Request a pilot demo',
    ctaSecondary: 'See how it works',
    cardFront: {
      label: 'OPD Token · Paper Record',
      lines: [
        'Token No.: 087',
        'Pt: [illegible]   Age: ~60',
        'C/O: chest pain  since 3d',
        'Rx: [smudged]   Tab ???',
        'Dr. signature ////',
      ],
    },
    cardBack: {
      label: 'MediKiosk · Structured Summary',
      fields: [
        { key: 'Chief Complaint', value: 'Chest pain — 3 days duration' },
        { key: 'Site',            value: 'Substernal' },
        { key: 'Onset',           value: 'Sudden' },
        { key: 'Character',       value: 'Crushing, pressure-like' },
        { key: 'Radiation',       value: 'Left arm, jaw' },
        { key: 'Severity',        value: '8 / 10' },
        { key: 'ABHA ID',         value: '12-3456-7890-1234', mono: true },
      ],
      alert: '⚠ Red flag: ACS criteria — physician alerted',
    },
  },

  problem: {
    eyebrow: 'The Problem',
    headline: 'OPD consultations in India average 2–5 minutes.',
    subhead:
      'History-taking alone consumes most of that time — and it still produces an incomplete, unstructured paper record.',
    points: [
      {
        title: 'Fragmented paper records',
        body: 'Prescriptions, lab reports, and discharge summaries arrive on paper — torn, faded, or written in three languages. There is no structured record to hand a physician.',
      },
      {
        title: 'No time for a full history',
        body: 'A physician seeing 80–100 patients in a session cannot run a complete SOCRATES-structured interview for each one. Critical details are missed.',
      },
      {
        title: 'Low digital literacy',
        body: 'Hospital MRD portals assume a literate, smartphone-equipped patient. Most OPD visitors are neither. Existing digital intake systems exclude the people who need them most.',
      },
      {
        title: 'Multilingual barriers',
        body: 'A patient speaking Bhojpuri at a Hindi-form counter, or Tamil at an English-form counter, falls through every existing digital intake system.',
      },
    ],
  },

  modules: {
    eyebrow: 'How MediKiosk Works',
    headline: 'Four modules. One integrated intake.',
    items: [
      {
        id: 'A',
        title: 'Conversational History Engine',
        subtitle: 'Ask the right questions, in the right language, before the doctor enters.',
        body: 'A constrained dialogue engine asks SOCRATES-structured follow-up questions based on the patient\'s chief complaint — in Hindi, English, or the patient\'s regional language. Red-flag patterns (chest pain + breathlessness → ACS criteria; unilateral weakness + slurred speech → FAST criteria) trigger an immediate alert to clinical staff. The AI does not judge; the rules engine does.',
        motif: 'waveform',
        motifLabel: 'Conversational audio waveform',
      },
      {
        id: 'B',
        title: 'Document Digitization',
        subtitle: 'Scan the prescription. Extract the diagnosis, the drug, the dose.',
        body: 'A document OCR pipeline processes paper prescriptions, lab reports, and referral letters. Structured entities — diagnoses, medications with dosages, investigation values with reference ranges — are extracted and mapped to FHIR R4 resources. Tested specifically against handwritten Indian prescriptions, the known hard case for generic OCR models.',
        motif: 'scan',
        motifLabel: 'Document scan sweep',
      },
      {
        id: 'C',
        title: 'Summary Generator',
        subtitle: 'A draft, not a decision. Always physician-confirmed.',
        body: 'Structured output from Modules A and B is compiled into a bilingual clinical summary — English for the physician, audio confirmation in the patient\'s language. The summary never saves without explicit physician confirmation. One-tap edit, one-tap confirm. This is an architecture constraint, not a UX option.',
        motif: 'checkmark',
        motifLabel: 'Physician confirmation checkmark',
      },
      {
        id: 'D',
        title: 'Consent & ABDM Integration',
        subtitle: 'Consent is not a checkbox. It is audible, revocable, and logged.',
        body: 'Every session begins with consent capture satisfying both the ABDM HIE-CM consent framework and the Digital Personal Data Protection Act 2023. Consent is explained in the patient\'s language — granular, revocable at any time, and stored in an audit log. Session data is purged immediately after the FHIR bundle is successfully pushed.',
        motif: 'shield',
        motifLabel: 'Consent shield and lock',
      },
    ],
  },

  journey: {
    eyebrow: 'Patient Journey',
    headline: 'Five steps. From arrival to consultation ready.',
    subhead: 'The complete intake sequence — in order, as it happens at the kiosk.',
    steps: [
      {
        n: 1,
        title: 'Identify',
        body: 'Patient presents ABHA card or QR code. Identity verified against the ABHA registry. No ABHA account? One is created at the kiosk before the session begins.',
      },
      {
        n: 2,
        title: 'Converse',
        body: 'The kiosk conducts a SOCRATES-structured interview in the patient\'s language. Red-flag rules run on every turn of the conversation, independent of the AI model.',
      },
      {
        n: 3,
        title: 'Scan',
        body: 'Patient scans paper documents — prescriptions, lab reports, prior discharge summaries. OCR extracts and structures every entity into the clinical record.',
      },
      {
        n: 4,
        title: 'Summarize & Route',
        body: 'MediKiosk compiles a structured summary and routes it to the physician\'s queue as a FHIR R4 bundle — ready before the patient enters the room.',
      },
      {
        n: 5,
        title: 'Consult',
        body: 'The physician reviews the history, edits if needed, and confirms. The consultation begins with a complete, structured record already in the system.',
      },
    ],
  },

  trust: {
    eyebrow: 'Standards & Trust',
    headline: 'Built for Indian national digital health infrastructure.',
    subhead:
      'For hospital administrators and procurement reviewers: every layer of MediKiosk is built against published national standards, not proprietary formats.',
    items: [
      {
        title: 'ABDM / ABHA',
        badge: 'National Health Authority',
        body: 'Patient identity, care-context linking, and data exchange per ABDM specifications. Milestones M1 (ABHA & Scan-and-Share), M2 (care-context linking), and M3 (consent-mediated FHIR exchange) implemented in sequence.',
      },
      {
        title: 'HL7 FHIR R4',
        badge: 'India Implementation Guide',
        body: 'All structured health data generated as FHIR R4 bundles with India-specific profiles per the ABDM Implementation Guide. Mapped from the clinical ontology at the architecture level — not retrofitted.',
      },
      {
        title: 'DPDP Act 2023',
        badge: 'Digital Personal Data Protection',
        body: 'Purpose-limited, consent-gated data handling. Consent is granular and revocable. Documented data retention and purge policy. No data shared beyond the consented purpose and duration.',
      },
      {
        title: 'HFR / HPR Registry',
        badge: 'Facility & Provider Registration',
        body: 'Facilities registered in the Health Facility Registry and physicians in the Healthcare Providers Registry before any FHIR bundles enter the network — a prerequisite for valid ABDM participation.',
      },
    ],
  },

  cta: {
    eyebrow: 'Pilot Partnership',
    headline: 'Interested in a pilot at your OPD counter?',
    body: `We are evaluating pilot partnerships with general and AYUSH outpatient departments. A pilot runs in shadow mode for the first phase: the AI-generated summary sits alongside the physician's own note without replacing it, so you can measure agreement rate before trusting it standalone.`,
    subBody: 'Daily debriefs with physicians and staff catch usability issues fast. Pilot metrics — consultation time saved, document digitization accuracy, patient completion rate — are tracked from day one.',
    cta: 'Request a pilot demo',
    ctaHref: 'mailto:pilot@medikiosk.in',
    secondary: 'Read the project documentation',
    secondaryHref: '#',
  },

  footer: {
    brand: 'MediKiosk',
    tagline: 'Clinical intake for Indian OPDs.',
    links: [
      { label: 'ABDM Sandbox', href: 'https://sandbox.abdm.gov.in' },
      { label: 'AI4Bharat (IIT Madras)', href: 'https://ai4bharat.iitm.ac.in' },
      { label: 'FHIR R4 Spec', href: 'https://hl7.org/fhir/R4' },
    ],
    legal: 'Built for non-commercial pilot evaluation. All statistics sourced from project documentation. Patient data handled per DPDP Act 2023.',
  },
}
