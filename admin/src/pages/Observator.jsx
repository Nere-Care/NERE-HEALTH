import { useState, useMemo, useCallback } from "react";
import { toast } from "react-hot-toast";
import {
  Eye,
  Search,
  Shield,
  ShieldAlert,
  Download,
  FileText,
  Users,
  Activity,
  Building2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Filter,
  Clock,
  Plus,
  X,
  Trash2,
  Edit,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Mail,
  Phone,
} from "lucide-react";

/* ================= MOCK DATA ================= */
const initialObservers = [
  {
    id: 1,
    name: "ONG Santé Globale",
    scope: "Surveillance système santé",
    role: "Audit national",
    status: "Actif",
    lastSync: "10:45",
    alerts: 3,
    watched: {
      patients: 12450,
      doctors: 1250,
      structures: 85,
      activityRisk: "Faible",
    },
    email: "contact@santeglobale.org",
    phone: "+237 690 000 001",
    createdAt: "2023-06-15",
    permissions: ["lecture", "rapports"],
  },
  {
    id: 2,
    name: "Ministère de la Santé",
    scope: "Contrôle et statistiques nationales",
    role: "État",
    status: "Actif",
    lastSync: "09:20",
    alerts: 0,
    watched: {
      patients: 12450,
      doctors: 1250,
      structures: 85,
      activityRisk: "Stable",
    },
    email: "stats@minsante.cm",
    phone: "+237 670 000 002",
    createdAt: "2023-01-10",
    permissions: ["lecture", "écriture", "admin"],
  },
  {
    id: 3,
    name: "ONG Anti-Fraude Médicale",
    scope: "Détection d'abus et fraudes",
    role: "Audit sécurité",
    status: "Suspended",
    lastSync: "Hier",
    alerts: 7,
    watched: {
      patients: 12450,
      doctors: 1250,
      structures: 85,
      activityRisk: "Élevé",
    },
    email: "alert@antifraude.org",
    phone: "+237 655 000 003",
    createdAt: "2024-01-20",
    permissions: ["lecture"],
  },
];

import ViewObserverModal from "../components/observers/ViewObserverModal";
import AddObserverModal from "../components/observers/AddObserverModal";
import DeleteConfirmModal from "../components/observers/DeleteConfirmModal";
import ObserverCard from "../components/observers/ObserverCard";

/* ================= COMPONENT ================= */
export default function ObservateursAdmin({ darkMode }) {
  const [observers, setObservers] = useState(initialObservers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Selected item
  const [selectedObserver, setSelectedObserver] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    scope: "",
    role: "",
    email: "",
    phone: "",
    permissions: ["lecture"],
    watched: {
      patients: 0,
      doctors: 0,
      structures: 0,
      activityRisk: "Faible",
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  /* ================= FILTERING ================= */
  const filteredObservers = useMemo(() => {
    return observers.filter((o) => {
      const matchSearch =
        o.name.toLowerCase().includes(search.toLowerCase()) ||
        o.scope.toLowerCase().includes(search.toLowerCase()) ||
        o.role.toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        statusFilter === "all" || o.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [observers, search, statusFilter]);

  const paginatedObservers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredObservers.slice(start, start + itemsPerPage);
  }, [filteredObservers, currentPage]);

  const totalPages = Math.ceil(filteredObservers.length / itemsPerPage);

  /* ================= STATS ================= */
  const stats = useMemo(
    () => ({
      total: observers.length,
      active: observers.filter((o) => o.status === "Actif").length,
      totalAlerts: observers.reduce((acc, o) => acc + o.alerts, 0),
      totalPatients: observers[0]?.watched?.patients || 0,
    }),
    [observers]
  );

  /* ================= ACTIONS ================= */
  const handleAddObserver = useCallback(async () => {
    if (!formData.name || !formData.scope || !formData.role) {
      toast.error("❌ Nom, scope et rôle sont requis");
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const newObserver = {
        id: Date.now(),
        ...formData,
        status: "Actif",
        alerts: 0,
        lastSync: "À l'instant",
        createdAt: new Date().toISOString().split("T")[0],
        watched: {
          patients: Number(formData.watched?.patients) || 0,
          doctors: Number(formData.watched?.doctors) || 0,
          structures: Number(formData.watched?.structures) || 0,
          activityRisk:
            formData.watched?.activityRisk || "Faible",
        },
      };

      setObservers((prev) => [newObserver, ...prev]);

      toast.success("✅ Observateur ajouté avec succès");

      resetForm();
      setShowAddModal(false);
    } catch {
      toast.error("❌ Erreur lors de l'ajout");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData]);

  const handleViewObserver = useCallback((observer) => {
    setSelectedObserver(observer);
    setShowViewModal(true);
  }, []);

  const handleToggleStatus = useCallback(
    (id) => {
      setObservers((prev) =>
        prev.map((o) => {
          if (o.id === id) {
            const newStatus =
              o.status === "Actif" ? "Suspended" : "Actif";

            toast.success(
              newStatus === "Actif"
                ? "✅ Observateur activé"
                : "⏸️ Observateur suspendu"
            );

            return {
              ...o,
              status: newStatus,
              lastSync: new Date().toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              }),
            };
          }

          return o;
        })
      );

      if (selectedObserver?.id === id) {
        setSelectedObserver((prev) =>
          prev
            ? {
                ...prev,
                status:
                  prev.status === "Actif"
                    ? "Suspended"
                    : "Actif",
                lastSync: new Date().toLocaleTimeString(
                  "fr-FR",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                ),
              }
            : null
        );
      }
    },
    [selectedObserver]
  );

  const handleDelete = useCallback(
    (id) => {
      setSelectedObserver(
        observers.find((o) => o.id === id)
      );
      setShowDeleteConfirm(true);
    },
    [observers]
  );

  const confirmDelete = useCallback(() => {
    if (selectedObserver) {
      setObservers((prev) =>
        prev.filter((o) => o.id !== selectedObserver.id)
      );

      toast.success("🗑️ Observateur supprimé");

      setShowDeleteConfirm(false);
      setSelectedObserver(null);
      setShowViewModal(false);
    }
  }, [selectedObserver]);

  const handleExport = useCallback((observer) => {
    try {
      const data = JSON.stringify(observer, null, 2);

      const blob = new Blob([data], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");

      a.href = url;

      a.download = `${observer.name.replace(
        /\s+/g,
        "_"
      )}_export.json`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);

      toast.success("📥 Export téléchargé");
    } catch {
      toast.error("❌ Erreur lors de l'export");
    }
  }, []);

  const handleExportAll = useCallback(() => {
    try {
      const data = JSON.stringify(observers, null, 2);

      const blob = new Blob([data], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");

      a.href = url;

      a.download = `observateurs_export_${
        new Date().toISOString().split("T")[0]
      }.json`;

      document.body.appendChild(a);

      a.click();

      document.body.removeChild(a);

      URL.revokeObjectURL(url);

      toast.success("📥 Export complet téléchargé");
    } catch {
      toast.error("❌ Erreur lors de l'export");
    }
  }, [observers]);

  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      scope: "",
      role: "",
      email: "",
      phone: "",
      permissions: ["lecture"],
      watched: {
        patients: 0,
        doctors: 0,
        structures: 0,
        activityRisk: "Faible",
      },
    });
  }, []);

  const resetFilters = useCallback(() => {
    setSearch("");
    setStatusFilter("all");
    setCurrentPage(1);

    toast.info("🔄 Filtres réinitialisés");
  }, []);

  const closeModal = useCallback(() => {
    setShowAddModal(false);
    setShowViewModal(false);
    setShowDeleteConfirm(false);

    setSelectedObserver(null);

    resetForm();
  }, [resetForm]);

  const togglePermission = useCallback((perm) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm],
    }));
  }, []);

  /* ================= RENDER HELPERS ================= */
  const getStatusBadge = (status) => {
    const styles = {
      Actif:
        "bg-green-500/10 text-green-500 border-green-500/20",
      Suspended:
        "bg-red-500/10 text-red-500 border-red-500/20",
    };

    return (
      <span
        className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium border whitespace-nowrap ${
          styles[status] || styles["Actif"]
        }`}
      >
        {status}
      </span>
    );
  };

  const getRiskColor = (risk) => {
    const colors = {
      Faible: "text-green-500",
      Stable: "text-yellow-500",
      Élevé: "text-red-500",
    };

    return colors[risk] || "text-gray-500";
  };

  const bg = darkMode
    ? "bg-slate-950 text-white"
    : "bg-gray-100 text-gray-900";

  const card = darkMode
    ? "bg-slate-900 border-slate-800"
    : "bg-white border-gray-200";

  return (
    <div
      className={`min-h-screen w-full overflow-x-hidden p-2 sm:p-3 md:p-4 lg:p-6 space-y-4 sm:space-y-5 lg:space-y-6 transition-all ${bg}`}
    >
      {/* ================= HEADER ================= */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="min-w-0 w-full">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight flex items-center gap-2 flex-wrap">
            <Shield
              className="text-blue-500 flex-shrink-0"
              size={26}
            />

            <span className="break-words">
              Observateurs institutionnels
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            ONG, État et organismes de surveillance
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">
          <button
            onClick={handleExportAll}
            className={`w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl border font-medium transition flex items-center gap-2 ${
              darkMode
                ? "border-slate-700 hover:bg-slate-800"
                : "border-gray-300 hover:bg-gray-100"
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
            <span>Ajouter</span>
          </button>
        </div>
      </div>

      {/* ================= SEARCH & FILTERS ================= */}
      <div
        className={`rounded-2xl border p-3 sm:p-4 space-y-4 overflow-hidden ${card}`}
      >
        {/* Search */}
        <div className="flex items-center gap-3 px-3 sm:px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700">
          <Search
            size={18}
            className="text-gray-400 flex-shrink-0"
          />

          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Rechercher un organisme, scope, rôle..."
            className="w-full min-w-0 bg-transparent outline-none text-sm"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap gap-2">
          {["all", "Actif", "Suspended"].map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setCurrentPage(1);
              }}
              className={`flex-1 sm:flex-none min-w-[120px] px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                statusFilter === status
                  ? "bg-blue-600 text-white"
                  : darkMode
                  ? "bg-slate-800 text-gray-300 hover:bg-slate-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {status === "all"
                ? "Tous statuts"
                : status}
            </button>
          ))}

          <button
            onClick={resetFilters}
            className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition ${
              darkMode
                ? "hover:bg-slate-800"
                : "hover:bg-gray-100"
            }`}
          >
            <RefreshCw size={14} />
            Réinitialiser
          </button>
        </div>
      </div>

      {/* ================= GLOBAL STATS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            title: "Observateurs",
            value: stats.total,
            icon: Shield,
            color: "blue",
            sub: "Organismes actifs",
          },
          {
            title: "Actifs",
            value: stats.active,
            icon: CheckCircle2,
            color: "green",
            sub: "En surveillance",
          },
          {
            title: "Alertes",
            value: stats.totalAlerts,
            icon: AlertTriangle,
            color:
              stats.totalAlerts > 5 ? "red" : "yellow",
            sub: "À traiter",
          },
          {
            title: "Patients suivis",
            value: stats.totalPatients.toLocaleString(),
            icon: Users,
            color: "purple",
            sub: "Données protégées",
          },
        ].map((item, i) => {
          const Icon = item.icon;

          const colorClasses = {
            blue: "bg-blue-500/10 text-blue-500",
            green: "bg-green-500/10 text-green-500",
            yellow: "bg-yellow-500/10 text-yellow-500",
            red: "bg-red-500/10 text-red-500",
            purple: "bg-purple-500/10 text-purple-500",
          };

          return (
            <div
              key={i}
              className={`rounded-2xl p-4 sm:p-5 border transition hover:shadow-lg overflow-hidden ${
                darkMode
                  ? "bg-slate-900 border-slate-800 hover:border-slate-700"
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-400 truncate">
                    {item.title}
                  </p>

                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mt-1 break-words">
                    {item.value}
                  </h2>

                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {item.sub}
                  </p>
                </div>

                <div
                  className={`p-2.5 md:p-3 rounded-xl flex-shrink-0 ${
                    colorClasses[item.color]
                  }`}
                >
                  <Icon size={20} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= MOBILE + TABLET CARDS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:hidden gap-4">
        {paginatedObservers.length > 0 ? (
          paginatedObservers.map((o) => (
            <div
              key={o.id}
              className={`rounded-2xl border p-4 space-y-4 overflow-hidden ${card}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {o.name.charAt(0)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold truncate text-sm sm:text-base">
                      {o.name}
                    </h3>

                    <p className="text-xs sm:text-sm text-gray-400 truncate">
                      {o.role}
                    </p>
                  </div>
                </div>

                {getStatusBadge(o.status)}
              </div>

              {/* Info */}
              <div className="space-y-2 text-xs sm:text-sm">
                <p className="text-gray-400 break-words">
                  <span className="font-medium">
                    Scope:
                  </span>{" "}
                  {o.scope}
                </p>

                <div className="flex items-center gap-2 text-gray-400">
                  <Clock
                    size={14}
                    className="flex-shrink-0"
                  />

                  <span className="truncate">
                    Sync: {o.lastSync}
                  </span>
                </div>

                <div className="flex items-center gap-2 min-w-0">
                  <AlertTriangle
                    size={14}
                    className={`${getRiskColor(
                      o.watched.activityRisk
                    )} flex-shrink-0`}
                  />

                  <span
                    className={`${getRiskColor(
                      o.watched.activityRisk
                    )} truncate`}
                  >
                    Risque: {o.watched.activityRisk}
                  </span>
                </div>

                {o.alerts > 0 && (
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertTriangle
                      size={14}
                      className="flex-shrink-0"
                    />

                    <span className="truncate">
                      {o.alerts} alerte
                      {o.alerts > 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </div>

              {/* Watched Data */}
              <div className="grid grid-cols-3 gap-2 text-[11px] sm:text-xs">
                <div
                  className={`p-2 rounded-lg text-center overflow-hidden ${
                    darkMode
                      ? "bg-slate-800"
                      : "bg-gray-50"
                  }`}
                >
                  <p className="font-semibold truncate">
                    {o.watched.patients.toLocaleString()}
                  </p>

                  <p className="text-gray-400 truncate">
                    Patients
                  </p>
                </div>

                <div
                  className={`p-2 rounded-lg text-center overflow-hidden ${
                    darkMode
                      ? "bg-slate-800"
                      : "bg-gray-50"
                  }`}
                >
                  <p className="font-semibold truncate">
                    {o.watched.doctors}
                  </p>

                  <p className="text-gray-400 truncate">
                    Médecins
                  </p>
                </div>

                <div
                  className={`p-2 rounded-lg text-center overflow-hidden ${
                    darkMode
                      ? "bg-slate-800"
                      : "bg-gray-50"
                  }`}
                >
                  <p className="font-semibold truncate">
                    {o.watched.structures}
                  </p>

                  <p className="text-gray-400 truncate">
                    Structures
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t dark:border-slate-800">
                <button
                  onClick={() => handleViewObserver(o)}
                  className="flex items-center justify-center gap-2 py-2 rounded-xl bg-blue-500/10 text-blue-500 text-sm"
                >
                  <Eye size={16} />
                  <span>Voir</span>
                </button>

                <button
                  onClick={() => handleToggleStatus(o.id)}
                  className={`flex items-center justify-center gap-2 py-2 rounded-xl text-sm ${
                    o.status === "Actif"
                      ? "bg-yellow-500/10 text-yellow-500"
                      : "bg-green-500/10 text-green-500"
                  }`}
                >
                  <Edit size={16} />

                  <span className="truncate">
                    {o.status === "Actif"
                      ? "Suspendre"
                      : "Activer"}
                  </span>
                </button>

                <button
                  onClick={() => handleDelete(o.id)}
                  className="flex items-center justify-center gap-2 py-2 rounded-xl bg-red-500/10 text-red-500 text-sm"
                >
                  <Trash2 size={16} />
                  <span>Suppr.</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div
            className={`rounded-2xl border p-8 sm:p-10 text-center ${card}`}
          >
            <div className="flex flex-col items-center gap-3">
              <AlertTriangle
                size={40}
                className="opacity-50"
              />

              <p className="text-gray-400 text-sm sm:text-base">
                Aucun observateur trouvé
              </p>

              <button
                onClick={resetFilters}
                className="text-blue-500 hover:underline text-sm"
              >
                Réinitialiser les filtres
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= DESKTOP GRID ================= */}
      <div className="hidden xl:grid grid-cols-1 2xl:grid-cols-2 3xl:grid-cols-3 gap-5">
        {paginatedObservers.length > 0 ? (
          paginatedObservers.map((o) => (
            <ObserverCard
              key={o.id}
              observer={o}
              darkMode={darkMode}
              cardClass={card}
              onView={() => handleViewObserver(o)}
              onToggleStatus={() =>
                handleToggleStatus(o.id)
              }
              onExport={() => handleExport(o)}
              onDelete={() => handleDelete(o.id)}
              getStatusBadge={getStatusBadge}
              getRiskColor={getRiskColor}
            />
          ))
        ) : (
          <div
            className={`col-span-full p-12 rounded-2xl border text-center ${card}`}
          >
            <AlertTriangle
              size={40}
              className="mx-auto text-gray-400 mb-3"
            />

            <p className="text-gray-400">
              Aucun observateur trouvé
            </p>

            <button
              onClick={resetFilters}
              className="mt-3 text-blue-500 hover:underline text-sm"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>

      {/* ================= PAGINATION ================= */}
      {totalPages > 1 && (
        <div
          className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 rounded-xl border ${card}`}
        >
          <p className="text-xs sm:text-sm text-gray-400 text-center sm:text-left">
            Page {currentPage} sur {totalPages} •{" "}
            {filteredObservers.length} résultats
          </p>

          <div className="flex gap-2">
            <button
              onClick={() =>
                setCurrentPage((p) => Math.max(1, p - 1))
              }
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
                setCurrentPage((p) =>
                  Math.min(totalPages, p + 1)
                )
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

      {showAddModal && (
        <AddObserverModal
          darkMode={darkMode}
          formData={formData}
          setFormData={setFormData}
          isSubmitting={isSubmitting}
          onSubmit={handleAddObserver}
          onClose={closeModal}
          togglePermission={togglePermission}
        />
      )}

      {showViewModal && selectedObserver && (
        <ViewObserverModal
          darkMode={darkMode}
          observer={selectedObserver}
          onClose={closeModal}
          onToggleStatus={() =>
            handleToggleStatus(selectedObserver.id)
          }
          onExport={() =>
            handleExport(selectedObserver)
          }
          onDelete={() => {
            setShowViewModal(false);
            handleDelete(selectedObserver.id);
          }}
          getStatusBadge={getStatusBadge}
          getRiskColor={getRiskColor}
        />
      )}

      {showDeleteConfirm && selectedObserver && (
        <DeleteConfirmModal
          darkMode={darkMode}
          item={selectedObserver}
          itemType="observateur"
          onConfirm={confirmDelete}
          onCancel={closeModal}
        />
      )}
    </div>
  );
}