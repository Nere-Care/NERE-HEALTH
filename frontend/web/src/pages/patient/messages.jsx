import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Send, ArrowLeft, Video, Paperclip, MoreVertical,
  Flag, Trash2, AlertTriangle, X, CheckCircle, Loader, Lock
} from 'lucide-react';
import { get, post, del } from '../../services/apiClient';

function encodeMsg(text) { return btoa(unescape(encodeURIComponent(text))); }
function decodeMsg(data) { try { return decodeURIComponent(escape(atob(data))); } catch { return data || ''; } }

export default function Messages({ darkMode }) {
  const navigate = useNavigate();
  const chatEndRef = useRef(null);
  const [conversations, setConversations] = useState([]);
  const [messagesData, setMessagesData] = useState([]);
  const [convActive, setConvActive] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [recherche, setRecherche] = useState('');
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [showSignalerModal, setShowSignalerModal] = useState(false);
  const [showSupprimerModal, setShowSupprimerModal] = useState(false);
  const [motifSignalement, setMotifSignalement] = useState('');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get('/api/conversations', { limit: 50 })
      .then(data => setConversations(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (convActive) {
      get('/api/messages', { conversation_id: convActive.id, limit: 100 })
        .then(data => setMessagesData(data || []))
        .catch(console.error);
    }
  }, [convActive]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messagesData]);

  const afficherToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const ouvrirConversation = (conv) => {
    setConvActive(conv);
    setMenuOuvert(false);
    get('/api/messages', { conversation_id: conv.id, limit: 100 })
      .then(data => setMessagesData(data || []))
      .catch(() => setMessagesData([]));
  };

  const envoyerMessage = async () => {
    if (!newMessage.trim() || !convActive) return;
    if (convActive.statut === 'fermee') {
      afficherToast("La conversation a été fermée par le médecin", 'error');
      return;
    }
    try {
      const msg = await post('/api/messages', {
        conversation_id: convActive.id,
        contenu_chiffre: encodeMsg(newMessage),
        type: 'texte',
      });
      setMessagesData(prev => [...prev, msg]);
      setNewMessage('');
    } catch (err) {
      const detail = err?.response?.data?.detail || err.message;
      afficherToast('Erreur: ' + detail, 'error');
    }
  };

  const gererPieceJointe = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf,.doc,.docx';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file || !convActive) return;
      try {
        const contenu = await file.text();
        await post('/api/messages', {
          conversation_id: convActive.id,
          contenu_chiffre: encodeMsg(`📎 ${file.name}`),
          type: 'fichier',
          fichier_nom: file.name,
          fichier_taille: file.size,
          fichier_mime: file.type,
        });
        afficherToast("Fichier envoyé");
      } catch (err) {
        afficherToast("Erreur d'envoi: " + err.message, 'error');
      }
    };
    input.click();
  };

  const supprimerConversation = async () => {
    if (!convActive) return;
    try {
      await del(`/api/conversations/${convActive.id}`);
      setConversations(prev => prev.filter(c => c.id !== convActive.id));
      setMessagesData([]);
      setConvActive(null);
      setShowSupprimerModal(false);
      afficherToast("Conversation supprimée");
    } catch (err) {
      afficherToast("Erreur: " + err.message, 'error');
    }
  };

  const conversationsFiltrees = conversations.filter(c =>
    `${c.medecin_nom || c.patient_nom || ''}`.toLowerCase().includes(recherche.toLowerCase())
  );

  const motifsSignalement = [
    "Spam ou publicité", "Contenu inapproprié", "Harcèlement",
    "Usurpation d'identité", "Autre",
  ];

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <Loader className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className={`min-h-[100dvh] flex overflow-hidden relative ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-slide-in
          ${toast.type === "error" ? "bg-red-500 text-white" : "bg-green-500 text-white"}`}>
          <CheckCircle size={18} />
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      <div className={`${convActive && "hidden md:flex"} flex-col w-full md:w-80 border-r ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        <div className={`p-4 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
          <h1 className="text-2xl font-bold text-blue-500">Messages</h1>
          <div className={`mt-4 flex items-center gap-2 px-3 py-2 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
            <Search size={16} className="text-gray-400" />
            <input type="text" placeholder="Rechercher..." value={recherche}
              onChange={e => setRecherche(e.target.value)}
              className={`bg-transparent outline-none text-sm w-full ${darkMode ? "text-white placeholder-gray-400" : "text-gray-800"}`} />
            {recherche && <button onClick={() => setRecherche('')}><X size={14} className="text-gray-400" /></button>}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversationsFiltrees.length === 0 ? (
            <div className="p-6 text-center"><p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Aucune conversation</p></div>
          ) : (
            conversationsFiltrees.map(conv => (
              <button key={conv.id} onClick={() => ouvrirConversation(conv)}
                className={`w-full flex items-center gap-3 px-4 py-4 transition-all text-left ${convActive?.id === conv.id ? (darkMode ? "bg-gray-700" : "bg-blue-50") : (darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100")}`}>
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                    {(conv.medecin_nom || conv.patient_nom || '?').charAt(0)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`font-semibold truncate ${darkMode ? "text-white" : "text-gray-800"}`}>{conv.medecin_nom || conv.patient_nom || 'Conversation'}</p>
                    <span className="text-xs text-gray-400">{conv.dernier_message_at ? new Date(conv.dernier_message_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                  </div>
                  <p className="text-xs text-gray-400">{conv.statut}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-gray-400 truncate">{conv.dernier_message_preview ? decodeMsg(conv.dernier_message_preview) : ''}</p>
                    {(conv.nb_messages_non_lus_patient || 0) > 0 && (
                      <div className="min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-xs flex items-center justify-center ml-2">{conv.nb_messages_non_lus_patient}</div>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {convActive && (
        <div className="flex flex-col flex-1">
          <div className={`p-4 border-b flex items-center justify-between relative ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className="flex items-center gap-3">
              <button onClick={() => setConvActive(null)} className="md:hidden"><ArrowLeft size={22} className={darkMode ? "text-white" : "text-gray-700"} /></button>
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                  {(convActive.medecin_nom || convActive.patient_nom || '?').charAt(0)}
                </div>
              </div>
              <div>
                <p className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{convActive.medecin_nom || convActive.patient_nom || 'Conversation'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => afficherToast("Téléconsultation")}
                className={`p-2 rounded-lg transition ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`} title="Lancer une téléconsultation">
                <Video size={20} className="text-blue-500" />
              </button>
              <div className="relative">
                <button onClick={() => setMenuOuvert(!menuOuvert)}
                  className={`p-2 rounded-lg transition ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}>
                  <MoreVertical size={20} className={darkMode ? "text-white" : "text-gray-700"} />
                </button>
                {menuOuvert && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOuvert(false)} />
                    <div className={`absolute right-0 top-full mt-1 w-48 rounded-xl shadow-lg z-20 ${darkMode ? "bg-gray-700 border border-gray-600" : "bg-white border border-gray-200"}`}>
                      <button onClick={() => { setShowSignalerModal(true); setMenuOuvert(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition ${darkMode ? "hover:bg-gray-600 text-white" : "hover:bg-gray-50 text-gray-700"}`}>
                        <Flag size={16} className="text-orange-500" /> Signaler
                      </button>
                      <button onClick={() => { setShowSupprimerModal(true); setMenuOuvert(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition ${darkMode ? "hover:bg-gray-600 text-white" : "hover:bg-gray-50 text-gray-700"}`}>
                        <Trash2 size={16} className="text-red-500" /> Supprimer
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {messagesData.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Aucun message. Commencez la conversation !</p>
              </div>
            ) : (
              messagesData.map(msg => {
                const isMine = msg.expediteur_id === convActive.patient_id;
                return (
                  <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${isMine ? "bg-blue-500 text-white" : darkMode ? "bg-gray-700 text-white" : "bg-white shadow"}`}>
                      <p>{decodeMsg(msg.contenu_chiffre)}</p>
                      <p className={`text-[10px] mt-1 text-right ${isMine ? "text-blue-100" : "text-gray-400"}`}>
                        {msg.created_at ? new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {convActive.statut === 'fermee' ? (
            <div className={`p-4 border-t flex items-center justify-center gap-2 text-sm font-medium
              ${darkMode ? 'border-gray-700 bg-red-900/20 text-red-400' : 'border-gray-200 bg-red-50 text-red-600'}`}>
              <Lock size={16} />
              <span>La conversation a été fermée par le médecin</span>
            </div>
          ) : (
            <div className={`p-3 border-t flex items-center gap-3 pb-[env(safe-area-inset-bottom)] ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <button onClick={gererPieceJointe}
                className={`p-2 rounded-lg transition ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`} title="Joindre un fichier">
                <Paperclip size={20} className="text-gray-400" />
              </button>
              <input value={newMessage} onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && envoyerMessage()}
                placeholder="Écrire un message..."
                className={`flex-1 px-4 py-2 rounded-full text-sm outline-none ${darkMode ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-gray-100 text-gray-800'}`} />
              <button onClick={envoyerMessage} disabled={!newMessage.trim()}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${newMessage.trim() ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>
                <Send size={18} />
              </button>
            </div>
          )}
        </div>
      )}

      {!convActive && (
        <div className={`hidden md:flex flex-1 items-center justify-center ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
          <div className="text-center">
            <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${darkMode ? "bg-gray-800" : "bg-gray-100"}`}>
              <Send size={32} className="text-blue-500" />
            </div>
            <p className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>Vos messages</p>
            <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Sélectionnez une conversation pour commencer</p>
          </div>
        </div>
      )}

      {showSignalerModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl p-6 ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-orange-500" /></div>
                <h2 className="text-lg font-bold">Signaler la conversation</h2>
              </div>
              <button onClick={() => setShowSignalerModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <p className={`text-sm mb-4 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              Signaler la conversation avec <strong>{convActive?.medecin_nom || convActive?.patient_nom}</strong>
            </p>
            <div className="space-y-2 mb-4">
              <p className={`text-xs font-semibold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Motif du signalement</p>
              {motifsSignalement.map(motif => (
                <label key={motif}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${motifSignalement === motif ? (darkMode ? "bg-gray-700 border-2 border-orange-500" : "bg-orange-50 border-2 border-orange-500") : (darkMode ? "bg-gray-700 border-2 border-transparent hover:bg-gray-600" : "bg-gray-50 border-2 border-transparent hover:bg-gray-100")}`}>
                  <input type="radio" name="motif" value={motif} checked={motifSignalement === motif}
                    onChange={e => setMotifSignalement(e.target.value)} className="accent-orange-500" />
                  <span className="text-sm">{motif}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowSignalerModal(false)}
                className={`flex-1 py-2.5 rounded-xl font-semibold transition ${darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>Annuler</button>
              <button onClick={() => { afficherToast("Conversation signalée"); setShowSignalerModal(false); setMotifSignalement(''); setMenuOuvert(false); }}
                className="flex-1 py-2.5 rounded-xl font-semibold bg-orange-500 text-white hover:bg-orange-600 transition">Signaler</button>
            </div>
          </div>
        </div>
      )}

      {showSupprimerModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl p-6 ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><Trash2 className="w-5 h-5 text-red-500" /></div>
              <h2 className="text-lg font-bold">Supprimer la conversation ?</h2>
            </div>
            <p className={`text-sm mb-6 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              Cette action supprimera définitivement votre conversation avec <strong>{convActive?.medecin_nom || convActive?.patient_nom}</strong>.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowSupprimerModal(false)}
                className={`flex-1 py-2.5 rounded-xl font-semibold transition ${darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>Annuler</button>
              <button onClick={supprimerConversation}
                className="flex-1 py-2.5 rounded-xl font-semibold bg-red-500 text-white hover:bg-red-600 transition">Supprimer</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes slide-in{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}.animate-slide-in{animation:slide-in .3s ease-out}`}</style>
    </div>
  );
}
