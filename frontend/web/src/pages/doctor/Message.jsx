import { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { useLocation } from "react-router-dom";
import { get, post, put } from "../../services/apiClient";
import { getStoredUser } from "../../services/auth";
import ChatSidebar from "../../components/doctors/messages/ChatSidebar";
import ConversationHeader from "../../components/doctors/messages/ConversationHeader";
import MessageInput from "../../components/doctors/messages/MessageInput";
import ChatMessage from "../../components/doctors/messages/ChatMessage";
import MedicalOpinionCard from "../../components/doctors/messages/MedicalOpinionCard";

export default function Messages({ darkMode }) {
  const [message, setMessage] = useState("");
  const [selectedChat, setSelectedChat] = useState(null);
  const [blockedChats, setBlockedChats] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);
  const location = useLocation();

  const isBlocked = blockedChats.includes(selectedChat);
  const currentUser = getStoredUser();

  /* ─── Load conversations ─────────────────────────────────── */
  useEffect(() => {
    get("/api/conversations")
      .then((data) => {
        const mapped = data.map((c) => ({
          id: c.id,
          name: c.demande_avis_id
            ? c.other_medecin_nom || "Confrère"
            : c.patient_nom || c.medecin_nom || "Utilisateur",
          subtitle: c.demande_avis_id
            ? c.demande_specialite || "Avis médical"
            : "Patient",
          lastMessage: c.dernier_message_preview || "Aucun message",
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
          demande_statut: c.demande_statut,
          other_medecin_nom: c.other_medecin_nom,
          created_at: c.created_at,
        }));
        setConversations(mapped);
        if (location.state?.conversationId) {
          setSelectedChat(location.state.conversationId);
        }
      })
      .catch(() => {});
  }, []);

  /* ─── Load messages when conversation changes ───────────── */
  useEffect(() => {
    if (!selectedChat) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
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
    if (!message.trim() || !selectedChat || isBlocked) return;
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

  const toggleBlockConversation = () => {
    if (!selectedChat) return;
    setBlockedChats((prev) =>
      prev.includes(selectedChat)
        ? prev.filter((id) => id !== selectedChat)
        : [...prev, selectedChat]
    );
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

  const current = conversations.find((c) => c.id === selectedChat) || {
    name: "",
    subtitle: "",
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
      {/* ══════════════════════════════════════
          LEFT PANEL — conversations list
          • Title + search + filters: fixed (flex-shrink-0)
          • List: scrollable (flex-1 overflow-y-auto)
      ══════════════════════════════════════ */}
      <ChatSidebar
        conversations={conversations}
        selectedChat={selectedChat}
        setSelectedChat={setSelectedChat}
        darkMode={darkMode}
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
            <ConversationHeader
              current={current}
              darkMode={darkMode}
              isBlocked={isBlocked}
              onBack={() => setSelectedChat(null)}
              onToggleBlock={toggleBlockConversation}
              onToggleStatus={!current.demande_avis_id ? toggleConversationStatus : undefined}
            />

            {/* ② MedicalOpinionCard — FIXED (flex-shrink-0, only for avis) */}
            {current.demande_avis_id && (
              <MedicalOpinionCard
                conversation={current}
                darkMode={darkMode}
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
              isBlocked={isBlocked}
              isClosed={current?.statut === "fermee"}
              darkMode={darkMode}
            />
          </>
        )}
      </div>
    </div>
  );
}
