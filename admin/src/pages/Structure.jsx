import { useState, useMemo, useCallback } from "react";
import { toast } from "react-hot-toast";
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
} from "lucide-react";

/* ================= MOCK DATA ================= */
const initialStructures = [
  {
    id: 1,
    name: "Hôpital Laquintinie",
    type: "Hôpital public",
    city: "Douala",
    address: "Akwa, Douala",
    phone: "+237 690 000 001",
    email: "contact@laquintinie.cm",
    manager: "Dr. Ndzi",
    professionals: 120,
    status: "Actif",
    documents: [
      { id: 1, name: "Autorisation.pdf", url: "#", type: "application/pdf", size: "2.1 MB" },
      { id: 2, name: "Licence.pdf", url: "#", type: "application/pdf", size: "1.4 MB" },
    ],
    createdAt: "2023-06-15",
  },
  {
    id: 2,
    name: "CHU Yaoundé",
    type: "CHU",
    city: "Yaoundé",
    address: "Centre ville, Yaoundé",
    phone: "+237 670 000 002",
    email: "contact@chu.cm",
    manager: "Dr. Essomba",
    professionals: 250,
    status: "Actif",
    documents: [
      { id: 1, name: "Agrément.pdf", url: "#", type: "application/pdf", size: "3.2 MB" },
      { id: 2, name: "Certification.pdf", url: "#", type: "application/pdf", size: "890 KB" },
    ],
    createdAt: "2023-03-20",
  },
  {
    id: 3,
    name: "Clinique des Palétuviers",
    type: "Clinique privée",
    city: "Kribi",
    address: "Bord de mer, Kribi",
    phone: "+237 655 000 003",
    email: "info@palétuviers.cm",
    manager: "Dr. Mbarga",
    professionals: 45,
    status: "Inactif",
    documents: [],
    createdAt: "2024-01-10",
  },
];

import AddStructureModal from "../components/structures/AddStructureModal";
import DeleteConfirmModal from "../components/structures/DeleteConfirmModal"; 
import ViewStructureModal from "../components/structures/ViewStructureModal";
import DocumentsModal from "../components/structures/DocumentsModal";

/* ================= COMPONENT ================= */
export default function StructuresPage({ darkMode }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [structures, setStructures] = useState(initialStructures);
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Selected items
  const [selectedStructure, setSelectedStructure] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "", type: "", city: "", address: "", phone: "", email: "", manager: "", professionals: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

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
    active: structures.filter(s => s.status === "Actif").length,
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
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newStructure = {
        id: Date.now(),
        ...formData,
        professionals: Number(formData.professionals) || 0,
        status: "Actif",
        documents: [],
        createdAt: new Date().toISOString().split("T")[0],
      };
      
      setStructures(prev => [newStructure, ...prev]);
      toast.success("✅ Structure ajoutée avec succès");
      setFormData({ name: "", type: "", city: "", address: "", phone: "", email: "", manager: "", professionals: "" });
      setShowAddModal(false);
    } catch {
      toast.error("❌ Erreur lors de l'ajout");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData]);

  const handleViewStructure = useCallback((structure) => {
    setSelectedStructure(structure);
    setShowViewModal(true);
  }, []);

  const handleViewDocuments = useCallback((structure) => {
    setSelectedStructure(structure);
    setShowDocModal(true);
  }, []);

  const handleToggleStatus = useCallback((id) => {
    setStructures(prev => prev.map(s => {
      if (s.id === id) {
        const newStatus = s.status === "Actif" ? "Inactif" : "Actif";
        toast.success(newStatus === "Actif" ? "✅ Structure activée" : "🚫 Structure désactivée");
        return { ...s, status: newStatus };
      }
      return s;
    }));
    if (selectedStructure?.id === id) {
      setSelectedStructure(prev => prev ? { 
        ...prev, 
        status: prev.status === "Actif" ? "Inactif" : "Actif" 
      } : null);
    }
  }, [selectedStructure]);

  const handleDelete = useCallback((id) => {
    setSelectedStructure(structures.find(s => s.id === id));
    setShowDeleteConfirm(true);
  }, [structures]);

  const confirmDelete = useCallback(() => {
    if (selectedStructure) {
      setStructures(prev => prev.filter(s => s.id !== selectedStructure.id));
      toast.success("🗑️ Structure supprimée");
      setShowDeleteConfirm(false);
      setSelectedStructure(null);
      setShowViewModal(false);
    }
  }, [selectedStructure]);

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
  }, []);

  /* ================= RENDER HELPERS ================= */
  const getStatusBadge = (status) => {
    const styles = {
      "Actif": "bg-green-500/10 text-green-500 border-green-500/20",
      "Inactif": "bg-red-500/10 text-red-500 border-red-500/20",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${styles[status] || styles["Actif"]}`}>
        {status}
      </span>
    );
  };

  const getTypeColor = (type) => {
    const colors = {
      "Hôpital public": "text-blue-500",
      "Clinique privée": "text-purple-500",
      "CHU": "text-emerald-500",
    };
    return colors[type] || "text-gray-500";
  };

  const bg = darkMode ? "bg-slate-950 text-white" : "bg-gray-100 text-gray-900";
  const card = darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200";

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
            <div key={i} className={`rounded-2xl p-4 sm:p-5 border transition hover:shadow-lg ${
              darkMode ? "bg-slate-900 border-slate-800 hover:border-slate-700" : "bg-white border-gray-200 hover:border-gray-300"
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
          {["all", "Hôpital public", "Clinique privée", "CHU"].map((type) => (
            <button
              key={type}
              onClick={() => { setTypeFilter(type); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                typeFilter === type
                  ? "bg-blue-600 text-white"
                  : darkMode ? "bg-slate-800 text-gray-300 hover:bg-slate-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {type === "all" ? "Tous types" : type}
            </button>
          ))}
          {["all", "Actif", "Inactif"].map((status) => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                statusFilter === status
                  ? "bg-blue-600 text-white"
                  : darkMode ? "bg-slate-800 text-gray-300 hover:bg-slate-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {status === "all" ? "Tous statuts" : status}
            </button>
          ))}
          <button 
            onClick={resetFilters}
            className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 transition ${
              darkMode ? "hover:bg-slate-800" : "hover:bg-gray-100"
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
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleViewStructure(s)}
                  className="flex items-center justify-center gap-2 py-2 rounded-xl bg-blue-500/10 text-blue-500"
                >
                  <Eye size={16} />
                  <span className="text-sm">Voir</span>
                </button>
                <button
                  onClick={() => handleViewDocuments(s)}
                  className="flex items-center justify-center gap-2 py-2 rounded-xl bg-purple-500/10 text-purple-500"
                >
                  <FileText size={16} />
                  <span className="text-sm">Docs</span>
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="flex items-center justify-center gap-2 py-2 rounded-xl bg-red-500/10 text-red-500"
                >
                  <Trash2 size={16} />
                  <span className="text-sm">Suppr.</span>
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
                  <tr key={s.id} className={`border-t transition ${
                    darkMode ? "border-slate-800 hover:bg-slate-800/40" : "border-gray-200 hover:bg-gray-50"
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
                          onClick={() => handleToggleStatus(s.id)}
                          className="p-2 rounded-lg hover:bg-yellow-500/10 text-yellow-500 transition" 
                          title={s.status === "Actif" ? "Désactiver" : "Activer"}
                        >
                          <Edit size={16} />
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
          <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t ${
            darkMode ? "border-slate-800" : "border-gray-200"
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