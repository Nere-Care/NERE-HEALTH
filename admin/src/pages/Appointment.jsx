import { useState, useMemo, useCallback, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  Calendar,
  Clock,
  User,
  Building2,
  Search,
  Trash2,
  CheckCircle2,
  X,
  Plus,
  Video,
  MapPin,
  Stethoscope,
  Link2,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Download,
  Edit,
  Eye,
  Loader2,
} from "lucide-react";

import API from "../services/api";
import ViewAppointmentModal from "../components/appointments/ViewAppointmentModal";
import DeleteConfirmModal from "../components/appointments/DeleteConfirmModal";
import AppointmentCard from "../components/appointments/AppointmentCard";

const STATUS_MAP = {
  en_attente: "En attente",
  en_attente_paiement: "En attente de paiement",
  paye_en_attente_validation: "Paiement en vérification",
  confirme: "Confirmé",
  en_cours: "En cours",
  termine: "Terminé",
  annule_patient: "Annulé",
  annule_medecin: "Annulé par médecin",
  annule_systeme: "Annulé",
  no_show_patient: "Absent",
  no_show_medecin: "Médecin absent",
  rembourse: "Remboursé",
};

const TABS = [
  { key: "tous", label: "RDV pris", icon: Calendar, color: "blue" },
  { key: "honores", label: "Consultations honorées", icon: CheckCircle2, color: "green" },
  { key: "manques", label: "RDV manqués", icon: AlertTriangle, color: "red" },
];

/* ================= COMPONENT ================= */
export default function AppointmentsPage({ darkMode }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("tous");
  const [consultedRdvIds, setConsultedRdvIds] = useState(new Set());
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Selected item
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    patient: "", professional: "", structure: "", reason: "",
    mode: "Présentiel", location: "", date: "", time: ""
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    let cancelled = false;
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const [{ data: rdvData }, { data: consData }] = await Promise.all([
          API.get("/rendez_vous?limit=200"),
          API.get("/consultations?limit=200"),
        ]);
        const items = Array.isArray(rdvData) ? rdvData : rdvData?.data ?? [];

        const consultedIds = new Set(
          (Array.isArray(consData) ? consData : consData?.data ?? [])
            .map((c) => c.rdv_id)
            .filter(Boolean)
        );
        setConsultedRdvIds(consultedIds);

        const uniquePatientIds = [...new Set(items.map(i => i.patient_id).filter(Boolean))];
        const uniqueMedecinIds = [...new Set(items.map(i => i.medecin_id).filter(Boolean))];

        const patientsMap = {};
        const medecinsMap = {};
        const medecinsStructureMap = {};

        await Promise.all([
          ...uniquePatientIds.map(async (pid) => {
            try {
              const { data: p } = await API.get(`/users/${pid}`);
              patientsMap[pid] = `${p.prenom || ""} ${p.nom || ""}`.trim() || pid;
            } catch { patientsMap[pid] = pid; }
          }),
          ...uniqueMedecinIds.map(async (mid) => {
            try {
              const { data: m } = await API.get(`/users/${mid}`);
              medecinsMap[mid] = `Dr. ${[m.prenom, m.nom].filter(Boolean).join(" ")}` || mid;
            } catch { medecinsMap[mid] = mid; }
            try {
              const { data: mp } = await API.get(`/medecins/${mid}`);
              medecinsStructureMap[mid] = mp.structure_id || null;
            } catch { medecinsStructureMap[mid] = null; }
          }),
        ]);

        const uniqueStructureIds = [...new Set(Object.values(medecinsStructureMap).filter(Boolean))];
        const structuresMap = {};
        await Promise.all(
          uniqueStructureIds.map(async (sid) => {
            try {
              const { data: s } = await API.get(`/structures/${sid}`);
              structuresMap[sid] = s.nom_etablissement || sid;
            } catch { structuresMap[sid] = sid; }
          })
        );

        const mapped = items.map((item) => ({
          id: item.id,
          patient: patientsMap[item.patient_id] || item.patient_id || "",
          professional: medecinsMap[item.medecin_id] || item.medecin_id || "",
          structure: structuresMap[medecinsStructureMap[item.medecin_id]] || "—",
          reason: item.motif_consultation ?? item.motif ?? "",
          mode: item.type === "video" ? "En ligne" : "Présentiel",
          location: "",
          date: item.date_heure_debut ? item.date_heure_debut.split("T")[0] : item.created_at ?? "",
          time: item.date_heure_debut ? item.date_heure_debut.split("T")[1].slice(0, 5) : "",
          statut: item.statut ?? "",
          status: STATUS_MAP[item.statut] ?? item.statut ?? "En attente",
          createdAt: item.created_at ?? "",
        }));
        if (!cancelled) setAppointments(mapped);
      } catch {
        if (!cancelled) toast.error("Erreur lors du chargement des rendez-vous");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchAppointments();
    return () => { cancelled = true; };
  }, []);

  /* ================= FILTERING ================= */
  const isHonored = useCallback((a) => a.statut === "termine" || consultedRdvIds.has(a.id), [consultedRdvIds]);
  const isMissed = useCallback((a) => a.statut === "no_show_patient", []);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      if (activeTab === "honores" && !isHonored(a)) return false;
      if (activeTab === "manques" && !isMissed(a)) return false;
      const matchSearch = 
        a.patient.toLowerCase().includes(search.toLowerCase()) ||
        a.professional.toLowerCase().includes(search.toLowerCase()) ||
        a.structure.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || a.status === statusFilter;
      const matchMode = modeFilter === "all" || a.mode === modeFilter;
      return matchSearch && matchStatus && matchMode;
    });
  }, [appointments, search, statusFilter, modeFilter, activeTab, isHonored, isMissed]);

  const paginatedAppointments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAppointments.slice(start, start + itemsPerPage);
  }, [filteredAppointments, currentPage]);

  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);

  /* ================= STATS ================= */
  const stats = useMemo(() => ({
    total: appointments.length,
    pending: appointments.filter(a => a.status === "En attente").length,
    confirmed: appointments.filter(a => a.status === "Confirmé").length,
    today: appointments.filter(a => a.date === new Date().toISOString().split("T")[0]).length,
    honored: appointments.filter((a) => isHonored(a)).length,
    missed: appointments.filter((a) => isMissed(a)).length,
  }), [appointments, isHonored, isMissed]);

  /* ================= ACTIONS ================= */
  const validateForm = useCallback(() => {
    const errors = {};
    if (!formData.patient.trim()) errors.patient = "Le nom du patient est requis";
    if (!formData.professional.trim()) errors.professional = "Le professionnel est requis";
    if (!formData.structure.trim()) errors.structure = "La structure est requise";
    if (!formData.reason.trim()) errors.reason = "La raison est requise";
    if (!formData.date) errors.date = "La date est requise";
    if (!formData.time) errors.time = "L'heure est requise";
    if (formData.mode === "En ligne" && !formData.location?.includes("http")) {
      errors.location = "URL valide requise pour les consultations en ligne";
    }
    if (formData.mode === "Présentiel" && !formData.location.trim()) {
      errors.location = "Le lieu est requis pour les consultations présentielles";
    }
    return errors;
  }, [formData]);

  const handleAddAppointment = useCallback(async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("❌ Veuillez corriger les erreurs du formulaire");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newAppointment = {
        id: Date.now(),
        ...formData,
        status: "En attente",
        createdAt: new Date().toISOString().split("T")[0],
      };
      
      setAppointments(prev => [newAppointment, ...prev]);
      toast.success("✅ Rendez-vous créé avec succès");
      resetForm();
      setShowAddModal(false);
    } catch {
      toast.error("❌ Erreur lors de la création");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm]);

  const handleViewAppointment = useCallback((appointment) => {
    setSelectedAppointment(appointment);
    setShowViewModal(true);
  }, []);

  const handleConfirm = useCallback((id) => {
    setAppointments(prev => prev.map(a => 
      a.id === id ? { ...a, status: "Confirmé" } : a
    ));
    toast.success("✅ Rendez-vous confirmé");
    if (selectedAppointment?.id === id) {
      setSelectedAppointment(prev => prev ? { ...prev, status: "Confirmé" } : null);
    }
  }, [selectedAppointment]);

  const handleCancel = useCallback((id) => {
    setAppointments(prev => prev.map(a => 
      a.id === id ? { ...a, status: "Annulé" } : a
    ));
    toast.info("🚫 Rendez-vous annulé");
    if (selectedAppointment?.id === id) {
      setSelectedAppointment(prev => prev ? { ...prev, status: "Annulé" } : null);
    }
  }, [selectedAppointment]);

  const handleDelete = useCallback((id) => {
    setSelectedAppointment(appointments.find(a => a.id === id));
    setShowDeleteConfirm(true);
  }, [appointments]);

  const confirmDelete = useCallback(() => {
    if (selectedAppointment) {
      setAppointments(prev => prev.filter(a => a.id !== selectedAppointment.id));
      toast.success("🗑️ Rendez-vous supprimé");
      setShowDeleteConfirm(false);
      setSelectedAppointment(null);
      setShowViewModal(false);
    }
  }, [selectedAppointment]);

  const handleExport = useCallback(() => {
    try {
      const data = JSON.stringify(filteredAppointments, null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rendezvous_export_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("📥 Export téléchargé");
    } catch {
      toast.error("❌ Erreur lors de l'export");
    }
  }, [filteredAppointments]);

  const resetForm = useCallback(() => {
    setFormData({
      patient: "", professional: "", structure: "", reason: "",
      mode: "Présentiel", location: "", date: "", time: ""
    });
    setFormErrors({});
  }, []);

  const resetFilters = useCallback(() => {
    setSearch("");
    setStatusFilter("all");
    setModeFilter("all");
    setCurrentPage(1);
    toast.info("🔄 Filtres réinitialisés");
  }, []);

  const closeModal = useCallback(() => {
    setShowAddModal(false);
    setShowViewModal(false);
    setShowDeleteConfirm(false);
    setSelectedAppointment(null);
    resetForm();
  }, [resetForm]);

  /* ================= RENDER HELPERS ================= */
  const getStatusBadge = (status) => {
    const styles = {
      "Confirmé": "bg-green-500/10 text-green-500 border-green-500/20",
      "Terminé": "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      "En cours": "bg-blue-500/10 text-blue-500 border-blue-500/20",
      "En attente": "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      "En attente de paiement": "bg-orange-500/10 text-orange-500 border-orange-500/20",
      "Paiement en vérification": "bg-purple-500/10 text-purple-500 border-purple-500/20",
      "Absent": "bg-red-500/10 text-red-500 border-red-500/20",
      "Médecin absent": "bg-red-500/10 text-red-500 border-red-500/20",
      "Annulé": "bg-gray-500/10 text-gray-500 border-gray-500/20",
      "Annulé par médecin": "bg-gray-500/10 text-gray-500 border-gray-500/20",
      "Remboursé": "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${styles[status] || styles["En attente"]}`}>
        {status}
      </span>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
  };

  const bg = darkMode ? "bg-slate-950 text-white" : "bg-gray-100 text-gray-900";
  const card = darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200";

  if (loading) {
    return (
      <div className={`min-h-screen p-3 sm:p-4 md:p-6 transition-all ${bg}`}>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="animate-spin text-blue-500" size={40} />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-3 sm:p-4 md:p-6 space-y-5 md:space-y-6 transition-all ${bg}`}>
      
      {/* ================= HEADER ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 leading-tight">
            <Calendar className="text-blue-500 flex-shrink-0" size={28} />
            <span className="truncate">Gestion des Rendez-vous</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Consultations médicales et suivis
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <button 
            onClick={handleExport}
            className={`w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl border font-medium transition flex items-center gap-2 ${
              darkMode ? "border-slate-700 hover:bg-slate-800" : "border-gray-300 hover:bg-gray-100"
            }`}
          >
            <Download size={16} />
            <span>Export</span>
          </button>

          <button 
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-blue-500/25 active:scale-95 flex items-center gap-2"
          >
            <Plus size={18} />
            <span>Nouveau RDV</span>
          </button>
        </div>
      </div>

      {/* ================= TABS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          const count = tab.key === "tous" ? stats.total : tab.key === "honores" ? stats.honored : stats.missed;
          const activeColor = {
            blue: "bg-blue-600 text-white shadow-lg shadow-blue-500/25",
            green: "bg-green-600 text-white shadow-lg shadow-green-500/25",
            red: "bg-red-600 text-white shadow-lg shadow-red-500/25",
          }[tab.color];
          const idleColor = darkMode ? "border-slate-700 hover:bg-slate-800" : "border-gray-200 hover:bg-gray-100";
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setCurrentPage(1); }}
              className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border font-medium transition ${
                isActive ? activeColor : idleColor
              }`}
            >
              <span className="flex items-center gap-2 text-sm">
                <Icon size={16} />
                <span className="truncate">{tab.label}</span>
              </span>
              <span className={`min-w-[28px] h-7 px-1.5 rounded-full text-xs font-bold flex items-center justify-center ${
                isActive ? "bg-white/20 text-white" : darkMode ? "bg-slate-800 text-gray-400" : "bg-gray-100 text-gray-500"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Total RDV", value: stats.total, icon: Calendar, color: "blue" },
          { title: "En attente", value: stats.pending, icon: Clock, color: "yellow" },
          { title: "Confirmés", value: stats.confirmed, icon: CheckCircle2, color: "green" },
          { title: "Aujourd'hui", value: stats.today, icon: Calendar, color: "purple" },
        ].map((item, i) => {
          const Icon = item.icon;
          const colorClasses = {
            blue: "bg-blue-500/10 text-blue-500",
            yellow: "bg-yellow-500/10 text-yellow-500",
            green: "bg-green-500/10 text-green-500",
            purple: "bg-purple-500/10 text-purple-500",
          };

          return (
            <div
              key={i}
              className={`rounded-2xl p-4 md:p-5 border transition hover:shadow-lg ${
                darkMode
                  ? "bg-slate-900 border-slate-800 hover:border-slate-700"
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-400 truncate">
                    {item.title}
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-bold mt-1">
                    {item.value}
                  </h2>
                </div>

                <div
                  className={`p-2.5 md:p-3 rounded-xl flex-shrink-0 ${colorClasses[item.color]}`}
                >
                  <Icon size={20} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= SEARCH & FILTERS ================= */}
      <div
        className={`rounded-2xl border p-4 space-y-4 ${card}`}
      >
        {/* Search */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700">
          <Search size={18} className="text-gray-400 flex-shrink-0" />

          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Rechercher patient, professionnel, structure..."
            className="w-full bg-transparent outline-none text-sm"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className={`w-full sm:w-auto min-w-[180px] px-4 py-2.5 rounded-xl text-sm border bg-transparent outline-none ${
              darkMode ? "border-slate-700" : "border-gray-300"
            }`}
          >
            <option value="all">Tous statuts</option>
            <option value="En attente">En attente</option>
            <option value="En attente de paiement">En attente de paiement</option>
            <option value="Paiement en vérification">Paiement en vérification</option>
            <option value="Confirmé">Confirmé</option>
            <option value="En cours">En cours</option>
            <option value="Terminé">Terminé</option>
            <option value="Absent">Absent</option>
            <option value="Annulé">Annulé</option>
            <option value="Annulé par médecin">Annulé par médecin</option>
            <option value="Remboursé">Remboursé</option>
          </select>

          <select
            value={modeFilter}
            onChange={(e) => {
              setModeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className={`w-full sm:w-auto min-w-[180px] px-4 py-2.5 rounded-xl text-sm border bg-transparent outline-none ${
              darkMode ? "border-slate-700" : "border-gray-300"
            }`}
          >
            <option value="all">Tous modes</option>
            <option value="Présentiel">Présentiel</option>
            <option value="En ligne">En ligne</option>
          </select>

          <button
            onClick={resetFilters}
            className={`w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-1.5 transition ${
              darkMode ? "hover:bg-slate-800" : "hover:bg-gray-100"
            }`}
            title="Réinitialiser"
          >
            <RefreshCw size={14} />
            <span className="sm:hidden">Réinitialiser</span>
          </button>
        </div>
      </div>

      {/* ================= MOBILE CARDS ================= */}
      <div className="md:hidden space-y-4">
        {paginatedAppointments.length > 0 ? (
          paginatedAppointments.map((a) => (
            <div
              key={a.id}
              className={`rounded-2xl border p-4 space-y-4 ${card}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{a.patient}</h3>
                  <p className="text-sm text-gray-400 truncate">
                    {a.professional}
                  </p>
                </div>

                {getStatusBadge(a.status)}
              </div>

              {/* Infos */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <Building2 size={14} className="flex-shrink-0" />
                  <span className="truncate">{a.structure}</span>
                </div>

                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar size={14} className="flex-shrink-0" />
                  <span>{formatDate(a.date)}</span>
                </div>

                <div className="flex items-center gap-2 text-gray-400">
                  <Clock size={14} className="flex-shrink-0" />
                  <span>{a.time}</span>
                </div>

                <div className="flex items-center gap-2 text-gray-400">
                  {a.mode === "En ligne" ? (
                    <Video size={14} className="flex-shrink-0 text-blue-500" />
                  ) : (
                    <MapPin size={14} className="flex-shrink-0 text-green-500" />
                  )}

                  <span className="truncate">{a.mode}</span>
                </div>
              </div>

              {/* Reason */}
              <div
                className={`p-3 rounded-xl text-sm ${
                  darkMode ? "bg-slate-800" : "bg-gray-50"
                }`}
              >
                <p className="font-medium mb-1">Motif</p>
                <p className="text-gray-400">{a.reason}</p>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t dark:border-slate-800">
                <button
                  onClick={() => handleViewAppointment(a)}
                  className="flex items-center justify-center gap-2 py-2 rounded-xl bg-blue-500/10 text-blue-500"
                >
                  <Eye size={16} />
                  <span className="text-sm">Voir</span>
                </button>


                <button
                  onClick={() => handleDelete(a.id)}
                  className="col-span-2 flex items-center justify-center gap-2 py-2 rounded-xl bg-red-500/10 text-red-500"
                >
                  <Trash2 size={16} />
                  <span className="text-sm">Supprimer</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className={`rounded-2xl border p-10 text-center ${card}`}>
            <AlertTriangle size={40} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-400">Aucun rendez-vous trouvé</p>

            <button
              onClick={resetFilters}
              className="mt-3 text-blue-500 hover:underline text-sm"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>

      {/* ================= DESKTOP GRID ================= */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {paginatedAppointments.length > 0 ? (
          paginatedAppointments.map((a) => (
            <AppointmentCard
              key={a.id}
              appointment={a}
              darkMode={darkMode}
              cardClass={card}
              onView={() => handleViewAppointment(a)}
              onConfirm={() => handleConfirm(a.id)}
              onCancel={() => handleCancel(a.id)}
              onDelete={() => handleDelete(a.id)}
              getStatusBadge={getStatusBadge}
              formatDate={formatDate}
            />
          ))
        ) : (
          <div className={`col-span-full p-12 rounded-2xl border text-center ${card}`}>
            <AlertTriangle size={40} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-400">Aucun rendez-vous trouvé</p>

            <button
              onClick={resetFilters}
              className="mt-3 text-blue-500 hover:underline text-sm"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>

      {/* ================= DESKTOP PAGINATION ================= */}
      {totalPages > 1 && (
        <div
          className={`hidden md:flex items-center justify-between px-4 py-3 rounded-xl border ${card}`}
        >
          <p className="text-sm text-gray-400">
            Page {currentPage} sur {totalPages} •{" "}
            {filteredAppointments.length} résultats
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed transition ${
                darkMode
                  ? "border-slate-700 hover:bg-slate-800"
                  : "border-gray-300 hover:bg-gray-100"
              }`}
            >
              <ChevronLeft size={16} />
            </button>

            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed transition ${
                darkMode
                  ? "border-slate-700 hover:bg-slate-800"
                  : "border-gray-300 hover:bg-gray-100"
              }`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ================= MOBILE PAGINATION ================= */}
      {totalPages > 1 && (
        <div className="md:hidden flex flex-col items-center gap-3">
          <p className="text-sm text-gray-400 text-center">
            Page {currentPage} sur {totalPages}
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed transition ${
                darkMode
                  ? "border-slate-700 hover:bg-slate-800"
                  : "border-gray-300 hover:bg-gray-100"
              }`}
            >
              <ChevronLeft size={16} />
            </button>

            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed transition ${
                darkMode
                  ? "border-slate-700 hover:bg-slate-800"
                  : "border-gray-300 hover:bg-gray-100"
              }`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ================= MODALS ================= */}
      
      {showViewModal && selectedAppointment && (
        <ViewAppointmentModal
          darkMode={darkMode}
          appointment={selectedAppointment}
          onClose={closeModal}
          onConfirm={() => handleConfirm(selectedAppointment.id)}
          onCancel={() => handleCancel(selectedAppointment.id)}
          onDelete={() => {
            setShowViewModal(false);
            handleDelete(selectedAppointment.id);
          }}
          getStatusBadge={getStatusBadge}
          formatDate={formatDate}
        />
      )}

      {showDeleteConfirm && selectedAppointment && (
        <DeleteConfirmModal
          darkMode={darkMode}
          item={selectedAppointment}
          itemType="rendez-vous"
          onConfirm={confirmDelete}
          onCancel={closeModal}
        />
      )}
    </div>
  );
}
