import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Send,
  Loader2,
  MessageCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Paperclip,
  FileDown,
} from "lucide-react";
import API from "../services/api";

const STATUT_CONFIG = {
  ouvert: { bg: "bg-blue-100", text: "text-blue-700", label: "Ouvert", icon: AlertTriangle },
  en_cours: { bg: "bg-yellow-100", text: "text-yellow-700", label: "En cours", icon: Clock },
  resolu: { bg: "bg-green-100", text: "text-green-700", label: "Résolu", icon: CheckCircle2 },
  ferme: { bg: "bg-gray-100", text: "text-gray-600", label: "Fermé", icon: XCircle },
};

const PRIORITE_CONFIG = {
  basse: { bg: "bg-gray-100", text: "text-gray-600", label: "Basse" },
  moyenne: { bg: "bg-blue-100", text: "text-blue-600", label: "Moyenne" },
  haute: { bg: "bg-orange-100", text: "text-orange-600", label: "Haute" },
  urgente: { bg: "bg-red-100", text: "text-red-600", label: "Urgente" },
};

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Tickets({ darkMode }) {
  const navigate = useNavigate();
  const bg = darkMode ? "bg-slate-950 text-white" : "bg-gray-100 text-gray-900";
  const card = darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200";

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [filterPriorite, setFilterPriorite] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [reponses, setReponses] = useState([]);
  const [loadingReponses, setLoadingReponses] = useState(false);
  const [nouvelleReponse, setNouvelleReponse] = useState("");
  const [sendingReponse, setSendingReponse] = useState(false);
  const [adminFile, setAdminFile] = useState(null);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatut) params.statut = filterStatut;
      if (filterPriorite) params.priorite = filterPriorite;
      if (search) params.q = search;
      const { data } = await API.get("/tickets", { params });
      setTickets(data);
    } catch {
      /* handled by interceptor */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [filterStatut, filterPriorite]);

  useEffect(() => {
    const t = setTimeout(() => fetchTickets(), 400);
    return () => clearTimeout(t);
  }, [search]);

  const stats = useMemo(() => {
    const all = tickets;
    return {
      total: all.length,
      ouverts: all.filter((t) => t.statut === "ouvert").length,
      enCours: all.filter((t) => t.statut === "en_cours").length,
      resolus: all.filter((t) => t.statut === "resolu").length,
    };
  }, [tickets]);

  const filtered = useMemo(() => {
    let list = [...tickets];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.sujet.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          (t.patient_prenom || "").toLowerCase().includes(q) ||
          (t.patient_nom || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [tickets, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handleOpenDetail = async (ticket) => {
    setSelectedTicket(ticket);
    setLoadingReponses(true);
    try {
      const { data } = await API.get(`/tickets/${ticket.id}/reponses`);
      setReponses(data);
    } catch {
      /* handled by interceptor */
    } finally {
      setLoadingReponses(false);
    }
  };

  const handleUpdateStatut = async (ticketId, newStatut) => {
    try {
      await API.put(`/tickets/${ticketId}`, { statut: newStatut });
      fetchTickets();
      setSelectedTicket((prev) => (prev && prev.id === ticketId ? { ...prev, statut: newStatut } : prev));
    } catch {
      /* handled by interceptor */
    }
  };

  const handleUpdatePriorite = async (ticketId, newPriorite) => {
    try {
      await API.put(`/tickets/${ticketId}`, { priorite: newPriorite });
      fetchTickets();
      setSelectedTicket((prev) => (prev && prev.id === ticketId ? { ...prev, priorite: newPriorite } : prev));
    } catch {
      /* handled by interceptor */
    }
  };

  const handleSendReponse = async () => {
    if (!nouvelleReponse.trim() || !selectedTicket) return;
    setSendingReponse(true);
    try {
      let piece_jointe_url = null;
      if (adminFile) {
        const formData = new FormData();
        formData.append("file", adminFile);
        const { data: uploaded } = await API.post("/tickets/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        piece_jointe_url = uploaded.url;
      }
      await API.post(`/tickets/${selectedTicket.id}/reponses`, {
        contenu: nouvelleReponse.trim(),
        piece_jointe_url,
      });
      setNouvelleReponse("");
      setAdminFile(null);
      const { data } = await API.get(`/tickets/${selectedTicket.id}/reponses`);
      setReponses(data);
      fetchTickets();
    } catch {
      /* handled by interceptor */
    } finally {
      setSendingReponse(false);
    }
  };

  if (selectedTicket) {
    return (
      <div className={`min-h-screen p-6 space-y-6 ${bg}`}>
        <button
          onClick={() => setSelectedTicket(null)}
          className={`text-sm font-medium ${darkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"}`}
        >
          &larr; Retour à la liste
        </button>

        <div className={`rounded-2xl border p-6 ${card}`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold">{selectedTicket.sujet}</h2>
              <p className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                {selectedTicket.numero} · {selectedTicket.categorie_nom} · Patient: <button onClick={() => navigate('/patients')} className="text-blue-500 hover:underline">{selectedTicket.patient_prenom} {selectedTicket.patient_nom} ({selectedTicket.numero_patient || '-'})</button> · {formatDate(selectedTicket.created_at)}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <select
                value={selectedTicket.statut}
                onChange={(e) => handleUpdateStatut(selectedTicket.id, e.target.value)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium border outline-none ${card}`}
              >
                <option value="ouvert">Ouvert</option>
                <option value="en_cours">En cours</option>
                <option value="resolu">Résolu</option>
                <option value="ferme">Fermé</option>
              </select>
              <select
                value={selectedTicket.priorite}
                onChange={(e) => handleUpdatePriorite(selectedTicket.id, e.target.value)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium border outline-none ${card}`}
              >
                <option value="basse">Basse</option>
                <option value="moyenne">Moyenne</option>
                <option value="haute">Haute</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>
          <p className={`text-sm whitespace-pre-wrap ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            {selectedTicket.description}
          </p>
          {selectedTicket.piece_jointe_url && (
            <a
              href={`${API.defaults.baseURL.replace(/\/api$/, "")}${selectedTicket.piece_jointe_url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-xs text-blue-400 hover:text-blue-300"
            >
              <Paperclip size={12} /> Voir la pièce jointe
            </a>
          )}
        </div>

        <div className={`rounded-2xl border p-6 ${card}`}>
          <h3 className="text-sm font-bold mb-4">Réponses</h3>

          {loadingReponses ? (
            <div className="flex justify-center py-6">
              <Loader2 size={20} className="animate-spin text-blue-500" />
            </div>
          ) : reponses.length === 0 ? (
            <p className={`text-sm text-center py-4 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
              Aucune réponse
            </p>
          ) : (
            <div className="space-y-3 mb-4">
              {reponses.map((r) => {
                const isAdmin = r.auteur_role === "admin";
                return (
                  <div
                    key={r.id}
                    className={`rounded-xl p-3 ${
                      isAdmin
                        ? darkMode
                          ? "bg-blue-900/30 border border-blue-800"
                          : "bg-blue-50 border border-blue-100"
                        : darkMode
                        ? "bg-gray-800"
                        : "bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold ${isAdmin ? "text-blue-500" : darkMode ? "text-gray-300" : "text-gray-600"}`}>
                        {isAdmin ? "Support (Admin)" : `${r.auteur_prenom || ""} ${r.auteur_nom || ""}`}
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
                        href={`${API.defaults.baseURL.replace(/\/api$/, "")}${r.piece_jointe_url}`}
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

          <div className="space-y-2">
            {adminFile && (
              <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg ${darkMode ? "bg-gray-800" : "bg-gray-100"}`}>
                <Paperclip size={12} className="text-blue-400" />
                <span className="flex-1 truncate">{adminFile.name}</span>
                <button onClick={() => setAdminFile(null)} className="text-red-400 hover:text-red-300">
                  <XCircle size={12} />
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <label className={`p-2.5 rounded-xl border cursor-pointer transition ${darkMode ? "border-gray-700 hover:border-blue-500" : "border-gray-300 hover:border-blue-500"}`}>
                <Paperclip size={16} className={darkMode ? "text-gray-400" : "text-gray-500"} />
                <input
                  type="file"
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt,.webp"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f && f.size <= 10 * 1024 * 1024) setAdminFile(f);
                  }}
                />
              </label>
              <input
                type="text"
                value={nouvelleReponse}
                onChange={(e) => setNouvelleReponse(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendReponse()}
                placeholder="Répondre..."
                className={`flex-1 border rounded-xl px-4 py-2.5 text-sm outline-none ${
                  darkMode ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500" : "border-gray-300 focus:border-blue-500"
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
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 space-y-6 ${bg}`}>
      <h1 className="text-xl font-bold">Support Tickets</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, color: "text-blue-500" },
          { label: "Ouverts", value: stats.ouverts, color: "text-blue-600" },
          { label: "En cours", value: stats.enCours, color: "text-yellow-600" },
          { label: "Résolus", value: stats.resolus, color: "text-green-600" },
        ].map((s, i) => (
          <div key={i} className={`rounded-2xl border p-4 ${card}`}>
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className={`flex flex-wrap items-center gap-3 rounded-2xl border p-4 ${card}`}>
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Rechercher un ticket..."
            className={`bg-transparent outline-none text-sm flex-1 ${darkMode ? "text-white placeholder-gray-500" : "text-gray-700 placeholder-gray-400"}`}
          />
        </div>
        <select
          value={filterStatut}
          onChange={(e) => { setFilterStatut(e.target.value); setPage(1); }}
          className={`text-xs px-3 py-2 rounded-xl border outline-none ${card}`}
        >
          <option value="">Tous les statuts</option>
          <option value="ouvert">Ouvert</option>
          <option value="en_cours">En cours</option>
          <option value="resolu">Résolu</option>
          <option value="ferme">Fermé</option>
        </select>
        <select
          value={filterPriorite}
          onChange={(e) => { setFilterPriorite(e.target.value); setPage(1); }}
          className={`text-xs px-3 py-2 rounded-xl border outline-none ${card}`}
        >
          <option value="">Toutes les priorités</option>
          <option value="basse">Basse</option>
          <option value="moyenne">Moyenne</option>
          <option value="haute">Haute</option>
          <option value="urgente">Urgente</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-blue-500" />
        </div>
      ) : paginated.length === 0 ? (
        <div className={`text-center py-12 rounded-2xl border ${card}`}>
          <MessageCircle size={32} className="mx-auto mb-3 text-gray-400" />
          <p className="text-sm text-gray-400">Aucun ticket trouvé</p>
        </div>
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`text-left text-xs uppercase ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  <th className="pb-3 pr-4">Sujet</th>
                  <th className="pb-3 pr-4">N° Ticket</th>
                  <th className="pb-3 pr-4">Patient</th>
                  <th className="pb-3 pr-4">Catégorie</th>
                  <th className="pb-3 pr-4">Statut</th>
                  <th className="pb-3 pr-4">Priorité</th>
                  <th className="pb-3 pr-4">Réponses</th>
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((ticket) => (
                  <tr key={ticket.id} className={`border-t ${darkMode ? "border-slate-800" : "border-gray-100"}`}>
                    <td className="py-3 pr-4 font-medium max-w-[200px] truncate">{ticket.sujet}</td>
                    <td className="py-3 pr-4 text-gray-400 text-xs">{ticket.numero}</td>
                    <td className="py-3 pr-4 text-gray-400"><button onClick={() => navigate('/patients')} className="text-blue-500 hover:underline">{ticket.patient_prenom} {ticket.patient_nom}</button> <span className="text-xs">({ticket.numero_patient || '-'})</span></td>
                    <td className="py-3 pr-4 text-gray-400">{ticket.categorie_nom}</td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUT_CONFIG[ticket.statut]?.bg} ${STATUT_CONFIG[ticket.statut]?.text}`}>
                        {STATUT_CONFIG[ticket.statut]?.label}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${PRIORITE_CONFIG[ticket.priorite]?.bg} ${PRIORITE_CONFIG[ticket.priorite]?.text}`}>
                        {PRIORITE_CONFIG[ticket.priorite]?.label}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-gray-400">{ticket.nb_reponses}</td>
                    <td className="py-3 pr-4 text-gray-400 text-xs">{formatDate(ticket.created_at)}</td>
                    <td className="py-3">
                      <button onClick={() => handleOpenDetail(ticket)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {paginated.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => handleOpenDetail(ticket)}
                className={`w-full text-left rounded-2xl border p-4 ${card} transition hover:shadow-md`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-medium text-sm">{ticket.sujet}</span>
                    <span className={`ml-2 text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{ticket.numero}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUT_CONFIG[ticket.statut]?.bg} ${STATUT_CONFIG[ticket.statut]?.text}`}>
                    {STATUT_CONFIG[ticket.statut]?.label}
                  </span>
                </div>
                <p className={`text-xs mb-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  <button onClick={() => navigate('/patients')} className="text-blue-500 hover:underline">{ticket.patient_prenom} {ticket.patient_nom}</button> ({ticket.numero_patient || '-'}) · {ticket.categorie_nom}
                </p>
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                    {formatDate(ticket.created_at)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITE_CONFIG[ticket.priorite]?.bg} ${PRIORITE_CONFIG[ticket.priorite]?.text}`}>
                      {PRIORITE_CONFIG[ticket.priorite]?.label}
                    </span>
                    <span className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                      {ticket.nb_reponses} rép.
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              {filtered.length} ticket(s)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`p-2 rounded-xl border transition disabled:opacity-30 ${card}`}
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-medium">{page}/{totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className={`p-2 rounded-xl border transition disabled:opacity-30 ${card}`}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
