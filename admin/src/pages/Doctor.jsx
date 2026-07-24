import { useState, useEffect, useMemo, useCallback } from "react";
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
  Copy,
} from "lucide-react";

import ViewDoctorModal from "../components/doctors/ViewDoctorModal";
import AddDoctorModal from "../components/doctors/AddDoctorModal";
import DocumentsModal from "../components/doctors/DocumentsModal";
import DeleteConfirmModal from "../components/doctors/DeleteConfirmModal";
import API from "../services/api";

/* ================= COMPONENT ================= */
export default function DoctorsPage({ darkMode }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lists for dropdowns
  const [specialitesList, setSpecialitesList] = useState([]);
  const [structuresList, setStructuresList] = useState([]);

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
    role: "medecin",
    specialty: "",
    hospital: "",
    phone: "",
    email: "",
    address: "",
    numero_ordre: "",
    annees_experience: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEditDoctor = useCallback((doctor) => {
    setFormData({
      name: doctor.name,
      role: doctor.role || "medecin",
      specialty: doctor.specialty === "Non spécifiée" ? "" : doctor.specialty,
      hospital: doctor.hospital === "Non spécifié" ? "" : doctor.hospital,
      phone: doctor.phone || "",
      email: doctor.email || "",
      address: doctor.address || "",
      numero_ordre: doctor.numero_ordre || "",
      annees_experience: doctor.annees_experience ?? "",
    });
    setEditingId(doctor.id);
    setShowAddModal(true);
    setShowViewModal(false);
  }, []);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  /* ================= DATA FETCHING ================= */
  const fetchDoctors = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const [
        medecinsRes,
        usersRes,
        specialitesRes,
        medecinSpecialitesRes,
        structuresRes,
      ] = await Promise.all([
        API.get("/medecins", { params: { limit: 200 } }),
        API.get("/users"),
        API.get("/specialites", { params: { limit: 200 } }),
        API.get("/medecin_specialites", { params: { limit: 200 } }),
        API.get("/structures", { params: { limit: 200 } }),
      ]);

      const users = Array.isArray(usersRes.data) ? usersRes.data : [];
      const specialites = Array.isArray(specialitesRes.data) ? specialitesRes.data : [];
      const medecinSpecialites = Array.isArray(medecinSpecialitesRes.data) ? medecinSpecialitesRes.data : [];
      const structures = Array.isArray(structuresRes.data) ? structuresRes.data : [];

      const usersMap = {};
      users.forEach((u) => { usersMap[u.id] = u; });

      const specialitesMap = {};
      specialites.forEach((s) => { specialitesMap[s.id] = s; });

      const medecinSpecialitesMap = {};
      medecinSpecialites.forEach((ms) => {
        if (!medecinSpecialitesMap[ms.medecin_id]) {
          medecinSpecialitesMap[ms.medecin_id] = [];
        }
        if (specialitesMap[ms.specialite_id]) {
          medecinSpecialitesMap[ms.medecin_id].push(specialitesMap[ms.specialite_id].libelle_fr);
        }
      });

      const structuresMap = {};
      structures.forEach((s) => { structuresMap[s.id] = s; });

      setSpecialitesList(specialites);
      setStructuresList(structures);

      const statusMap = {
        en_attente: "En attente",
        verifie: "Vérifié",
        rejete: "Rejeté",
        actif: "Actif",
        suspendu: "Suspendu",
        banni: "Banni",
        inactif: "Inactif",
      };

      const userStatutMap = {
        actif: null,
        suspendu: "Suspendu",
        banni: "Banni",
        inactif: "Inactif",
      };

      const medecins = Array.isArray(medecinsRes.data) ? medecinsRes.data : [];

      const enriched = medecins.map((m) => {
        const user = usersMap[m.id];
        const userFullName = user
          ? [user.prenom, user.nom].filter(Boolean).join(" ")
          : "";
        const specialties = medecinSpecialitesMap[m.id] || [];
        const structure = structuresMap[m.structure_id];

        return {
          id: m.id,
          name: userFullName ? `Dr. ${userFullName}` : `Médecin #${m.id}`,
          role: user?.role || "medecin",
          specialty: specialties.join(", ") || "Non spécifiée",
          hospital: structure?.nom_etablissement || "Non spécifié",
          phone: user?.telephone || "",
          email: user?.email || "",
          address: user?.adresse || "",
          numero_ordre: m.numero_ordre || "",
          status: userStatutMap[user?.statut] || statusMap[m.statut_verification] || "En attente",
          userStatut: user?.statut || "actif",
          documents: m.documents || [],
          createdAt: m.created_at?.split("T")[0] || "",
          structure_id: m.structure_id,
          annees_experience: m.annees_experience || 0,
        };
      });

      setDoctors(enriched);
    } catch (err) {
      if (isInitial) toast.error("❌ Erreur lors du chargement des médecins");
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctors(true);
  }, [fetchDoctors]);

  const [pendingChanges, setPendingChanges] = useState([]);

  const fetchPending = useCallback(async () => {
    try {
      const res = await API.get("/admin/medecins/pending-profile-changes");
      setPendingChanges(Array.isArray(res.data) ? res.data : []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const handleValidateChange = useCallback(async (medecinId, field, index, action) => {
    try {
      await API.put(`/medecins/${medecinId}/validate-change`, { field, index, action });
      toast.success(action === "approve" ? "✅ Modification approuvée" : "❌ Modification rejetée");
      fetchPending();
      // Refresh the selected doctor profile in the modal so statuses update live
      setSelectedDoctor((prev) => {
        if (!prev || String(prev.id) !== String(medecinId)) return prev;
        const updatedItems = (prev[field] || []).map((item, i) =>
          i === index ? { ...item, statut: action === "approve" ? "valide" : "rejete" } : item
        );
        return { ...prev, [field]: updatedItems };
      });
    } catch {
      toast.error("Erreur lors de la validation");
    }
  }, [fetchPending]);

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
      if (editingId) {
        await API.put(`/medecins/${editingId}`, {
          address: formData.address,
          specialite: formData.specialty || undefined,
          hopital: formData.hospital || undefined,
          telephone: formData.phone || undefined,
          email: formData.email || undefined,
        });
        toast.success("✅ Médecin modifié avec succès");
      } else {
        const res = await API.post("/admin/medecins", {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          specialty: formData.specialty,
          hospital: formData.hospital,
          address: formData.address,
          role: formData.role || "medecin",
          numero_ordre: formData.numero_ordre || undefined,
        });

        const { mot_de_passe_genere, email } = res.data;

        toast.success(
          <div>
            <p>✅ Médecin ajouté avec succès</p>
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

      setFormData({
        name: "",
        specialty: "",
        hospital: "",
        phone: "",
        email: "",
        address: "",
      });
      setEditingId(null);
      setShowAddModal(false);

      fetchDoctors();
    } catch {
      toast.error(editingId ? "❌ Erreur lors de la modification" : "❌ Erreur lors de l'ajout");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, editingId, fetchDoctors]);

  const handleViewDoctor = useCallback(async (doctor) => {
    // Set basic info immediately so modal opens fast
    setSelectedDoctor(doctor);
    setShowViewModal(true);
    // Fetch full profile (diplomes, certifications, experience_history)
    try {
      const res = await API.get(`/medecins/${doctor.id}`);
      const full = res.data;
      setSelectedDoctor((prev) =>
        prev && prev.id === doctor.id
          ? {
              ...prev,
              diplomes: full.diplomes || [],
              certifications: full.certifications || [],
              experience_history: full.experience_history || [],
            }
          : prev
      );
    } catch {
      // silently ignore — profile sections will just be empty
    }
  }, []);

  const handleViewDocuments = useCallback((doctor) => {
    setSelectedDoctor(doctor);
    setShowDocModal(true);
  }, []);

  const handleVerify = useCallback(
    async (id) => {
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

      try {
        await API.put(`/medecins/${id}`, { statut_verification: "verifie" });
        await API.put(`/admin/medecins/${id}/status`, { statut: "actif" });
      } catch {
        toast.error("❌ Erreur lors de la vérification");
        fetchDoctors();
      }
    },
    [selectedDoctor, fetchDoctors]
  );

  const handleReject = useCallback(
    async (id, reason = "") => {
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

      try {
        await API.put(`/medecins/${id}`, { statut_verification: "rejete" });
      } catch {
        toast.error("❌ Erreur lors du rejet");
        fetchDoctors();
      }
    },
    [selectedDoctor, fetchDoctors]
  );

  const handleBan = useCallback(async (id) => {
    try {
      await API.put(`/admin/medecins/${id}/status`, { statut: "banni" });
      toast.success("Médecin banni");
      fetchDoctors();
    } catch {
      toast.error("Erreur lors du bannissement");
    }
  }, [fetchDoctors]);

  const handleSuspend = useCallback(async (id) => {
    try {
      await API.put(`/admin/medecins/${id}/status`, { statut: "suspendu" });
      toast.success("Médecin suspendu");
      fetchDoctors();
    } catch {
      toast.error("Erreur lors de la suspension");
    }
  }, [fetchDoctors]);

  const handleActivate = useCallback(async (id) => {
    try {
      await API.put(`/admin/medecins/${id}/status`, { statut: "actif" });
      toast.success("Médecin activé");
      fetchDoctors();
    } catch {
      toast.error("Erreur lors de l'activation");
    }
  }, [fetchDoctors]);

  const handleDelete = useCallback(
    (id) => {
      setSelectedDoctor(doctors.find((d) => d.id === id));
      setShowDeleteConfirm(true);
    },
    [doctors]
  );

  const confirmDelete = useCallback(async () => {
    if (selectedDoctor) {
      try {
        await API.delete(`/medecins/${selectedDoctor.id}`);

        toast.success("🗑️ Médecin supprimé");

        setShowDeleteConfirm(false);
        setSelectedDoctor(null);
        setShowViewModal(false);

        fetchDoctors();
      } catch {
        toast.error("❌ Erreur lors de la suppression");
      }
    }
  }, [selectedDoctor, fetchDoctors]);

  const handleDownload = useCallback((doc) => {
    toast.success(`📥 Téléchargement: ${doc.name}`);
  }, []);

  const handlePreview = useCallback((doc) => {
    toast.info(`👁️ Aperçu: ${doc.name}`);
  }, []);

  const handleStatusChange = useCallback(
    async (newStatus) => {
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

        try {
          const apiStatus = newStatus === "Vérifié" ? "verifie" : "rejete";
          await API.put(`/medecins/${selectedDoctor.id}`, { statut_verification: apiStatus });
          // Ensure user is active when verified
          if (newStatus === "Vérifié") {
            await API.put(`/admin/medecins/${selectedDoctor.id}/status`, { statut: "actif" });
          }
        } catch {
          toast.error("❌ Erreur lors du changement de statut");
          fetchDoctors();
        }
      }
    },
    [selectedDoctor, fetchDoctors]
  );

  const closeModal = useCallback(() => {
    setShowAddModal(false);
    setShowViewModal(false);
    setShowDocModal(false);
    setShowDeleteConfirm(false);
    setSelectedDoctor(null);
    setEditingId(null);
    setFormData({ name: "", role: "medecin", specialty: "", hospital: "", phone: "", email: "", address: "", numero_ordre: "", annees_experience: "" });
  }, []);

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          darkMode ? "bg-slate-950" : "bg-gray-100"
        }`}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  /* ================= HELPERS ================= */
  const getStatusBadge = (status) => {
    const styles = {
      Vérifié:
        "bg-green-500/10 text-green-500 border-green-500/20",
      "En attente":
        "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      Rejeté:
        "bg-red-500/10 text-red-500 border-red-500/20",
      Suspendu:
        "bg-orange-500/10 text-orange-500 border-orange-500/20",
      Banni:
        "bg-red-600/10 text-red-600 border-red-600/20",
      Actif:
        "bg-green-500/10 text-green-500 border-green-500/20",
      Inactif:
        "bg-gray-500/10 text-gray-500 border-gray-500/20",
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
            Gestion des professionnels
          </h1>

          <p className="text-sm text-gray-400 mt-1">
            Vérification et administration des comptes
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto justify-center px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-blue-500/25 active:scale-95 flex items-center gap-2"
        >
          <Plus size={18} />
          <span>Ajouter professionnel</span>
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

      <div className={`rounded-2xl border p-5 space-y-4 ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"}`}>
          <div className="flex items-center gap-2">
            <AlertCircle size={20} className={pendingChanges.length > 0 ? "text-amber-500" : "text-gray-400"} />
            <h2 className={`font-bold ${pendingChanges.length > 0 ? "text-amber-600" : darkMode ? "text-gray-300" : "text-gray-500"}`}>
              Modifications du profil en attente ({pendingChanges.length})
            </h2>
          </div>
          {pendingChanges.length > 0 ? (
            <div className="space-y-3">
              {/* Group by medecin_id to show one entry per doctor */}
              {Array.from(
                pendingChanges.reduce((acc, pc) => {
                  const key = String(pc.medecin_id);
                  if (!acc.has(key)) acc.set(key, { medecin_id: pc.medecin_id, medecin_nom: pc.medecin_nom, count: 0, fields: [] });
                  const entry = acc.get(key);
                  entry.count += 1;
                  if (!entry.fields.includes(pc.field)) entry.fields.push(pc.field);
                  return acc;
                }, new Map()).values()
              ).map((group) => {
                const fieldLabels = { diplomes: "Formation", certifications: "Certification", experience_history: "Expérience" };
                const doctor = doctors.find((d) => String(d.id) === String(group.medecin_id));
                return (
                  <button
                    key={String(group.medecin_id)}
                    onClick={() => doctor && handleViewDoctor(doctor)}
                    className={`w-full text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border transition hover:shadow-md ${
                      darkMode
                        ? "bg-slate-800 border-slate-700 hover:border-amber-500/40"
                        : "bg-amber-50 border-amber-100 hover:border-amber-300"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{group.medecin_nom || "Médecin"}</p>
                        <span className="text-xs text-gray-400">#{String(group.medecin_id).slice(0, 8)}…</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {group.count} modification(s) · {group.fields.map((f) => fieldLabels[f] || f).join(", ")}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-amber-500 flex-shrink-0 flex items-center gap-1">
                      <Eye size={13} /> Voir le profil
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className={`text-sm ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Aucune modification en attente de validation.</p>
          )}
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
          {["all", "En attente", "Vérifié", "Suspendu", "Banni"].map(
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
                  "N° Ordre",
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
                      {d.numero_ordre || "—"}
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
                    colSpan={8}
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
          specialitesList={specialitesList}
          structuresList={structuresList}
          editingId={editingId}
        />
      )}

      {showViewModal && selectedDoctor && (
        <ViewDoctorModal
          darkMode={darkMode}
          doctor={selectedDoctor}
          pendingChanges={pendingChanges}
          onClose={closeModal}
          onVerify={() => handleVerify(selectedDoctor.id)}
          onReject={() => handleReject(selectedDoctor.id)}
          onStatusChange={handleStatusChange}
          onViewDocs={() => {
            setShowViewModal(false);
            handleViewDocuments(selectedDoctor);
          }}
          onEdit={() => handleEditDoctor(selectedDoctor)}
          onDelete={() => {
            setShowViewModal(false);
            handleDelete(selectedDoctor.id);
          }}
          onBan={() => handleBan(selectedDoctor.id)}
          onSuspend={() => handleSuspend(selectedDoctor.id)}
          onActivate={() => handleActivate(selectedDoctor.id)}
          onValidateChange={handleValidateChange}
        />
      )}

      {showDocModal && selectedDoctor && (
        <DocumentsModal
          darkMode={darkMode}
          doctor={selectedDoctor}
          documents={doctors.find(d => d.id === selectedDoctor.id)?.documents || []}
          onPreview={handlePreview}
          onDownload={handleDownload}
          onClose={closeModal}
          onRefresh={fetchDoctors}
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
