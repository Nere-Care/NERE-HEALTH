import { useState, useRef, useEffect, useCallback } from "react";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export function useWebRTCCall(rdvId, isInitiator) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [connexionEtat, setConnexionEtat] = useState("connexion"); // 'connexion' | 'attente' | 'connecte' | 'termine' | 'erreur'
  const [micActif, setMicActif] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [erreur, setErreur] = useState(null);

  const pcRef = useRef(null);
  const wsRef = useRef(null);
  const localStreamRef = useRef(null);
  const iceCandidatesQueue = useRef([]);

  const nettoyer = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    iceCandidatesQueue.current = [];
  }, []);

  useEffect(() => {
    let annule = false;

    const demarrer = async () => {
      let stream = null;

      // 1. Tentatives d'accès aux périphériques médias
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch (err) {
        console.warn("Échec vidéo + audio :", err.name);
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        } catch (err2) {
          console.warn("Échec vidéo seule :", err2.name);
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
          } catch (err3) {
            console.warn("Aucun média disponible :", err3.name);
            setErreur(
              err3.name === "NotReadableError"
                ? "Caméra/micro déjà utilisés par une autre fenêtre. Vous rejoignez sans vidéo locale."
                : "Aucune caméra/microphone disponible. Vous rejoignez sans vidéo locale."
            );
            stream = new MediaStream();
          }
        }
      }

      if (annule) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      localStreamRef.current = stream;
      setLocalStream(stream);

      // 2. Initialisation RTCPeerConnection
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        console.log("🎥 Piste distante reçue !");
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
          setConnexionEtat("connecte");
        }
      };

      pc.onconnectionstatechange = () => {
        if (["disconnected", "failed"].includes(pc.connectionState)) {
          setConnexionEtat("termine");
        }
      };

      // 3. Connexion au serveur de signalisation via WebSocket
      const token = localStorage.getItem("token");
      const ws = new WebSocket(`ws://localhost:8100/ws/teleconsultation/${rdvId}?token=${token}`);
      wsRef.current = ws;

      pc.onicecandidate = (event) => {
        if (event.candidate && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ice-candidate", candidate: event.candidate }));
        }
      };

      ws.onopen = () => {
        console.log("🔌 WebSocket signalisation ouvert");
        setConnexionEtat("attente");
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("📩 Message reçu:", data.type);

          if (data.type === "peer-joined" && isInitiator) {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            ws.send(JSON.stringify({ type: "offer", sdp: offer }));
          }

          if (data.type === "offer" && !isInitiator) {
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
            
            // Traitement des candidats ICE reçus avant l'offre
            while (iceCandidatesQueue.current.length > 0) {
              const candidate = iceCandidatesQueue.current.shift();
              await pc.addIceCandidate(candidate);
            }

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            ws.send(JSON.stringify({ type: "answer", sdp: answer }));
          }

          if (data.type === "answer" && isInitiator) {
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
            
            // Traitement des candidats ICE reçus avant la réponse
            while (iceCandidatesQueue.current.length > 0) {
              const candidate = iceCandidatesQueue.current.shift();
              await pc.addIceCandidate(candidate);
            }
          }

          if (data.type === "ice-candidate") {
            const candidate = new RTCIceCandidate(data.candidate);
            if (pc.remoteDescription && pc.remoteDescription.type) {
              await pc.addIceCandidate(candidate);
            } else {
              iceCandidatesQueue.current.push(candidate);
            }
          }

          if (data.type === "peer-left") {
            setConnexionEtat("termine");
            setRemoteStream(null);
          }
        } catch (e) {
          console.error("Erreur lors du traitement du message de signalisation :", e);
        }
      };

      ws.onerror = (err) => {
        console.error("Erreur WebSocket :", err);
        setErreur("Erreur de connexion au serveur de signalisation.");
        setConnexionEtat("erreur");
      };
    };

    demarrer();

    return () => {
      annule = true;
      nettoyer();
    };
  }, [rdvId, isInitiator, nettoyer]);

  // Contrôles Audio / Vidéo
  const toggleMic = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setMicActif(track.enabled);
    }
  }, []);

  const toggleVideo = useCallback(() => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setVideoActive(track.enabled);
    }
  }, []);

  const raccrocher = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "peer-left" }));
    }
    nettoyer();
    setConnexionEtat("termine");
  }, [nettoyer]);

  return {
    localStream,
    remoteStream,
    connexionEtat,
    micActif,
    videoActive,
    erreur,
    toggleMic,
    toggleVideo,
    raccrocher,
  };
}