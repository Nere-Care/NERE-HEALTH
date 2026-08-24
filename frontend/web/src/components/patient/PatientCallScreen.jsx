import { useState, useEffect, useRef } from "react";
import {
  Video, PhoneOff, Mic, MicOff, VideoOff,
  Monitor, Clock, Wifi, MessageSquare, Send,
} from "lucide-react";
import { getStoredUser } from "../../services/auth";
import { useLivekit } from "../../hooks/useLivekit";

export default function PatientCallScreen({ darkMode, rdv, medecinName, onClose }) {
  const currentUser = getStoredUser();
  const remoteContainerRef = useRef(null);
  const localContainerRef = useRef(null);
  const [duree, setDuree] = useState(0);
  const [newMessage, setNewMessage] = useState("");

  const displayName = currentUser ? `${currentUser.prenom || ""} ${currentUser.nom || ""}`.trim() : "Patient";
  const livekit = useLivekit({
    rdvId: rdv?.id,
    displayName,
    remoteContainerRef,
    localContainerRef,
  });

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
    livekit.sendMessage(newMessage);
    setNewMessage("");
  };

  const quitter = () => {
    livekit.disconnect();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* HEADER */}
      <div className={`flex items-center justify-between px-4 py-3 ${darkMode ? "bg-gray-900" : "bg-white"} shadow-sm`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
            {medecinName?.charAt(0)?.toUpperCase() || "M"}
          </div>
          <div>
            <h1 className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
              {medecinName}
            </h1>
            <div className="flex items-center gap-2 text-xs">
              <span className={darkMode ? "text-gray-400" : "text-gray-500"}>
                {rdv?.motif_consultation || "Consultation"}
              </span>
              <span className="flex items-center gap-1 text-green-500 font-medium">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                En direct
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${darkMode ? "bg-gray-800" : "bg-gray-100"}`}>
            <Clock size={16} className="text-blue-500" />
            <span className={`font-mono font-semibold text-sm ${darkMode ? "text-white" : "text-gray-800"}`}>
              {formatDuree(duree)}
            </span>
          </div>
          <div className={`hidden sm:flex items-center gap-1 px-3 py-2 rounded-xl ${darkMode ? "bg-gray-800" : "bg-gray-100"}`}>
            <Wifi size={16} className="text-green-500" />
            <span className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Excellent</span>
          </div>
          <button
            onClick={quitter}
            className="flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded-xl text-sm hover:bg-red-700 transition"
          >
            <PhoneOff className="w-4 h-4" />
            <span className="hidden sm:inline">Quitter</span>
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className={`flex-1 flex flex-col lg:flex-row gap-4 p-4 overflow-hidden ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>

        {/* VIDEO AREA */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex-1 bg-black rounded-2xl relative min-h-[300px] overflow-hidden">
            <div ref={remoteContainerRef} className="absolute inset-0" />

            {livekit.status === "error" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white space-y-3 px-6">
                <VideoOff className="w-12 h-12 opacity-60" />
                <p className="text-sm sm:text-base">
                  Impossible de se connecter à la visioconférence.
                </p>
                <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Le serveur LiveKit doit être démarré (VITE_LIVEKIT_URL / LIVEKIT_URL).
                </p>
              </div>
            )}

            {livekit.status === "connecting" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white space-y-3">
                <div className="w-8 h-8 border-4 border-white/40 border-t-white rounded-full animate-spin" />
                <p className="text-xs sm:text-sm text-gray-300">Connexion à la visioconférence...</p>
              </div>
            )}

            {livekit.status === "connected" && !livekit.remoteActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white space-y-3 px-6">
                <Video className="w-12 h-12 opacity-60" />
                <p className="text-xs sm:text-sm text-gray-300">En attente du médecin...</p>
              </div>
            )}

            {/* Aperçu local */}
            <div ref={localContainerRef}
              className="absolute top-3 right-3 w-32 sm:w-40 aspect-video rounded-lg overflow-hidden border-2 border-white/40 bg-black/40 shadow-lg z-10" />

            {/* STATUS */}
            <div className="absolute top-3 left-3 bg-black/60 text-white text-[10px] sm:text-xs px-3 py-1 rounded-lg flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              Visioconsultation
            </div>

            {/* CONTROLS */}
            <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-2 sm:gap-3 bg-black/60 p-2 rounded-full backdrop-blur z-10">
              <button
                onClick={livekit.toggleMic}
                className={`p-2 sm:p-3 rounded-full transition ${livekit.micOn ? "bg-white text-black" : "bg-red-500 text-white"}`}
                title={livekit.micOn ? "Couper le micro" : "Activer le micro"}
              >
                {livekit.micOn ? <Mic className="w-4 h-4 sm:w-5 sm:h-5" /> : <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
              <button
                onClick={livekit.toggleCam}
                className={`p-2 sm:p-3 rounded-full transition ${livekit.camOn ? "bg-white text-black" : "bg-red-500 text-white"}`}
                title={livekit.camOn ? "Couper la caméra" : "Activer la caméra"}
              >
                {livekit.camOn ? <Video className="w-4 h-4 sm:w-5 sm:h-5" /> : <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
              <button
                onClick={livekit.toggleScreenShare}
                className={`p-2 sm:p-3 rounded-full transition ${livekit.screenSharing ? "bg-blue-500 text-white" : "bg-white/20 text-white hover:bg-white/30"}`}
                title={livekit.screenSharing ? "Arrêter le partage d'écran" : "Partager l'écran"}
              >
                <Monitor className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Chat temps réel */}
          <div className={`rounded-2xl overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
            <div className={`flex items-center justify-between px-4 py-3 border-b ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
              <h3 className={`font-semibold text-sm flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
                <MessageSquare size={16} className="text-blue-500" />
                Chat avec le médecin
              </h3>
              <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                {livekit.messages.length} message{livekit.messages.length > 1 ? "s" : ""}
              </span>
            </div>

            <div className="h-40 overflow-y-auto p-3 space-y-2">
              {livekit.messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === displayName ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm
                    ${msg.sender === displayName
                      ? "bg-blue-500 text-white"
                      : darkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-800"}`}>
                    {msg.sender && msg.sender !== displayName && (
                      <p className={`text-[10px] font-bold mb-0.5 ${darkMode ? "text-gray-300" : "text-gray-500"}`}>{msg.sender}</p>
                    )}
                    <p>{msg.texte}</p>
                    <p className={`text-[10px] mt-1 text-right ${msg.sender === displayName ? "text-blue-100" : "text-gray-400"}`}>
                      {new Date(msg.at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
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
                placeholder="Écrire au médecin..."
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
      </div>
    </div>
  );
}
