import { useState, useEffect, useRef } from "react";
import { Send, Flag, Trash2, AlertTriangle, X, CheckCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { get, post, put, del } from "../../services/apiClient";
import { getStoredUser } from "../../services/auth";
import ChatSidebar from "../../components/doctors/messages/ChatSidebar";
import ConversationHeader from "../../components/doctors/messages/ConversationHeader";
import MessageInput from "../../components/doctors/messages/MessageInput";
import ChatMessage from "../../components/doctors/messages/ChatMessage";
import MedicalOpinionCard from "../../components/doctors/messages/MedicalOpinionCard";
import ScheduleOpinionMeeting from "../../components/doctors/appointment/ScheduleOpinionMeeting";

const MOTIFS_SIGNALEMENT = [
  "Spam ou publicité",
  "Contenu inapproprié",
  "Harcèlement",
  "Usurpation d'identité",
  "Autre",
];

const decodeMsg = (data) => {
  try {
    return decodeURIComponent(escape(atob(data)));
  } catch {
    return data || "";
  }
};

const mapConversation = (c) => ({
  id: c.id,
  name: c.demande_avis_id
    ? c.other_medecin_nom || "Confrère"
    : c.patient_nom || c.medecin_nom || "Utilisateur",
  subtitle: c.demande_avis_id
    ? c.demande_specialite || "Avis médical"
    : "Patient",
  lastMessage: c.dernier_message_preview
    ? decodeMsg(c.dernier_message_preview)
    : "Aucun message",
  time: c.updated_at
    ? new Date(c.updated_at).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "",
  unread: c.nb_messages_non_lus_medecin || 0,
  statut: c.statut,
  rdv_id: c.rdv_id,
  demande_avis_id: c.demande_avis_id,
  demande_motif: c.demande_motif,
  demande_specialite: c.demande_specialite,
  demande_patient_nom: c.demande_patient_nom,
  demande_patient_id: c.demande_patient_id,
  demande_dossier_medical_id: c.demande_dossier_medical_id,
  demande_statut: c.demande_statut,
  demande_medecin_demandeur_id: c.demande_medecin_demandeur_id,
  demande_medecin_cible_id: c.demande_medecin_cible_id,
  demande_medecin_accepteur_id: c.demande_medecin_accepteur_id,
  other_medecin_nom: c.other_medecin_nom,
  demande_montant_facture: c.demande_montant_facture,
  demande_caution_montant: c.demande_caution_montant,
  created_at: c.created_at,
});

export default function Messages({ darkMode }) {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [selectedChat, setSelectedChat] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [showSignalerModal, setShowSignalerModal] = useState(false);
  const [showSupprimerModal, setShowSupprimerModal] = useState(false);
  const [motifSignalement, setMotifSignalement] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [toast, setToast] = useState(null);
  const messagesEndRef = useRef(null);
  const location = useLocation();

  const currentUser = getStoredUser();

  const afficherToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ─── Load conversations ─────────────────────────────────── */
  const loadConversations = () =>
    get("/api/conversations")
      .then((data) => {
        const mapped = data.map(mapConversation);
        setConversations((prev) => {
          const selected = prev.find((c) => c.id === selectedChat);
          if (selected && selected.unread > 0) {
            return mapped.map((c) =>
              c.id === selectedChat ? { ...c, unread: 0 } : c
            );
          }
          return mapped;
        });
        if (location.state?.conversationId) {
          setSelectedChat(location.state.conversationId);
          navigate(".", { replace: true });
        }
      })
      .catch(() => {});

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 30000);
    return () => clearInterval(interval);
  }, [selectedChat]);

  /* ─── Live : nouvelle notification → rafraîchir la liste ── */
  useEffect(() => {
    const handler = (e) => {
      const event = e.detail;
      if (!event || event.type !== "nouveau_message") return;
      loadConversations();
      if (selectedChat && event.reference_externe === selectedChat) {
        put(`/api/conversations/${selectedChat}/lu`)
          .then(() => {
            setConversations((prev) =>
              prev.map((c) => (c.id === selectedChat ? { ...c, unread: 0 } : c))
            );
          })
          .catch(() => {});
        get("/api/messages", { conversation_id: selectedChat })
          .then((data) => {
            setMessages(data);
            setTimeout(
              () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
              100
            );
          })
          .catch(() => {});
      }
    };
    window.addEventListener("nere:notification", handler);
    return () => window.removeEventListener("nere:notification", handler);
  }, [selectedChat]);

  /* ─── Load messages when conversation changes ───────────── */
  useEffect(() => {
    if (!selectedChat) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    put(`/api/conversations/${selectedChat}/lu`)
      .then(() => {
        setConversations((prev) =>
          prev.map((c) => (c.id === selectedChat ? { ...c, unread: 0 } : c))
        );
      })
      .catch(() => {});
    get("/api/messages", { conversation_id: selectedChat })
      .then((data) => {
        setMessages(data);
        setLoadingMessages(false);
        setTimeout(
          () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
          100
        );
      })
      .catch(() => setLoadingMessages(false));
  }, [selectedChat]);

  /* ─── Send message ──────────────────────────────────────── */
  const handleSend = async () => {
    if (!message.trim() || !selectedChat) return;
    try {
      const newMsg = await post("/api/messages", {
        conversation_id: selectedChat,
        contenu_chiffre: btoa(unescape(encodeURIComponent(message.trim()))),
        type: "texte",
      });
      setMessages((prev) => [...prev, newMsg]);
      setMessage("");
      setTimeout(
        () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
        100
      );
    } catch (err) {
      console.error("Erreur envoi message:", err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* ─── Toggle conversation open/closed (doctor only) ─────── */
  const toggleConversationStatus = async () => {
    if (!selectedChat) return;
    const conv = conversations.find((c) => c.id === selectedChat);
    if (!conv) return;
    const newStatut = conv.statut === "fermee" ? "active" : "fermee";
    try {
      await put(`/api/conversations/${selectedChat}`, { statut: newStatut });
      setConversations((prev) =>
        prev.map((c) => c.id === selectedChat ? { ...c, statut: newStatut } : c)
      );
    } catch (err) {
      console.error("Erreur mise à jour statut conversation:", err);
    }
  };

  /* ─── Signaler ──────────────────────────────────────────── */
  const signalerConversation = async () => {
    if (!selectedChat || !motifSignalement) return;
    try {
      await post("/api/signalements", {
        conversation_id: selectedChat,
        motif: motifSignalement,
      });
      setShowSignalerModal(false);
      setMotifSignalement("");
      setMenuOuvert(false);
      afficherToast("Conversation signalée");
    } catch (err) {
      afficherToast("Erreur: " + (err?.message || "signalement"), "error");
    }
  };

  /* ─── Supprimer (soft-delete) ───────────────────────────── */
  const supprimerConversation = async () => {
    if (!selectedChat) return;
    try {
      await del(`/api/conversations/${selectedChat}`);
      setConversations((prev) => prev.filter((c) => c.id !== selectedChat));
      setMessages([]);
      setSelectedChat(null);
      setShowSupprimerModal(false);
      setMenuOuvert(false);
      afficherToast("Conversation supprimée");
    } catch (err) {
      afficherToast("Erreur: " + (err?.message || "suppression"), "error");
    }
  };

  const current = conversations.find((c) => c.id === selectedChat) || {
    name: "",
    subtitle: "",
  };

  /* ─── Request "Planifier un RDV" pour conversation confrère ── */
  const scheduleRequest = (() => {
    if (!current.demande_avis_id || !currentUser?.id) return null;
    const otherMedecinId =
      current.demande_medecin_demandeur_id === currentUser.id
        ? current.demande_medecin_cible_id
        : current.demande_medecin_demandeur_id;
    if (!otherMedecinId) return null;
    return {
      medecinDemandeurId: otherMedecinId,
      patientId: current.demande_patient_id || null,
      motif: current.demande_motif || "Avis médical",
    };
  })();

  const handleScheduled = () => {
    setShowSchedule(false);
    afficherToast("RDV de téléconsultation planifié");
    setTimeout(() => navigate("/appointments"), 1200);
  };

  /* ─────────────────────────────────────────────────────────
     LAYOUT STRATEGY
     • The page renders inside <main> which is a flex-1 child
       of the `fixed top-[70px] bottom-0` zone in Layout.jsx.
     • We use flex-1 min-h-0 (NOT h-full) so we never escape
       that bounding box → the app header remains visible.
     • overflow-hidden on THIS div stops <main>'s own scroll.
  ──────────────────────────────────────────────────────────── */
  return (
    <div
      className={`flex flex-1 min-h-0 overflow-hidden pt-20 md:pt-24
        ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-black"}`}
    >
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-slide-in
          ${toast.type === "error" ? "bg-red-500 text-white" : "bg-green-500 text-white"}`}>
          <CheckCircle size={18} />
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* ══════════════════════════════════════
          LEFT PANEL — conversations list
      ══════════════════════════════════════ */}
      <ChatSidebar
        conversations={conversations}
        selectedChat={selectedChat}
        setSelectedChat={setSelectedChat}
        darkMode={darkMode}
        currentUserId={currentUser?.id}
      />

      {/* ══════════════════════════════════════
          RIGHT PANEL — active conversation
      ══════════════════════════════════════ */}
      <div
        className={`flex-1 flex flex-col min-h-0 overflow-hidden
          ${selectedChat === null ? "hidden md:flex" : "flex"}
          ${darkMode ? "bg-gray-900" : "bg-white"}`}
      >
        {/* ── Empty state ── */}
        {!selectedChat && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400">
            <Send className="w-14 h-14 opacity-20" />
            <p className="text-sm font-medium">Sélectionnez une conversation</p>
          </div>
        )}

        {/* ── Active conversation ── */}
        {selectedChat && (
          <>
            {/* ① ConversationHeader — FIXED (flex-shrink-0) */}
            <div className="relative flex-shrink-0">
              <ConversationHeader
                current={current}
                darkMode={darkMode}
                onBack={() => setSelectedChat(null)}
                onToggleStatus={!current.demande_avis_id ? toggleConversationStatus : undefined}
                onVideo={current.demande_avis_id ? () => setShowSchedule(true) : undefined}
                onOpenMenu={(e) => {
                  e?.stopPropagation();
                  setMenuOuvert((v) => !v);
                }}
              />

              {menuOuvert && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOuvert(false)} />
                  <div className={`absolute right-3 top-full z-20 mt-1 w-48 rounded-xl shadow-lg
                    ${darkMode ? "bg-gray-700 border border-gray-600" : "bg-white border border-gray-200"}`}>
                    <button
                      onClick={() => { setShowSignalerModal(true); setMenuOuvert(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition ${darkMode ? "hover:bg-gray-600 text-white" : "hover:bg-gray-50 text-gray-700"}`}
                    >
                      <Flag size={16} className="text-orange-500" /> Signaler
                    </button>
                    <button
                      onClick={() => { setShowSupprimerModal(true); setMenuOuvert(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition ${darkMode ? "hover:bg-gray-600 text-white" : "hover:bg-gray-50 text-gray-700"}`}
                    >
                      <Trash2 size={16} className="text-red-500" /> Supprimer
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* ② MedicalOpinionCard — FIXED (flex-shrink-0, only for avis) */}
            {current.demande_avis_id && (
              <MedicalOpinionCard
                conversation={current}
                darkMode={darkMode}
                currentUserId={currentUser?.id}
                onSendDossierRequest={async (text) => {
                  try {
                    const newMsg = await post("/api/messages", {
                      conversation_id: selectedChat,
                      contenu_chiffre: btoa(unescape(encodeURIComponent(text))),
                      type: "texte",
                    });
                    setMessages((prev) => [...prev, newMsg]);
                    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
                  } catch {}
                }}
              />
            )}

            {/* ③ Messages — ONLY scrollable zone */}
            <div
              className={`flex-1 min-h-0 overflow-y-auto px-4 py-3
                ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}
            >
              {loadingMessages && (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                </div>
              )}

              {!loadingMessages && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                  <Send className="w-12 h-12 opacity-20" />
                  <p className="text-sm">Aucun message. Commencez la discussion !</p>
                </div>
              )}

              {!loadingMessages &&
                messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    msg={msg}
                    darkMode={darkMode}
                  />
                ))}

              {/* Auto-scroll anchor */}
              <div ref={messagesEndRef} />
            </div>

            {/* ④ MessageInput — FIXED at bottom (flex-shrink-0) */}
            <MessageInput
              message={message}
              setMessage={setMessage}
              onSend={handleSend}
              onKeyDown={handleKeyDown}
              isBlocked={false}
              isClosed={current?.statut === "fermee" || current?.demande_statut === "cloturee"}
              darkMode={darkMode}
            />
          </>
        )}
      </div>

      {/* ── Modale "Planifier un RDV" (confrères) ── */}
      {showSchedule && scheduleRequest && (
        <ScheduleOpinionMeeting
          open={showSchedule}
          onClose={() => setShowSchedule(false)}
          request={scheduleRequest}
          onSchedule={handleScheduled}
          darkMode={darkMode}
        />
      )}

      {/* ── Modale Signaler ── */}
      {showSignalerModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl p-6 ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                </div>
                <h2 className="text-lg font-bold">Signaler la conversation</h2>
              </div>
              <button onClick={() => setShowSignalerModal(false)}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <p className={`text-sm mb-4 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              Signaler la conversation avec <strong>{current.name}</strong>
            </p>
            <div className="space-y-2 mb-4">
              <p className={`text-xs font-semibold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Motif du signalement</p>
              {MOTIFS_SIGNALEMENT.map((motif) => (
                <label
                  key={motif}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${
                    motifSignalement === motif
                      ? (darkMode ? "bg-gray-700 border-2 border-orange-500" : "bg-orange-50 border-2 border-orange-500")
                      : (darkMode ? "bg-gray-700 border-2 border-transparent hover:bg-gray-600" : "bg-gray-50 border-2 border-transparent hover:bg-gray-100")
                  }`}
                >
                  <input type="radio" name="motif" value={motif} checked={motifSignalement === motif}
                    onChange={(e) => setMotifSignalement(e.target.value)} className="accent-orange-500" />
                  <span className="text-sm">{motif}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSignalerModal(false)}
                className={`flex-1 py-2.5 rounded-xl font-semibold transition ${darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                Annuler
              </button>
              <button
                onClick={signalerConversation}
                disabled={!motifSignalement}
                className={`flex-1 py-2.5 rounded-xl font-semibold transition ${motifSignalement ? "bg-orange-500 text-white hover:bg-orange-600" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
              >
                Signaler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modale Supprimer ── */}
      {showSupprimerModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl p-6 ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <h2 className="text-lg font-bold">Supprimer la conversation ?</h2>
            </div>
            <p className={`text-sm mb-6 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              Cette action supprimera la conversation avec <strong>{current.name}</strong> de votre liste.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSupprimerModal(false)}
                className={`flex-1 py-2.5 rounded-xl font-semibold transition ${darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                Annuler
              </button>
              <button
                onClick={supprimerConversation}
                className="flex-1 py-2.5 rounded-xl font-semibold bg-red-500 text-white hover:bg-red-600 transition"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes slide-in{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}.animate-slide-in{animation:slide-in .3s ease-out}`}</style>
    </div>
  );
}
