import { useCallback, useEffect, useRef, useState } from "react";
import { Room, RoomEvent, Track } from "livekit-client";
import { get } from "../services/apiClient";

const EMPTY = "";

export function useLivekit({ rdvId, displayName, remoteContainerRef, localContainerRef }) {
  const roomRef = useRef(null);
  const [status, setStatus] = useState("connecting"); // connecting | connected | error
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [remoteActive, setRemoteActive] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!rdvId) return;
    let disposed = false;
    const remoteEls = { camera: null, screen: null };

    const room = new Room({ adaptiveStream: true, dynacast: true });
    roomRef.current = room;
    setStatus("connecting");
    setMessages([]);

    const styleVideo = (el, cover) => {
      el.style.position = "absolute";
      el.style.inset = "0";
      el.style.width = "100%";
      el.style.height = "100%";
      el.style.objectFit = cover ? "cover" : "contain";
      if (!cover) el.style.background = "#000";
    };

    const attachRemote = (track, publication) => {
      const isScreen = publication.source === Track.Source.ScreenShare;
      if (isScreen && remoteEls.screen) {
        track.detach(remoteEls.screen);
        remoteEls.screen.remove();
      }
      if (!isScreen && remoteEls.camera) {
        track.detach(remoteEls.camera);
        remoteEls.camera.remove();
      }
      const el = track.attach();
      styleVideo(el, !isScreen);
      if (isScreen) {
        remoteEls.screen = el;
        setScreenSharing(true);
      } else {
        remoteEls.camera = el;
      }
      if (remoteContainerRef.current) remoteContainerRef.current.appendChild(el);
    };

    const detachRemote = (track, publication) => {
      const isScreen = publication.source === Track.Source.ScreenShare;
      const el = isScreen ? remoteEls.screen : remoteEls.camera;
      if (el) {
        track.detach(el);
        el.remove();
      }
      if (isScreen) {
        remoteEls.screen = null;
        setScreenSharing(false);
      } else {
        remoteEls.camera = null;
      }
    };

    const attachLocal = (publication) => {
      if (publication.source !== Track.Source.Camera || !publication.track) return;
      if (!localContainerRef.current) return;
      localContainerRef.current.innerHTML = EMPTY;
      const el = publication.track.attach();
      el.muted = true;
      styleVideo(el, true);
      localContainerRef.current.appendChild(el);
    };

    const onTrackSubscribed = (track, publication) => {
      if (track.kind === Track.Kind.Video) {
        attachRemote(track, publication);
        setRemoteActive(true);
      }
    };
    const onTrackUnsubscribed = (track, publication) => {
      if (track.kind === Track.Kind.Video) {
        detachRemote(track, publication);
        setRemoteActive(room.remoteParticipants.size > 0);
      }
    };
    const onDataReceived = (payload) => {
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload));
        setMessages((m) => [...m, msg]);
      } catch {
        // message illisible : ignoré
      }
    };
    const onTrackMuted = (publication) => {
      if (publication.source === Track.Source.Microphone) setMicOn(!publication.isMuted);
      if (publication.source === Track.Source.Camera) setCamOn(!publication.isMuted);
    };
    const onLocalTrackUnpublished = (publication) => {
      if (publication.source === Track.Source.Camera && localContainerRef.current) {
        localContainerRef.current.innerHTML = EMPTY;
      }
    };

    room
      .on(RoomEvent.TrackSubscribed, onTrackSubscribed)
      .on(RoomEvent.TrackUnsubscribed, onTrackUnsubscribed)
      .on(RoomEvent.ParticipantConnected, () => setRemoteActive(true))
      .on(RoomEvent.ParticipantDisconnected, () => setRemoteActive(room.remoteParticipants.size > 0))
      .on(RoomEvent.DataReceived, onDataReceived)
      .on(RoomEvent.TrackMuted, onTrackMuted)
      .on(RoomEvent.LocalTrackPublished, attachLocal)
      .on(RoomEvent.LocalTrackUnpublished, onLocalTrackUnpublished)
      .on(RoomEvent.Disconnected, () => setRemoteActive(false));

    get(`/api/rendez_vous/${rdvId}/token`)
      .then(({ url, token }) => {
        if (!url || !token) throw new Error("LiveKit non configuré");
        return room.connect(url, token);
      })
      .then(async () => {
        if (disposed) return;
        await Promise.all([
          room.localParticipant.setCameraEnabled(true),
          room.localParticipant.setMicrophoneEnabled(true),
        ]);
        setStatus("connected");
      })
      .catch(() => {
        if (!disposed) setStatus("error");
      });

    return () => {
      disposed = true;
      if (remoteEls.camera) remoteEls.camera.remove();
      if (remoteEls.screen) remoteEls.screen.remove();
      if (localContainerRef.current) localContainerRef.current.innerHTML = EMPTY;
      room.disconnect();
      room.removeAllListeners();
      roomRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rdvId]);

  const toggleMic = useCallback(() => {
    const next = !micOn;
    setMicOn(next);
    roomRef.current?.localParticipant.setMicrophoneEnabled(next).catch(() => {});
  }, [micOn]);

  const toggleCam = useCallback(() => {
    const next = !camOn;
    setCamOn(next);
    roomRef.current?.localParticipant.setCameraEnabled(next).catch(() => {});
  }, [camOn]);

  const toggleScreenShare = useCallback(() => {
    const enabled = !screenSharing;
    setScreenSharing(enabled);
    roomRef.current?.localParticipant.setScreenShareEnabled(enabled).catch(() => {
      setScreenSharing(false);
    });
  }, [screenSharing]);

  const sendMessage = useCallback(
    (texte) => {
      const room = roomRef.current;
      if (!room || !texte.trim()) return;
      const msg = { texte: texte.trim(), sender: displayName || "Utilisateur", at: Date.now() };
      room.localParticipant
        .publishData(new TextEncoder().encode(JSON.stringify(msg)), { reliable: true })
        .catch(() => {});
      setMessages((m) => [...m, msg]);
    },
    [displayName]
  );

  const disconnect = useCallback(() => {
    roomRef.current?.disconnect();
  }, []);

  return {
    status,
    micOn,
    camOn,
    remoteActive,
    screenSharing,
    messages,
    toggleMic,
    toggleCam,
    toggleScreenShare,
    sendMessage,
    disconnect,
  };
}
