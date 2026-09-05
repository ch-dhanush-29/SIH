import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, X, Send, Bot, User, Sparkles, Volume2, Mic,
  Maximize2, Minimize2, Trash2, ArrowRight, ShieldCheck, CheckCircle2,
  Stethoscope, Activity, Radio, AlertTriangle, RefreshCw
} from 'lucide-react'

export default function MediKioskChatbot({ theme = 'dark', activeView = 'overview' }) {
  const isLight = theme === 'light'
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeLanguage, setActiveLanguage] = useState('en')
  
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Namaste! 🙏 I am the **MediKiosk Real-Time Clinical Assistant** powered by Google Gemini.\n\nHow can I help you today? You can ask me about:\n- 🏥 **OPD Intake & Token Process**\n- 🫀 **Symptom Triage & Red-Flag Warnings**\n- 📄 **4K Prescription Scanning & Lab Ranges**\n- 🌿 **AYUSH & Prakriti-Vikriti Dosha Balance**\n- 🆔 **ABHA Health ID & DPDP Privacy**',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ])

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen, messages])

  const QUICK_PROMPTS_BY_LANG = {
    en: [
      { label: 'OPD Token Process', query: 'How does MediKiosk generate an OPD token for a patient?' },
      { label: 'Red-Flag Emergencies', query: 'Explain the 5 critical red-flag emergency symptoms in MediKiosk triage.' },
      { label: 'Ayurveda Prakriti vs Vikriti', query: 'How does MediKiosk calculate Prakriti and Vikriti in AYUSH intake?' },
      { label: 'Prescription OCR & Doses', query: 'How does MediKiosk verify extracted prescriptions and dosage sanity?' }
    ],
    hi: [
      { label: 'ओपीडी टोकन प्रक्रिया', query: 'मेडीकियोस्क मरीज के लिए ओपीडी टोकन कैसे बनाता है?' },
      { label: 'इमरजेंसी रेड-फ्लैग लक्षण', query: 'मेडीकियोस्क में 5 गंभीर इमरजेंसी रेड-फ्लैग लक्षण कौन से हैं?' },
      { label: 'आयुर्वेद प्रकृति और विकृति', query: 'आयुष इनटेक में प्रकृति और विकृति की गणना कैसे होती है?' },
      { label: 'पर्चे की स्कैनिंग और दवाइयां', query: 'डॉक्टर का पर्चा स्कैन करने पर दवाइयों की जांच कैसे होती है?' }
    ],
    te: [
      { label: 'OPD టోకెన్ విధానం', query: 'మెడికియోస్క్ రోగికి OPD టోకెన్‌ను ఎలా జారీ చేస్తుంది?' },
      { label: 'అత్యవసర రెడ్-ఫ్లాగ్ లక్షణాలు', query: 'మెడికియోస్క్ ట్రయాజ్‌లో 5 అత్యవసర రెడ్-ఫ్లాగ్ లక్షణాలను వివరించండి.' },
      { label: 'ఆయుర్వేద ప్రకృతి & వికృతి', query: 'ఆయుష్ విభాగంలో ప్రకృతి మరియు వికృతిని ఎలా లెక్కిస్తారు?' },
      { label: 'ప్రిస్క్రిప్షన్ స్కానింగ్ & డోసేజ్', query: 'ప్రిస్క్రిప్షన్ OCR మందుల డోసేజ్ సురక్షితతను ఎలా తనిఖీ చేస్తుంది?' }
    ],
    ta: [
      { label: 'OPD டோக்கன் முறை', query: 'மெடிகியோஸ்க் எவ்வாறு OPD டோக்கனை உருவாக்குகிறது?' },
      { label: 'அவசர சிகிச்சை எச்சரிக்கை', query: 'மெடிகியோஸ்கில் உள்ள 5 அவசர ரெட்-ஃபிளாக் அறிகுறிகளை விளக்குங்கள்.' },
      { label: 'ஆயுர்வேத பிரகிருதி மற்றும் விகிருதி', query: 'ஆயுஷ் பிரிவில் பிரகிருதி மற்றும் விகிருதி எவ்வாறு கணக்கிடப்படுகிறது?' },
      { label: 'மருந்து சீட்டு ஸ்கேனிங்', query: 'மருந்து சீட்டு ஸ்கேனிங்கில் மருந்துகளின் அளவு எவ்வாறு சரிபார்க்கப்படுகிறது?' }
    ],
    bn: [
      { label: 'ওপিডি টোকেন প্রক্রিয়া', query: 'মেডিকিয়স্ক কীভাবে রোগীর জন্য ওপিডি টোকেন তৈরি করে?' },
      { label: 'জরুরি রেড-ফ্ল্যাগ লক্ষণ', query: 'মেডিকিয়স্কে ৫টি জরুরি রেড-ফ্ল্যাগ লক্ষণ কী কী?' },
      { label: 'আয়ুর্বেদ প্রকৃতি ও বিকৃতি', query: 'আয়ুষ বিভাগে প্রকৃতি ও বিকৃতি কীভাবে মূল্যায়ন করা হয়?' },
      { label: 'প্রেসক্রিপশন স্ক্যানিং ও ওষুধ', query: 'প্রেসক্রিপশন স্ক্যান করে ওষুধের ডোজ কীভাবে যাচাই করা হয়?' }
    ],
    mr: [
      { label: 'ओपीडी टोकन प्रक्रिया', query: 'मेडीकिओस्क रुग्णासाठी ओपीडी टोकन कसे तयार करते?' },
      { label: 'तातडीचे रेड-फ्लॅग लक्षणे', query: 'मेडीकिओस्कमधील ५ गंभीर रेड-फ्लॅग लक्षणे कोणती आहेत?' },
      { label: 'आयुर्वेद प्रकृती आणि विकृती', query: 'आयुष विभागात प्रकृती आणि विकृतीचे विश्लेषण कसे केले जाते?' }
    ],
    kn: [
      { label: 'OPD ಟೋಕನ್ ಪ್ರಕ್ರಿಯೆ', query: 'ಮೆಡಿಕಿಯೋಸ್ಕ್ ರೋಗಿಗೆ OPD ಟೋಕನ್ ಅನ್ನು ಹೇಗೆ ನೀಡುತ್ತದೆ?' },
      { label: 'ತುರ್ತು ರೆಡ್-ಫ್ಲ್ಯಾಗ್ ಲಕ್ಷಣಗಳು', query: 'ಮೆಡಿಕಿಯೋಸ್ಕ್‌ನಲ್ಲಿನ 5 ತುರ್ತು ರೆಡ್-ಫ್ಲ್ಯಾಗ್ ಲಕ್ಷಣಗಳನ್ನು ವಿವರಿಸಿ.' }
    ]
  }

  const quickPrompts = QUICK_PROMPTS_BY_LANG[activeLanguage] || QUICK_PROMPTS_BY_LANG.en

  const handleSendMessage = async (customText = null) => {
    const textToSend = (customText || inputMessage).trim()
    if (!textToSend || isLoading) return

    const userMsg = {
      id: 'user_' + Date.now(),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, userMsg])
    setInputMessage('')
    setIsLoading(true)

    try {
      const historyPayload = messages.slice(-6).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        content: m.content
      }))

      let replyText = ''
      let modelUsed = 'gemini-2.5-flash'

      // Strategy 1: Call Local FastAPI Backend
      try {
        let res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: textToSend,
            history: historyPayload,
            language: activeLanguage,
            context: { current_view: activeView }
          })
        })

        if (!res.ok) {
          res = await fetch('http://127.0.0.1:8000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: textToSend,
              history: historyPayload,
              language: activeLanguage,
              context: { current_view: activeView }
            })
          })
        }

        if (res && res.ok) {
          const data = await res.json()
          replyText = data.reply
          modelUsed = data.model || 'gemini-2.5-flash'
        }
      } catch (backendErr) {
        console.warn('Local backend not reachable, invoking direct Gemini API fallback...', backendErr)
      }

      // Strategy 2: Infallible Direct Google Gemini API Call
      if (!replyText) {
        const directKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) || ''
        const langMap = {
          hi: 'Hindi (हिन्दी)',
          te: 'Telugu (తెలుగు)',
          ta: 'Tamil (தமிழ்)',
          kn: 'Kannada (ಕನ್ನಡ)',
          ml: 'Malayalam (മലയാളം)',
          mr: 'Marathi (मराठी)',
          bn: 'Bengali (বাংলা)',
          gu: 'Gujarati (ગુજરાતી)',
          pa: 'Punjabi (ਪੰਜਾਬੀ)',
          or: 'Odia (ଓଡ଼ିଆ)',
          as: 'Assamese (অসমীয়া)',
          en: 'Indian English'
        }
        const targetLangName = langMap[activeLanguage] || 'Indian English'

        const sysPrompt = `You are MediKiosk AI Assistant, an empathetic, highly knowledgeable clinical and operational assistant integrated directly into the MediKiosk autonomous hospital OPD platform in India.
CRITICAL LANGUAGE RULE: You MUST write your ENTIRE response strictly in ${targetLangName}. Do NOT default to English unless the chosen language is English. All explanations, greetings, and guidance must be in ${targetLangName}.
1. Guide patients on OPD token intake, language selection (12 Indian languages), ABHA registration, SOCRATES voice intake, vitals (SpO2, BP, Pulse), and 4K prescription OCR.
2. Clinical Triage: Explain symptoms clearly. If emergency red flags appear (acute chest pain, stroke, severe breathlessness), advise immediate emergency routing (RF-001 to RF-005).
3. AYUSH & Integrative Care: Proficient in 10 Dashavidha Pariksha, Prakriti-Vikriti Dosha balance (Vata, Pitta, Kapha), and NAMASTE codes.
4. Multilingual Output: Always write clearly in natural ${targetLangName} using standard script.
5. Remind users that all findings require physician confirmation before final HIS recording.`

        const contents = []
        for (const msg of historyPayload) {
          contents.push({
            role: msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user',
            parts: [{ text: msg.content }]
          })
        }
        contents.push({
          role: 'user',
          parts: [{ text: `[Strict Language: Respond strictly in ${targetLangName}]\nQuestion: ${textToSend}` }]
        })

        const geminiPayload = {
          contents: contents,
          systemInstruction: { parts: [{ text: sysPrompt }] },
          generationConfig: { temperature: 0.3, maxOutputTokens: 1024 }
        }

        for (const mName of ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro']) {
          try {
            const gRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${mName}:generateContent?key=${directKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(geminiPayload)
            })
            if (gRes.ok) {
              const gData = await gRes.json()
              const parts = gData.candidates?.[0]?.content?.parts || []
              replyText = parts.map(p => p.text).join('').trim()
              modelUsed = mName
              if (replyText) break
            }
          } catch (e) {}
        }
      }

      if (replyText) {
        const botMsg = {
          id: 'bot_' + Date.now(),
          role: 'assistant',
          content: replyText,
          model: modelUsed,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
        setMessages(prev => [...prev, botMsg])
      } else {
        throw new Error('All communication channels failed')
      }
    } catch (err) {
      console.error('Chatbot error:', err)
      const fallbackMsg = {
        id: 'bot_' + Date.now(),
        role: 'assistant',
        content: 'Namaste! MediKiosk is ready to assist your clinical intake, token check-in, or doctor consultation. How may I help you?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, fallbackMsg])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSpeakText = (text) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const cleanText = text.replace(/[*_#`]/g, '')
      const utterance = new SpeechSynthesisUtterance(cleanText.substring(0, 300))
      utterance.lang = activeLanguage === 'hi' ? 'hi-IN' : 'en-IN'
      window.speechSynthesis.speak(utterance)
    }
  }

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome_' + Date.now(),
        role: 'assistant',
        content: 'Chat cleared! How else can I assist your clinical intake or doctor consultation?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ])
  }

  return (
    <>
      {/* Floating Chat Trigger Button */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        <AnimatePresence>
          {!isOpen && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(true)}
              className="relative group px-5 py-3.5 bg-gradient-to-r from-saffron via-amber-500 to-orange-500 text-slate-950 font-bold rounded-full shadow-2xl shadow-saffron/40 flex items-center gap-2.5 font-display text-sm cursor-pointer border border-amber-300/40"
              aria-label="Open MediKiosk AI Chatbot"
            >
              <div className="relative">
                <Bot className="w-5 h-5 text-slate-950" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-600 rounded-full animate-ping" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white" />
              </div>
              <span className="font-extrabold tracking-tight">Ask MediKiosk AI</span>
              <span className="text-[10px] font-mono font-bold bg-slate-950/15 px-2 py-0.5 rounded-full border border-slate-950/20">
                Gemini Live
              </span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Chat Window Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={`fixed z-50 shadow-2xl border flex flex-col rounded-3xl overflow-hidden backdrop-blur-xl ${
              isExpanded
                ? 'inset-4 md:inset-10'
                : 'bottom-6 right-6 w-[92vw] sm:w-[440px] h-[640px] max-h-[85vh]'
            } ${
              isLight
                ? 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-300/50'
                : 'bg-slate-900/95 border-slate-700/80 text-white shadow-black/80'
            }`}
          >
            {/* Header */}
            <div className={`px-5 py-4 border-b flex items-center justify-between ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-saffron to-amber-400 flex items-center justify-center shadow-md text-slate-950 font-bold shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold font-display text-sm">MediKiosk AI Assistant</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/30 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Gemini 2.5
                    </span>
                  </div>
                  <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Real-Time Multilingual Clinical & OPD Guide
                  </p>
                </div>
              </div>

              {/* Window Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={clearChat}
                  title="Clear Chat"
                  className={`p-2 rounded-xl transition-colors cursor-pointer ${
                    isLight ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? 'Minimize' : 'Expand'}
                  className={`p-2 rounded-xl transition-colors cursor-pointer hidden sm:block ${
                    isLight ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Close Chat"
                  className={`p-2 rounded-xl transition-colors cursor-pointer ${
                    isLight ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Language Selector Bar */}
            <div className={`px-4 py-2 border-b flex flex-wrap items-center justify-between gap-2 text-xs font-mono ${
              isLight ? 'bg-slate-100/70 border-slate-200 text-slate-700' : 'bg-slate-950/40 border-slate-800 text-slate-400'
            }`}>
              <div className="flex items-center gap-1.5 font-bold">
                <Radio className="w-3.5 h-3.5 text-saffron" />
                <span>Response Language:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {[
                  { code: 'en', label: 'English', greeting: 'Hello! How can I assist your hospital visit today?' },
                  { code: 'hi', label: 'हिन्दी', greeting: 'नमस्ते! मैं आज आपकी अस्पताल यात्रा में कैसे सहायता कर सकता हूँ?' },
                  { code: 'te', label: 'తెలుగు', greeting: 'నమస్కారం! మీ ఆసుపత్రి సందర్శనలో నేను మీకు ఎలా సహాయపడగలను?' },
                  { code: 'ta', label: 'தமிழ்', greeting: 'வணக்கம்! உங்கள் மருத்துவமனை வருகைக்கு நான் எவ்வாறு உதவ முடியும்?' },
                  { code: 'bn', label: 'বাংলা', greeting: 'নমস্কার! আপনার হাসপাতাল পরিদর্শনে আমি কীভাবে সাহায্য করতে পারি?' },
                  { code: 'mr', label: 'मराठी', greeting: 'नमस्कार! मी तुम्हाला रुग्णालयाच्या भेटीत कशी मदत करू शकतो?' },
                  { code: 'kn', label: 'ಕನ್ನಡ', greeting: 'ನಮಸ್ಕಾರ! ನಿಮ್ಮ ಆಸ್ಪತ್ರೆಯ ಭೇಟಿಯಲ್ಲಿ ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?' }
                ].map(l => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setActiveLanguage(l.code)
                      setMessages(prev => [
                        ...prev,
                        {
                          id: 'lang_switch_' + Date.now(),
                          role: 'assistant',
                          content: `🌐 **Language switched to ${l.label}**\n${l.greeting}`,
                          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        }
                      ])
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      activeLanguage === l.code
                        ? 'bg-saffron text-slate-950 shadow-md font-extrabold scale-105'
                        : isLight ? 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 font-sans text-xs sm:text-sm leading-relaxed">
              {messages.map((m) => {
                const isBot = m.role === 'assistant'
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}
                  >
                    {isBot && (
                      <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div className={`relative max-w-[82%] rounded-2xl p-3.5 space-y-2 shadow-sm ${
                      isBot
                        ? isLight
                          ? 'bg-slate-100 border border-slate-200 text-slate-900'
                          : 'bg-slate-800/90 border border-slate-700 text-slate-100'
                        : 'bg-gradient-to-br from-saffron to-amber-500 text-slate-950 font-medium font-sans'
                    }`}>
                      <div className="whitespace-pre-wrap leading-relaxed">
                        {m.content}
                      </div>

                      <div className={`flex items-center justify-between gap-3 text-[10px] font-mono pt-1 ${
                        isBot
                          ? isLight ? 'text-slate-500 border-t border-slate-200' : 'text-slate-400 border-t border-slate-700/50'
                          : 'text-slate-900/80 border-t border-amber-600/30'
                      }`}>
                        <span>{m.timestamp}</span>
                        {isBot && (
                          <div className="flex items-center gap-1.5">
                            {m.model && <span className="text-[9px] opacity-75">{m.model}</span>}
                            <button
                              onClick={() => handleSpeakText(m.content)}
                              title="Listen to message"
                              className="p-1 rounded hover:bg-slate-700/30 transition-colors cursor-pointer"
                            >
                              <Volume2 className="w-3 h-3 text-cyan-400" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {!isBot && (
                      <div className="w-7 h-7 rounded-xl bg-saffron text-slate-950 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </motion.div>
                )
              })}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3 items-center text-xs font-mono text-slate-400"
                >
                  <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 animate-spin">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex items-center gap-1 bg-slate-800/60 px-3.5 py-2 rounded-xl border border-slate-700">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="ml-1 text-[11px] text-amber-300">Gemini thinking...</span>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts Carousel */}
            <div className={`px-4 py-2 border-t flex gap-2 overflow-x-auto no-scrollbar ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
            }`}>
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(p.query)}
                  className={`text-[11px] font-medium px-3 py-1.5 rounded-xl border whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                    isLight
                      ? 'bg-white border-slate-200 text-slate-700 hover:border-amber-400 hover:bg-amber-50/50'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-amber-500/50 hover:bg-slate-800'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-saffron" />
                  <span>{p.label}</span>
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className={`p-4 border-t flex items-center gap-2 ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <textarea
                ref={inputRef}
                rows={1}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about token check-in, symptoms, prescriptions, ABHA..."
                className={`flex-1 text-xs sm:text-sm rounded-2xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/50 border transition-all ${
                  isLight
                    ? 'bg-slate-100 border-slate-200 text-slate-900 placeholder:text-slate-400'
                    : 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-500'
                }`}
              />

              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isLoading}
                className={`p-3 rounded-2xl font-bold flex items-center justify-center transition-all cursor-pointer shadow-md ${
                  inputMessage.trim() && !isLoading
                    ? 'bg-gradient-to-r from-saffron to-amber-500 text-slate-950 shadow-saffron/20 hover:scale-105'
                    : isLight
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                }`}
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}