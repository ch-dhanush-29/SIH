"""
MediKiosk Prakriti & Vikriti Assessment Questionnaire & Scored Dosha Engine.
Provides standardized Ayurvedic constitutional and morbidity evaluation based on
classical Brihat Trayi (Charaka, Sushruta, Ashtanga Hridaya) parameters.
"""

from typing import Dict, Any, List, Tuple, Optional

# =======================================================================
# 1. SCORED PRAKRITI QUESTIONNAIRE (PAIRED DOSHA TRAIT QUESTIONS)
# =======================================================================

PRAKRITI_QUESTIONNAIRE = [
    {
        "id": "frame_skin",
        "domain": "Physical Frame, Skin & Joints (शरीर एवं त्वचा)",
        "question_en": "How would you describe your natural body frame, joints, and skin texture?",
        "question_hi": "आपकी स्वाभाविक शारीरिक बनावट, जोड़ और त्वचा कैसी है?",
        "options": [
            {
                "dosha": "Vata",
                "label_en": "Slender/thin build, prominent bones/joints, dry or rough skin, prominent veins",
                "label_hi": "दुबला-पतला शरीर, उभरी हुई नसें/जोड़, रूखी या खुरदरी त्वचा",
                "score_weight": 1.0
            },
            {
                "dosha": "Pitta",
                "label_en": "Medium proportionate build, soft/warm skin, prone to moles/freckles or redness",
                "label_hi": "मध्यम सुगठित शरीर, कोमल व गर्म त्वचा, तिल/मुंहासे या लालिमा की प्रवृत्ति",
                "score_weight": 1.0
            },
            {
                "dosha": "Kapha",
                "label_en": "Broad/heavy sturdy build, well-lubricated thick/smooth glowing skin, strong joints",
                "label_hi": "मजबूत चौड़ा भारी शरीर, चिकनी व चमकदार त्वचा, सुदृढ़ छिपे हुए जोड़",
                "score_weight": 1.0
            }
        ]
    },
    {
        "id": "appetite_digestion",
        "domain": "Appetite, Digestion & Metabolism (अग्नि एवं कोष्ठ)",
        "question_en": "How is your typical appetite, thirst, and digestion routine (Agni)?",
        "question_hi": "आपकी स्वाभाविक भूख, प्यास और पाचन क्षमता (अग्नि) कैसी रहती है?",
        "options": [
            {
                "dosha": "Vata",
                "label_en": "Variable/irregular (Vishamagni) - sometimes hungry, sometimes skips without appetite; prone to gas/constipation",
                "label_hi": "अनियमित भूख (विषमाग्नि) - कभी बहुत भूख, कभी बिल्कुल नहीं; पेट में गैस/कब्ज की प्रवृत्ति",
                "score_weight": 1.0
            },
            {
                "dosha": "Pitta",
                "label_en": "Intense/sharp (Tikshnagni) - cannot tolerate skipped meals, frequent hunger, high thirst, loose stools",
                "label_hi": "तीव्र भूख (तीक्ष्णाग्नि) - भोजन छोड़ने पर जलन/चिड़चिड़ापन, अधिक प्यास, नर्म मल",
                "score_weight": 1.0
            },
            {
                "dosha": "Kapha",
                "label_en": "Slow/steady (Mandagni) - can easily miss meals without discomfort, slow digestion, heavy fullness after food",
                "label_hi": "मन्द भूख (मन्दाग्नि) - भोजन न मिलने पर भी परेशानी नहीं, धीमा पाचन, खाने के बाद भारीपन",
                "score_weight": 1.0
            }
        ]
    },
    {
        "id": "weather_tolerance",
        "domain": "Temperature & Weather Tolerance (शीत-उष्ण सहिष्णुता)",
        "question_en": "Which climatic condition causes you the greatest discomfort?",
        "question_hi": "किस मौसम अथवा तापमान में आपको सबसे अधिक असहजता महसूस होती है?",
        "options": [
            {
                "dosha": "Vata",
                "label_en": "Intolerant to cold, dry wind, and air conditioning; prefers warm, cozy environments",
                "label_hi": "ठंड, सूखी हवा व AC से परेशानी; गर्म व आरामदायक वातावरण पसंद",
                "score_weight": 1.0
            },
            {
                "dosha": "Pitta",
                "label_en": "Intolerant to hot summer sun and humid heat; profuse sweating; seeks cool environments",
                "label_hi": "गर्मी, धूप व गर्म पेय से परेशानी; अत्यधिक पसीना आना; शीतल वातावरण पसंद",
                "score_weight": 1.0
            },
            {
                "dosha": "Kapha",
                "label_en": "Intolerant to cold, damp, cloudy rain; comfortable in warm and dry weather",
                "label_hi": "सर्द व नम/बरसाती मौसम से कफ-सुस्ती बढ़ना; गर्म व सूखे मौसम में सहज",
                "score_weight": 1.0
            }
        ]
    },
    {
        "id": "sleep_dreams",
        "domain": "Sleep Quality & Dreams (निद्रा एवं स्वप्न)",
        "question_en": "What is the nature of your usual sleep and dreaming pattern (Nidra)?",
        "question_hi": "आपकी निद्रा (नींद) और स्वप्न देखने का स्वाभाविक स्वरूप कैसा है?",
        "options": [
            {
                "dosha": "Vata",
                "label_en": "Light, interrupted sleep, easily awakened, dreams of flying, running, or fear",
                "label_hi": "हल्की टूटने वाली नींद, छोटी आवाज से जागना, उड़ने/भागने या भय के स्वप्न",
                "score_weight": 1.0
            },
            {
                "dosha": "Pitta",
                "label_en": "Moderate, sound sleep (6-7 hrs), dreams of fire, sunlight, competition, or bright objects",
                "label_hi": "मध्यम गाढ़ी नींद (6-7 घंटे), अग्नि, धूप, चमकती वस्तुओं या प्रतियोगिता के स्वप्न",
                "score_weight": 1.0
            },
            {
                "dosha": "Kapha",
                "label_en": "Deep, heavy prolonged sleep, hard to wake up early morning, dreams of water, clouds, or lakes",
                "label_hi": "गहरी भारी लंबी नींद (8+ घंटे), सुबह उठने में आलस्य, नदी/झील/जल के स्वप्न",
                "score_weight": 1.0
            }
        ]
    },
    {
        "id": "mental_temperament",
        "domain": "Mental Temperament & Stress Response (मनोभाव एवं स्वभाव)",
        "question_en": "How do your mind, memory, and emotional stress responses typically operate?",
        "question_hi": "तनाव या सामान्य परिस्थिति में आपकी मानसिक प्रतिक्रिया और याददाश्त कैसी है?",
        "options": [
            {
                "dosha": "Vata",
                "label_en": "Quick to learn and quick to forget; anxious or worried under pressure; creative and restless",
                "label_hi": "शीघ्र सीखना व शीघ्र भूलना; तनाव में चिंता/घबराहट; अत्यधिक विचारशील व चंचल",
                "score_weight": 1.0
            },
            {
                "dosha": "Pitta",
                "label_en": "Sharp intellect, good focus, quick to anger or become irritated when plans fail; ambitious",
                "label_hi": "तीव्र बुद्धि व एकाग्रता; बात बिगड़ने पर तुरंत क्रोध/चिड़चिड़ापन; दृढ़ संकल्पी",
                "score_weight": 1.0
            },
            {
                "dosha": "Kapha",
                "label_en": "Calm, slow to learn but unforgettable memory; patient, forgiving, resistant to stress",
                "label_hi": "शांत व धैर्यवान, सीखने में समय पर स्थायी याददाश्त; क्षमाशील, तनावमुक्त स्वभाव",
                "score_weight": 1.0
            }
        ]
    },
    {
        "id": "activity_speech",
        "domain": "Physical Activity & Speech Cadence (शारीरिक गति एवं वाणी)",
        "question_en": "What is your habitual pace of walking, speech, and physical stamina?",
        "question_hi": "आपके चलने की गति, बातचीत करने की शैली और शारीरिक सहनशक्ति कैसी है?",
        "options": [
            {
                "dosha": "Vata",
                "label_en": "Fast brisk walking, rapid and talkative speech, quickly exhausted with bursts of energy",
                "label_hi": "तेज चाल, जल्दी-जल्दी बोलना, ऊर्जा में उतार-चढ़ाव व शीघ्र थकान",
                "score_weight": 1.0
            },
            {
                "dosha": "Pitta",
                "label_en": "Purposeful moderate walk, sharp, persuasive, articulate speech, moderate stamina",
                "label_hi": "सुव्यवस्थित गति, स्पष्ट व प्रभावशाली वाणी, मध्यम सहनशक्ति",
                "score_weight": 1.0
            },
            {
                "dosha": "Kapha",
                "label_en": "Slow steady graceful walk, deep melodious voice, sustained and great endurance",
                "label_hi": "धीमी स्थिर चाल, गंभीर व मधुर वाणी, दीर्घकालिक उच्च सहनशक्ति",
                "score_weight": 1.0
            }
        ]
    }
]

# =======================================================================
# 2. DOSHA SCORING & PRAKRITI EVALUATION ENGINE
# =======================================================================

def calculate_prakriti_scores(answers: Dict[str, str]) -> Dict[str, Any]:
    """
    Calculates quantitative dosha balance scores (Vata, Pitta, Kapha percentages)
    from completed questionnaire responses.
    """
    scores = {"Vata": 0.0, "Pitta": 0.0, "Kapha": 0.0}
    total_answered = 0

    for q in PRAKRITI_QUESTIONNAIRE:
        q_id = q["id"]
        selected = answers.get(q_id)
        if selected:
            for opt in q["options"]:
                if opt["dosha"].lower() == selected.lower() or opt["label_en"].startswith(selected) or selected in opt["label_en"]:
                    scores[opt["dosha"]] += opt["score_weight"]
                    total_answered += 1
                    break

    # Fallback to balanced default if empty
    if total_answered == 0:
        return {
            "vata_score": 33.3,
            "pitta_score": 33.3,
            "kapha_score": 33.4,
            "dominant_prakriti": "Tridoshaja (त्रिदोषज)",
            "constitution_type": "Tridoshic Balanced",
            "answers_recorded": 0
        }

    total_pts = sum(scores.values())
    vata_pct = round((scores["Vata"] / total_pts) * 100, 1)
    pitta_pct = round((scores["Pitta"] / total_pts) * 100, 1)
    kapha_pct = round((scores["Kapha"] / total_pts) * 100, 1)

    # Determine dominant dosha configuration
    sorted_doshas = sorted([("Vata", vata_pct), ("Pitta", pitta_pct), ("Kapha", kapha_pct)], key=lambda x: x[1], reverse=True)
    first_d, first_pct = sorted_doshas[0]
    second_d, second_pct = sorted_doshas[1]

    if first_pct >= 55.0:
        dominant_label = f"{first_d}ja ({first_d} Predominant)"
        const_type = f"Eka-Doshaja ({first_d})"
    elif first_pct - second_pct <= 12.0 and second_pct >= 28.0:
        dominant_label = f"{first_d}-{second_d} (द्वन्द्वज)"
        const_type = f"Dvandvaja ({first_d}-{second_d})"
    else:
        dominant_label = f"{first_d}-{second_d} Dual"
        const_type = f"Dvandvaja ({first_d}-{second_d})"

    if abs(vata_pct - 33.3) < 6.0 and abs(pitta_pct - 33.3) < 6.0 and abs(kapha_pct - 33.3) < 6.0:
        dominant_label = "Tridoshaja (Samadosha / त्रिदोषज)"
        const_type = "Tridoshic Balanced"

    return {
        "vata_score": vata_pct,
        "pitta_score": pitta_pct,
        "kapha_score": kapha_pct,
        "dominant_prakriti": dominant_label,
        "constitution_type": const_type,
        "raw_points": scores,
        "answers_recorded": total_answered
    }


def evaluate_vikriti_imbalance(
    prakriti_scores: Dict[str, float],
    presenting_symptoms: List[str],
    vikriti_selection: Optional[str] = None
) -> Dict[str, Any]:
    """
    Evaluates current active Vikriti (morbidity imbalance) and compares
    against baseline Prakriti to highlight doshic deviation.
    """
    v_bias = 0.0
    p_bias = 0.0
    k_bias = 0.0

    symptoms_text = " ".join(presenting_symptoms).lower()
    
    # Vata triggers
    if any(k in symptoms_text for k in ["pain", "ache", "stiff", "dry", "gas", "insomnia", "anxiety", "tingling", "shivering", "joint", "sciatica"]):
        v_bias += 2.0
    # Pitta triggers
    if any(k in symptoms_text for k in ["burning", "fever", "acid", "heat", "inflammation", "ulcer", "redness", "jaundice", "rash", "sweat"]):
        p_bias += 2.0
    # Kapha triggers
    if any(k in symptoms_text for k in ["cough", "phlegm", "heaviness", "mucus", "edema", "congestion", "obesity", "lethargy", "swelling"]):
        k_bias += 2.0

    if vikriti_selection:
        v_sel = vikriti_selection.lower()
        if "vata" in v_sel:
            v_bias += 3.0
        if "pitta" in v_sel:
            p_bias += 3.0
        if "kapha" in v_sel:
            k_bias += 3.0

    total = max(1.0, v_bias + p_bias + k_bias)
    cur_v = round((v_bias / total) * 100, 1)
    cur_p = round((p_bias / total) * 100, 1)
    cur_k = round((k_bias / total) * 100, 1)

    base_v = prakriti_scores.get("vata_score", 33.3)
    base_p = prakriti_scores.get("pitta_score", 33.3)
    base_k = prakriti_scores.get("kapha_score", 33.3)

    return {
        "vikriti_vata": cur_v,
        "vikriti_pitta": cur_p,
        "vikriti_kapha": cur_k,
        "prakriti_vata": base_v,
        "prakriti_pitta": base_p,
        "prakriti_kapha": base_k,
        "vata_deviation": round(cur_v - base_v, 1),
        "pitta_deviation": round(cur_p - base_p, 1),
        "kapha_deviation": round(cur_k - base_k, 1),
        "primary_vitiated_dosha": "Vata" if cur_v >= max(cur_p, cur_k) else ("Pitta" if cur_p >= cur_k else "Kapha")
    }
