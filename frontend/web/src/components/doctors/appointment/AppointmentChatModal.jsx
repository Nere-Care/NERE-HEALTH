import { useState, useEffect, useRef } from "react";
import { X, Send, Lock, Unlock, MessageSquare } from "lucide-react";
import { get, post, put } from "../../../services/apiClient";
import { getStoredUser } from "../../../services/auth";
import { getUserTimezone } from "../../../utils/timezone";

function decodeMsg(data) {
  try {
    return decodeURIComponent(escape(atob(data)));
  } catch {
    return data || "";
  }
}

export default function AppointmentChatModal({
  open,
  onClose,
  rdv,
  darkMode,
}) {
  const currentUser = getStoredUser();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!open || !rdv) return;
    setLoading(true);

    const rdvId = rdv.id || rdv.rdvId;
    const patientId = rdv.patient_id || rdv.patientId;
    const medecinId = currentUser?.id;

    // Step 1: Try to find existing conversation by rdv_id directly
    get("/api/conversations", { rdv_id: rdvId })
      .then((convsByRdv) => {
        if (convsByRdv && convsByRdv.length > 0) {
          return convsByRdv[0];
        }
        // Step 2: Fall back — search all conversations for this patient+medecin pair
        return get("/api/conversations").then((allConvs) => {
          return allConvs.find(
            (c) =>
              !c.demande_avis_id &&
              String(c.patient_id) === String(patientId) &&
              String(c.medecin_id) === String(medecinId)
          ) || null;
        });
      })
      .then((existing) => {
        if (existing) {
          // Reopen if closed (doctor action)
          if (existing.statut === "fermee") {
            return put(`/api/conversations/${existing.id}`, { statut: "active" })
              .then((updated) => updated)
              .catch(() => existing);
          }
          return existing;
        }
        // Step 3: No conversation found — create one
        return post("/api/conversations", {
          rdv_id: rdvId,
          patient_id: patientId,
          medecin_id: medecinId,
        });
      })
      .then((conv) => {
        setConversation(conv);
        return get("/api/messages", { conversation_id: conv.id });
      })
      .then((msgs) => {
        setMessages(msgs || []);
      })
      .catch((err) => {
        console.error("Erreur chargement conversation/messages:", err);
      })
      .finally(() => setLoading(false));
  }, [open, rdv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!open || !rdv) return null;

  const isClosed = conversation?.statut === "fermee";

  const handleToggleStatus = async () => {
    if (!conversation) return;
    const newStatut = isClosed ? "active" : "fermee";
    try {
      const updated = await put(`/api/conversations/${conversation.id}`, {
        statut: newStatut,
      });
      setConversation(updated);
    } catch (err) {
      console.error("Erreur mise à jour statut conversation:", err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !conversation || sending) return;
    setSending(true);
    try {
      const encoded = btoa(unescape(encodeURIComponent(inputText.trim())));
      const newMsg = await post("/api/messages", {
        conversation_id: conversation.id,
        contenu_chiffre: encoded,
        type: "texte",
      });
      setMessages((prev) => [...prev, newMsg]);
      setInputText("");
    } catch (err) {
      console.error("Erreur envoi message:", err);
    } finally {
      setSending(false);
    }
  };

  const patientName = rdv.patientName || `${rdv.patient?.prenom || ""} ${rdv.patient?.nom || ""}`.trim() || "Patient";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className={`w-full max-w-2xl h-[600px] flex flex-col rounded-2xl shadow-xl overflow-hidden ${
          darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
        }`}
      >
        {/* HEADER */}
        <div
          className={`flex items-center justify-between px-5 py-4 border-b ${
            darkMode ? "border-gray-700 bg-gray-900/50" : "border-gray-100 bg-gray-50"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              {patientName[0]?.toUpperCase() || "P"}
            </div>
            <div>
              <h3 className="font-semibold text-base leading-snug">{patientName}</h3>
              <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Motif: {rdv.motif || rdv.motif_consultation || "Consultation"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Status toggle button */}
            <button
              onClick={handleToggleStatus}
              title={isClosed ? "Rouvrir la conversation" : "Fermer la conversation"}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                isClosed
                  ? "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20"
                  : "bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20"
              }`}
            >
              {isClosed ? <Lock size={14} /> : <Unlock size={14} />}
              {isClosed ? "Fermée (Cliquer pour rouvrir)" : "Ouverte (Cliquer pour fermer)"}
            </button>

            <button
              onClick={onClose}
              className={`p-1.5 rounded-xl transition ${
                darkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-200 text-gray-500"
              }`}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* MESSAGES LIST */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-400 opacity-40 mb-2" />
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Aucun message dans cette conversation.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Commencez à échanger avec votre patient ci-dessous.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = String(msg.expediteur_id) === String(currentUser?.id);
              return (
                <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                      isMine
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : darkMode
                        ? "bg-gray-700 text-white rounded-bl-sm"
                        : "bg-gray-100 text-gray-900 rounded-bl-sm"
                    }`}
                  >
                    <p className="break-words whitespace-pre-wrap">{decodeMsg(msg.contenu_chiffre)}</p>
                    <span
                      className={`block text-[10px] mt-1 text-right ${
                        isMine ? "text-blue-200" : "text-gray-400"
                      }`}
                    >
                      {new Date(msg.created_at).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: getUserTimezone(),
                      })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT FORM */}
        <form
          onSubmit={handleSend}
          className={`p-3 border-t flex items-center gap-2 ${
            darkMode ? "border-gray-700 bg-gray-900/50" : "border-gray-100 bg-gray-50"
          }`}
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isClosed
                ? "La conversation est fermée (rouvrez-la pour écrire)..."
                : "Écrivez votre message au patient..."
            }
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm outline-none transition ${
              darkMode
                ? "bg-gray-700 text-white placeholder-gray-400 focus:ring-1 focus:ring-blue-500"
                : "bg-white text-gray-800 border border-gray-200 focus:border-blue-500"
            }`}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
            <span>Envoyer</span>
          </button>
        </form>
      </div>
    </div>
  );
}
