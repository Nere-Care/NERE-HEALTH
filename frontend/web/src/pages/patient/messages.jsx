import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, Send, ArrowLeft, Video, Paperclip,
  MoreVertical, Flag, Trash2, AlertTriangle, X, CheckCircle, XCircle, Lock
} from 'lucide-react';
import { connectWebSocket, onWebSocketMessage } from '../../services/websocketService';
import { fetchConversations, fetchMessages, envoyerMessage, envoyerFichier } from '../../services/messageService';
import { FileText, Download } from 'lucide-react';
import PasswordConfirmModal from '../../components/common/PasswordConfirmModal';

export default function Messages({ darkMode }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const messagesEndRef = useRef(null);

  // État de déverrouillage sécurisé
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(true);

  const [conversations, setConversations] = useState([]);
  const [convActive, setConvActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [recherche, setRecherche] = useState("");
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [showSignalerModal, setShowSignalerModal] = useState(false);
  const [showSupprimerModal, setShowSupprimerModal] = useState(false);
  const [motifSignalement, setMotifSignalement] = useState("");
  const [toast, setToast] = useState(null);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [uploadEnCours, setUploadEnCours] = useState(false);

  // Callback appelé quand le mot de passe est validé avec succès
  const handlePasswordSuccess = () => {
    setShowPasswordModal(false);
    setIsUnlocked(true);
  };

  const afficherToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const gererPieceJointe = () => {
    if (!convActive) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf,.doc,.docx';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (file.size > 10 * 1024 * 1024) {
        afficherToast("Fichier trop volumineux (max 10 Mo)", "error");
        return;
      }

      try {
        setUploadEnCours(true);
        const msg = await envoyerFichier(convActive.id, file);
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        setConversations(prev =>
          prev.map(c => c.id === convActive.id
            ? { ...c, dernier_message: msg.texte }
            : c
          )
        );
      } catch (err) {
        afficherToast(err.message, "error");
      } finally {
        setUploadEnCours(false);
      }
    };
    input.click();
  };

  const convActiveRef = useRef(convActive);
  useEffect(() => {
    convActiveRef.current = convActive;
  }, [convActive]);

  // 1. Charger la liste des conversations (uniquement si déverrouillé)
  const chargerConvs = useCallback(async () => {
    if (!isUnlocked) return;
    try {
      setLoadingConvs(true);
      const data = await fetchConversations();
      const convs = data ?? [];
      setConversations(convs);

      const convIdFromUrl = searchParams.get("conv");
      if (convIdFromUrl) {
        const convToOpen = convs.find(c => c.id === convIdFromUrl);
        if (convToOpen) {
          setConvActive(convToOpen);
          setConversations(prev =>
            prev.map(c => c.id === convToOpen.id ? { ...c, non_lus: 0 } : c)
          );
        }
      }
    } catch (err) {
      afficherToast(err.message, "error");
    } finally {
      setLoadingConvs(false);
    }
  }, [searchParams, isUnlocked]);

  useEffect(() => {
    if (isUnlocked) {
      chargerConvs();
    }
  }, [isUnlocked, chargerConvs]);

  // 2. Gestion du WebSocket (uniquement si déverrouillé)
  useEffect(() => {
    if (!isUnlocked) return;

    connectWebSocket();

    const unsubscribe = onWebSocketMessage((data) => {
      if (data.event === "nouveau_message") {
        if (convActiveRef.current && data.conversation_id === convActiveRef.current.id) {
          setMessages((prev) => {
            if (prev.some(m => m.id === data.message.id)) return prev;
            return [...prev, { ...data.message, est_moi: false }];
          });
        }
        chargerConvs();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isUnlocked, chargerConvs]);

  // 3. Charger messages au changement de conversation
  useEffect(() => {
    if (!convActive || !isUnlocked) return;
    const charger = async () => {
      try {
        setLoadingMsgs(true);
        const data = await fetchMessages(convActive.id);
        setMessages(data ?? []);
      } catch (err) {
        afficherToast(err.message, "error");
      } finally {
        setLoadingMsgs(false);
      }
    };
    charger();
  }, [convActive, isUnlocked]);

  // Scroll auto
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const ouvrirConversation = (conv) => {
    setConvActive(conv);
    setMenuOuvert(false);
    setConversations(prev =>
      prev.map(c => c.id === conv.id ? { ...c, non_lus: 0 } : c)
    );
  };

  const handleEnvoyer = async () => {
    if (!newMessage.trim() || !convActive || envoi) return;
    try {
      setEnvoi(true);
      const msg = await envoyerMessage(convActive.id, newMessage.trim());
      if (msg) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        setConversations(prev =>
          prev.map(c => c.id === convActive.id
            ? { ...c, dernier_message: newMessage.trim() }
            : c
          )
        );
      }
      setNewMessage("");
    } catch (err) {
      afficherToast(err.message, "error");
    } finally {
      setEnvoi(false);
    }
  };

  const lancerTeleconsultation = () => {
    if (convActive) {
      afficherToast(`Lancement avec ${convActive.nom}`);
      setTimeout(() => navigate('/teleconsultation'), 500);
    }
  };

  const supprimerConversation = () => {
    setConversations(prev => prev.filter(c => c.id !== convActive.id));
    setConvActive(null);
    setShowSupprimerModal(false);
    afficherToast("Conversation supprimée");
  };

  const signalerConversation = () => {
    if (!motifSignalement.trim()) {
      afficherToast("Veuillez sélectionner un motif", "error");
      return;
    }
    afficherToast("Conversation signalée avec succès");
    setShowSignalerModal(false);
    setMotifSignalement("");
  };

  const conversationsFiltrees = conversations.filter(c =>
    c.nom.toLowerCase().includes(recherche.toLowerCase()) ||
    c.role.toLowerCase().includes(recherche.toLowerCase())
  );

  const motifsSignalement = [
    "Spam ou publicité", "Contenu inapproprié",
    "Harcèlement", "Usurpation d'identité", "Autre",
  ];

  // -------------------------------------------------------------
  // 1. ÉCRAN SÉCURISÉ (Affiché avant validation du mot de passe)
  // -------------------------------------------------------------
// -------------------------------------------------------------
// 1. ÉCRAN SÉCURISÉ (Affiché avant validation du mot de passe)
// -------------------------------------------------------------
if (!isUnlocked) {
  return (
    <div className={`min-h-[100dvh] flex flex-col items-center justify-center p-6 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className={`p-8 rounded-3xl shadow-xl border text-center max-w-sm w-full mb-6 ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-100 text-gray-800"}`}>
        <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
          <Lock size={32} />
        </div>
        <h2 className="text-xl font-bold mb-2">
          Accès aux Messages Protégé
        </h2>
        <p className={`text-xs mb-6 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          Veuillez confirmer votre mot de passe pour accéder à vos discussions confidentielles.
        </p>
        <button
          onClick={() => setShowPasswordModal(true)}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition shadow-lg shadow-blue-500/20"
        >
          Saisir le mot de passe
        </button>
      </div>

      <PasswordConfirmModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handlePasswordSuccess}
        title="Accès sécurisé à la messagerie"
        description="Veuillez saisir votre mot de passe pour accéder à vos discussions."
        darkMode={darkMode}
      />
    </div>
  );
}

  // -------------------------------------------------------------
  // 2. PAGE MESSAGES NORMALE (Une fois le mot de passe validé)
  // -------------------------------------------------------------
  return (
    <div className={`min-h-[100dvh] flex overflow-hidden relative ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>

      {/* TOAST */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-slide-in
          ${toast.type === "error" ? "bg-red-500 text-white" : "bg-green-500 text-white"}`}>
          {toast.type === "error" ? <XCircle size={18} /> : <CheckCircle size={18} />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* LISTE CONVERSATIONS */}
      <div className={`${convActive ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 border-r
        ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>

        <div className={`p-4 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
          <h1 className="text-2xl font-bold text-blue-500">Messages</h1>
          <div className={`mt-4 flex items-center gap-2 px-3 py-2 rounded-xl
            ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className={`bg-transparent outline-none text-sm w-full
                ${darkMode ? "text-white placeholder-gray-400" : "text-gray-800"}`}
            />
            {recherche && (
              <button onClick={() => setRecherche("")}>
                <X size={14} className="text-gray-400" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : conversationsFiltrees.length === 0 ? (
            <div className="p-6 text-center">
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Aucune conversation
              </p>
            </div>
          ) : (
            conversationsFiltrees.map((conv) => (
              <button
                key={conv.id}
                onClick={() => ouvrirConversation(conv)}
                className={`w-full flex items-center gap-3 px-4 py-4 transition-all text-left
                  ${convActive?.id === conv.id
                    ? darkMode ? "bg-gray-700" : "bg-blue-50"
                    : darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg">
                    {conv.nom.charAt(0)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`font-semibold truncate ${darkMode ? "text-white" : "text-gray-800"}`}>
                      {conv.nom}
                    </p>
                    <span className="text-xs text-gray-400">{conv.dernier_message_at}</span>
                  </div>
                  <p className="text-xs text-gray-400 capitalize">{conv.role}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-gray-400 truncate">{conv.dernier_message}</p>
                    {conv.non_lus > 0 && (
                      <div className="min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-xs flex items-center justify-center ml-2">
                        {conv.non_lus}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* DISCUSSION */}
      {convActive && (
        <div className="flex flex-col flex-1 min-w-0">

          {/* HEADER */}
          <div className={`p-4 border-b flex items-center justify-between relative
            ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className="flex items-center gap-3">
              <button onClick={() => setConvActive(null)} className="md:hidden">
                <ArrowLeft size={22} className={darkMode ? "text-white" : "text-gray-700"} />
              </button>
              <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                {convActive.nom.charAt(0)}
              </div>
              <div>
                <p className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{convActive.nom}</p>
                <p className={`text-xs capitalize ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{convActive.role}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={lancerTeleconsultation}
                className={`p-2 rounded-lg transition ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
              >
                <Video size={20} className="text-blue-500" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setMenuOuvert(!menuOuvert)}
                  className={`p-2 rounded-lg transition ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                >
                  <MoreVertical size={20} className={darkMode ? "text-white" : "text-gray-700"} />
                </button>
                {menuOuvert && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOuvert(false)} />
                    <div className={`absolute right-0 top-full mt-1 w-48 rounded-xl shadow-lg z-20
                      ${darkMode ? "bg-gray-700 border border-gray-600" : "bg-white border border-gray-200"}`}>
                      <button
                        onClick={() => { setShowSignalerModal(true); setMenuOuvert(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm
                          ${darkMode ? "hover:bg-gray-600 text-white" : "hover:bg-gray-50 text-gray-700"}`}
                      >
                        <Flag size={16} className="text-orange-500" /> Signaler
                      </button>
                      <button
                        onClick={() => { setShowSupprimerModal(true); setMenuOuvert(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm
                          ${darkMode ? "hover:bg-gray-600 text-white" : "hover:bg-gray-50 text-gray-700"}`}
                      >
                        <Trash2 size={16} className="text-red-500" /> Supprimer
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* MESSAGES */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {loadingMsgs ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Aucun message. Commencez la conversation !
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.est_moi ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm
                    ${msg.est_moi
                      ? "bg-blue-600 text-white shadow-sm"
                      : darkMode ? "bg-gray-700 text-white" : "bg-white text-gray-800 shadow-sm"}`}>

                    {msg.type === "image" && msg.fichier_url && (
                      <img
                        src={msg.fichier_url}
                        alt={msg.fichier_nom || "Image"}
                        className="rounded-xl max-w-full max-h-64 object-cover cursor-pointer mb-1 hover:opacity-95 transition"
                        onClick={() => window.open(msg.fichier_url, "_blank")}
                      />
                    )}

                    {msg.type === "fichier" && msg.fichier_url && (
                      <a
                        href={msg.fichier_url}
                        download={msg.fichier_nom || "Fichier"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl transition mb-1
                          ${msg.est_moi 
                            ? "bg-blue-700 text-white hover:bg-blue-800" 
                            : darkMode ? "bg-gray-600 text-white hover:bg-gray-500" : "bg-gray-100 text-gray-800 hover:bg-gray-200"}`}
                      >
                        <FileText size={18} className="flex-shrink-0" />
                        <span className="text-xs truncate max-w-[180px] font-medium">{msg.fichier_nom || "Document"}</span>
                        <Download size={14} className="flex-shrink-0 opacity-80" />
                      </a>
                    )}

                    {msg.texte && <p className="break-words">{msg.texte}</p>}

                    <p className={`text-[10px] mt-1 text-right select-none ${msg.est_moi ? "text-blue-200" : "text-gray-400"}`}>
                      {msg.heure}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT */}
          <div className={`p-3 border-t flex items-center gap-3
            ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <button
              onClick={gererPieceJointe}
              disabled={uploadEnCours}
              className={`p-2 rounded-lg transition ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"} disabled:opacity-50`}
            >
              {uploadEnCours
                ? <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                : <Paperclip size={20} className="text-gray-400" />
              }
            </button>
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleEnvoyer()}
              placeholder="Écrire un message..."
              className={`flex-1 px-4 py-2 rounded-full text-sm outline-none
                ${darkMode ? "bg-gray-700 text-white placeholder-gray-400" : "bg-gray-100 text-gray-800"}`}
            />
            <button
              onClick={handleEnvoyer}
              disabled={!newMessage.trim() || envoi}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all
                ${newMessage.trim() && !envoi
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
            >
              {envoi
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Send size={18} />
              }
            </button>
          </div>
        </div>
      )}

      {/* ÉTAT VIDE desktop */}
      {!convActive && (
        <div className={`hidden md:flex flex-1 items-center justify-center ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
          <div className="text-center">
            <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center
              ${darkMode ? "bg-gray-800" : "bg-gray-100"}`}>
              <Send size={32} className="text-blue-500" />
            </div>
            <p className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>Vos messages</p>
            <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Sélectionnez une conversation pour commencer
            </p>
          </div>
        </div>
      )}

      {/* MODAL SIGNALEMENT */}
      {showSignalerModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl p-6
            ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"}`}>
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
              Signaler la conversation avec <strong>{convActive?.nom}</strong>
            </p>
            <div className="space-y-2 mb-4">
              {motifsSignalement.map((motif) => (
                <label key={motif} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition border-2
                  ${motifSignalement === motif
                    ? "border-orange-500 bg-orange-50"
                    : darkMode ? "border-transparent bg-gray-700 hover:bg-gray-600" : "border-transparent bg-gray-50 hover:bg-gray-100"}`}>
                  <input type="radio" name="motif" value={motif}
                    checked={motifSignalement === motif}
                    onChange={(e) => setMotifSignalement(e.target.value)}
                    className="accent-orange-500" />
                  <span className="text-sm">{motif}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowSignalerModal(false)}
                className={`flex-1 py-2.5 rounded-xl font-semibold ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                Annuler
              </button>
              <button onClick={signalerConversation}
                className="flex-1 py-2.5 rounded-xl font-semibold bg-orange-500 text-white hover:bg-orange-600">
                Signaler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SUPPRESSION */}
      {showSupprimerModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl p-6
            ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <h2 className="text-lg font-bold">Supprimer la conversation ?</h2>
            </div>
            <p className={`text-sm mb-6 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              Supprimer définitivement la conversation avec <strong>{convActive?.nom}</strong> ? Cette action est irréversible.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowSupprimerModal(false)}
                className={`flex-1 py-2.5 rounded-xl font-semibold ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                Annuler
              </button>
              <button onClick={supprimerConversation}
                className="flex-1 py-2.5 rounded-xl font-semibold bg-red-500 text-white hover:bg-red-600">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
    </div>
  );
}