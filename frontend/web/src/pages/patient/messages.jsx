import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Send, ArrowLeft, Video, Paperclip, MoreVertical,
  Flag, Trash2, AlertTriangle, X, CheckCircle, Loader, Lock, Calendar, Clock
} from 'lucide-react';
import { get, post, del, put } from '../../services/apiClient';
import { getStoredUser } from '../../services/auth';
import { getUserTimezone, slotToUTCISO, slotWallTimeInTZ } from '../../utils/timezone';

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

  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoSlots, setVideoSlots] = useState([]);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoSaving, setVideoSaving] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [videoError, setVideoError] = useState(null);
  const [videoTz, setVideoTz] = useState(null);

  const loadConversations = () =>
    get('/api/conversations', { limit: 50 })
      .then(data => setConversations(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const event = e.detail;
      if (!event || event.type !== 'nouveau_message') return;
      loadConversations();
      if (convActive && event.reference_externe === convActive.id) {
        put(`/api/conversations/${convActive.id}/lu`)
          .then(() => {
            setConversations(prev => prev.map(c => c.id === convActive.id ? { ...c, nb_messages_non_lus_patient: 0 } : c));
          })
          .catch(() => {});
        get('/api/messages', { conversation_id: convActive.id, limit: 100 })
          .then(data => setMessagesData(data || []))
          .catch(() => {});
      }
    };
    window.addEventListener('nere:notification', handler);
    return () => window.removeEventListener('nere:notification', handler);
  }, [convActive]);

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
    if ((conv.nb_messages_non_lus_patient || 0) > 0) {
      setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, nb_messages_non_lus_patient: 0 } : c));
      put(`/api/conversations/${conv.id}/lu`).catch(console.error);
    }
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
      setMenuOuvert(false);
      afficherToast("Conversation supprimée");
    } catch (err) {
      afficherToast("Erreur: " + err.message, 'error');
    }
  };

  const signalerConversation = async () => {
    if (!convActive || !motifSignalement) return;
    try {
      await post('/api/signalements', {
        conversation_id: convActive.id,
        motif: motifSignalement,
      });
      setShowSignalerModal(false);
      setMotifSignalement('');
      setMenuOuvert(false);
      afficherToast("Conversation signalée");
    } catch (err) {
      afficherToast("Erreur: " + (err.message || 'signalement'), 'error');
    }
  };

  const ouvrirVideoModal = async () => {
    if (!convActive || !convActive.medecin_id) return;
    setShowVideoModal(true);
    setVideoSlots([]);
    setSelectedSlot(null);
    setVideoError(null);
    setVideoTz(null);
    setVideoLoading(true);
    get(`/api/medecins/${convActive.medecin_id}`)
      .then(m => setVideoTz(m?.timezone || "Africa/Douala"))
      .catch(() => setVideoTz("Africa/Douala"));
    const tz = getUserTimezone();
    const now = new Date();
    const clientNow = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const dayFetches = [];
    for (let i = 0; i < 14; i++) {
      const dt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      const ds = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
      dayFetches.push(
        get(`/api/disponibilites/creneaux/${convActive.medecin_id}`, { date: ds, now: clientNow })
          .then(slots => ({ date: ds, slots: Array.isArray(slots) ? slots : [] }))
          .catch(() => ({ date: ds, slots: [] }))
      );
    }
    const results = await Promise.all(dayFetches);
    setVideoSlots(results.filter(r => r.slots.length > 0));
    setVideoLoading(false);
  };

  const reserverTeleconsultation = async () => {
    if (!selectedSlot || !convActive) return;
    const currentUser = getStoredUser();
    if (!currentUser) return;
    setVideoSaving(true);
    setVideoError(null);
    try {
      const tz = videoTz || "Africa/Douala";
      const debutISO = slotToUTCISO(selectedSlot.date, selectedSlot.start, tz);
      const finISO = slotToUTCISO(selectedSlot.date, selectedSlot.end, tz);
      await post('/api/rendez_vous', {
        medecin_id: convActive.medecin_id,
        patient_id: currentUser.id,
        date_heure_debut: debutISO,
        date_heure_fin: finISO,
        type: 'video',
        motif_consultation: 'Téléconsultation',
      });
      setShowVideoModal(false);
      setSelectedSlot(null);
      afficherToast("RDV de téléconsultation réservé");
      setTimeout(() => navigate('/rendez-vous'), 1500);
    } catch (err) {
      setVideoError(err?.message || "Erreur lors de la réservation");
    } finally {
      setVideoSaving(false);
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
    <div className={`flex flex-1 min-h-0 overflow-hidden relative pt-20 md:pt-24 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
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
                    <div className="flex items-center gap-2 min-w-0">
                      <p className={`font-semibold truncate ${darkMode ? "text-white" : "text-gray-800"}`}>{conv.medecin_nom || conv.patient_nom || 'Conversation'}</p>
                      {(conv.nb_messages_non_lus_patient || 0) > 0 && (
                        <div className="min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-xs flex items-center justify-center flex-shrink-0">{conv.nb_messages_non_lus_patient}</div>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">{conv.dernier_message_at ? new Date(conv.dernier_message_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                  </div>
                  <p className="text-xs text-gray-400">{conv.statut}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-gray-400 truncate">{conv.dernier_message_preview ? decodeMsg(conv.dernier_message_preview) : ''}</p>
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
              <button onClick={ouvrirVideoModal}
                className={`p-2 rounded-lg transition ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`} title="Prendre un RDV de téléconsultation">
                <Video size={20} className="text-green-500" />
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
                        {msg.created_at ? new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: getUserTimezone() }) : ''}
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

      {showVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl p-6 flex flex-col max-h-[90vh] ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"}`}>
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Video className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Téléconsultation</h2>
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Avec {convActive?.medecin_nom || convActive?.patient_nom}
                  </p>
                </div>
              </div>
              <button onClick={() => { setShowVideoModal(false); setSelectedSlot(null); }}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <p className={`text-xs mb-3 flex-shrink-0 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Choisissez un créneau dans le planning de {convActive?.medecin_nom || "votre médecin"} :
            </p>

            <div className="flex-1 overflow-y-auto min-h-0 space-y-3 mb-4">
              {videoLoading && (
                <div className="flex items-center justify-center py-10">
                  <Loader className="animate-spin text-green-500" size={28} />
                </div>
              )}

              {!videoLoading && videoSlots.length === 0 && (
                <div className="text-center py-10">
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Aucun créneau de téléconsultation disponible sur les 14 prochains jours.
                  </p>
                </div>
              )}

              {!videoLoading && videoSlots.map(group => (
                <div key={group.date}>
                  <p className={`text-xs font-semibold uppercase mb-1.5 flex items-center gap-1.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    <Calendar size={12} />
                    {new Date(group.date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.slots.map((slot, idx) => {
                      const selected = selectedSlot?.date === group.date && selectedSlot?.start === slot.start;
                      return (
                        <button key={idx}
                          onClick={() => setSelectedSlot({ date: group.date, start: slot.start, end: slot.end })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            selected
                              ? "bg-green-500 text-white border-green-500"
                              : darkMode
                                ? "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600"
                                : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                          }`}>
                          <Clock size={11} className="inline mr-1" />
                          {slotWallTimeInTZ(group.date, slot.start, videoTz || "Africa/Douala", getUserTimezone())} - {slotWallTimeInTZ(group.date, slot.end, videoTz || "Africa/Douala", getUserTimezone())}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {videoError && (
              <div className={`flex items-center gap-2 p-3 rounded-xl text-sm mb-3 flex-shrink-0 ${darkMode ? "bg-red-900/20 text-red-400" : "bg-red-50 text-red-600"}`}>
                <AlertTriangle size={16} />
                {videoError}
              </div>
            )}

            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => { setShowVideoModal(false); setSelectedSlot(null); }}
                className={`flex-1 py-2.5 rounded-xl font-semibold transition ${darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                Annuler
              </button>
              <button
                onClick={reserverTeleconsultation}
                disabled={!selectedSlot || videoSaving}
                className={`flex-1 py-2.5 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${
                  selectedSlot && !videoSaving ? "bg-green-500 text-white hover:bg-green-600" : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {videoSaving && <Loader size={16} className="animate-spin" />}
                Réserver
              </button>
            </div>
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
              <button onClick={signalerConversation}
                disabled={!motifSignalement}
                className={`flex-1 py-2.5 rounded-xl font-semibold transition ${motifSignalement ? "bg-orange-500 text-white hover:bg-orange-600" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}>Signaler</button>
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
