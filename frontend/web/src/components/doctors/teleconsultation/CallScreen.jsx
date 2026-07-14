import {
  Video,
  PhoneOff,
  User,
  FileText,
  Stethoscope,
  MessageSquare,
  Send,
  Save,
  Download,
  Clock,
  AlertCircle,
  Pill,
  CheckCircle,
  Wifi,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function CallScreen({ darkMode, endCall, patient }) {
  const [duree, setDuree] = useState(0);
  const [activePanel, setActivePanel] = useState("notes");
  const [notes, setNotes] = useState("");
  const [diagnostic, setDiagnostic] = useState("");
  const [prescription, setPrescription] = useState("");
  const [messages, setMessages] = useState([
    { id: 1, expediteur: "patient", texte: "Bonjour Docteur", heure: "14:00" },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [showSavedToast, setShowSavedToast] = useState(false);

  // ✅ Réfs pour Jitsi SDK
  const jitsiContainerRef = useRef(null);
  const jitsiApiRef = useRef(null);

  // ✅ Initialisation Jitsi SDK
  useEffect(() => {
    if (!patient.lien_video || !jitsiContainerRef.current) return;

    const loadJitsi = () => {
      if (window.JitsiMeetExternalAPI) {
        initJitsi();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://meet.jit.si/external_api.js";
      script.onload = initJitsi;
      document.head.appendChild(script);
    };

    const initJitsi = () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
      }
      const roomName = patient.room_name || patient.lien_video?.split("/").pop();
      jitsiApiRef.current = new window.JitsiMeetExternalAPI("meet.jit.si", {
        roomName,
        parentNode: jitsiContainerRef.current,
        width: "100%",
        height: "100%",
        userInfo: {
          displayName: `Dr. ${patient.doctorName || 'Medecin'}`,
        },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          disableDeepLinking: true,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_BRAND_WATERMARK: false,
          TOOLBAR_BUTTONS: ["microphone", "camera", "hangup", "chat", "tileview", "fullscreen"],
        },
      });
    };

    loadJitsi();

    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }
    };
  }, [patient.lien_video, patient.room_name, patient.doctorName]);

  // Timer de consultation
  useEffect(() => {
    const timer = setInterval(() => setDuree((d) => d + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuree = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ":" : ""}${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const envoyerMessage = () => {
    if (!newMessage.trim()) return;
    setMessages([
      ...messages,
      {
        id: Date.now(),
        expediteur: "medecin",
        texte: newMessage,
        heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setNewMessage("");
  };

  const sauvegarderConsultation = () => {
    console.log("Consultation sauvegardée :", {
      patient: patient.patientName,
      notes,
      diagnostic,
      prescription,
      duree: formatDuree(duree),
    });
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  const genererRapport = () => {
    const rapport = `
COMPTE-RENDU DE TÉLÉCONSULTATION
================================
Patient : ${patient.patientName}
Date : ${new Date().toLocaleDateString('fr-FR')}
Durée : ${formatDuree(duree)}

NOTES CLINIQUES :
${notes || "Aucune note"}

DIAGNOSTIC :
${diagnostic || "Non renseigné"}

PRESCRIPTION :
${prescription || "Aucune prescription"}
    `.trim();

    const blob = new Blob([rapport], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consultation_${patient.patientName.replace(/\s/g, '_')}_${Date.now()}.txt`;
    a.click();
  };

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className="p-3 sm:p-4 md:p-6">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
              {patient.avatar}
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-[#3b82f6]">
                {patient.patientName}
              </h1>
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <span className={darkMode ? "text-gray-400" : "text-gray-500"}>
                  {patient.motif}
                </span>
                <span className="flex items-center gap-1 text-green-500 font-medium">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  En direct
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
              <Clock size={16} className="text-blue-500" />
              <span className={`font-mono font-semibold text-sm ${darkMode ? "text-white" : "text-gray-800"}`}>
                {formatDuree(duree)}
              </span>
            </div>

            <div className={`hidden sm:flex items-center gap-1 px-3 py-2 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
              <Wifi size={16} className="text-green-500" />
              <span className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Excellent</span>
            </div>

            <button
              onClick={endCall}
              className="flex items-center gap-2 bg-red-600 text-white px-3 sm:px-4 py-2 rounded-xl text-sm hover:bg-red-700 transition"
            >
              <PhoneOff className="w-4 h-4" />
              <span className="hidden sm:inline">Terminer</span>
            </button>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* COLONNE GAUCHE : VIDEO + CHAT */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* ✅ VIDEO JITSI via SDK (pas d'iframe) */}
            <div
              ref={jitsiContainerRef}
              className="bg-black rounded-2xl overflow-hidden relative"
              style={{ height: "65vh", minHeight: "400px" }}
            >
              {!patient.lien_video && (
                <div className="flex items-center justify-center h-full text-white text-center p-4">
                  <div>
                    <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm text-gray-400">Preparation de la salle video...</p>
                  </div>
                </div>
              )}

              {/* STATUS */}
              <div className="absolute top-3 left-3 bg-black/60 text-white text-[10px] sm:text-xs px-3 py-1 rounded-lg flex items-center gap-2 pointer-events-none z-10">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                Live
              </div>
            </div>

            {/* Lien patient a copier */}
            {patient.lien_video && (
              <div className={`rounded-xl p-3 flex items-center gap-3 ${darkMode ? "bg-gray-800" : "bg-blue-50"}`}>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Lien pour le patient
                  </p>
                  <p className={`text-xs truncate font-mono ${darkMode ? "text-blue-400" : "text-blue-600"}`}>
                    {patient.lien_video}
                  </p>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(patient.lien_video)}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition flex-shrink-0"
                >
                  Copier
                </button>
              </div>
            )}

            {/* CHAT */}
            <div className={`rounded-2xl overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
              <div className={`flex items-center justify-between px-4 py-3 border-b ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                <h3 className={`font-semibold text-sm flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
                  <MessageSquare size={16} className="text-blue-500" />
                  Chat avec le patient
                </h3>
                <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {messages.length} message{messages.length > 1 ? "s" : ""}
                </span>
              </div>

              <div className="h-48 overflow-y-auto p-3 space-y-2">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.expediteur === "medecin" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm
                      ${msg.expediteur === "medecin"
                        ? "bg-blue-500 text-white"
                        : darkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-800"}`}>
                      <p>{msg.texte}</p>
                      <p className={`text-[10px] mt-1 text-right ${msg.expediteur === "medecin" ? "text-blue-100" : "text-gray-400"}`}>
                        {msg.heure}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className={`p-3 border-t flex items-center gap-2 ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && envoyerMessage()}
                  placeholder="Écrire au patient..."
                  className={`flex-1 px-3 py-2 rounded-full text-sm outline-none
                    ${darkMode ? "bg-gray-700 text-white placeholder-gray-400" : "bg-gray-100 text-gray-800"}`}
                />
                <button
                  onClick={envoyerMessage}
                  disabled={!newMessage.trim()}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition
                    ${newMessage.trim() ? "bg-blue-500 text-white" : "bg-gray-300 text-gray-500"}`}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* COLONNE DROITE : MEDICAL PANEL */}
          <div className={`rounded-2xl shadow-sm overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"}`}>

            {/* Tabs */}
            <div className={`flex border-b ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
              <button
                onClick={() => setActivePanel("notes")}
                className={`flex-1 py-3 text-xs sm:text-sm font-medium transition flex items-center justify-center gap-1.5
                  ${activePanel === "notes"
                    ? "text-blue-500 border-b-2 border-blue-500"
                    : darkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                <Stethoscope size={14} />
                <span className="hidden sm:inline">Consultation</span>
                <span className="sm:hidden">Notes</span>
              </button>
              <button
                onClick={() => setActivePanel("dossier")}
                className={`flex-1 py-3 text-xs sm:text-sm font-medium transition flex items-center justify-center gap-1.5
                  ${activePanel === "dossier"
                    ? "text-blue-500 border-b-2 border-blue-500"
                    : darkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                <User size={14} />
                Dossier
              </button>
            </div>

            {/* Contenu panel */}
            <div className="p-4 space-y-4 max-h-[65vh] overflow-y-auto">

              {activePanel === "notes" && (
                <>
                  <div className={`p-3 rounded-xl text-sm space-y-1 ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                    <div className={`flex items-center gap-2 text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                      <User className="w-4 h-4" />
                      Patient
                    </div>
                    <p className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                      {patient.patientName}
                    </p>
                    {patient.age && (
                      <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {patient.age} ans • {patient.motif}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className={`text-xs sm:text-sm font-medium flex items-center gap-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      <FileText size={14} />
                      Notes cliniques
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className={`w-full border p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none
                        ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
                      rows={4}
                      placeholder="Observations, symptômes, examen clinique..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className={`text-xs sm:text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Diagnostic
                    </label>
                    <input
                      value={diagnostic}
                      onChange={(e) => setDiagnostic(e.target.value)}
                      className={`w-full border p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                        ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
                      placeholder="Ex: Rhinopharyngite aiguë"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className={`text-xs sm:text-sm font-medium flex items-center gap-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      <Pill size={14} />
                      Prescription
                    </label>
                    <textarea
                      value={prescription}
                      onChange={(e) => setPrescription(e.target.value)}
                      className={`w-full border p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none
                        ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
                      rows={4}
                      placeholder="Médicament - Posologie - Durée&#10;Ex: Amoxicilline 1g - 3x/jour - 7 jours"
                    />
                  </div>

                  <div className="space-y-2 pt-2 sticky bottom-0 pb-2">
                    <button
                      onClick={sauvegarderConsultation}
                      className="w-full bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 transition text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <Save size={16} />
                      Sauvegarder
                    </button>

                    <button
                      onClick={genererRapport}
                      className={`w-full border py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-sm font-medium
                        ${darkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                    >
                      <Download size={16} />
                      Télécharger le rapport
                    </button>

                    <button
                      onClick={endCall}
                      className="w-full bg-red-600 text-white py-2.5 rounded-xl hover:bg-red-700 transition text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <PhoneOff size={16} />
                      Terminer la consultation
                    </button>
                  </div>
                </>
              )}

              {activePanel === "dossier" && (
                <>
                  <div className={`p-3 rounded-xl ${darkMode ? "bg-gray-700" : "bg-blue-50"}`}>
                    <p className={`text-xs font-bold uppercase mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                      Informations
                    </p>
                    <p className={`font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>
                      {patient.patientName}
                    </p>
                    {patient.age && (
                      <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                        {patient.age} ans
                      </p>
                    )}
                  </div>

                  <div>
                    <p className={`text-xs font-bold uppercase mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                      Antécédents médicaux
                    </p>
                    {patient.dossier?.antecedents?.length > 0 ? (
                      <div className="space-y-1">
                        {patient.dossier.antecedents.map((a, i) => (
                          <div key={i} className={`flex items-center gap-2 p-2 rounded-lg text-sm
                            ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                            <AlertCircle size={14} className="text-orange-500" />
                            <span className={darkMode ? "text-gray-300" : "text-gray-700"}>{a}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Aucun antécédent</p>
                    )}
                  </div>

                  <div>
                    <p className={`text-xs font-bold uppercase mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                      Allergies
                    </p>
                    {patient.dossier?.allergies?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {patient.dossier.allergies.map((a, i) => (
                          <span key={i} className="px-3 py-1 rounded-full text-xs bg-red-100 text-red-700 font-medium">
                            ⚠️ {a}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Aucune allergie connue</p>
                    )}
                  </div>

                  {patient.dossier?.dernierConsultation && (
                    <div>
                      <p className={`text-xs font-bold uppercase mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                        Dernière consultation
                      </p>
                      <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                        {new Date(patient.dossier.dernierConsultation).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {showSavedToast && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 z-50 animate-slide-in">
          <CheckCircle size={18} />
          <span className="text-sm font-medium">Consultation sauvegardée</span>
        </div>
      )}

      <style>{`
        @keyframes slide-in {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
    </div>
  );
}