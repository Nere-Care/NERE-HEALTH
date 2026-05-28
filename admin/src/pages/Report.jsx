import { useState, useMemo, useCallback } from "react";
import { toast } from "react-hot-toast";
import {
  Search,
  FileText,
  Download,
  Eye,
  Trash2,
  Calendar,
  Plus,
  X,
  Building2,
  Users,
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Copy,
  ExternalLink,
  Clock,
  AlertTriangle,
} from "lucide-react";

/* ================= MOCK REPORTS ================= */
const initialReports = [
  {
    id: 1,
    title: "Rapport des structures sanitaires",
    type: "Structures",
    generatedFor: "Structures de santé",
    date: "2026-05-18",
    status: "Publié",
    file: "/reports/structures.pdf",
    size: "2.4 MB",
    pages: 45,
    description:
      "Analyse complète des structures de santé enregistrées",
  },
  {
    id: 2,
    title: "Rapport des professionnels de santé",
    type: "Professionnels",
    generatedFor: "Professionnels",
    date: "2026-05-12",
    status: "Publié",
    file: "/reports/professionnels.pdf",
    size: "1.8 MB",
    pages: 32,
    description:
      "État des lieux des professionnels actifs",
  },
  {
    id: 3,
    title: "Rapport des utilisateurs",
    type: "Utilisateurs",
    generatedFor: "Utilisateurs",
    date: "2026-05-10",
    status: "En attente",
    file: "/reports/users.pdf",
    size: "—",
    pages: 0,
    description: "Génération en cours...",
  },
];

/* ================= COMPONENT ================= */
export default function ReportsPage({ darkMode }) {
  const [reports, setReports] = useState(initialReports);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showGenerateModal, setShowGenerateModal] =
    useState(false);
  const [showViewModal, setShowViewModal] =
    useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] =
    useState(false);

  const [selectedReport, setSelectedReport] =
    useState(null);

  const [reportForm, setReportForm] = useState({
    title: "",
    type: "",
    description: "",
    dateRange: "30j",
  });

  const [formErrors, setFormErrors] = useState({});
  const [isGenerating, setIsGenerating] =
    useState(false);

  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 6;

  /* ================= FILTER ================= */
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchSearch =
        r.title
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        r.generatedFor
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchType =
        typeFilter === "all" ||
        r.type === typeFilter;

      const matchStatus =
        statusFilter === "all" ||
        r.status === statusFilter;

      return (
        matchSearch &&
        matchType &&
        matchStatus
      );
    });
  }, [reports, search, typeFilter, statusFilter]);

  const paginatedReports = useMemo(() => {
    const start =
      (currentPage - 1) * itemsPerPage;

    return filteredReports.slice(
      start,
      start + itemsPerPage
    );
  }, [filteredReports, currentPage]);

  const totalPages = Math.ceil(
    filteredReports.length / itemsPerPage
  );

  /* ================= STATS ================= */
  const stats = useMemo(
    () => ({
      total: reports.length,
      published: reports.filter(
        (r) => r.status === "Publié"
      ).length,
      pending: reports.filter(
        (r) => r.status === "En attente"
      ).length,
      totalSize: reports
        .filter((r) => r.status === "Publié")
        .reduce((acc, r) => {
          const size = parseFloat(r.size);

          return acc + (isNaN(size) ? 0 : size);
        }, 0),
    }),
    [reports]
  );

  /* ================= ACTIONS ================= */
  const validateForm = useCallback(() => {
    const errors = {};

    if (!reportForm.title.trim()) {
      errors.title = "Le titre est requis";
    }

    if (!reportForm.type) {
      errors.type = "Le type est requis";
    }

    return errors;
  }, [reportForm]);

  const handleGenerateReport =
    useCallback(async () => {
      const errors = validateForm();

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);

        toast.error(
          "❌ Veuillez corriger les erreurs"
        );

        return;
      }

      setIsGenerating(true);

      try {
        await new Promise((resolve) =>
          setTimeout(resolve, 1500)
        );

        const newReport = {
          id: Date.now(),
          title: reportForm.title,
          type: reportForm.type,
          generatedFor: reportForm.type,
          date: new Date()
            .toISOString()
            .split("T")[0],
          status: "Publié",
          file: `/reports/${reportForm.type.toLowerCase()}_${Date.now()}.pdf`,
          size: `${(
            Math.random() * 3 +
            0.5
          ).toFixed(1)} MB`,
          pages:
            Math.floor(Math.random() * 50) + 10,
          description:
            reportForm.description ||
            "Rapport généré automatiquement",
        };

        setReports((prev) => [
          newReport,
          ...prev,
        ]);

        toast.success(
          "✅ Rapport généré avec succès"
        );

        setReportForm({
          title: "",
          type: "",
          description: "",
          dateRange: "30j",
        });

        setFormErrors({});
        setShowGenerateModal(false);
      } catch {
        toast.error(
          "❌ Erreur lors de la génération"
        );
      } finally {
        setIsGenerating(false);
      }
    }, [reportForm, validateForm]);

  const handleViewReport = useCallback(
    (report) => {
      if (report.status !== "Publié") {
        toast.info(
          "⏳ Ce rapport n'est pas encore disponible"
        );

        return;
      }

      setSelectedReport(report);
      setShowViewModal(true);
    },
    []
  );

  const handleDownloadReport = useCallback(
    (report) => {
      if (report.status !== "Publié") {
        toast.info(
          "⏳ Rapport non disponible"
        );

        return;
      }

      toast.success(
        `📥 Téléchargement : ${report.title}`
      );
    },
    []
  );

  const handleDelete = useCallback(
    (report) => {
      setSelectedReport(report);
      setShowDeleteConfirm(true);
    },
    []
  );

  const confirmDelete = useCallback(() => {
    if (!selectedReport) return;

    setReports((prev) =>
      prev.filter(
        (r) => r.id !== selectedReport.id
      )
    );

    toast.success("🗑️ Rapport supprimé");

    setSelectedReport(null);
    setShowDeleteConfirm(false);
  }, [selectedReport]);

  const handleCopyLink = useCallback(
    (report) => {
      const url = `${window.location.origin}/reports/${report.id}`;

      navigator.clipboard.writeText(url);

      toast.success("📋 Lien copié");
    },
    []
  );

  const handleShareReport = useCallback(
    async (report) => {
      const text = `📊 ${report.title}`;

      if (navigator.share) {
        await navigator.share({
          title: report.title,
          text,
          url: window.location.href,
        });
      } else {
        navigator.clipboard.writeText(text);

        toast.success(
          "📋 Rapport copié pour partage"
        );
      }
    },
    []
  );

  const resetFilters = useCallback(() => {
    setSearch("");
    setTypeFilter("all");
    setStatusFilter("all");
    setCurrentPage(1);

    toast.success(
      "🔄 Filtres réinitialisés"
    );
  }, []);

  const closeModal = useCallback(() => {
    setShowGenerateModal(false);
    setShowViewModal(false);
    setShowDeleteConfirm(false);

    setSelectedReport(null);
    setFormErrors({});
  }, []);

  /* ================= HELPERS ================= */
  const getStatusBadge = (status) => {
    const styles = {
      Publié:
        "bg-green-500/10 text-green-500 border-green-500/20",
      "En attente":
        "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      Échoué:
        "bg-red-500/10 text-red-500 border-red-500/20",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${
          styles[status]
        }`}
      >
        {status}
      </span>
    );
  };

  const getTypeIcon = (type) => {
    const icons = {
      Structures: Building2,
      Professionnels: Users,
      Utilisateurs: Activity,
    };

    return icons[type] || FileText;
  };

  const getTypeColor = (type) => {
    const colors = {
      Structures: "text-purple-500",
      Professionnels: "text-green-500",
      Utilisateurs: "text-blue-500",
    };

    return colors[type] || "text-gray-500";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";

    return new Date(dateStr).toLocaleDateString(
      "fr-FR",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  const bg = darkMode
    ? "bg-slate-950 text-white"
    : "bg-gray-100 text-gray-900";

  const card = darkMode
    ? "bg-slate-900 border-slate-800"
    : "bg-white border-gray-200";

  return (
    <div
      className={`min-h-screen p-3 sm:p-5 lg:p-6 space-y-5 ${bg}`}
    >
      {/* ================= HEADER ================= */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <FileText
              size={28}
              className="text-blue-500"
            />
            Gestion des Rapports
          </h1>

          <p className="text-sm text-gray-400 mt-1">
            Génération et suivi des rapports
            analytiques
          </p>
        </div>

        <button
          onClick={() =>
            setShowGenerateModal(true)
          }
          className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-700 hover:to-indigo-700 transition flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Générer un rapport
        </button>
      </div>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            title: "Total",
            value: stats.total,
            icon: FileText,
            color:
              "bg-blue-500/10 text-blue-500",
          },
          {
            title: "Publiés",
            value: stats.published,
            icon: CheckCircle2,
            color:
              "bg-green-500/10 text-green-500",
          },
          {
            title: "En attente",
            value: stats.pending,
            icon: Clock,
            color:
              "bg-yellow-500/10 text-yellow-500",
          },
          {
            title: "Volume",
            value: `${stats.totalSize.toFixed(
              1
            )} MB`,
            icon: Download,
            color:
              "bg-purple-500/10 text-purple-500",
          },
        ].map((item, i) => {
          const Icon = item.icon;

          return (
            <div
              key={i}
              className={`rounded-2xl border p-4 ${card}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">
                    {item.title}
                  </p>

                  <h2 className="text-2xl font-bold mt-1">
                    {item.value}
                  </h2>
                </div>

                <div
                  className={`p-3 rounded-xl ${item.color}`}
                >
                  <Icon size={20} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= FILTERS ================= */}
      <div
        className={`rounded-2xl border p-4 space-y-4 ${card}`}
      >
        <div
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
            darkMode
              ? "border-slate-700"
              : "border-gray-300"
          }`}
        >
          <Search
            size={18}
            className="text-gray-400"
          />

          <input
            type="text"
            placeholder="Rechercher un rapport..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-transparent outline-none text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            "all",
            "Structures",
            "Professionnels",
            "Utilisateurs",
          ].map((type) => (
            <button
              key={type}
              onClick={() => {
                setTypeFilter(type);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-sm transition ${
                typeFilter === type
                  ? "bg-blue-600 text-white"
                  : darkMode
                  ? "bg-slate-800 hover:bg-slate-700"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {type === "all"
                ? "Tous types"
                : type}
            </button>
          ))}

          {[
            "all",
            "Publié",
            "En attente",
          ].map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-sm transition ${
                statusFilter === status
                  ? "bg-blue-600 text-white"
                  : darkMode
                  ? "bg-slate-800 hover:bg-slate-700"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {status === "all"
                ? "Tous statuts"
                : status}
            </button>
          ))}

          <button
            onClick={resetFilters}
            className={`px-4 py-2 rounded-xl ${
              darkMode
                ? "bg-slate-800 hover:bg-slate-700"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* ================= REPORTS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-5">
        {paginatedReports.length > 0 ? (
          paginatedReports.map((r) => {
            const TypeIcon =
              getTypeIcon(r.type);

            return (
              <div
                key={r.id}
                className={`rounded-3xl border p-5 transition hover:shadow-lg ${card}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`p-3 rounded-2xl ${
                      darkMode
                        ? "bg-slate-800"
                        : "bg-gray-100"
                    }`}
                  >
                    <TypeIcon
                      size={22}
                      className={getTypeColor(
                        r.type
                      )}
                    />
                  </div>

                  {getStatusBadge(r.status)}
                </div>

                <h2 className="mt-4 text-lg font-bold line-clamp-1">
                  {r.title}
                </h2>

                <p
                  className={`text-sm mt-1 ${getTypeColor(
                    r.type
                  )}`}
                >
                  {r.generatedFor}
                </p>

                <div className="space-y-2 mt-4 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    {formatDate(r.date)}
                  </div>

                  {r.status === "Publié" && (
                    <div className="flex items-center gap-4 text-xs">
                      <span>
                        📄 {r.pages} pages
                      </span>

                      <span>
                        💾 {r.size}
                      </span>
                    </div>
                  )}
                </div>

                {/* ACTIONS */}
                <div className="mt-6 pt-4 border-t dark:border-slate-800 flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      handleViewReport(r)
                    }
                    disabled={
                      r.status !== "Publié"
                    }
                    className={`flex-1 min-w-[90px] py-2.5 rounded-2xl border flex items-center justify-center gap-2 text-sm transition ${
                      r.status === "Publié"
                        ? darkMode
                          ? "hover:bg-slate-800"
                          : "hover:bg-gray-100"
                        : "opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <Eye size={16} />
                    Voir
                  </button>

                  <button
                    onClick={() =>
                      handleDownloadReport(r)
                    }
                    disabled={
                      r.status !== "Publié"
                    }
                    className={`flex-1 min-w-[90px] py-2.5 rounded-2xl flex items-center justify-center gap-2 text-sm transition ${
                      r.status === "Publié"
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    <Download size={16} />
                    PDF
                  </button>

                  <button
                    onClick={() =>
                      handleCopyLink(r)
                    }
                    className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-500 hover:bg-purple-500/20"
                  >
                    <Copy size={16} />
                  </button>

                  <button
                    onClick={() =>
                      handleDelete(r)
                    }
                    className="p-2.5 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500/20"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div
            className={`col-span-full rounded-2xl border p-10 text-center ${card}`}
          >
            <AlertCircle
              size={40}
              className="mx-auto opacity-50"
            />

            <p className="mt-3 text-gray-400">
              Aucun rapport trouvé
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
          className={`rounded-2xl border p-4 flex flex-col sm:flex-row items-center justify-between gap-4 ${card}`}
        >
          <p className="text-sm text-gray-400">
            Page {currentPage} sur{" "}
            {totalPages}
          </p>

          <div className="flex gap-2">
            <button
              onClick={() =>
                setCurrentPage((p) =>
                  Math.max(1, p - 1)
                )
              }
              disabled={currentPage === 1}
              className={`p-2 rounded-xl border disabled:opacity-50 ${
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
              disabled={
                currentPage === totalPages
              }
              className={`p-2 rounded-xl border disabled:opacity-50 ${
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
      {showGenerateModal && (
        <GenerateReportModal
          darkMode={darkMode}
          formData={reportForm}
          setFormData={setReportForm}
          formErrors={formErrors}
          isGenerating={isGenerating}
          onSubmit={handleGenerateReport}
          onClose={closeModal}
        />
      )}

      {showViewModal && selectedReport && (
        <ViewReportModal
          darkMode={darkMode}
          report={selectedReport}
          onClose={closeModal}
          onDownload={() =>
            handleDownloadReport(
              selectedReport
            )
          }
          onCopyLink={() =>
            handleCopyLink(selectedReport)
          }
          onShare={() =>
            handleShareReport(
              selectedReport
            )
          }
          formatDate={formatDate}
        />
      )}

      {showDeleteConfirm &&
        selectedReport && (
          <DeleteConfirmModal
            darkMode={darkMode}
            item={selectedReport}
            onConfirm={confirmDelete}
            onCancel={closeModal}
          />
        )}
    </div>
  );
}

/* ================= GENERATE MODAL ================= */
function GenerateReportModal({
  darkMode,
  formData,
  setFormData,
  formErrors,
  isGenerating,
  onSubmit,
  onClose,
}) {
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const inputClass = (field) =>
    `w-full p-4 rounded-2xl border bg-transparent outline-none focus:ring-2 focus:ring-blue-500 transition ${
      formErrors[field]
        ? "border-red-500"
        : darkMode
        ? "border-slate-700"
        : "border-gray-300"
    }`;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className={`w-full max-w-lg rounded-3xl overflow-hidden ${
          darkMode
            ? "bg-slate-900 text-white"
            : "bg-white text-gray-900"
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b dark:border-slate-700">
          <div>
            <h2 className="text-xl font-bold">
              Générer un rapport
            </h2>

            <p className="text-sm text-gray-400">
              Configurer la génération
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="p-5 space-y-4"
        >
          <div>
            <label className="text-sm font-medium">
              Titre *
            </label>

            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={inputClass("title")}
            />

            {formErrors.title && (
              <p className="text-xs text-red-500 mt-1">
                {formErrors.title}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">
              Type *
            </label>

            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className={inputClass("type")}
            >
              <option value="">
                Sélectionner
              </option>

              <option value="Structures">
                Structures
              </option>

              <option value="Professionnels">
                Professionnels
              </option>

              <option value="Utilisateurs">
                Utilisateurs
              </option>
            </select>

            {formErrors.type && (
              <p className="text-xs text-red-500 mt-1">
                {formErrors.type}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">
              Description
            </label>

            <textarea
              rows={4}
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={`${inputClass()} resize-none`}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-3 rounded-2xl border ${
                darkMode
                  ? "border-slate-700 hover:bg-slate-800"
                  : "border-gray-300 hover:bg-gray-100"
              }`}
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={isGenerating}
              className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Génération...
                </>
              ) : (
                "Générer"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ================= VIEW MODAL ================= */
function ViewReportModal({
  darkMode,
  report,
  onClose,
  onDownload,
  onCopyLink,
  onShare,
  formatDate,
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className={`w-full max-w-3xl rounded-3xl overflow-hidden ${
          darkMode
            ? "bg-slate-900 text-white"
            : "bg-white text-gray-900"
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b dark:border-slate-700">
          <div>
            <h2 className="text-xl font-bold">
              {report.title}
            </h2>

            <p className="text-sm text-gray-400">
              {formatDate(report.date)}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetaItem
              darkMode={darkMode}
              label="Type"
              value={report.type}
            />

            <MetaItem
              darkMode={darkMode}
              label="Pages"
              value={report.pages}
            />

            <MetaItem
              darkMode={darkMode}
              label="Taille"
              value={report.size}
            />

            <MetaItem
              darkMode={darkMode}
              label="Statut"
              value={report.status}
              badge
            />
          </div>

          <div
            className={`rounded-2xl border-2 border-dashed p-10 text-center ${
              darkMode
                ? "border-slate-700 bg-slate-800/50"
                : "border-gray-300 bg-gray-50"
            }`}
          >
            <FileText
              size={40}
              className="mx-auto text-gray-400 mb-3"
            />

            <p className="text-gray-400">
              Aperçu PDF
            </p>
          </div>
        </div>

        <div className="p-5 border-t dark:border-slate-700 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onDownload}
            className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
          >
            <Download size={18} />
            Télécharger
          </button>

          <div className="flex gap-2">
            <button
              onClick={onCopyLink}
              className={`p-3 rounded-2xl border ${
                darkMode
                  ? "border-slate-700 hover:bg-slate-800"
                  : "border-gray-300 hover:bg-gray-100"
              }`}
            >
              <Copy size={16} />
            </button>

            <button
              onClick={onShare}
              className={`p-3 rounded-2xl border ${
                darkMode
                  ? "border-slate-700 hover:bg-slate-800"
                  : "border-gray-300 hover:bg-gray-100"
              }`}
            >
              <ExternalLink size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaItem({
  label,
  value,
  badge = false,
  darkMode,
}) {
  return (
    <div
      className={`p-3 rounded-xl text-center ${
        darkMode
          ? "bg-slate-800"
          : "bg-gray-50"
      }`}
    >
      <p className="text-xs text-gray-400">
        {label}
      </p>

      {badge ? (
        <span
          className={`inline-block mt-1 px-2 py-1 rounded text-xs ${
            value === "Publié"
              ? "bg-green-500/10 text-green-500"
              : "bg-yellow-500/10 text-yellow-500"
          }`}
        >
          {value}
        </span>
      ) : (
        <p className="font-medium mt-1">
          {value}
        </p>
      )}
    </div>
  );
}

/* ================= DELETE MODAL ================= */
function DeleteConfirmModal({
  darkMode,
  item,
  onConfirm,
  onCancel,
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className={`w-full max-w-md rounded-3xl p-6 ${
          darkMode
            ? "bg-slate-900 text-white"
            : "bg-white text-gray-900"
        }`}
      >
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="text-red-500" />
          </div>

          <h3 className="text-xl font-bold">
            Supprimer ce rapport ?
          </h3>

          <p className="text-gray-400 mt-2">
            Cette action est irréversible.
          </p>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onCancel}
              className={`flex-1 py-3 rounded-2xl border ${
                darkMode
                  ? "border-slate-700 hover:bg-slate-800"
                  : "border-gray-300 hover:bg-gray-100"
              }`}
            >
              Annuler
            </button>

            <button
              onClick={onConfirm}
              className="flex-1 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}