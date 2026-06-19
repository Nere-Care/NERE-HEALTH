import { useState, useMemo, useCallback } from "react";
import { toast } from "react-hot-toast";
import {
  Search,
  Plus,
  Eye,
  Trash2,
  Building2,
  Phone,
  Activity,
  Users,
  FileCheck2,
  AlertCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import ViewDoctorModal from "../components/doctors/ViewDoctorModal";
import AddDoctorModal from "../components/doctors/AddDoctorModal";
import DocumentsModal from "../components/doctors/DocumentsModal";
import DeleteConfirmModal from "../components/doctors/DeleteConfirmModal";

/* ================= MOCK DATA ================= */
const initialDoctors = [
  {
    id: 1,
    name: "Dr. Martin Nkono",
    specialty: "Cardiologue",
    hospital: "Hôpital Laquintinie",
    phone: "+237 690 000 001",
    email: "martin.nkono@hopital.cm",
    address: "Douala, Bonanjo",
    status: "En attente",
    documents: [
      { id: 1, name: "CV.pdf", url: "#", type: "application/pdf", size: "2.4 MB" },
      { id: 2, name: "Licence.pdf", url: "#", type: "application/pdf", size: "1.1 MB" },
      { id: 3, name: "Attestation.pdf", url: "#", type: "application/pdf", size: "890 KB" },
    ],
    createdAt: "2024-01-15",
  },
  {
    id: 2,
    name: "Dr. Sarah Ngono",
    specialty: "Pédiatre",
    hospital: "CHU Yaoundé",
    phone: "+237 670 000 002",
    email: "sarah.ngono@chu.cm",
    address: "Yaoundé, Bastos",
    status: "Vérifié",
    documents: [
      { id: 1, name: "CV.pdf", url: "#", type: "application/pdf", size: "1.8 MB" },
    ],
    createdAt: "2024-01-10",
  },
  {
    id: 3,
    name: "Dr. Paul Mbe",
    specialty: "Chirurgien",
    hospital: "Hôpital Général Douala",
    phone: "+237 650 000 003",
    email: "paul.mbe@hgdouala.cm",
    address: "Douala, Akwa",
    status: "Rejeté",
    documents: [
      { id: 1, name: "Incomplet.pdf", url: "#", type: "application/pdf", size: "450 KB" },
    ],
    createdAt: "2024-01-20",
  },
];

/* ================= COMPONENT ================= */
export default function DoctorsPage({ darkMode }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [doctors, setDoctors] = useState(initialDoctors);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Selected items
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    specialty: "",
    hospital: "",
    phone: "",
    email: "",
    address: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  /* ================= FILTERING ================= */
  const filteredDoctors = useMemo(() => {
    return doctors.filter((d) => {
      const matchSearch =
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.specialty.toLowerCase().includes(search.toLowerCase()) ||
        d.hospital.toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        statusFilter === "all" || d.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [doctors, search, statusFilter]);

  const paginatedDoctors = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDoctors.slice(start, start + itemsPerPage);
  }, [filteredDoctors, currentPage]);

  const totalPages = Math.ceil(filteredDoctors.length / itemsPerPage);

  /* ================= STATS ================= */
  const stats = useMemo(
    () => ({
      total: doctors.length,
      pending: doctors.filter((d) => d.status === "En attente").length,
      verified: doctors.filter((d) => d.status === "Vérifié").length,
      rejected: doctors.filter((d) => d.status === "Rejeté").length,
    }),
    [doctors]
  );

  /* ================= ACTIONS ================= */
  const handleAddDoctor = useCallback(async () => {
    if (!formData.name || !formData.specialty) {
      toast.error("❌ Nom et spécialité requis");
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const newDoctor = {
        id: Date.now(),
        ...formData,
        status: "En attente",
        documents: [],
        createdAt: new Date().toISOString().split("T")[0],
      };

      setDoctors((prev) => [newDoctor, ...prev]);

      toast.success("✅ Médecin ajouté avec succès");

      setFormData({
        name: "",
        specialty: "",
        hospital: "",
        phone: "",
        email: "",
        address: "",
      });

      setShowAddModal(false);
    } catch {
      toast.error("❌ Erreur lors de l'ajout");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData]);

  const handleViewDoctor = useCallback((doctor) => {
    setSelectedDoctor(doctor);
    setShowViewModal(true);
  }, []);

  const handleViewDocuments = useCallback((doctor) => {
    setSelectedDoctor(doctor);
    setShowDocModal(true);
  }, []);

  const handleVerify = useCallback(
    (id) => {
      setDoctors((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, status: "Vérifié" } : d
        )
      );

      toast.success("✅ Médecin vérifié");

      if (selectedDoctor?.id === id) {
        setSelectedDoctor((prev) =>
          prev ? { ...prev, status: "Vérifié" } : null
        );
      }
    },
    [selectedDoctor]
  );

  const handleReject = useCallback(
    (id, reason = "") => {
      setDoctors((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, status: "Rejeté" } : d
        )
      );

      toast.error(`🚫 Médecin rejeté${reason ? `: ${reason}` : ""}`);

      if (selectedDoctor?.id === id) {
        setSelectedDoctor((prev) =>
          prev ? { ...prev, status: "Rejeté" } : null
        );
      }
    },
    [selectedDoctor]
  );

  const handleDelete = useCallback(
    (id) => {
      setSelectedDoctor(doctors.find((d) => d.id === id));
      setShowDeleteConfirm(true);
    },
    [doctors]
  );

  const confirmDelete = useCallback(() => {
    if (selectedDoctor) {
      setDoctors((prev) =>
        prev.filter((d) => d.id !== selectedDoctor.id)
      );

      toast.success("🗑️ Médecin supprimé");

      setShowDeleteConfirm(false);
      setSelectedDoctor(null);
      setShowViewModal(false);
    }
  }, [selectedDoctor]);

  const handleDownload = useCallback((doc) => {
    toast.success(`📥 Téléchargement: ${doc.name}`);
  }, []);

  const handlePreview = useCallback((doc) => {
    toast.info(`👁️ Aperçu: ${doc.name}`);
  }, []);

  const handleStatusChange = useCallback(
    (newStatus) => {
      if (selectedDoctor) {
        setDoctors((prev) =>
          prev.map((d) =>
            d.id === selectedDoctor.id
              ? { ...d, status: newStatus }
              : d
          )
        );

        setSelectedDoctor((prev) =>
          prev ? { ...prev, status: newStatus } : null
        );

        toast.success(
          newStatus === "Vérifié" ? "✅ Vérifié" : "🚫 Rejeté"
        );
      }
    },
    [selectedDoctor]
  );

  const closeModal = useCallback(() => {
    setShowAddModal(false);
    setShowViewModal(false);
    setShowDocModal(false);
    setShowDeleteConfirm(false);
    setSelectedDoctor(null);
  }, []);

  /* ================= HELPERS ================= */
  const getStatusBadge = (status) => {
    const styles = {
      Vérifié:
        "bg-green-500/10 text-green-500 border-green-500/20",
      "En attente":
        "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      Rejeté:
        "bg-red-500/10 text-red-500 border-red-500/20",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${
          styles[status] || styles["En attente"]
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <div
      className={`min-h-screen p-3 sm:p-4 lg:p-6 space-y-5 lg:space-y-6 transition-all ${
        darkMode
          ? "bg-slate-950 text-white"
          : "bg-gray-100 text-gray-900"
      }`}
    >
      {/* ================= HEADER ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
            Gestion des Médecins
          </h1>

          <p className="text-sm text-gray-400 mt-1">
            Vérification et administration des dossiers
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto justify-center px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-blue-500/25 active:scale-95 flex items-center gap-2"
        >
          <Plus size={18} />
          <span>Ajouter médecin</span>
        </button>
      </div>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {[
          {
            title: "Total médecins",
            value: stats.total,
            icon: Users,
            color: "blue",
          },
          {
            title: "En attente",
            value: stats.pending,
            icon: Activity,
            color: "yellow",
          },
          {
            title: "Vérifiés",
            value: stats.verified,
            icon: FileCheck2,
            color: "green",
          },
        ].map((item, i) => {
          const Icon = item.icon;

          const colorClasses = {
            blue: "bg-blue-500/10 text-blue-500",
            yellow: "bg-yellow-500/10 text-yellow-500",
            green: "bg-green-500/10 text-green-500",
          };

          return (
            <div
              key={i}
              className={`rounded-2xl p-4 sm:p-5 border transition hover:shadow-lg ${
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
                  className={`p-3 rounded-xl flex-shrink-0 ${colorClasses[item.color]}`}
                >
                  <Icon size={22} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= FILTERS ================= */}
      <div
        className={`rounded-2xl border p-4 space-y-4 ${
          darkMode
            ? "bg-slate-900 border-slate-800"
            : "bg-white border-gray-200"
        }`}
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
            placeholder="Rechercher un médecin, spécialité, hôpital..."
            className="w-full bg-transparent outline-none text-sm"
          />
        </div>

        {/* Status buttons */}
        <div className="flex flex-wrap gap-2">
          {["all", "En attente", "Vérifié", "Rejeté"].map(
            (status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                  statusFilter === status
                    ? "bg-blue-600 text-white"
                    : darkMode
                    ? "bg-slate-800 text-gray-300 hover:bg-slate-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {status === "all" ? "Tous" : status}
              </button>
            )
          )}
        </div>
      </div>

      {/* ================= MOBILE CARDS ================= */}
      <div className="lg:hidden space-y-4">
        {paginatedDoctors.length > 0 ? (
          paginatedDoctors.map((d) => (
            <div
              key={d.id}
              className={`rounded-2xl border p-4 space-y-4 ${
                darkMode
                  ? "bg-slate-900 border-slate-800"
                  : "bg-white border-gray-200"
              }`}
            >
              {/* Top */}
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {d.name.charAt(0)}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold truncate">{d.name}</h3>

                  <p className="text-sm text-gray-400 truncate">
                    {d.specialty}
                  </p>

                  <div className="mt-2">
                    {getStatusBadge(d.status)}
                  </div>
                </div>
              </div>

              {/* Infos */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <Building2 size={15} />
                  <span className="truncate">{d.hospital}</span>
                </div>

                <div className="flex items-center gap-2 text-gray-400">
                  <Phone size={15} />
                  <span>{d.phone}</span>
                </div>

                <div className="flex items-center gap-2 text-blue-500">
                  <FileText size={15} />
                  <span>{d.documents?.length || 0} document(s)</span>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleViewDoctor(d)}
                  className="flex items-center justify-center gap-2 py-2 rounded-xl bg-blue-500/10 text-blue-500"
                >
                  <Eye size={16} />
                  <span className="text-sm">Voir</span>
                </button>

                <button
                  onClick={() => handleViewDocuments(d)}
                  className="flex items-center justify-center gap-2 py-2 rounded-xl bg-purple-500/10 text-purple-500"
                >
                  <FileText size={16} />
                  <span className="text-sm">Docs</span>
                </button>

                <button
                  onClick={() => handleDelete(d.id)}
                  className="flex items-center justify-center gap-2 py-2 rounded-xl bg-red-500/10 text-red-500"
                >
                  <Trash2 size={16} />
                  <span className="text-sm">Suppr.</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div
            className={`rounded-2xl border p-10 text-center ${
              darkMode
                ? "bg-slate-900 border-slate-800"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="flex flex-col items-center gap-3">
              <AlertCircle size={40} className="opacity-50" />

              <p className="text-gray-400">
                Aucun médecin trouvé
              </p>

              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
                className="text-blue-500 hover:underline text-sm"
              >
                Réinitialiser les filtres
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= DESKTOP TABLE ================= */}
      <div
        className={`hidden lg:block rounded-2xl border overflow-hidden ${
          darkMode
            ? "bg-slate-900 border-slate-800"
            : "bg-white border-gray-200"
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead
              className={
                darkMode ? "bg-slate-800" : "bg-gray-100"
              }
            >
              <tr>
                {[
                  "Médecin",
                  "Spécialité",
                  "Hôpital",
                  "Contact",
                  "Documents",
                  "Statut",
                  "Actions",
                ].map((header) => (
                  <th
                    key={header}
                    className="p-4 text-left text-sm font-semibold uppercase tracking-wider whitespace-nowrap"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {paginatedDoctors.length > 0 ? (
                paginatedDoctors.map((d) => (
                  <tr
                    key={d.id}
                    className={`border-t transition ${
                      darkMode
                        ? "border-slate-800 hover:bg-slate-800/40"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {d.name.charAt(0)}
                        </div>

                        <div className="min-w-0">
                          <p className="font-semibold truncate">
                            {d.name}
                          </p>

                          <p className="text-xs text-gray-400">
                            ID: #{d.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-sm text-gray-400">
                      {d.specialty}
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Building2
                          size={14}
                          className="flex-shrink-0"
                        />

                        <span className="truncate max-w-[180px]">
                          {d.hospital}
                        </span>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Phone
                          size={14}
                          className="flex-shrink-0"
                        />

                        <span>{d.phone}</span>
                      </div>
                    </td>

                    <td className="p-4">
                      <button
                        onClick={() =>
                          handleViewDocuments(d)
                        }
                        className="text-blue-500 hover:text-blue-400 flex items-center gap-1.5 text-sm font-medium transition"
                      >
                        <FileText size={14} />
                        {d.documents?.length || 0}
                      </button>
                    </td>

                    <td className="p-4">
                      {getStatusBadge(d.status)}
                    </td>

                    <td className="p-4">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() =>
                            handleViewDoctor(d)
                          }
                          className="p-2 rounded-lg hover:bg-blue-500/10 text-blue-500 transition"
                          title="Voir détails"
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          onClick={() =>
                            handleViewDocuments(d)
                          }
                          className="p-2 rounded-lg hover:bg-purple-500/10 text-purple-500 transition"
                          title="Voir documents"
                        >
                          <FileText size={16} />
                        </button>

                        <button
                          onClick={() =>
                            handleDelete(d.id)
                          }
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
                  <td
                    colSpan={7}
                    className="p-12 text-center text-gray-400"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <AlertCircle
                        size={40}
                        className="opacity-50"
                      />

                      <p>Aucun médecin trouvé</p>

                      <button
                        onClick={() => {
                          setSearch("");
                          setStatusFilter("all");
                        }}
                        className="text-blue-500 hover:underline text-sm"
                      >
                        Réinitialiser les filtres
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t ${
              darkMode
                ? "border-slate-800"
                : "border-gray-200"
            }`}
          >
            <p className="text-sm text-gray-400 text-center sm:text-left">
              Page {currentPage} sur {totalPages} •{" "}
              {filteredDoctors.length} résultats
            </p>

            <div className="flex gap-2">
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.max(1, p - 1))
                }
                disabled={currentPage === 1}
                className="p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-slate-800 transition"
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
          <p className="text-sm text-gray-400 text-center">
            Page {currentPage} sur {totalPages}
          </p>

          <div className="flex gap-2">
            <button
              onClick={() =>
                setCurrentPage((p) => Math.max(1, p - 1))
              }
              disabled={currentPage === 1}
              className="p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-slate-800 transition"
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
              className="p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-slate-800 transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ================= MODALS ================= */}

      {showAddModal && (
        <AddDoctorModal
          darkMode={darkMode}
          formData={formData}
          setFormData={setFormData}
          isSubmitting={isSubmitting}
          onSubmit={handleAddDoctor}
          onClose={closeModal}
        />
      )}

      {showViewModal && selectedDoctor && (
        <ViewDoctorModal
          darkMode={darkMode}
          doctor={selectedDoctor}
          onClose={closeModal}
          onVerify={() => handleVerify(selectedDoctor.id)}
          onReject={() => handleReject(selectedDoctor.id)}
          onStatusChange={handleStatusChange}
          onViewDocs={() => {
            setShowViewModal(false);
            handleViewDocuments(selectedDoctor);
          }}
          onEdit={() =>
            toast.info("✏️ Fonctionnalité à venir")
          }
          onDelete={() => {
            setShowViewModal(false);
            handleDelete(selectedDoctor.id);
          }}
        />
      )}

      {showDocModal && selectedDoctor && (
        <DocumentsModal
          darkMode={darkMode}
          doctor={selectedDoctor}
          documents={selectedDoctor.documents || []}
          onPreview={handlePreview}
          onDownload={handleDownload}
          onClose={closeModal}
        />
      )}

      {showDeleteConfirm && selectedDoctor && (
        <DeleteConfirmModal
          darkMode={darkMode}
          doctor={selectedDoctor}
          onConfirm={confirmDelete}
          onCancel={closeModal}
        />
      )}
    </div>
  );
}