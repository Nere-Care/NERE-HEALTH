import { useState, useMemo, useCallback, useEffect } from "react";
import { toast } from "react-hot-toast";
import API from "../services/api";
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Building2,
  Users,
  Activity,
  MapPin,
  Phone,
  Mail,
  UserCircle,
  X,
  Download,
  FileText,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  Loader2,
  Power,
  Copy,
} from "lucide-react";

import AddStructureModal from "../components/structures/AddStructureModal";
import DeleteConfirmModal from "../components/structures/DeleteConfirmModal";
import ViewStructureModal from "../components/structures/ViewStructureModal";
import DocumentsModal from "../components/structures/DocumentsModal";

const STATUS_MAP = {
  en_attente: "En attente",
  verifie: "Vérifié",
  rejete: "Rejeté",
  suspendu: "Suspendu",
};

function mapStructure(item) {
  return {
    id: item.id,
    name: item.nom_etablissement,
    type: item.type,
    city: item.ville,
    address: item.adresse,
    phone: item.telephone_pro,
    email: item.email_pro,
    manager: item.responsable || "—",
    professionals: item.nombre_professionnels || 0,
    services: item.services_offerts || [],
    equipements: item.equipements || [],
    langues: item.langues_parlees || [],
    assurances: item.assurances || [],
    status: STATUS_MAP[item.statut_verification] || item.statut_verification || "En attente",
    documents: item.documents || [],
    horaires: item.horaires_ouverture || {},
    createdAt: item.created_at,
  };
}

const INITIAL_FORM = {
  name: "", type: "", city: "", address: "", phone: "", email: "",
  manager: "", professionals: "", services: [], equipements: [],
  langues: [], assurances: [], horaires: {},
};

/* ================= COMPONENT ================= */
export default function StructuresPage({ darkMode }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Selected items
  const [selectedStructure, setSelectedStructure] = useState(null);

  // Form state
  const [formData, setFormData] = useState({ ...INITIAL_FORM });
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  /* ================= FETCH ================= */
  const fetchStructures = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/structures");
      const mapped = Array.isArray(data) ? data.map(mapStructure) : [];
      setStructures(mapped);
    } catch {
      toast.error("❌ Erreur lors du chargement des structures");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStructures();
  }, [fetchStructures]);

  /* ================= FILTERING ================= */
  const filteredStructures = useMemo(() => {
    return structures.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.city.toLowerCase().includes(search.toLowerCase()) ||
        s.type.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === "all" || s.type === typeFilter;
      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      return matchSearch && matchType && matchStatus;
    });
  }, [structures, search, typeFilter, statusFilter]);

  const paginatedStructures = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStructures.slice(start, start + itemsPerPage);
  }, [filteredStructures, currentPage]);

  const totalPages = Math.ceil(filteredStructures.length / itemsPerPage);

  /* ================= STATS ================= */
  const stats = useMemo(() => ({
    total: structures.length,
    active: structures.filter(s => s.status === "Vérifié").length,
    totalPros: structures.reduce((acc, s) => acc + Number(s.professionals || 0), 0),
  }), [structures]);

  /* ================= ACTIONS ================= */
  const handleAddStructure = useCallback(async () => {
    if (!formData.name || !formData.type || !formData.city) {
      toast.error("❌ Nom, type et ville sont requis");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        nom_etablissement: formData.name,
        type: formData.type,
        ville: formData.city,
        adresse: formData.address,
        telephone_pro: formData.phone,
        email_pro: formData.email,
        services_offerts: formData.services,
        equipements: formData.equipements,
        langues_parlees: formData.langues,
        assurances: formData.assurances,
        responsable: formData.manager || null,
        nombre_professionnels: formData.professionals ? Number(formData.professionals) : null,
        horaires_ouverture: Object.keys(formData.horaires || {}).length > 0 ? formData.horaires : null,
      };

      if (editingId) {
        await API.put(`/structures/${editingId}`, payload);
        toast.success("✅ Structure modifiée avec succès");
      } else {
        const res = await API.post("/structures", payload);

        const { mot_de_passe_genere, email } = res.data;

        toast.success(
          <div>
            <p>✅ Structure ajoutée avec succès</p>
            <p className="text-xs mt-1">
              Email: <strong>{email}</strong> | Mot de passe:{" "}
              <strong>{mot_de_passe_genere}</strong>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Email: ${email}\nMot de passe: ${mot_de_passe_genere}`
                  );
                  toast.success("📋 Identifiants copiés");
                }}
                className="ml-2 text-blue-400 hover:text-blue-300"
              >
                <Copy size={14} className="inline" />
              </button>
            </p>
          </div>,
          { duration: 10000 }
        );
      }

      setFormData({ ...INITIAL_FORM });
      setEditingId(null);
      setShowAddModal(false);
      fetchStructures();
    } catch {
      toast.error(editingId ? "❌ Erreur lors de la modification" : "❌ Erreur lors de l'ajout");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, editingId, fetchStructures]);

  const handleEditStructure = useCallback((structure) => {
    setFormData({
      name: structure.name,
      type: structure.type,
      city: structure.city,
      address: structure.address || "",
      phone: structure.phone || "",
      email: structure.email || "",
      manager: structure.manager || "",
      professionals: structure.professionals || "",
      services: structure.services || [],
      equipements: structure.equipements || [],
      langues: structure.langues || [],
      assurances: structure.assurances || [],
      horaires: structure.horaires || {},
    });
    setEditingId(structure.id);
    setShowAddModal(true);
  }, []);

  const handleViewStructure = useCallback((structure) => {
    setSelectedStructure(structure);
    setShowViewModal(true);
  }, []);

  const handleViewDocuments = useCallback((structure) => {
    setSelectedStructure(structure);
    setShowDocModal(true);
  }, []);

  const handleToggleStatus = useCallback(async (id) => {
    const s = structures.find(item => item.id === id);
    if (!s) return;
    const newStatut = s.status === "Vérifié" ? "suspendu" : "verifie";
    try {
      await API.put(`/structures/${id}`, { statut_verification: newStatut });
      toast.success(newStatut === "verifie" ? "✅ Structure activée" : "🚫 Structure désactivée");
      fetchStructures();
    } catch {
      toast.error("❌ Erreur lors du changement de statut");
    }
  }, [structures, fetchStructures]);

  const handleDelete = useCallback((id) => {
    setSelectedStructure(structures.find(s => s.id === id));
    setShowDeleteConfirm(true);
  }, [structures]);

  const confirmDelete = useCallback(async () => {
    if (selectedStructure) {
      try {
        await API.delete(`/structures/${selectedStructure.id}`);
        toast.success("🗑️ Structure supprimée");
        setShowDeleteConfirm(false);
        setSelectedStructure(null);
        setShowViewModal(false);
        fetchStructures();
      } catch {
        toast.error("❌ Erreur lors de la suppression");
      }
    }
  }, [selectedStructure, fetchStructures]);

  const handleDownload = useCallback((doc) => {
    toast.success(`📥 Téléchargement: ${doc.name}`);
  }, []);

  const handlePreview = useCallback((doc) => {
    toast.info(`👁️ Aperçu: ${doc.name}`);
  }, []);

  const resetFilters = useCallback(() => {
    setSearch("");
    setTypeFilter("all");
    setStatusFilter("all");
    setCurrentPage(1);
    toast.info("🔄 Filtres réinitialisés");
  }, []);

  const closeModal = useCallback(() => {
    setShowAddModal(false);
    setShowViewModal(false);
    setShowDocModal(false);
    setShowDeleteConfirm(false);
    setSelectedStructure(null);
    setEditingId(null);
    setFormData({ ...INITIAL_FORM });
  }, []);

  /* ================= RENDER HELPERS ================= */
  const getStatusBadge = (status) => {
    const styles = {
      "Vérifié": "bg-green-500/10 text-green-500 border-green-500/20",
      "Suspendu": "bg-red-500/10 text-red-500 border-red-500/20",
      "En attente": "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      "Rejeté": "bg-red-500/10 text-red-500 border-red-500/20",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${styles[status] || styles["Vérifié"]}`}>
        {status}
      </span>
    );
  };

  const getTypeColor = (type) => {
    const colors = {
      "Hôpital public": "text-blue-500",
      "Clinique privée": "text-purple-500",
      "CHU": "text-emerald-500",
      "Centre de santé": "text-cyan-500",
      "Laboratoire": "text-pink-500",
      "Pharmacie": "text-yellow-500",
      "Centre de radiologie": "text-green-500",
      "Centre de dialyse": "text-blue-500",

    };
    return colors[type] || "text-gray-500";
  };

  const bg = darkMode ? "bg-slate-950 text-white" : "bg-gray-100 text-gray-900";
  const card = darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200";

  if (loading) {
    return (
      <div className={`min-h-screen p-3 sm:p-4 lg:p-6 flex items-center justify-center transition-all ${bg}`}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={40} className="animate-spin text-blue-500" />
          <p className="text-gray-400">Chargement des structures…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-3 sm:p-4 lg:p-6 space-y-5 lg:space-y-6 transition-all ${bg}`}>

      {/* ================= HEADER ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight">Gestion des Structures</h1>
          <p className="text-sm text-gray-400 mt-1">Hôpitaux, cliniques et centres de santé</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto justify-center px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-blue-500/25 active:scale-95 flex items-center gap-2"
        >
          <Plus size={18} />
          <span>Ajouter structure</span>
        </button>
      </div>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {[
          { title: "Total structures", value: stats.total, icon: Building2, color: "blue", sub: "Établissements enregistrés" },
          { title: "Structures actives", value: stats.active, icon: Activity, color: "green", sub: "Opérationnelles" },
          { title: "Professionnels", value: stats.totalPros.toLocaleString(), icon: Users, color: "purple", sub: "Personnel de santé" },
        ].map((item, i) => {
          const Icon = item.icon;
          const colorClasses = {
            blue: "bg-blue-500/10 text-blue-500",
            green: "bg-green-500/10 text-green-500",
            purple: "bg-purple-500/10 text-purple-500",
          };
          return (
            <div key={i} className={`rounded-2xl p-4 sm:p-5 border transition hover:shadow-lg ${darkMode ? "bg-slate-900 border-slate-800 hover:border-slate-700" : "bg-white border-gray-200 hover:border-gray-300"
              }`}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-400 truncate">{item.title}</p>
                  <h2 className="text-2xl sm:text-3xl font-bold mt-1">{item.value}</h2>
                  <p className="text-xs text-gray-500 mt-1">{item.sub}</p>
                </div>
                <div className={`p-3 rounded-xl flex-shrink-0 ${colorClasses[item.color]}`}>
                  <Icon size={22} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= FILTERS ================= */}
      <div className={`rounded-2xl border p-4 space-y-4 ${card}`}>
        {/* Search */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700">
          <Search size={18} className="text-gray-400 flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Rechercher par nom, ville ou type..."
            className="w-full bg-transparent outline-none text-sm"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap gap-2">
          {["all", "Hôpital public", "Clinique privée", "CHU", "Centre de santé", "Laboratoire", "Pharmacie", "Centre de radiologie", "Centre de dialyse"].map((type) => (
            <button
              key={type}
              onClick={() => { setTypeFilter(type); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${typeFilter === type
                ? "bg-blue-600 text-white"
                : darkMode ? "bg-slate-800 text-gray-300 hover:bg-slate-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
            >
              {type === "all" ? "Tous types" : type}
            </button>
          ))}
          {["all", "Vérifié", "En attente", "Suspendu", "Rejeté"].map((status) => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${statusFilter === status
                ? "bg-blue-600 text-white"
                : darkMode ? "bg-slate-800 text-gray-300 hover:bg-slate-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
            >
              {status === "all" ? "Tous statuts" : status}
            </button>
          ))}
          <button
            onClick={resetFilters}
            className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 transition ${darkMode ? "hover:bg-slate-800" : "hover:bg-gray-100"
              }`}
          >
            <RefreshCw size={14} /> Réinitialiser
          </button>
        </div>
      </div>

      {/* ================= MOBILE CARDS ================= */}
      <div className="lg:hidden space-y-4">
        {paginatedStructures.length > 0 ? (
          paginatedStructures.map((s) => (
            <div key={s.id} className={`rounded-2xl border p-4 space-y-4 ${card}`}>
              {/* Top */}
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {s.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold truncate">{s.name}</h3>
                  <p className={`text-sm ${getTypeColor(s.type)} truncate`}>{s.type}</p>
                  <div className="mt-2">{getStatusBadge(s.status)}</div>
                </div>
              </div>

              {/* Infos */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <UserCircle size={15} />
                  <span className="truncate">{s.manager}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <MapPin size={15} />
                  <span className="truncate">{s.city}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Phone size={15} />
                  <span className="truncate">{s.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-blue-500">
                  <FileText size={15} />
                  <span>{s.documents?.length || 0} document(s)</span>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => handleViewStructure(s)}
                  className="flex items-center justify-center gap-1 py-2 rounded-xl bg-blue-500/10 text-blue-500"
                >
                  <Eye size={14} />
                  <span className="text-xs">Voir</span>
                </button>
                <button
                  onClick={() => handleEditStructure(s)}
                  className="flex items-center justify-center gap-1 py-2 rounded-xl bg-blue-500/10 text-blue-500"
                >
                  <Edit size={14} />
                  <span className="text-xs">Edit</span>
                </button>
                <button
                  onClick={() => handleViewDocuments(s)}
                  className="flex items-center justify-center gap-1 py-2 rounded-xl bg-purple-500/10 text-purple-500"
                >
                  <FileText size={14} />
                  <span className="text-xs">Docs</span>
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="flex items-center justify-center gap-1 py-2 rounded-xl bg-red-500/10 text-red-500"
                >
                  <Trash2 size={14} />
                  <span className="text-xs">Suppr.</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className={`rounded-2xl border p-10 text-center ${card}`}>
            <div className="flex flex-col items-center gap-3">
              <AlertCircle size={40} className="opacity-50" />
              <p className="text-gray-400">Aucune structure trouvée</p>
              <button onClick={resetFilters} className="text-blue-500 hover:underline text-sm">
                Réinitialiser les filtres
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= DESKTOP TABLE ================= */}
      <div className={`hidden lg:block rounded-2xl border overflow-hidden ${card}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead className={darkMode ? "bg-slate-800" : "bg-gray-100"}>
              <tr>
                {["Structure", "Responsable", "Ville", "Contact", "Professionnels", "Statut", "Documents", "Actions"].map((header) => (
                  <th key={header} className="p-4 text-left text-sm font-semibold uppercase tracking-wider whitespace-nowrap">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedStructures.length > 0 ? (
                paginatedStructures.map((s) => (
                  <tr key={s.id} className={`border-t transition ${darkMode ? "border-slate-800 hover:bg-slate-800/40" : "border-gray-200 hover:bg-gray-50"
                    }`}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {s.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{s.name}</p>
                          <p className={`text-xs ${getTypeColor(s.type)}`}>{s.type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm">
                        <UserCircle size={14} className="text-gray-400 flex-shrink-0" />
                        <span className="truncate max-w-[120px]">{s.manager}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <MapPin size={14} className="flex-shrink-0" />
                        <span>{s.city}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <Phone size={12} className="flex-shrink-0" />
                          <span className="truncate max-w-[100px]">{s.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <Mail size={12} className="flex-shrink-0" />
                          <span className="truncate max-w-[100px]">{s.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold">{s.professionals}</span>
                      <p className="text-xs text-gray-400">personnes</p>
                    </td>
                    <td className="p-4">{getStatusBadge(s.status)}</td>
                    <td className="p-4">
                      <button
                        onClick={() => handleViewDocuments(s)}
                        className="text-blue-500 hover:text-blue-400 flex items-center gap-1.5 text-sm font-medium transition"
                      >
                        <FileText size={14} />
                        {s.documents?.length || 0}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleViewStructure(s)}
                          className="p-2 rounded-lg hover:bg-blue-500/10 text-blue-500 transition"
                          title="Voir détails"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleEditStructure(s)}
                          className="p-2 rounded-lg hover:bg-blue-500/10 text-blue-500 transition"
                          title="Modifier"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(s.id)}
                          className="p-2 rounded-lg hover:bg-yellow-500/10 text-yellow-500 transition"
                          title={s.status === "Actif" ? "Désactiver" : "Activer"}
                        >
                          <Power size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-3">
                      <AlertCircle size={40} className="opacity-50" />
                      <p>Aucune structure trouvée</p>
                      <button onClick={resetFilters} className="text-blue-500 hover:underline text-sm">
                        Réinitialiser les filtres
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Desktop Pagination */}
        {totalPages > 1 && (
          <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t ${darkMode ? "border-slate-800" : "border-gray-200"
            }`}>
            <p className="text-sm text-gray-400 text-center sm:text-left">
              Page {currentPage} sur {totalPages} • {filteredStructures.length} résultats
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-slate-800 transition"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-slate-800 transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= MOBILE PAGINATION ================= */}
      {totalPages > 1 && (
        <div className="lg:hidden flex flex-col items-center gap-3">
          <p className="text-sm text-gray-400 text-center">Page {currentPage} sur {totalPages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-slate-800 transition"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-slate-800 transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ================= MODALS ================= */}
      {showAddModal && (
        <AddStructureModal
          darkMode={darkMode}
          formData={formData}
          setFormData={setFormData}
          isSubmitting={isSubmitting}
          onSubmit={handleAddStructure}
          onClose={closeModal}
          editingId={editingId}
        />
      )}

      {showViewModal && selectedStructure && (
        <ViewStructureModal
          darkMode={darkMode}
          structure={selectedStructure}
          onClose={closeModal}
          onToggleStatus={() => handleToggleStatus(selectedStructure.id)}
          onViewDocs={() => { setShowViewModal(false); handleViewDocuments(selectedStructure); }}
          onDelete={() => { setShowViewModal(false); handleDelete(selectedStructure.id); }}
        />
      )}

      {showDocModal && selectedStructure && (
        <DocumentsModal
          darkMode={darkMode}
          structure={selectedStructure}
          documents={selectedStructure.documents || []}
          onPreview={handlePreview}
          onDownload={handleDownload}
          onClose={closeModal}
          onRefresh={fetchStructures}
        />
      )}

      {showDeleteConfirm && selectedStructure && (
        <DeleteConfirmModal
          darkMode={darkMode}
          structure={selectedStructure}
          onConfirm={confirmDelete}
          onCancel={closeModal}
        />
      )}
    </div>
  );
}
