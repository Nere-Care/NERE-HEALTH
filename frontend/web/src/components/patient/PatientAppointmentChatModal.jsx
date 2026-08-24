import { useState, useEffect, useRef } from "react";
import { X, Send, Lock, MessageSquare, AlertCircle } from "lucide-react";
import { get, post } from "../../services/apiClient";
import { getStoredUser } from "../../services/auth";
import { getUserTimezone } from "../../utils/timezone";

function decodeMsg(data) {
  try {
    return decodeURIComponent(escape(atob(data)));
  } catch {
    return data || "";
  }
}

export default function PatientAppointmentChatModal({
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
  const [noConvNotice, setNoConvNotice] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!open || !rdv) return;
    setLoading(true);
    setNoConvNotice(false);

    get("/api/conversations", { rdv_id: rdv.id })
      .then((convs) => {
        if (convs && convs.length > 0) {
          const conv = convs[0];
          setConversation(conv);
          return get("/api/messages", { conversation_id: conv.id });
        } else {
          setNoConvNotice(true);
          setConversation(null);
          return [];
        }
      })
      .then((msgs) => {
        setMessages(msgs || []);
      })
      .catch((err) => {
        console.error("Erreur chargement conversation patient:", err);
        setNoConvNotice(true);
      })
      .finally(() => setLoading(false));
  }, [open, rdv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!open || !rdv) return null;

  const isClosed = conversation?.statut === "fermee";
  const doctorName = rdv.medecin_nom ? `Dr. ${rdv.medecin_nom}` : "Votre Médecin";

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !conversation || isClosed || sending) return;
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
      console.error("Erreur envoi message patient:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className={`w-full max-w-2xl h-[580px] flex flex-col rounded-2xl shadow-xl overflow-hidden ${
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
              {doctorName[0]?.toUpperCase() || "D"}
            </div>
            <div>
              <h3 className="font-semibold text-base leading-snug">{doctorName}</h3>
              <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Message pour le rendez-vous
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl transition ${
              darkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-200 text-gray-500"
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* MESSAGES / BODY */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : noConvNotice ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8 px-4">
              <AlertCircle className="w-12 h-12 text-orange-400 mb-3" />
              <h4 className="font-semibold text-base mb-1">Conversation non ouverte</h4>
              <p className={`text-sm max-w-md ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                Le médecin n'a pas encore ouvert la conversation pour ce rendez-vous. La communication doit être initiée par le médecin.
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-400 opacity-40 mb-2" />
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Aucun message dans cette conversation.
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

        {/* INPUT / FOOTER */}
        {!noConvNotice && (
          <div
            className={`p-3 border-t ${
              darkMode ? "border-gray-700 bg-gray-900/50" : "border-gray-100 bg-gray-50"
            }`}
          >
            {isClosed ? (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 text-red-500 rounded-xl text-xs font-medium justify-center border border-red-500/20">
                <Lock size={14} />
                <span>Conversation fermée par le médecin</span>
              </div>
            ) : (
              <form onSubmit={handleSend} className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Écrivez votre message..."
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}
