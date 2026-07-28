import { useEffect, useRef } from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Loader } from "lucide-react";
import { useWebRTCCall } from "../../../hooks/useWebRTCCall";

export default function VideoCallRoom({ rdvId, isInitiator, onEnd, darkMode, nomInterlocuteur }) {
  const { localStream, remoteStream, connexionEtat, micActif, videoActive, erreur, toggleMic, toggleVideo, raccrocher } = useWebRTCCall(rdvId, isInitiator);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => { if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream; }, [localStream]);
  useEffect(() => { if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream; }, [remoteStream]);

  const handleRaccrocher = () => { raccrocher(); onEnd?.(); };

  if (erreur) {
    return (
      <div className={`flex flex-col items-center justify-center h-[65vh] rounded-2xl ${darkMode ? "bg-gray-800" : "bg-gray-100"}`}>
        <p className="text-red-500 font-medium mb-4 text-center px-6">{erreur}</p>
        <button onClick={onEnd} className="px-4 py-2 bg-gray-600 text-white rounded-xl">Retour</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative bg-black rounded-2xl overflow-hidden" style={{ height: "65vh", minHeight: "400px" }}>
        {remoteStream ? (
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-white gap-3">
            <Loader className="w-8 h-8 animate-spin" />
            <p className="text-sm text-gray-300">
              {connexionEtat === "connexion" && "Connexion a la camera..."}
              {connexionEtat === "attente" && `En attente de ${nomInterlocuteur || "l'autre participant"}...`}
            </p>
          </div>
        )}

        <div className="absolute bottom-4 right-4 w-32 h-24 sm:w-40 sm:h-28 rounded-xl overflow-hidden border-2 border-white/20 bg-gray-900">
          {localStream && videoActive ? (
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-xs">Camera coupee</div>
          )}
        </div>

        <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-3 py-1 rounded-lg flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${connexionEtat === "connecte" ? "bg-green-500 animate-pulse" : "bg-yellow-500"}`} />
          {connexionEtat === "connecte" ? "En direct" : "Connexion..."}
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        <button onClick={toggleMic} className={`w-12 h-12 rounded-full flex items-center justify-center transition ${micActif ? (darkMode ? "bg-gray-700 text-white" : "bg-gray-200 text-gray-800") : "bg-red-500 text-white"}`}>
          {micActif ? <Mic size={20} /> : <MicOff size={20} />}
        </button>
        <button onClick={toggleVideo} className={`w-12 h-12 rounded-full flex items-center justify-center transition ${videoActive ? (darkMode ? "bg-gray-700 text-white" : "bg-gray-200 text-gray-800") : "bg-red-500 text-white"}`}>
          {videoActive ? <Video size={20} /> : <VideoOff size={20} />}
        </button>
        <button onClick={handleRaccrocher} className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition">
          <PhoneOff size={22} />
        </button>
      </div>
    </div>
  );
}