import { useState, useEffect } from "react";
import {
  Video,
  PhoneOff,
  Mic,
  MicOff,
  VideoOff,
  User,
  FileText,
  Stethoscope,
  MessageSquare,
  Monitor,
  Send,
  Save,
  Download,
  Clock,
  AlertCircle,
  Pill,
  Plus,
  Trash2,
  X,
  CheckCircle,
  Paperclip,
  Wifi,
  FlaskConical,
} from "lucide-react";
import { post } from "../../../services/apiClient";
import { getStoredUser } from "../../../services/auth";
import PosologieBuilder from "../../PosologieBuilder";
import MedicamentSearch from "../../MedicamentSearch";
import LabSearch from "../../LabSearch";
import { getUserTimezone } from "../../../utils/timezone";
import { FORMES } from "../../../constants/medicalOptions";

const EMPTY_LIGNE = { medicament_nom: "", dosage: "", forme: "comprimes", posologie: "", duree_jours: 7, quantite: 1, posologieConfig: null };

export default function CallScreen({ darkMode, endCall, patient }) {
  const currentUser = getStoredUser();
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [duree, setDuree] = useState(0);
  const [activePanel, setActivePanel] = useState("notes"); // notes | chat | dossier
  const [notes, setNotes] = useState("");
  const [diagnostic, setDiagnostic] = useState("");
  const [lignes, setLignes] = useState([{ ...EMPTY_LIGNE }]);
  const [labAnalyses, setLabAnalyses] = useState([]);
  const [messages, setMessages] = useState([
    { id: 1, senderId: "other", texte: "Bonjour Docteur", heure: "14:00" },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [showSavedToast, setShowSavedToast] = useState(false);

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

  const addLigne = () => setLignes((l) => [...l, { ...EMPTY_LIGNE }]);
  const removeLigne = (idx) => setLignes((l) => l.filter((_, i) => i !== idx));
  const updateLigne = (idx, field, val) =>
    setLignes((l) => l.map((item, i) => (i === idx ? { ...item, [field]: val } : item)));

  const buildPrescriptionText = () =>
    lignes
      .filter((l) => l.medicament_nom || l.posologie)
      .map((l) => {
        const parts = [];
        if (l.medicament_nom) parts.push(l.medicament_nom);
        if (l.dosage) parts.push(l.dosage);
        if (l.forme) parts.push(`(${l.forme})`);
        if (l.posologie) parts.push(l.posologie);
        return parts.join(" ");
      })
      .join("\n");

  const envoyerMessage = () => {
    if (!newMessage.trim()) return;
    setMessages([
      ...messages,
      {
        id: Date.now(),
        senderId: currentUser?.id,
        texte: newMessage,
        heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: getUserTimezone() }),
      },
    ]);
    setNewMessage("");
  };

  const sauvegarderConsultation = async () => {
    if (!patient.rdvId) {
      console.log("Pas de RDV lié — consultation rapide non sauvegardée");
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 3000);
      return;
    }
    try {
      await post("/api/consultations", {
        rdv_id: patient.rdvId,
        patient_id: patient.patientId,
        motif: patient.motif || "Consultation generale",
        examen_clinique: notes || null,
        diagnostic_principal: diagnostic || null,
        plan_traitement: buildPrescriptionText() || null,
        prescription_posologie: buildPrescriptionText() || null,
        demandes_labo: labAnalyses.length > 0 ? labAnalyses.map((a) => a.nom).join(", ") : null,
        duree_minutes: Math.floor(duree / 60),
        statut: "en_cours",
      });
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 3000);
    } catch (err) {
      console.error("Erreur sauvegarde consultation:", err);
    }
  };

  const genererRapport = () => {
    const rapport = `
COMPTE-RENDU DE TÉLÉCONSULTATION
================================
Patient : ${patient.patientName}
Date : ${new Date().toLocaleDateString('fr-FR', { timeZone: getUserTimezone() })}
Durée : ${formatDuree(duree)}

NOTES CLINIQUES :
${notes || "Aucune note"}

DIAGNOSTIC :
${diagnostic || "Non renseigné"}

PRESCRIPTION :
${buildPrescriptionText() || "Aucune prescription"}

DEMANDES DE LABORATOIRE :
${labAnalyses.length > 0 ? labAnalyses.map((a) => a.nom).join(", ") : "Aucune demande"}
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
            {/* Timer */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
              <Clock size={16} className="text-blue-500" />
              <span className={`font-mono font-semibold text-sm ${darkMode ? "text-white" : "text-gray-800"}`}>
                {formatDuree(duree)}
              </span>
            </div>

            {/* Qualité connexion */}
            <div className={`hidden sm:flex items-center gap-1 px-3 py-2 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
              <Wifi size={16} className="text-green-500" />
              <span className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Excellent</span>
            </div>

            <button
              onClick={() => endCall(duree)}
              className="flex items-center gap-2 bg-red-600 text-white px-3 sm:px-4 py-2 rounded-xl text-sm hover:bg-red-700 transition"
            >
              <PhoneOff className="w-4 h-4" />
              <span className="hidden sm:inline">Terminer</span>
            </button>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* VIDEO */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-black rounded-2xl relative h-[45vh] sm:h-[55vh] lg:h-[65vh] min-h-[300px] overflow-hidden flex items-center justify-center">
              {camOn ? (
                <div className="text-center text-white space-y-2 px-3">
                  <Video className="w-10 h-10 mx-auto opacity-70" />
                  <p className="text-xs sm:text-sm text-gray-300">Flux vidéo actif</p>
                </div>
              ) : (
                <div className="text-center text-white space-y-2 px-3">
                  <VideoOff className="w-10 h-10 mx-auto opacity-70" />
                  <p className="text-xs sm:text-sm text-gray-300">Caméra désactivée</p>
                </div>
              )}

              {/* STATUS */}
              <div className="absolute top-3 left-3 bg-black/60 text-white text-[10px] sm:text-xs px-3 py-1 rounded-lg flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                Live Session
              </div>

              {/* CONTROLS */}
              <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-2 sm:gap-3 bg-black/60 p-2 rounded-full backdrop-blur">
                <button
                  onClick={() => setMicOn(!micOn)}
                  className={`p-2 sm:p-3 rounded-full transition ${micOn ? "bg-white text-black" : "bg-red-500 text-white"}`}
                  title={micOn ? "Couper le micro" : "Activer le micro"}
                >
                  {micOn ? <Mic className="w-4 h-4 sm:w-5 sm:h-5" /> : <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>

                <button
                  onClick={() => setCamOn(!camOn)}
                  className={`p-2 sm:p-3 rounded-full transition ${camOn ? "bg-white text-black" : "bg-red-500 text-white"}`}
                  title={camOn ? "Couper la caméra" : "Activer la caméra"}
                >
                  {camOn ? <Video className="w-4 h-4 sm:w-5 sm:h-5" /> : <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>

                <button
                  className="p-2 sm:p-3 rounded-full bg-white/20 text-white hover:bg-white/30 transition"
                  title="Partager l'écran"
                >
                  <Monitor className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            {/* Panneau inférieur : Chat */}
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
                    className={`flex ${msg.senderId === currentUser?.id ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm
                      ${msg.senderId === currentUser?.id
                        ? "bg-blue-500 text-white"
                        : darkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-800"}`}>
                      <p>{msg.texte}</p>
                      <p className={`text-[10px] mt-1 text-right ${msg.senderId === currentUser?.id ? "text-blue-100" : "text-gray-400"}`}>
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

          {/* MEDICAL PANEL */}
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
                  {/* PATIENT CARD */}
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

                  {/* NOTES CLINIQUES */}
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

                  {/* DIAGNOSTIC */}
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

                  {/* PRESCRIPTION - Multi-medication cards */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className={`text-xs sm:text-sm font-medium flex items-center gap-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                        <Pill size={14} />
                        Prescription
                      </label>
                      <button onClick={addLigne} className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 font-medium">
                        <Plus size={12} /> Ajouter
                      </button>
                    </div>
                    <div className="space-y-3">
                      {lignes.map((ligne, idx) => (
                        <div key={idx} className={`p-3 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs font-semibold ${darkMode ? "text-gray-300" : "text-gray-500"}`}>Medicament {idx + 1}</span>
                            {lignes.length > 1 && (
                              <button onClick={() => removeLigne(idx)} className="text-red-400 hover:text-red-600">
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            <MedicamentSearch
                              value={ligne.medicament_nom}
                              darkMode={darkMode}
                              onSelect={(med) => {
                                updateLigne(idx, "medicament_nom", med.nom_commercial);
                                if (med.dosage) updateLigne(idx, "dosage", med.dosage);
                                if (med.forme) updateLigne(idx, "forme", med.forme);
                              }}
                              placeholder="Nom du medicament"
                            />
                            <input
                              placeholder="Dosage (ex: 500mg)"
                              value={ligne.dosage}
                              onChange={(e) => updateLigne(idx, "dosage", e.target.value)}
                              className={`px-2.5 py-1.5 rounded-lg border text-xs outline-none ${darkMode ? "bg-gray-500 border-gray-400 text-white placeholder-gray-400" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"}`}
                            />
                            <select
                              value={ligne.forme}
                              onChange={(e) => updateLigne(idx, "forme", e.target.value)}
                              className={`px-2.5 py-1.5 rounded-lg border text-xs outline-none ${darkMode ? "bg-gray-500 border-gray-400 text-white" : "bg-gray-50 border-gray-200 text-gray-900"}`}
                            >
                              {FORMES.map((f) => <option key={f} value={f}>{f}</option>)}
                            </select>
                            <div>
                              <label className={`text-[10px] font-medium mb-0.5 block ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Nb boites/Flacons</label>
                              <input
                                type="number"
                                min="1"
                                value={ligne.quantite}
                                onChange={(e) => updateLigne(idx, "quantite", e.target.value)}
                                className={`w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none ${darkMode ? "bg-gray-500 border-gray-400 text-white" : "bg-gray-50 border-gray-200 text-gray-900"}`}
                              />
                            </div>
                          </div>
                          <div className="mt-2">
                            <PosologieBuilder
                              darkMode={darkMode}
                              dureeJours={Number(ligne.duree_jours) || 7}
                              value={ligne.posologieConfig}
                              onChange={(config) => {
                                updateLigne(idx, "posologie", config.posologie);
                                updateLigne(idx, "posologieConfig", config);
                                if (config.dureeJours) updateLigne(idx, "duree_jours", config.dureeJours);
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* LABORATORY REQUESTS */}
                  <div className="space-y-2">
                    <label className={`text-xs sm:text-sm font-medium flex items-center gap-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      <FlaskConical size={14} />
                      Laboratoire (examens demandes)
                    </label>
                    <LabSearch
                      darkMode={darkMode}
                      allowCustom
                      onSelect={(analyse) => {
                        if (!labAnalyses.find((a) => a.nom === analyse.nom)) {
                          setLabAnalyses([...labAnalyses, analyse]);
                        }
                      }}
                      placeholder="Rechercher une analyse..."
                    />
                    {labAnalyses.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {labAnalyses.map((a, i) => (
                          <span
                            key={i}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                              darkMode ? "bg-purple-900/40 text-purple-300" : "bg-purple-100 text-purple-700"
                            }`}
                          >
                            {a.nom}
                            <button
                              type="button"
                              onClick={() => setLabAnalyses(labAnalyses.filter((_, j) => j !== i))}
                              className="ml-0.5 hover:text-red-400"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ACTIONS */}
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
                      onClick={() => endCall(duree)}
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
                  {/* Dossier patient */}
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

                  {/* Antécédents */}
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

                  {/* Allergies */}
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

                  {/* Dernière consultation */}
                  {patient.dossier?.dernierConsultation && (
                    <div>
                      <p className={`text-xs font-bold uppercase mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                        Dernière consultation
                      </p>
                      <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                        {new Date(patient.dossier.dernierConsultation).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'long', year: 'numeric', timeZone: getUserTimezone()
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

      {/* TOAST */}
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