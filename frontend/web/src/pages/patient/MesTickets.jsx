import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Loader2, MessageCircle, Send, Clock, CheckCircle, AlertCircle, ChevronDown, ChevronUp, ArrowLeft, Paperclip, X } from 'lucide-react';
import { getMyTickets, getTicketReponses, addTicketReponse, uploadTicketFile } from '../../services/support';

const STATUT_COLORS = {
  ouvert: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Ouvert' },
  en_cours: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'En cours' },
  resolu: { bg: 'bg-green-100', text: 'text-green-700', label: 'Résolu' },
  ferme: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Fermé' },
};

const PRIORITE_COLORS = {
  basse: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Basse' },
  moyenne: { bg: 'bg-blue-100', text: 'text-blue-600', label: 'Moyenne' },
  haute: { bg: 'bg-orange-100', text: 'text-orange-600', label: 'Haute' },
  urgente: { bg: 'bg-red-100', text: 'text-red-600', label: 'Urgente' },
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function MesTickets({ darkMode }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [reponses, setReponses] = useState([]);
  const [loadingReponses, setLoadingReponses] = useState(false);
  const [nouvelleReponse, setNouvelleReponse] = useState("");
  const [sendingReponse, setSendingReponse] = useState(false);
  const [responseFile, setResponseFile] = useState(null);
  const [filterStatut, setFilterStatut] = useState("");

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const data = await getMyTickets(filterStatut ? { statut: filterStatut } : {});
      setTickets(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [filterStatut]);

  const handleSelectTicket = async (ticket) => {
    setSelectedTicket(ticket);
    setLoadingReponses(true);
    try {
      const data = await getTicketReponses(ticket.id);
      setReponses(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingReponses(false);
    }
  };

  const handleSendReponse = async () => {
    if (!nouvelleReponse.trim()) return;
    setSendingReponse(true);
    try {
      let piece_jointe_url = null;
      if (responseFile) {
        const uploaded = await uploadTicketFile(responseFile);
        piece_jointe_url = uploaded.url;
      }
      await addTicketReponse(selectedTicket.id, nouvelleReponse.trim(), piece_jointe_url);
      setNouvelleReponse("");
      setResponseFile(null);
      const data = await getTicketReponses(selectedTicket.id);
      setReponses(data);
      toast.success("Réponse envoyée");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSendingReponse(false);
    }
  };

  if (selectedTicket) {
    return (
      <div className={`p-6 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <button
          onClick={() => { setSelectedTicket(null); setReponses([]); }}
          className={`flex items-center gap-2 mb-4 text-sm font-medium ${darkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"}`}
        >
          <ArrowLeft size={16} /> Retour à mes tickets
        </button>

        <div className={`rounded-2xl shadow p-5 mb-4 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <div className="flex items-start justify-between mb-3">
            <h2 className={`text-base font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
              {selectedTicket.sujet}
            </h2>
            <div className="flex gap-2">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUT_COLORS[selectedTicket.statut]?.bg} ${STATUT_COLORS[selectedTicket.statut]?.text}`}>
                {STATUT_COLORS[selectedTicket.statut]?.label}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${PRIORITE_COLORS[selectedTicket.priorite]?.bg} ${PRIORITE_COLORS[selectedTicket.priorite]?.text}`}>
                {PRIORITE_COLORS[selectedTicket.priorite]?.label}
              </span>
            </div>
          </div>
          <p className={`text-xs mb-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            {selectedTicket.numero} · Catégorie : {selectedTicket.categorie_nom} · Créé le {formatDate(selectedTicket.created_at)}
          </p>
          <p className={`text-sm whitespace-pre-wrap ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            {selectedTicket.description}
          </p>
        </div>

        <div className={`rounded-2xl shadow p-5 mb-4 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <h3 className={`text-sm font-bold mb-4 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
            Conversation
          </h3>

          {loadingReponses ? (
            <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-blue-500" /></div>
          ) : reponses.length === 0 ? (
            <p className={`text-sm text-center py-4 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
              Aucune réponse pour le moment
            </p>
          ) : (
            <div className="space-y-3 mb-4">
              {reponses.map((r) => {
                const isAdmin = r.auteur_role === 'admin';
                return (
                  <div key={r.id} className={`rounded-xl p-3 ${isAdmin ? (darkMode ? "bg-blue-900/30 border border-blue-800" : "bg-blue-50 border border-blue-100") : (darkMode ? "bg-gray-700" : "bg-gray-100")}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold ${isAdmin ? "text-blue-500" : (darkMode ? "text-gray-300" : "text-gray-600")}`}>
                        {isAdmin ? "Support" : "Vous"}
                      </span>
                      <span className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                        {formatDate(r.created_at)}
                      </span>
                    </div>
                    <p className={`text-sm whitespace-pre-wrap ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                      {r.contenu}
                    </p>
                    {r.piece_jointe_url && (
                      <a
                        href={`http://localhost:8100${r.piece_jointe_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-xs text-blue-400 hover:text-blue-300"
                      >
                        <Paperclip size={10} /> Pièce jointe
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {selectedTicket.statut !== 'ferme' && selectedTicket.statut !== 'resolu' && (
            <div className="space-y-2">
              {responseFile && (
                <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                  <Paperclip size={12} className="text-blue-400" />
                  <span className="flex-1 truncate">{responseFile.name}</span>
                  <button onClick={() => setResponseFile(null)} className="text-red-400 hover:text-red-300">
                    <X size={12} />
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <label className={`p-2.5 rounded-xl border cursor-pointer transition ${darkMode ? "border-gray-600 hover:border-blue-500" : "border-gray-300 hover:border-blue-500"}`}>
                  <Paperclip size={16} className={darkMode ? "text-gray-400" : "text-gray-500"} />
                  <input
                    type="file"
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt,.webp"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f && f.size <= 10 * 1024 * 1024) setResponseFile(f);
                    }}
                  />
                </label>
              <input
                type="text"
                value={nouvelleReponse}
                onChange={(e) => setNouvelleReponse(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendReponse()}
                placeholder="Écrire une réponse..."
                className={`flex-1 border rounded-xl px-4 py-2.5 text-sm outline-none ${
                  darkMode ? "bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:border-blue-500" : "border-gray-300 text-gray-700 placeholder-gray-400 focus:border-blue-500"
                }`}
              />
              <button
                onClick={handleSendReponse}
                disabled={sendingReponse || !nouvelleReponse.trim()}
                className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50"
              >
                {sendingReponse ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <h1 className="text-lg font-bold text-blue-600 mb-6">Mes tickets de support</h1>

      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { value: '', label: 'Tous' },
          { value: 'ouvert', label: 'Ouverts' },
          { value: 'en_cours', label: 'En cours' },
          { value: 'resolu', label: 'Résolus' },
          { value: 'ferme', label: 'Fermés' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilterStatut(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
              filterStatut === f.value
                ? "bg-blue-600 text-white"
                : darkMode ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-blue-500" /></div>
      ) : tickets.length === 0 ? (
        <div className={`text-center py-12 rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <AlertCircle size={32} className="mx-auto mb-3 text-gray-400" />
          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Aucun ticket trouvé
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => handleSelectTicket(ticket)}
              className={`w-full text-left rounded-2xl shadow p-4 transition hover:shadow-md ${darkMode ? "bg-gray-800 hover:bg-gray-750" : "bg-white hover:bg-gray-50"}`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className={`text-sm font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                  {ticket.sujet}
                </h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${STATUT_COLORS[ticket.statut]?.bg} ${STATUT_COLORS[ticket.statut]?.text}`}>
                  {STATUT_COLORS[ticket.statut]?.label}
                </span>
              </div>
              <p className={`text-xs mb-2 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                {ticket.numero}
              </p>
              <p className={`text-xs mb-2 line-clamp-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                {ticket.description}
              </p>
              <div className="flex items-center justify-between">
                <span className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                  {ticket.categorie_nom} · {formatDate(ticket.created_at)}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITE_COLORS[ticket.priorite]?.bg} ${PRIORITE_COLORS[ticket.priorite]?.text}`}>
                    {PRIORITE_COLORS[ticket.priorite]?.label}
                  </span>
                  {ticket.nb_reponses > 0 && (
                    <span className={`flex items-center gap-1 text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                      <MessageCircle size={12} /> {ticket.nb_reponses}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
