"""
MediKiosk NAMASTE & ICD-11-TM2 Registry Adapter.
Provides structured terminology mapping between National AYUSH Morbidity and Standardized
Terminologies Electronic (NAMASTE) codes and WHO ICD-11 Traditional Medicine Module 2 (TM2).

Architecture note:
This is implemented as a high-fidelity local seeded reference table with a clean adapter interface
(NAMASTEAdapter), following the same simulated-first, swappable-later adapter pattern used for ABDM.
No live external MoA portal API is fabricated.
"""

from typing import List, Optional, Dict, Any
import re
from medikiosk.ontology import NAMASTECode

# =======================================================================
# SEEDED LOCAL REFERENCE REGISTRY: NAMASTE ↔ ICD-11-TM2 CODE PAIRS (~45 PAIRS)
# Relevant to common OPD presentations across AYUSH healthcare systems.
# =======================================================================

SEED_NAMASTE_REGISTRY: List[Dict[str, Any]] = [
    # --- Musculoskeletal & Joint Disorders (Vata Vyadhi) ---
    {
        "namaste_code": "AYU-VV-001",
        "namaste_term": "Sandhigata Vata (सन्धिगत वात)",
        "icd11_tm2_code": "TM2-MSK-01",
        "ayush_system": "Ayurveda",
        "category": "Musculoskeletal",
        "allopathic_equivalent": "Osteoarthritis / Degenerative Joint Disease",
        "description": "Degenerative joint disease caused by aggravated Vata localized in joint capsules with pain, crepitus, and stiffness on movement."
    },
    {
        "namaste_code": "AYU-VV-002",
        "namaste_term": "Amavata (आमवात)",
        "icd11_tm2_code": "TM2-MSK-02",
        "ayush_system": "Ayurveda",
        "category": "Musculoskeletal",
        "allopathic_equivalent": "Rheumatoid Arthritis / Inflammatory Polyarthritis",
        "description": "Systemic inflammatory joint pathology arising from metabolic endotoxins (Ama) combined with aggravated Vata, characterized by severe morning stiffness, migratory pain, and swelling."
    },
    {
        "namaste_code": "AYU-VV-003",
        "namaste_term": "Gridhrasi (गृध्रसी)",
        "icd11_tm2_code": "TM2-MSK-03",
        "ayush_system": "Ayurveda",
        "category": "Musculoskeletal",
        "allopathic_equivalent": "Sciatica / Lumbosacral Radiculopathy",
        "description": "Radiating pain from lumbosacral region extending through gluteal area, posterior thigh, calf to the foot with stiffness and restricted leg extension."
    },
    {
        "namaste_code": "AYU-VV-004",
        "namaste_term": "Katishoola (कटिशूल)",
        "icd11_tm2_code": "TM2-MSK-04",
        "ayush_system": "Ayurveda",
        "category": "Musculoskeletal",
        "allopathic_equivalent": "Low Back Pain / Lumbar Spondylosis",
        "description": "Localized ache and muscular spasm in the lumbar/pelvic region aggravated by prolonged posture or exertion."
    },
    {
        "namaste_code": "AYU-VV-005",
        "namaste_term": "Manyastambha (मन्यास्तम्भ)",
        "icd11_tm2_code": "TM2-MSK-05",
        "ayush_system": "Ayurveda",
        "category": "Musculoskeletal",
        "allopathic_equivalent": "Cervical Spondylosis / Torticollis",
        "description": "Stiffness, rigidity, and painful restriction of cervical neck rotation due to vitiated Vata and Kapha in cervical musculature."
    },
    {
        "namaste_code": "AYU-VV-006",
        "namaste_term": "Vatarakta (वातरक्त)",
        "icd11_tm2_code": "TM2-MSK-06",
        "ayush_system": "Ayurveda",
        "category": "Musculoskeletal",
        "allopathic_equivalent": "Gouty Arthritis / Hyperuricemia",
        "description": "Vascular-metabolic articular disorder starting typically in the great toe with burning pain, redness, and hyperuricemic crystal inflammation."
    },

    # --- Respiratory & ENT Disorders (Pranavaha Srotas) ---
    {
        "namaste_code": "AYU-RS-001",
        "namaste_term": "Kasa (कास)",
        "icd11_tm2_code": "TM2-RESP-01",
        "ayush_system": "Ayurveda",
        "category": "Respiratory",
        "allopathic_equivalent": "Cough (Productive / Dry Bronchial Cough)",
        "description": "Expulsive respiratory reflex condition classified into Vataja (dry), Pittaja (burning), Kaphaja (productive), and Kshayaja types."
    },
    {
        "namaste_code": "AYU-RS-002",
        "namaste_term": "Tamaka Shwasa (तमक श्वास)",
        "icd11_tm2_code": "TM2-RESP-02",
        "ayush_system": "Ayurveda",
        "category": "Respiratory",
        "allopathic_equivalent": "Bronchial Asthma",
        "description": "Paroxysmal dyspnea and wheezing with bronchial spasm, nocturnal cough, and airway obstruction relieved in upright seated posture."
    },
    {
        "namaste_code": "AYU-RS-003",
        "namaste_term": "Pratishyaya (प्रतिश्याय)",
        "icd11_tm2_code": "TM2-RESP-03",
        "ayush_system": "Ayurveda",
        "category": "Respiratory",
        "allopathic_equivalent": "Allergic Rhinitis / Acute Coryza / Sinusitis",
        "description": "Nasal mucosa congestion, recurrent paroxysmal sneezing, watery rhinorrhea, and frontal heaviness."
    },
    {
        "namaste_code": "AYU-RS-004",
        "namaste_term": "Dushta Pratishyaya (दुष्ट प्रतिश्याय)",
        "icd11_tm2_code": "TM2-RESP-04",
        "ayush_system": "Ayurveda",
        "category": "Respiratory",
        "allopathic_equivalent": "Chronic Rhinosinusitis",
        "description": "Chronic foul-smelling nasal discharge, anosmia, and persistent sinus fullness."
    },
    {
        "namaste_code": "AYU-RS-005",
        "namaste_term": "Kanthashoola / Galaganda (कण्ठशूल)",
        "icd11_tm2_code": "TM2-RESP-05",
        "ayush_system": "Ayurveda",
        "category": "Respiratory",
        "allopathic_equivalent": "Pharyngitis / Laryngitis / Tonsillitis",
        "description": "Throat inflammation, dysphagia, hoarseness of voice, and localized cervical lymph node tenderness."
    },

    # --- Gastrointestinal & Metabolic (Annavaha / Purishavaha Srotas) ---
    {
        "namaste_code": "AYU-GI-001",
        "namaste_term": "Amlapitta (अम्लपित्त)",
        "icd11_tm2_code": "TM2-GIT-01",
        "ayush_system": "Ayurveda",
        "category": "Gastrointestinal",
        "allopathic_equivalent": "Gastroesophageal Reflux Disease (GERD) / Non-Ulcer Dyspepsia",
        "description": "Hyperacidity syndrome with sour eructations, retrosternal burning (Hritkanta Daha), nausea, and epigastric discomfort."
    },
    {
        "namaste_code": "AYU-GI-002",
        "namaste_term": "Grahani Dosha (ग्रहणी दोष)",
        "icd11_tm2_code": "TM2-GIT-02",
        "ayush_system": "Ayurveda",
        "category": "Gastrointestinal",
        "allopathic_equivalent": "Irritable Bowel Syndrome (IBS) / Malabsorption Syndrome",
        "description": "Impaired intestinal absorptive capacity characterized by alternating loose and constipated stools, post-prandial urgency, and borborygmi."
    },
    {
        "namaste_code": "AYU-GI-003",
        "namaste_term": "Ajirna (अजीर्ण)",
        "icd11_tm2_code": "TM2-GIT-03",
        "ayush_system": "Ayurveda",
        "category": "Gastrointestinal",
        "allopathic_equivalent": "Functional Dyspepsia / Indigestion",
        "description": "Incomplete digestive assimilation causing abdominal distension, fullness, belching, and loss of appetite."
    },
    {
        "namaste_code": "AYU-GI-004",
        "namaste_term": "Atisara (अतिसार)",
        "icd11_tm2_code": "TM2-GIT-04",
        "ayush_system": "Ayurveda",
        "category": "Gastrointestinal",
        "allopathic_equivalent": "Acute Diarrhea / Gastroenteritis",
        "description": "Frequent watery, loose fecal evacuations with abdominal colic and dehydration."
    },
    {
        "namaste_code": "AYU-GI-005",
        "namaste_term": "Vibandha (विबन्ध)",
        "icd11_tm2_code": "TM2-GIT-05",
        "ayush_system": "Ayurveda",
        "category": "Gastrointestinal",
        "allopathic_equivalent": "Chronic Constipation",
        "description": "Hard, dry stools with straining, incomplete evacuation, and flatulence caused by Apana Vata drying."
    },
    {
        "namaste_code": "AYU-GI-006",
        "namaste_term": "Arsha (अर्श)",
        "icd11_tm2_code": "TM2-GIT-06",
        "ayush_system": "Ayurveda",
        "category": "Gastrointestinal",
        "allopathic_equivalent": "Hemorrhoids / Piles",
        "description": "Ano-rectal vascular cushions/masses presenting with painless bleeding, prolapse, or painful thrombosed swellings."
    },
    {
        "namaste_code": "AYU-GI-007",
        "namaste_term": "Kamala (कामला)",
        "icd11_tm2_code": "TM2-GIT-07",
        "ayush_system": "Ayurveda",
        "category": "Gastrointestinal",
        "allopathic_equivalent": "Jaundice / Hepatic Dysfunction",
        "description": "Yellowish discoloration of sclera, skin, and urine with profound fatigue, anorexia, and hepatic Pitta vitiation."
    },
    {
        "namaste_code": "AYU-GI-008",
        "namaste_term": "Parinamashoola (परिणामशूल)",
        "icd11_tm2_code": "TM2-GIT-08",
        "ayush_system": "Ayurveda",
        "category": "Gastrointestinal",
        "allopathic_equivalent": "Peptic / Duodenal Ulcer Pain",
        "description": "Abdominal spasmodic pain during digestion of food, typically 2-3 hours after meal intake."
    },

    # --- Metabolic & Endocrine Disorders (Medovaha Srotas) ---
    {
        "namaste_code": "AYU-MB-001",
        "namaste_term": "Prameha / Madhumeha (प्रमेह / मधुमेह)",
        "icd11_tm2_code": "TM2-MET-01",
        "ayush_system": "Ayurveda",
        "category": "Metabolic",
        "allopathic_equivalent": "Type 2 Diabetes Mellitus",
        "description": "Metabolic disorder marked by polyuria (Prabhuta Avila Mutrata), polydipsia, sweet-tasting urine, numbness in extremities, and tissue laxity."
    },
    {
        "namaste_code": "AYU-MB-002",
        "namaste_term": "Sthaulya / Medoroga (स्थौल्य / मेदोरोग)",
        "icd11_tm2_code": "TM2-MET-02",
        "ayush_system": "Ayurveda",
        "category": "Metabolic",
        "allopathic_equivalent": "Obesity / Dyslipidemia / Metabolic Syndrome",
        "description": "Excessive accumulation of abnormal Medas (adipose tissue) with exertional breathlessness, excessive sweating, and lethargy."
    },
    {
        "namaste_code": "AYU-MB-003",
        "namaste_term": "Galaganda (गलगण्ड)",
        "icd11_tm2_code": "TM2-MET-03",
        "ayush_system": "Ayurveda",
        "category": "Metabolic",
        "allopathic_equivalent": "Hypothyroidism / Goitre",
        "description": "Cervical thyroid glandular swelling with generalized lethargy, cold intolerance, and weight gain."
    },

    # --- Neurological & Psychological (Manovaha Srotas) ---
    {
        "namaste_code": "AYU-NP-001",
        "namaste_term": "Shirashoola / Ardhavabhedaka (शिरःशूल / अर्धावभेदक)",
        "icd11_tm2_code": "TM2-NEU-01",
        "ayush_system": "Ayurveda",
        "category": "Neurological",
        "allopathic_equivalent": "Migraine / Tension-Type Headache / Hemrania",
        "description": "Unilateral paroxysmal throbbing cephalalgia aggravated by sunlight, bright stimuli, or stress with visual auras."
    },
    {
        "namaste_code": "AYU-NP-002",
        "namaste_term": "Anidra (अनिद्रा)",
        "icd11_tm2_code": "TM2-NEU-02",
        "ayush_system": "Ayurveda",
        "category": "Neurological",
        "allopathic_equivalent": "Primary Insomnia / Sleep Maintenance Disorder",
        "description": "Inability to initiate or maintain restful sleep, accompanied by daytime fatigue, yawning, and cognitive heaviness."
    },
    {
        "namaste_code": "AYU-NP-003",
        "namaste_term": "Chittodwega (चित्तोद्वेग)",
        "icd11_tm2_code": "TM2-NEU-03",
        "ayush_system": "Ayurveda",
        "category": "Neurological",
        "allopathic_equivalent": "Generalized Anxiety Disorder / Panic Attack",
        "description": "Excessive psychic agitation, autonomic palpitations, apprehension, and inability to concentrate."
    },
    {
        "namaste_code": "AYU-NP-004",
        "namaste_term": "Vishada / Mano-Avasada (विषाद / मनोऽवसाद)",
        "icd11_tm2_code": "TM2-NEU-04",
        "ayush_system": "Ayurveda",
        "category": "Neurological",
        "allopathic_equivalent": "Major Depressive Episode / Dysthymia",
        "description": "Persistent sorrow, anhedonia, psycho-motor retardation, and feeling of worthlessness."
    },
    {
        "namaste_code": "AYU-NP-005",
        "namaste_term": "Pakshaghata (पक्षाघात)",
        "icd11_tm2_code": "TM2-NEU-05",
        "ayush_system": "Ayurveda",
        "category": "Neurological",
        "allopathic_equivalent": "Cerebrovascular Accident (Stroke) / Hemiplegia",
        "description": "Acute loss of motor function and sensation in half the body with facial deviation and speech slurring."
    },
    {
        "namaste_code": "AYU-NP-006",
        "namaste_term": "Ardita (अर्द्दित)",
        "icd11_tm2_code": "TM2-NEU-06",
        "ayush_system": "Ayurveda",
        "category": "Neurological",
        "allopathic_equivalent": "Bell's Palsy / Facial Nerve Paralysis",
        "description": "Unilateral facial paresis with loss of forehead wrinkling, inability to close eyelid, and angle of mouth deviation."
    },

    # --- Dermatological Disorders (Twak Vikara / Kushtha) ---
    {
        "namaste_code": "AYU-DERM-001",
        "namaste_term": "Eka Kushtha (एककुष्ठ)",
        "icd11_tm2_code": "TM2-DERM-01",
        "ayush_system": "Ayurveda",
        "category": "Dermatology",
        "allopathic_equivalent": "Psoriasis Vulgaris",
        "description": "Erythematous plaques with silvery mica-like scales, candle-grease sign, and non-sweating dry skin patches."
    },
    {
        "namaste_code": "AYU-DERM-002",
        "namaste_term": "Vicharchika (विचर्चिका)",
        "icd11_tm2_code": "TM2-DERM-02",
        "ayush_system": "Ayurveda",
        "category": "Dermatology",
        "allopathic_equivalent": "Eczema / Atopic Dermatitis",
        "description": "Pruritic eruptions with severe itching, blackish-red pigmentation, oozing (Srava), and lichenification."
    },
    {
        "namaste_code": "AYU-DERM-003",
        "namaste_term": "Sheetapitta / Udarda (शीतपित्त / उदर्द)",
        "icd11_tm2_code": "TM2-DERM-03",
        "ayush_system": "Ayurveda",
        "category": "Dermatology",
        "allopathic_equivalent": "Urticaria / Allergic Hives / Angioedema",
        "description": "Transient itchy wheals and circular erythema precipitated by cold wind exposure or histamine release."
    },
    {
        "namaste_code": "AYU-DERM-004",
        "namaste_term": "Shvitra (श्वित्र)",
        "icd11_tm2_code": "TM2-DERM-04",
        "ayush_system": "Ayurveda",
        "category": "Dermatology",
        "allopathic_equivalent": "Vitiligo / Leukoderma",
        "description": "Non-scaly depigmented chalky-white macules due to Bhrajaka Pitta and Rakta Dhatu vitiation."
    },
    {
        "namaste_code": "AYU-DERM-005",
        "namaste_term": "Mukhadushika / Tarunya Pitika (मुखदूषिका)",
        "icd11_tm2_code": "TM2-DERM-05",
        "ayush_system": "Ayurveda",
        "category": "Dermatology",
        "allopathic_equivalent": "Acne Vulgaris",
        "description": "Papulopustular facial comedones and cysts on face occurring during adolescence with localized sebum clogging."
    },

    # --- Cardiovascular & Systemic (Hridaya & Rasavaha Srotas) ---
    {
        "namaste_code": "AYU-CV-001",
        "namaste_term": "Hridroga (हृद्रोग)",
        "icd11_tm2_code": "TM2-CVD-01",
        "ayush_system": "Ayurveda",
        "category": "Cardiovascular",
        "allopathic_equivalent": "Ischemic Heart Disease / Angina Pectoris",
        "description": "Precordial heaviness, crushing sensation in chest, palpitation, and radiating distress."
    },
    {
        "namaste_code": "AYU-CV-002",
        "namaste_term": "Uchha Raktachapa (उच्च रक्तचाप)",
        "icd11_tm2_code": "TM2-CVD-02",
        "ayush_system": "Ayurveda",
        "category": "Cardiovascular",
        "allopathic_equivalent": "Essential Hypertension",
        "description": "Sustained elevation of arterial blood pressure associated with Vyana Vata and Rakta Dhatu turbulence."
    },
    {
        "namaste_code": "AYU-CV-003",
        "namaste_term": "Pandu Roga (पाण्डुरोग)",
        "icd11_tm2_code": "TM2-HEM-01",
        "ayush_system": "Ayurveda",
        "category": "Hematology",
        "allopathic_equivalent": "Nutritional Anemia / Iron Deficiency",
        "description": "Pallor of skin, conjunctiva, and nails, exertional palpitations, fatigue, and tissue loss of luster."
    },

    # --- General & Fevers (Jwara) ---
    {
        "namaste_code": "AYU-GEN-001",
        "namaste_term": "Vata-Kaphaja Jwara (वात-कफज ज्वर)",
        "icd11_tm2_code": "TM2-INF-01",
        "ayush_system": "Ayurveda",
        "category": "General",
        "allopathic_equivalent": "Viral Fever with Upper Respiratory Infection",
        "description": "Pyrexia associated with shivering, generalized body ache, nasal congestion, and heaviness."
    },
    {
        "namaste_code": "AYU-GEN-002",
        "namaste_term": "Pittaja Jwara (पित्तज ज्वर)",
        "icd11_tm2_code": "TM2-INF-02",
        "ayush_system": "Ayurveda",
        "category": "General",
        "allopathic_equivalent": "High-Grade Inflammatory / Typhoidal Fever",
        "description": "High temperature spikes with severe burning sensation, delirium, thirst, and yellowish urine."
    },
    {
        "namaste_code": "AYU-GEN-003",
        "namaste_term": "Jeerna Jwara (जीर्ण ज्वर)",
        "icd11_tm2_code": "TM2-INF-03",
        "ayush_system": "Ayurveda",
        "category": "General",
        "allopathic_equivalent": "Chronic Low-Grade Fever / Post-Viral Asthenia",
        "description": "Low-grade evening fever persisting beyond 3 weeks with weight loss and profound weakness."
    },

    # --- Urological & Reproductive ---
    {
        "namaste_code": "AYU-URO-001",
        "namaste_term": "Mutrakrichhra (मूत्रकृच्छ्र)",
        "icd11_tm2_code": "TM2-URO-01",
        "ayush_system": "Ayurveda",
        "category": "Urology",
        "allopathic_equivalent": "Dysuria / Urinary Tract Infection",
        "description": "Painful, burning micturition with urinary frequency and urethral irritation."
    },
    {
        "namaste_code": "AYU-URO-002",
        "namaste_term": "Ashmari (अश्मरी)",
        "icd11_tm2_code": "TM2-URO-02",
        "ayush_system": "Ayurveda",
        "category": "Urology",
        "allopathic_equivalent": "Nephrolithiasis / Renal Calculi",
        "description": "Colicky flank pain radiating to the groin with hematuria and obstruction to urinary stream."
    },
    {
        "namaste_code": "AYU-GYN-001",
        "namaste_term": "Kashtartava (कष्टार्तव)",
        "icd11_tm2_code": "TM2-GYN-01",
        "ayush_system": "Ayurveda",
        "category": "Gynecology",
        "allopathic_equivalent": "Dysmenorrhea",
        "description": "Severe spasmodic lower abdominal and pelvic cramps occurring during menstruation."
    },
    {
        "namaste_code": "AYU-GYN-002",
        "namaste_term": "Shwetapradara (श्वेतप्रदर)",
        "icd11_tm2_code": "TM2-GYN-02",
        "ayush_system": "Ayurveda",
        "category": "Gynecology",
        "allopathic_equivalent": "Leukorrhea / Vaginal Discharge Syndrome",
        "description": "Non-purulent white mucoid discharge with backache and generalized weakness."
    }
]

# =======================================================================
# NAMASTE ADAPTER INTERFACE & LOCAL ENGINE
# =======================================================================

class NAMASTEAdapterInterface:
    def search_codes(self, query: str, category: Optional[str] = None, limit: int = 20) -> List[NAMASTECode]:
        raise NotImplementedError

    def get_by_code(self, code: str) -> Optional[NAMASTECode]:
        raise NotImplementedError

    def get_by_icd11_tm2(self, icd_code: str) -> Optional[NAMASTECode]:
        raise NotImplementedError


class NAMASTELocalAdapter(NAMASTEAdapterInterface):
    """
    Local seeded reference adapter for NAMASTE ↔ ICD-11-TM2 codings.
    Provides fast, deterministic in-memory searches and cross-system mappings.
    """

    def __init__(self, registry: Optional[List[Dict[str, Any]]] = None):
        self._raw_registry = registry or SEED_NAMASTE_REGISTRY
        self._code_index: Dict[str, Dict[str, Any]] = {}
        self._icd_index: Dict[str, Dict[str, Any]] = {}
        self._build_indexes()

    def _build_indexes(self):
        for item in self._raw_registry:
            self._code_index[item["namaste_code"].upper()] = item
            if item.get("icd11_tm2_code"):
                self._icd_index[item["icd11_tm2_code"].upper()] = item

    def _to_dataclass(self, d: Dict[str, Any]) -> NAMASTECode:
        return NAMASTECode(
            namaste_code=d["namaste_code"],
            namaste_term=d["namaste_term"],
            icd11_tm2_code=d.get("icd11_tm2_code"),
            ayush_system=d.get("ayush_system", "Ayurveda"),
            category=d.get("category", "General"),
            description=d.get("description", d.get("allopathic_equivalent", ""))
        )

    def search_codes(self, query: str, category: Optional[str] = None, limit: int = 20) -> List[NAMASTECode]:
        """
        Searches NAMASTE terms, allopathic equivalents, ICD codes, and categories.
        """
        if not query and not category:
            return [self._to_dataclass(d) for d in self._raw_registry[:limit]]

        q_clean = (query or "").lower().strip()
        matches = []

        for item in self._raw_registry:
            # Filter category if specified
            if category and item.get("category", "").lower() != category.lower():
                continue

            if not q_clean:
                matches.append(self._to_dataclass(item))
                continue

            score = 0
            if q_clean in item["namaste_term"].lower():
                score += 10
            if q_clean in item.get("allopathic_equivalent", "").lower():
                score += 8
            if q_clean in item["namaste_code"].lower():
                score += 9
            if item.get("icd11_tm2_code") and q_clean in item["icd11_tm2_code"].lower():
                score += 9
            if q_clean in item.get("description", "").lower():
                score += 4
            if q_clean in item.get("category", "").lower():
                score += 3

            if score > 0:
                matches.append((score, self._to_dataclass(item)))

        # Sort by match score descending
        matches.sort(key=lambda x: x[0], reverse=True)
        return [m[1] for m in matches[:limit]]

    def get_by_code(self, code: str) -> Optional[NAMASTECode]:
        item = self._code_index.get((code or "").upper().strip())
        return self._to_dataclass(item) if item else None

    def get_by_icd11_tm2(self, icd_code: str) -> Optional[NAMASTECode]:
        item = self._icd_index.get((icd_code or "").upper().strip())
        return self._to_dataclass(item) if item else None

    def get_all_categories(self) -> List[str]:
        cats = sorted(list({item.get("category", "General") for item in self._raw_registry}))
        return cats

# Singleton instance accessor
NAMASTEAdapter = NAMASTELocalAdapter
_global_adapter = NAMASTELocalAdapter()

def get_namaste_client() -> NAMASTEAdapterInterface:
    return _global_adapter
