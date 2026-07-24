// Appointment.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  List,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  Clock3,
  Users,
  Send,
  UserCheck,
  Plus,
  Power,
} from "lucide-react";

import SearchBar from "../../components/common/SearchBar";
import FilterButton from "../../components/common/FilterButton";
import AppointmentListCard from "../../components/doctors/appointment/AppointmentListCard";
import AppointmentCalendarDayCard from "../../components/doctors/appointment/AppointmentCalendarDayCard";
import NewAppointmentForm from "../../components/doctors/appointment/NewAppointmentForm";
import RescheduleForm from "../../components/doctors/appointment/ResheduleForm";
import StatCard from "../../components/doctors/appointment/StatCard";
import OpinionRequestsTab from "../../components/doctors/appointment/OpinionRequestsTab";
import MyOpinionRequestsTab from "../../components/doctors/appointment/MyOpinionRequestsTab";
import AvailabilityForm from "../../components/doctors/appointment/AvailabilityForm";
import PatientProfileModal from "../../components/doctors/appointment/PatientProfileModal";
import SlotFormModal from "../../components/doctors/appointment/SlotFormModal";
import AppointmentChatModal from "../../components/doctors/appointment/AppointmentChatModal";

import { get, post, put as apiPut, del } from "../../services/apiClient";
import { getStoredUser } from "../../services/auth";
import { getUserTimezone } from "../../utils/timezone";

export default function Appointment({ darkMode }) {
  const navigate = useNavigate();
  // ============ STATES ============
  const [openPatientModal, setOpenPatientModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [openChatModal, setOpenChatModal] = useState(false);
  const [chatRdv, setChatRdv] = useState(null);
  const [activeTab, setActiveTab] = useState("Upcoming");
  const [view, setView] = useState("list");
  const [search, setSearch] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [openReschedule, setOpenReschedule] = useState(false);
  const [openAvailability, setOpenAvailability] = useState(false);
  const [selectedAvailability, setSelectedAvailability] = useState(null);
  const [openSlotModal, setOpenSlotModal] = useState(false);
  const [selectedSlotForModal, setSelectedSlotForModal] = useState(null);
  const [selectedDateForModal, setSelectedDateForModal] = useState(null);

  const [appointments, setAppointments] = useState([]);
  const [loadingRdv, setLoadingRdv] = useState(true);
  const [availabilities, setAvailabilities] = useState([]);
  const [exceptions, setExceptions] = useState([]);

  const [mainTab, setMainTab] = useState("patients");
  const [opinionRequests, setOpinionRequests] = useState([]);
  const [myOpinionRequests, setMyOpinionRequests] = useState([]);
  const [colleagueAppointments, setColleagueAppointments] = useState([]);
  const [disponible, setDisponible] = useState(false);
  const [togglingDispo, setTogglingDispo] = useState(false);

  // ============ CHARGEMENT RDV ============
  const fetchRdvs = async () => {
    setLoadingRdv(true);
    try {
      const rdvsRaw = await get("/api/rendez_vous");
      const paidStatuses = new Set([
        "confirme", "paye_en_attente_validation", "en_cours", "termine",
      ]);
      const rdvs = rdvsRaw.filter(r => paidStatuses.has(r.statut));
      const uniqueIds = [...new Set(rdvs.map((r) => r.patient_id))];
      const patientsMap = {};
      await Promise.all(
        uniqueIds.map(async (pid) => {
          try {
            const p = await get(`/api/patients/${pid}`);
            patientsMap[pid] = p;
          } catch {
            patientsMap[pid] = null;
          }
        })
      );
      const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
      const now = Date.now();
      const mapped = rdvs.map((r) => {
        const p = patientsMap[r.patient_id] || {};
        const d = new Date(r.date_heure_debut);
        const endTime = new Date(r.date_heure_fin).getTime();
        const isExpired = now > endTime + TWO_HOURS_MS;
        const isDone = r.statut === "en_cours" || r.statut === "termine";
        const timeParts = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: getUserTimezone() });
        const statusMap = {
          confirme: "Confirmed",
          en_cours: "Confirmed",
          termine: "Confirmed",
          paye_en_attente_validation: "Pending",
        };
        return {
          id: r.id,
          patientId: r.patient_id,
          patientName: `${p.prenom || ""} ${p.nom || ""}`.trim() || "Patient",
          patientImage: p.photo_url || "",
          email: p.email || "",
          phone: p.telephone || "",
          city: p.ville || "",
          note: r.motif_consultation || "",
          status: statusMap[r.statut] || "Pending",
          date: d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }),
          time: timeParts,
          type: r.type === "presentiel" ? "In-person" : "Teleconsultation",
          category: isExpired || isDone ? "past" : "upcoming",
          dateHeureDebut: r.date_heure_debut,
          dateHeureFin: r.date_heure_fin,
          medecinId: r.medecin_id,
          statut: r.statut,
          montant: Math.round(Number(r.montant) * 0.9) || 0,
          devise: r.devise || "XAF",
          patientCode: p.code_patient || "",
        };
      });
      setAppointments(mapped);
    } catch {
      setAppointments([]);
    } finally {
      setLoadingRdv(false);
    }
  };

  useEffect(() => {
    fetchRdvs();
  }, []);

  // ============ CHARGEMENT DISPONIBILITÉS ============
  const mapAvailability = (d) => ({
    id: d.id,
    day: d.jour_semaine.charAt(0).toUpperCase() + d.jour_semaine.slice(1),
    startTime: d.heure_debut.slice(0, 5),
    endTime: d.heure_fin.slice(0, 5),
    status: d.actif ? "available" : "unavailable",
    recurrence: d.recurrence || "hebdomadaire",
    dateDebut: d.date_debut_validite,
    dateFin: d.date_fin_validite,
  });

  const fetchAvailabilities = async () => {
    try {
      const data = await get("/api/disponibilites");
      setAvailabilities(data.map(mapAvailability));
    } catch {
      setAvailabilities([]);
    }
  };

  useEffect(() => {
    fetchAvailabilities();
  }, []);

  // ============ CHARGEMENT EXCEPTIONS ============
  useEffect(() => {
    get("/api/exceptions-disponibilites")
      .then((data) => setExceptions(data))
      .catch(() => setExceptions([]));
  }, []);

  // ============ CHARGEMENT DISPONIBILITÉ MÉDECIN ============
  useEffect(() => {
    const user = getStoredUser();
    if (!user?.id) return;
    get(`/api/medecins/${user.id}`)
      .then((m) => setDisponible(m.disponible_maintenant ?? false))
      .catch(() => {});
  }, []);

  // ============ CHARGEMENT DEMANDES D'AVIS ============
  const parseMessage = (msg) => {
    if (!msg) return {};
    const result = {};
    const lines = msg.split("\n\n").filter(Boolean);
    for (const line of lines) {
      const m = line.match(/^Urgence:\s*(.+)$/);
      if (m) { result.urgence = m[1].trim(); continue; }
      const c = line.match(/^Contexte:\s*(.+)$/);
      if (c) { result.contexte = c[1].trim(); continue; }
      const q = line.match(/^Question:\s*(.+)$/);
      if (q) { result.question = q[1].trim(); continue; }
      const e = line.match(/^Examens:\s*(.+)$/);
      if (e) { result.examens = e[1].trim(); continue; }
    }
    return result;
  };

  const fetchDemandesAvis = async () => {
    try {
      const user = getStoredUser();
      if (!user?.id) return;
      const data = await get("/api/demandes-avis");

      const received = [];
      const sent = [];

      for (const d of data) {
        const parsed = parseMessage(d.message);
        const base = {
          id: d.id,
          statut: d.statut,
          motif: d.motif,
          date: d.created_at,
          urgence: parsed.urgence || "normal",
          contexte: parsed.contexte || "",
          question: parsed.question || "",
          examens: parsed.examens || "",
          portee: d.portee,
          confidentiel: d.confidentiel,
          reponse: d.reponse,
          medecinDemandeurId: d.medecin_demandeur_id,
          medecinAccepteurId: d.medecin_accepteur_id,
          dossierNumero: d.dossier_numero || "",
          dossierMedicalId: d.dossier_medical_id || null,
          consultationNumero: d.consultation_numero || "",
          consultationId: d.consultation_id || null,
          consultationMotif: d.consultation_motif || "",
        };

        if (d.medecin_demandeur_id === user.id) {
          sent.push({
            ...base,
            doctorName: d.cible_prenom && d.cible_nom
              ? `${d.cible_prenom} ${d.cible_nom}`
              : d.medecin_accepteur_id
                ? "Dr. accepté"
                : "En attente",
            doctorSpeciality: d.specialite_libelle || "",
            patientNom: d.patient_nom || "",
            patientPrenom: d.patient_prenom || "",
          });
        } else {
          received.push({
            ...base,
            requesterName: d.demandeur_prenom && d.demandeur_nom
              ? `${d.demandeur_prenom} ${d.demandeur_nom}`
              : "Dr. confrère",
            requesterSpeciality: d.specialite_libelle || "",
            patientNom: d.patient_nom || "",
            patientPrenom: d.patient_prenom || "",
          });
        }
      }

      setOpinionRequests(received);
      setMyOpinionRequests(sent);
    } catch {
      setOpinionRequests([]);
      setMyOpinionRequests([]);
    }
  };

  useEffect(() => {
    fetchDemandesAvis();
  }, []);

  const handleToggleDisponibilite = async () => {
    const user = getStoredUser();
    if (!user?.id) return;
    setTogglingDispo(true);
    try {
      const res = await apiPut(`/api/medecins/${user.id}/disponibilite`);
      setDisponible(res.disponible_maintenant);
    } catch (err) {
      console.error("Erreur toggle disponibilité:", err);
    } finally {
      setTogglingDispo(false);
    }
  };

  const handleAddException = async (exceptionData) => {
    const created = await post("/api/exceptions-disponibilites", exceptionData);
    setExceptions((prev) => [created, ...prev]);
    return created;
  };

  const handleUpdateException = async (id, updateData) => {
    const updated = await apiPut(`/api/exceptions-disponibilites/${id}`, updateData);
    setExceptions((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updated } : e))
    );
    return updated;
  };

  const handleDeleteException = async (id) => {
    try {
      await del(`/api/exceptions-disponibilites/${id}`);
      setExceptions((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error("Erreur suppression exception:", err);
    }
  };

  const getExceptionForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return exceptions.find((ex) => ex.date === dateStr && ex.actif !== false) || null;
  };

  // ============ HANDLERS ============
  const handleOpenPatient = (patient) => {
    setSelectedPatient(patient);
    setOpenPatientModal(true);
  };

  const handleReschedule = (item) => {
    setSelectedAppointment(item);
    setOpenReschedule(true);
  };

  const handleOpenChat = (item) => {
    setChatRdv(item);
    setOpenChatModal(true);
  };

  const handleSaveReschedule = (id, newDate, newTime) => {
    fetchRdvs();
  };

  const handleSaveAvailability = async (data) => {
    const user = getStoredUser();
    if (!user?.id) return;

    const slots = Array.isArray(data) ? data : data.slots;
    const repeat = !Array.isArray(data) ? data.repeat || "none" : "none";
    const repeatEndDate = !Array.isArray(data) ? data.repeatEndDate || null : null;

    const today = new Date().toISOString().split("T")[0];

    const promises = slots.map((slot) => {
      const payload = {
        medecin_id: user.id,
        jour_semaine: slot.day.toLowerCase(),
        heure_debut: slot.startTime + ":00",
        heure_fin: slot.endTime + ":00",
        duree_creneau_minutes: 30,
        type: "video",
        recurrence:
          repeat === "weekly"
            ? "hebdomadaire"
            : repeat === "biweekly"
            ? "bi_mensuel"
            : repeat === "daily"
            ? "quotidien"
            : repeat === "monthly"
            ? "mensuel"
            : "unique",
        date_debut_validite: today,
        date_fin_validite: repeatEndDate || null,
        actif: true,
      };
      return post("/api/disponibilites", payload);
    });

    try {
      await Promise.all(promises);
      await fetchAvailabilities();
    } catch (err) {
      console.error("Erreur lors de l'enregistrement des disponibilités:", err);
    }
  };

  const handleDeleteAvailability = async (id) => {
    try {
      await del(`/api/disponibilites/${id}`);
      setAvailabilities((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Erreur suppression disponibilité:", err);
      throw err; // Remonte l'erreur pour affichage dans la modal
    }
  };

  const handleOpenCreateSlotModal = (day) => {
    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`;

    setSelectedSlotForModal(null);
    setSelectedDateForModal(dateStr);
    setOpenSlotModal(true);
  };

  const handleOpenEditSlotModal = (slot) => {
    setSelectedSlotForModal(slot);
    setSelectedDateForModal(null);
    setOpenSlotModal(true);
  };

  const handleSwitchToCreateSlot = (effectiveDateStr) => {
    setSelectedSlotForModal(null);
    setSelectedDateForModal(effectiveDateStr || localDateStr(new Date()));
  };

  const handleSaveSlot = async (slotData) => {
    const user = getStoredUser();
    if (!user?.id) return;

    const payload = {
      medecin_id: user.id,
      jour_semaine: slotData.day.toLowerCase(),
      heure_debut: slotData.startTime + ":00",
      heure_fin: slotData.endTime + ":00",
      duree_creneau_minutes: 30,
      type: "video",
      recurrence: slotData.recurrence,
      date_debut_validite: slotData.dateDebut,
      date_fin_validite: slotData.dateFin || null,
      actif: true,
    };

    try {
      if (slotData.id) {
        await apiPut(`/api/disponibilites/${slotData.id}`, payload);
      } else {
        await post("/api/disponibilites", payload);
      }
      await fetchAvailabilities();
    } catch (err) {
      console.error("Erreur lors de l'enregistrement du créneau:", err);
      throw err; // Remonte l'erreur pour affichage dans la modal
    }
  };

  const handleUpdateOpinionRequest = async (id, newStatus, data) => {
    try {
      if (newStatus === "acceptee") {
        if (data?.openMessaging) {
          const res = await apiPut(`/api/demandes-avis/${id}/accepter-et-discuter`);
          setOpinionRequests(prev =>
            prev.map(req => (req.id === id ? { ...req, statut: "acceptee" } : req))
          );
          if (res.conversation_id) {
            navigate("/doctor-messages", { state: { conversationId: res.conversation_id } });
          }
          return;
        }
        await apiPut(`/api/demandes-avis/${id}/accepter`);
      } else if (newStatus === "refusee") {
        await apiPut(`/api/demandes-avis/${id}/refuser`, { reason: data?.reason });
      }

      setOpinionRequests(prev =>
        prev.map(req => (req.id === id ? { ...req, statut: newStatus, ...data } : req))
      );

      if (newStatus === "acceptee" && data.meetingDate) {
        const request = opinionRequests.find(r => r.id === id);
        const newAppointment = {
          id: Date.now(),
          type: "opinion_meeting",
          patientName: `Dr. ${request?.requesterName || "confrère"}`,
          patientImage: null,
          date: new Date(data.meetingDate).toLocaleDateString("fr-FR"),
          time: new Date(data.meetingDate).toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          status: "Confirmed",
          category: "upcoming",
          mode: data.mode,
        };
        setColleagueAppointments(prev => [...prev, newAppointment]);
      }
    } catch (err) {
      console.error("Erreur mise à jour demande d'avis:", err);
    }
  };

  // ============ FILTRAGE ============
  const filteredAppointments = appointments
    .filter((item) => {
      if (activeTab === "Upcoming") return item.category === "upcoming";
      if (activeTab === "Past") return item.category === "past";
      return true;
    })
    .sort((a, b) => {
      if (activeTab === "Past") return (b.dateHeureDebut || "").localeCompare(a.dateHeureDebut || "");
      return (a.dateHeureDebut || "").localeCompare(b.dateHeureDebut || "");
    });

  // ============ STATS ============
  const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
  const now = Date.now();
  const stats = {
    today: filteredAppointments.filter(a => {
      const today = new Date().toLocaleDateString();
      return new Date(a.date).toLocaleDateString() === today;
    }).length,
    pending: filteredAppointments.filter(a => {
      if (a.statut === "en_cours" || a.statut === "termine") return false;
      if (!a.dateHeureFin) return false;
      return now <= new Date(a.dateHeureFin).getTime() + TWO_HOURS_MS;
    }).length,
    week: filteredAppointments.filter(a => {
      const apptDate = new Date(a.date);
      const today = new Date();
      const dayOfWeek = today.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + mondayOffset);
      const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 23, 59, 59);
      return apptDate >= monday && apptDate <= sunday;
    }).length,
    opinionRequests: opinionRequests.filter(r => r.statut === "en_attente").length,
  };

  // ============ HELPERS ============
  const getStatusStyle = (status, darkMode) => {
    switch (status) {
      case "Confirmed":
        return darkMode ? "bg-green-900/40 text-green-300" : "bg-green-100 text-green-700";
      case "Pending":
        return darkMode ? "bg-yellow-900/40 text-yellow-300" : "bg-yellow-100 text-yellow-700";
      case "Cancelled":
        return darkMode ? "bg-red-900/40 text-red-300" : "bg-red-100 text-red-700";
      default:
        return darkMode ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-600";
    }
  };

  const tabClass = (tab) =>
    `px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition whitespace-nowrap ${
      activeTab === tab
        ? "bg-blue-600 text-white"
        : darkMode
        ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
    }`;

  // ✅ Onglets principaux RESPONSIVE
  const mainTabClass = (tab) =>
    `flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap relative flex-shrink-0 min-w-fit ${
      mainTab === tab
        ? "bg-blue-600 text-white shadow-md"
        : darkMode
        ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
        : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
    }`;

  const viewBtnClass = (mode) =>
    `flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm border transition whitespace-nowrap ${
      view === mode
        ? "bg-blue-600 text-white border-blue-600"
        : darkMode
        ? "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"
        : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
    }`;

  // ============ CALENDAR LOGIC ============
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const startDay = firstDay === 0 ? 6 : firstDay - 1;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: startDay });
  const today = new Date();

  const localDateStr = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const previousMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getAvailabilityForDay = (day) => {
    const current = new Date(year, month, day);
    const currentStr = localDateStr(current);
    const weekDay = current.toLocaleDateString("fr-FR", { weekday: "long" });
    const cap = weekDay.charAt(0).toUpperCase() + weekDay.slice(1);

    const exception = exceptions.find(
      (ex) => ex.date === currentStr && ex.actif !== false
    );
    if (exception) {
      if (exception.type === "indisponible") {
        return [];
      }
      if (exception.type === "horaires_personnalises") {
        return (exception.creneaux || [])
          .filter((cr) => {
            if (!cr.start) return false;
            const isToday = currentStr === localDateStr(today);
            if (isToday) {
              const [h, m] = cr.start.split(":").map(Number);
              const slotStart = new Date(today);
              slotStart.setHours(h, m, 0, 0);
              if (slotStart.getTime() - today.getTime() < 30 * 60 * 1000) return false;
            }
            return true;
          })
          .map((cr, idx) => ({
            id: `exc-${exception.id}-${idx}`,
            day: cap,
            startTime: cr.start,
            endTime: cr.end,
            status: "available",
            exception: true,
          }));
      }
    }

    return availabilities.filter((a) => {
      if (a.day !== cap) return false;

      if (a.dateDebut && currentStr < a.dateDebut) return false;
      if (a.dateFin && currentStr > a.dateFin) return false;

      if (a.recurrence === "unique") {
        if (!a.dateDebut) return false;
        if (currentStr < a.dateDebut) return false;
        const debut = new Date(a.dateDebut + "T00:00:00");
        const diffDays = Math.round(
          (current.getTime() - debut.getTime()) / (24 * 60 * 60 * 1000)
        );
        if (diffDays < 0 || diffDays >= 7) return false;
      } else if (a.recurrence === "bi_mensuel") {
        if (!a.dateDebut) return false;
        const debut = new Date(a.dateDebut + "T00:00:00");
        const diffMs = current.getTime() - debut.getTime();
        const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
        if (diffWeeks < 0 || diffWeeks % 2 !== 0) return false;
      } else if (a.recurrence === "quotidien") {
        // Pour quotidien, on affiche chaque jour sauf si jour de la semaine ne match pas
        // quotidien = tous les jours dans la plage de validité
      } else if (a.recurrence === "mensuel") {
        if (!a.dateDebut) return false;
        const debut = new Date(a.dateDebut + "T00:00:00");
        if (current.getDate() !== debut.getDate()) return false;
      }

      if (!a.startTime) return false;

      return true;
    });
  };

  const getAppointmentsByDay = (day) => {
    return filteredAppointments.filter((a) => {
      const [dayPart, monthPart] = a.date.split(" ");
      const apptDay = parseInt(dayPart);
      const monthIndex = new Date(`${monthPart} 1, ${year}`).getMonth();
      return apptDay === day && monthIndex === month;
    });
  };

  const pendingOpinionsCount = opinionRequests.filter(r => r.statut === "en_attente").length;

  // ============ RENDU JSX ============
  return (
    <div
      className={`space-y-3 overflow-x-hidden w-full sm:space-y-4 lg:space-y-6 p-3 sm:p-4 lg:p-6 transition-colors min-h-screen
      ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-black"}`}
    >
      {/* HEADER RESPONSIVE */}
      <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#3b82f6]">
            Appointments
          </h1>
          <p className={`text-xs sm:text-sm mt-0.5 sm:mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Latest updates from the last 7 days.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* POWER TOGGLE */}
          <button
            onClick={handleToggleDisponibilite}
            disabled={togglingDispo}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              disponible
                ? "bg-green-500 hover:bg-green-600 text-white shadow-md shadow-green-500/25"
                : "bg-gray-400 hover:bg-gray-500 text-white"
            } ${togglingDispo ? "opacity-50 cursor-not-allowed" : ""}`}
            title={disponible ? "Vous êtes disponible — cliquer pour passer indisponible" : "Vous êtes indisponible — cliquer pour passer disponible"}
          >
            <Power size={16} className={disponible ? "animate-pulse" : ""} />
            <span className="hidden sm:inline">{disponible ? "Disponible" : "Indisponible"}</span>
          </button>

          <button
            onClick={() => setOpenForm(true)}
            className="bg-[#3B82F6] text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm w-full sm:w-auto hover:bg-blue-700 transition flex items-center justify-center gap-1.5 sm:gap-2 font-medium"
          >
            <Plus size={14} className="sm:hidden" />
            <Plus size={16} className="hidden sm:inline" />
            <span className="hidden sm:inline">Create new appointment</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>

      {/* STATS RESPONSIVE */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <StatCard
          icon={<CalendarDays className="w-4 h-4 sm:w-5 sm:h-5" />}
          label="Aujourd'hui"
          value={stats.today}
          color="blue"
          darkMode={darkMode}
        />
        <StatCard
          icon={<Clock3 className="w-4 h-4 sm:w-5 sm:h-5" />}
          label="En attente"
          value={stats.pending}
          color="yellow"
          darkMode={darkMode}
        />
        <StatCard
          icon={<Calendar className="w-4 h-4 sm:w-5 sm:h-5" />}
          label="Cette semaine"
          value={stats.week}
          color="green"
          darkMode={darkMode}
        />
        <StatCard
          icon={<Stethoscope className="w-4 h-4 sm:w-5 sm:h-5" />}
          label="Avis"
          value={stats.opinionRequests}
          color="purple"
          darkMode={darkMode}
          alert={stats.opinionRequests > 0}
        />
      </div>

      <div className={`h-[1px] my-3 sm:my-4 lg:my-6 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>

      {/* ✅ ONGLETS PRINCIPAUX - Scroll horizontal fluide */}
      <div className="relative ">
        <div
          className="flex flex-wrap gap-2 pb-2 scrollbar-hide"
          style={{ 
            scrollbarWidth: "none", 
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch"
          }}
        >
          <style>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          
          <button onClick={() => setMainTab("patients")} className={mainTabClass("patients")}>
            <Users size={14} className="sm:hidden" />
            <Users size={16} className="hidden sm:inline" />
            <span className="hidden sm:inline">RDV Patients</span>
            <span className="sm:hidden">Patients</span>
          </button>

          <button
            onClick={() => setMainTab("opinions-received")}
            className={mainTabClass("opinions-received")}
          >
            <Stethoscope size={14} className="sm:hidden" />
            <Stethoscope size={16} className="hidden sm:inline" />
            <span className="hidden sm:inline">Demandes reçues</span>
            <span className="sm:hidden">Reçues</span>
            {pendingOpinionsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white text-[9px] sm:text-[10px] font-bold rounded-full flex items-center justify-center">
                {pendingOpinionsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setMainTab("opinions-sent")}
            className={mainTabClass("opinions-sent")}
          >
            <Send size={14} className="sm:hidden" />
            <Send size={16} className="hidden sm:inline" />
            <span className="hidden sm:inline">Mes demandes</span>
            <span className="sm:hidden">Envoyées</span>
          </button>

          <button
            onClick={() => setMainTab("colleagues")}
            className={mainTabClass("colleagues")}
          >
            <UserCheck size={14} className="sm:hidden" />
            <UserCheck size={16} className="hidden sm:inline" />
            <span className="hidden sm:inline">RDV Confrères</span>
            <span className="sm:hidden">Confrères</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* ONGLET : RDV PATIENTS */}
      {/* ============================================================ */}
      {mainTab === "patients" && (
        <>
          {/* Sous-onglets */}
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {["Upcoming", "Past", "All"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={tabClass(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* TOOLBAR RESPONSIVE */}
          <div className="flex flex-col gap-2 sm:gap-3 mt-3 sm:mt-4">
            {/* Ligne 1 : Titre + bouton */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center shrink-0 ${
                    darkMode
                      ? "bg-green-900/30 border-green-700"
                      : "bg-green-100 border-[#56B943]"
                  }`}
                >
                  <CalendarDays
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${darkMode ? "text-green-400" : "text-[#27772B]"}`}
                  />
                </div>

                <span
                  className={`font-medium text-xs sm:text-sm lg:text-base ${
                    darkMode ? "text-gray-200" : "text-gray-700"
                  }`}
                >
                  {activeTab} Appointments
                </span>
              </div>

              <button
                onClick={() => setOpenAvailability(true)}
                className="px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition text-xs sm:text-sm w-full sm:w-auto font-medium"
              >
                Manage Availability
              </button>
            </div>

            {/* Ligne 2 : Search + Filtres */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="flex-1">
                <SearchBar
                  placeholder="Search patient..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <FilterButton />

                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={() => setView("list")}
                    className={viewBtnClass("list")}
                    title="Vue liste"
                  >
                    <List className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">List</span>
                  </button>

                  <button
                    onClick={() => setView("calendar")}
                    className={viewBtnClass("calendar")}
                    title="Vue calendrier"
                  >
                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Calendar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* CONTENT */}
          <div className="mt-3 sm:mt-4 lg:mt-6">
            {/* LIST VIEW */}
            {view === "list" && (
              <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                {filteredAppointments.map((item) => (
                  <AppointmentListCard
                    key={item.id}
                    item={item}
                    getStatusStyle={getStatusStyle}
                    darkMode={darkMode}
                    onReschedule={handleReschedule}
                    onOpenChat={handleOpenChat}
                    onOpenPatient={handleOpenPatient}
                    onNavigatePatient={() => navigate("/patients", { state: { patientId: item.patientId } })}
                  />
                ))}
              </div>
            )}

            {/* CALENDAR VIEW */}
            {view === "calendar" && (
              <div
                className={`${
                  darkMode ? "bg-gray-900" : "bg-white"
                } rounded-xl sm:rounded-2xl p-2 sm:p-3 lg:p-4 overflow-x-auto`}
              >
                {/* HEADER CALENDAR */}
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <button
                    onClick={previousMonth}
                    className={`p-1.5 sm:p-2 rounded-lg border transition ${
                      darkMode
                        ? "border-gray-700 hover:bg-gray-800 text-gray-200"
                        : "border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <h2 className="font-semibold text-xs sm:text-sm lg:text-lg capitalize text-center">
                    {monthName} {year}
                  </h2>

                  <button
                    onClick={nextMonth}
                    className={`p-1.5 sm:p-2 rounded-lg border transition ${
                      darkMode
                        ? "border-gray-700 hover:bg-gray-800 text-gray-200"
                        : "border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* DAYS HEADER */}
                <div className="hidden md:grid grid-cols-7 text-xs font-semibold mb-2">
                  {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
                    <div
                      key={d}
                      className={`text-center py-2 ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {d}
                    </div>
                  ))}
                </div>

                {/* GRID */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1 sm:gap-1.5 lg:gap-2">
                  {emptyDays.map((_, index) => (
                    <div key={`empty-${index}`} />
                  ))}

                  {days.map((day) => (
                    <AppointmentCalendarDayCard
                      key={day}
                      day={day}
                      dayAppointments={getAppointmentsByDay(day)}
                      availability={getAvailabilityForDay(day)}
                      dayException={getExceptionForDay(day)}
                      isToday={
                        day === today.getDate() &&
                        month === today.getMonth() &&
                        year === today.getFullYear()
                      }
                      darkMode={darkMode}
                      onDayClick={handleOpenCreateSlotModal}
                      onSlotClick={handleOpenEditSlotModal}
                      onDeleteException={handleDeleteException}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* ONGLET : DEMANDES D'AVIS REÇUES */}
      {/* ============================================================ */}
      {mainTab === "opinions-received" && (
        <OpinionRequestsTab
          darkMode={darkMode}
          requests={opinionRequests}
          onUpdateRequest={handleUpdateOpinionRequest}
        />
      )}

      {/* ============================================================ */}
      {/* ONGLET : MES DEMANDES D'AVIS ENVOYÉES */}
      {/* ============================================================ */}
      {mainTab === "opinions-sent" && (
        <MyOpinionRequestsTab
          darkMode={darkMode}
          requests={myOpinionRequests}
        />
      )}

      {/* ============================================================ */}
      {/* ONGLET : RDV CONFRÈRES */}
      {/* ============================================================ */}
      {mainTab === "colleagues" && (
        <div className="space-y-2 sm:space-y-3 lg:space-y-4">
          {colleagueAppointments.length === 0 ? (
            <div
              className={`text-center py-10 sm:py-12 lg:py-16 px-4 rounded-xl sm:rounded-2xl border-2 border-dashed ${
                darkMode ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-500"
              }`}
            >
              <UserCheck className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 opacity-50" />
              <p className="font-semibold text-sm sm:text-base">Aucun RDV avec un confrère</p>
              <p className="text-xs sm:text-sm mt-1">
                Les RDV planifiés suite à des demandes d'avis apparaîtront ici
              </p>
            </div>
          ) : (
            colleagueAppointments.map((item) => (
              <AppointmentListCard
                key={item.id}
                item={item}
                getStatusStyle={getStatusStyle}
                darkMode={darkMode}
                onReschedule={handleReschedule}
                onOpenPatient={() => {}}
              />
            ))
          )}
        </div>
      )}

      {/* ============ MODALES ============ */}
      <NewAppointmentForm
        open={openForm}
        onClose={() => setOpenForm(false)}
        darkMode={darkMode}
        onCreated={() => {
          setLoadingRdv(true);
          get("/api/rendez_vous")
            .then(async (rdvsRaw) => {
              const paidStatuses = new Set([
                "confirme", "paye_en_attente_validation", "en_cours", "termine",
              ]);
              const rdvs = rdvsRaw.filter(r => paidStatuses.has(r.statut));
              const uniqueIds = [...new Set(rdvs.map((r) => r.patient_id))];
              const patientsMap = {};
              await Promise.all(
                uniqueIds.map(async (pid) => {
                  try {
                    const p = await get(`/api/patients/${pid}`);
                    patientsMap[pid] = p;
                  } catch {
                    patientsMap[pid] = null;
                  }
                })
              );
              const now2 = Date.now();
              const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
              const mapped = rdvs.map((r) => {
                const p = patientsMap[r.patient_id] || {};
                const d = new Date(r.date_heure_debut);
                const endTime = new Date(r.date_heure_fin).getTime();
                const isExpired = now2 > endTime + TWO_HOURS_MS;
                const isDone = r.statut === "en_cours" || r.statut === "termine";
          const timeParts = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: getUserTimezone() });
                const statusMap = {
                  confirme: "Confirmed",
                  paye_en_attente_validation: "Pending",
                  en_cours: "Confirmed",
                  termine: "Confirmed",
                };
                return {
                  id: r.id,
                  patientName: `${p.prenom || ""} ${p.nom || ""}`.trim() || "Patient",
                  patientImage: p.photo_url || "",
                  status: statusMap[r.statut] || "Pending",
                  date: d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }),
                  time: timeParts,
                  type: r.type === "presentiel" ? "In-person" : "Teleconsultation",
                  category: isExpired || isDone ? "past" : "upcoming",
                  dateHeureFin: r.date_heure_fin,
                  statut: r.statut,
                };
              });
              setAppointments(mapped);
            })
            .catch(() => setAppointments([]))
            .finally(() => setLoadingRdv(false));
        }}
      />
      <RescheduleForm
        open={openReschedule}
        onClose={() => setOpenReschedule(false)}
        selectedAppointment={selectedAppointment}
        darkMode={darkMode}
        onSave={handleSaveReschedule}
      />
      <AvailabilityForm
        open={openAvailability}
        onClose={() => setOpenAvailability(false)}
        darkMode={darkMode}
        onSave={handleSaveAvailability}
        selectedAvailability={selectedAvailability}
        exceptions={exceptions}
        onAddException={handleAddException}
        onUpdateException={handleUpdateException}
        onDeleteException={handleDeleteException}
        existingAvailabilities={availabilities}
        onDeleteAvailability={handleDeleteAvailability}
      />
      <PatientProfileModal
        open={openPatientModal}
        onClose={() => setOpenPatientModal(false)}
        patient={selectedPatient}
        darkMode={darkMode}
      />
      <SlotFormModal
        open={openSlotModal}
        onClose={() => setOpenSlotModal(false)}
        selectedSlot={selectedSlotForModal}
        selectedDate={selectedDateForModal}
        darkMode={darkMode}
        onSave={handleSaveSlot}
        onDelete={handleDeleteAvailability}
        onAddNew={handleSwitchToCreateSlot}
        existingAvailabilities={availabilities}
        exceptions={exceptions}
      />
      <AppointmentChatModal
        open={openChatModal}
        onClose={() => setOpenChatModal(false)}
        rdv={chatRdv}
        darkMode={darkMode}
      />
    </div>
  );
}