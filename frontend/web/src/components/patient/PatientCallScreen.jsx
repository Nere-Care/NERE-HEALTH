import { useState, useEffect } from "react";
import {
  Video, PhoneOff, Mic, MicOff, VideoOff,
  MessageSquare, Monitor, Send, Clock, Wifi, X,
} from "lucide-react";
import { getStoredUser } from "../../services/auth";

export default function PatientCallScreen({ darkMode, rdv, medecinName, onClose }) {
  const currentUser = getStoredUser();
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [duree, setDuree] = useState(0);
  const [messages, setMessages] = useState([
    { id: 1, senderId: "other", texte: `Bonjour, je suis ${medecinName}. Comment puis-je vous aider ?`, heure: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) },
  ]);
  const [newMessage, setNewMessage] = useState("");

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
        senderId: currentUser?.id,
        texte: newMessage,
        heure: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setNewMessage("");
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
            onClick={onClose}
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
          <div className="flex-1 bg-black rounded-2xl relative min-h-[300px] overflow-hidden flex items-center justify-center">
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
              Visioconsultation
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

          {/* CHAT */}
          <div className={`rounded-2xl overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
            <div className={`flex items-center justify-between px-4 py-3 border-b ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
              <h3 className={`font-semibold text-sm flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
                <MessageSquare size={16} className="text-blue-500" />
                Chat avec le médecin
              </h3>
              <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                {messages.length} message{messages.length > 1 ? "s" : ""}
              </span>
            </div>

            <div className="h-40 overflow-y-auto p-3 space-y-2">
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
