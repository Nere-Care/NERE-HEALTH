import { useState, useEffect, useCallback } from "react";
import {
  CalendarDays, List, Calendar, ChevronLeft, ChevronRight,
  Stethoscope, Clock3, Users, Send, UserCheck, Plus, AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

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

import { fetchMesDemandesAvis } from "../../services/medecinService";

import {
  fetchMedecinRendezVous,
  changerStatutRdv,
  fetchDemandesAvisRecues,
  repondreDemandeAvis,
} from "../../services/rendezVousService";

// Convertit un RDV backend vers le format attendu par les composants UI
function mapRdvToUi(rdv) {
  return {
    id: rdv.id,
    patientName: rdv.patient_nom,
    patientImage: null,
    email: rdv.patient_email,
    phone: rdv.patient_telephone,
    date: rdv.date,
    time: rdv.heure,
    type: rdv.type === "video" ? "Teleconsultation" : "In-person",
    status:
      rdv.statut === "confirme" ? "Confirmed"
      : rdv.statut === "en_attente" ? "Pending"
      : rdv.statut === "annule_medecin" || rdv.statut === "annule_patient" ? "Cancelled"
      : "Pending",
    category:
      new Date(`${rdv.date.split("/").reverse().join("-")}T${rdv.heure}`) > new Date()
        ? "upcoming"
        : "past",
    motif: rdv.motif,
    montant: rdv.montant,
    devise: rdv.devise,
    _statut_backend: rdv.statut,
    _original: rdv,
  };
}

// Convertit une demande d'avis backend vers le format UI
function mapDemandeToUi(d) {
  return {
    id: d.id,
    requesterName: d.patient_nom,
    requesterSpeciality: d.patient_role === "medecin" ? "Medecin" : "Patient",
    motif: d.motif,
    urgence: d.urgence,
    contexte: d.contexte,
    question: d.question,
    examens: d.examens,
    fichiers: d.fichiers || [],   // pièces jointes
    date: d.date,
    statut: d.statut,
    meetingDate: d.meetingDate,
    attachments: [],
  };
}

export default function Appointment({ darkMode }) {
  const [openPatientModal, setOpenPatientModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [activeTab, setActiveTab] = useState("Upcoming");
  const [view, setView] = useState("list");
  const [search, setSearch] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [openReschedule, setOpenReschedule] = useState(false);
  const [openAvailability, setOpenAvailability] = useState(false);
  const [mainTab, setMainTab] = useState("patients");
  const [myOpinionRequests, setMyOpinionRequests] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [opinionRequests, setOpinionRequests] = useState([]);
  const [colleagueAppointments, setColleagueAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState(null);
  const navigate = useNavigate();

 const charger = useCallback(async () => {
  try {
    setLoading(true);
    setErreur(null);
    const [rdvs, demandes, mesDemandes] = await Promise.all([
      fetchMedecinRendezVous(),
      fetchDemandesAvisRecues(),
      fetchMesDemandesAvis(),
    ]);
    setAppointments((rdvs ?? []).map(mapRdvToUi));
    setOpinionRequests((demandes ?? []).map(mapDemandeToUi));
    setMyOpinionRequests(mesDemandes ?? []);
  } catch (err) {
    setErreur(err.message);
  } finally {
    setLoading(false);
  }
}, []);

  useEffect(() => { charger(); }, [charger]);

  const handleOpenPatient = (patient) => {
    setSelectedPatient(patient);
    setOpenPatientModal(true);
  };

  const handleReschedule = (item) => {
    setSelectedAppointment(item);
    setOpenReschedule(true);
  };

  const handleSaveReschedule = async (id, newDate, newTime) => {
    // Pour l'instant annulation + recréation non supportée côté backend simple
    console.log("Reschedule demandé:", id, newDate, newTime);
  };

 const handleUpdateOpinionRequest = async (id, newStatus, data) => {
  try {
    // ✅ UN SEUL appel API
    const reponse = await repondreDemandeAvis(id, {
  statut: newStatus,
  message: data.notes || data.reason || "",
  date_rdv: data.meetingDate || null,
  mode: data.mode || null,
  duration_minutes: data.duration || 30,
});

    // ✅ Mise à jour de l'état local
    setOpinionRequests((prev) =>
      prev.map((req) => req.id === id ? { ...req, statut: newStatus, ...data } : req)
    );

    // ✅ Si accepté avec date de RDV, ajouter aux RDV confrères
    if (newStatus === "acceptee" && data.meetingDate) {
      const request = opinionRequests.find((r) => r.id === id);
      if (request) {
        setColleagueAppointments((prev) => [
          ...prev,
          {
            id: `col-${Date.now()}`,
            type: "Teleconsultation",
            patientName: `Dr. ${request.requesterName}`,
            patientImage: null,
            date: new Date(data.meetingDate).toLocaleDateString("fr-FR"),
            time: new Date(data.meetingDate).toLocaleTimeString("fr-FR", {
              hour: "2-digit", minute: "2-digit",
            }),
            status: "Confirmed",
            category: "upcoming",
            mode: data.mode,
          },
        ]);
      }
    }

    // ✅ Si une conversation a été créée, logger l'ID
    if (reponse?.conversation_id) {
      console.log("Conversation créée:", reponse.conversation_id);
       navigate(`/messages?conv=${reponse.conversation_id}`); 
    }
  } catch (err) {
    console.error("Erreur reponse demande:", err.message);
  }
};

  const handleChangerStatut = async (rdvId, statut) => {
  try {
    const result = await changerStatutRdv(rdvId, statut);
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === rdvId
          ? {
              ...a,
              _statut_backend: statut,
              status:
                statut === "confirme" ? "Confirmed"
                : statut.startsWith("annule") ? "Cancelled"
                : "Pending",
            }
          : a
      )
    );

    // Si acceptation → proposer d'ouvrir la conversation
    if (statut === "confirme" && result?.conversation_id) {
      const aller = window.confirm(
        "RDV confirmé et paiement validé. Ouvrir la conversation avec le patient ?"
      );
      if (aller) navigate("/messages");
    }
  } catch (err) {
    console.error("Erreur changement statut:", err.message);
  }
};

  const filteredAppointments = appointments.filter((item) => {
    const matchTab =
      activeTab === "Upcoming" ? item.category === "upcoming"
      : activeTab === "Past" ? item.category === "past"
      : true;
    const matchSearch = !search || item.patientName?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const now = new Date();
  const stats = {
    today: appointments.filter((a) => {
      const [d, m, y] = a.date.split("/");
      const apptDate = new Date(`${y}-${m}-${d}`);
      return apptDate.toDateString() === now.toDateString();
    }).length,
    pending: appointments.filter((a) => a.status === "Pending").length,
    week: appointments.filter((a) => {
      const [d, m, y] = a.date.split("/");
      const apptDate = new Date(`${y}-${m}-${d}`);
      return apptDate >= now && apptDate <= new Date(now.getTime() + 7 * 86400000);
    }).length,
    opinionRequests: opinionRequests.filter((r) => r.statut === "en_attente").length,
  };

  const getStatusStyle = (status, darkMode) => {
    switch (status) {
      case "Confirmed": return darkMode ? "bg-green-900/40 text-green-300" : "bg-green-100 text-green-700";
      case "Pending":   return darkMode ? "bg-yellow-900/40 text-yellow-300" : "bg-yellow-100 text-yellow-700";
      case "Cancelled": return darkMode ? "bg-red-900/40 text-red-300" : "bg-red-100 text-red-700";
      default:          return darkMode ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-600";
    }
  };

  const tabClass = (tab) =>
    `px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition whitespace-nowrap ${
      activeTab === tab
        ? "bg-blue-600 text-white"
        : darkMode ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
    }`;

  const mainTabClass = (tab) =>
    `flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap relative flex-shrink-0 min-w-fit ${
      mainTab === tab
        ? "bg-blue-600 text-white shadow-md"
        : darkMode ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
    }`;

  const viewBtnClass = (mode) =>
    `flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm border transition whitespace-nowrap ${
      view === mode
        ? "bg-blue-600 text-white border-blue-600"
        : darkMode ? "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
    }`;

  // Calendrier
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const startDay = firstDay === 0 ? 6 : firstDay - 1;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: startDay });
  const today = new Date();

  const getAppointmentsByDay = (day) =>
    filteredAppointments.filter((a) => {
      const [d, m] = a.date.split("/");
      return parseInt(d) === day && parseInt(m) - 1 === month;
    });

  const pendingOpinionsCount = stats.opinionRequests;

  return (
    <div className={`space-y-3 overflow-x-hidden w-full sm:space-y-4 lg:space-y-6 p-3 sm:p-4 lg:p-6 transition-colors min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-black"}`}>

      <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#3b82f6]">Appointments</h1>
          <p className={`text-xs sm:text-sm mt-0.5 sm:mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Vos rendez-vous et demandes d'avis.
          </p>
        </div>
        <button
          onClick={() => setOpenForm(true)}
          className="bg-[#3B82F6] text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm w-full sm:w-auto hover:bg-blue-700 transition flex items-center justify-center gap-1.5 sm:gap-2 font-medium"
        >
          <Plus size={16} />
          <span>Nouveau RDV</span>
        </button>
      </div>

      {erreur && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${darkMode ? "bg-red-900/30 text-red-300" : "bg-red-50 text-red-600"}`}>
          <AlertCircle size={16} /> {erreur}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <StatCard icon={<CalendarDays className="w-4 h-4 sm:w-5 sm:h-5" />} label="Aujourd'hui" value={stats.today} color="blue" darkMode={darkMode} />
            <StatCard icon={<Clock3 className="w-4 h-4 sm:w-5 sm:h-5" />} label="En attente" value={stats.pending} color="yellow" darkMode={darkMode} />
            <StatCard icon={<Calendar className="w-4 h-4 sm:w-5 sm:h-5" />} label="Cette semaine" value={stats.week} color="green" darkMode={darkMode} />
            <StatCard icon={<Stethoscope className="w-4 h-4 sm:w-5 sm:h-5" />} label="Avis" value={stats.opinionRequests} color="purple" darkMode={darkMode} alert={pendingOpinionsCount > 0} />
          </div>

          <div className={`h-[1px] ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />

          <div className="flex flex-wrap gap-2 pb-2">
            <button onClick={() => setMainTab("patients")} className={mainTabClass("patients")}>
              <Users size={16} /> <span>RDV Patients</span>
            </button>
            <button onClick={() => setMainTab("opinions-received")} className={mainTabClass("opinions-received")}>
              <Stethoscope size={16} /> <span>Demandes recues</span>
              {pendingOpinionsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {pendingOpinionsCount}
                </span>
              )}
            </button>
            <button onClick={() => setMainTab("opinions-sent")} className={mainTabClass("opinions-sent")}>
              <Send size={16} /> <span>Mes demandes</span>
            </button>
            <button onClick={() => setMainTab("colleagues")} className={mainTabClass("colleagues")}>
              <UserCheck size={16} /> <span>RDV Confreres</span>
            </button>
          </div>

          {mainTab === "patients" && (
            <>
              <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1">
                {["Upcoming", "Past", "All"].map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={tabClass(tab)}>{tab}</button>
                ))}
              </div>

              <div className="flex flex-col gap-2 sm:gap-3 mt-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span className={`font-medium text-xs sm:text-sm ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                    {activeTab} Appointments
                  </span>
                  <button
                    onClick={() => setOpenAvailability(true)}
                    className="px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition text-xs sm:text-sm w-full sm:w-auto font-medium"
                  >
                    Gerer disponibilites
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <SearchBar placeholder="Rechercher patient..." value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <FilterButton />
                    <button onClick={() => setView("list")} className={viewBtnClass("list")}><List className="w-4 h-4" /><span className="hidden sm:inline">Liste</span></button>
                    <button onClick={() => setView("calendar")} className={viewBtnClass("calendar")}><Calendar className="w-4 h-4" /><span className="hidden sm:inline">Calendrier</span></button>
                  </div>
                </div>
              </div>

              <div className="mt-3 sm:mt-4">
                {view === "list" && (
                  <div className="space-y-2 sm:space-y-3">
                    {filteredAppointments.length === 0 ? (
                      <div className={`text-center py-12 rounded-2xl border-2 border-dashed ${darkMode ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-500"}`}>
                        <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="font-semibold text-sm">Aucun rendez-vous</p>
                      </div>
                    ) : (
                      filteredAppointments.map((item) => (
                        <AppointmentListCard
                          key={item.id}
                          item={item}
                          getStatusStyle={getStatusStyle}
                          darkMode={darkMode}
                          onReschedule={handleReschedule}
                          onOpenPatient={handleOpenPatient}
                          onChangerStatut={handleChangerStatut}
                        />
                      ))
                    )}
                  </div>
                )}

                {view === "calendar" && (
                  <div className={`${darkMode ? "bg-gray-900" : "bg-white"} rounded-xl sm:rounded-2xl p-2 sm:p-4 overflow-x-auto`}>
                    <div className="flex items-center justify-between mb-4">
                      <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className={`p-2 rounded-lg border ${darkMode ? "border-gray-700 hover:bg-gray-800" : "border-gray-200 hover:bg-gray-100"}`}>
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <h2 className="font-semibold text-sm lg:text-lg capitalize">{monthName} {year}</h2>
                      <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className={`p-2 rounded-lg border ${darkMode ? "border-gray-700 hover:bg-gray-800" : "border-gray-200 hover:bg-gray-100"}`}>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="hidden md:grid grid-cols-7 text-xs font-semibold mb-2">
                      {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
                        <div key={d} className={`text-center py-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1 sm:gap-2">
                      {emptyDays.map((_, i) => <div key={`e-${i}`} />)}
                      {days.map((day) => (
                        <AppointmentCalendarDayCard
                          key={day}
                          day={day}
                          dayAppointments={getAppointmentsByDay(day)}
                          availability={[]}
                          isToday={day === today.getDate() && month === today.getMonth() && year === today.getFullYear()}
                          darkMode={darkMode}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {mainTab === "opinions-received" && (
            <OpinionRequestsTab darkMode={darkMode} requests={opinionRequests} onUpdateRequest={handleUpdateOpinionRequest} />
          )}

          {mainTab === "opinions-sent" && (
            <MyOpinionRequestsTab darkMode={darkMode} requests={myOpinionRequests} />
          )}

          {mainTab === "colleagues" && (
            <div className="space-y-2 sm:space-y-3">
              {colleagueAppointments.length === 0 ? (
                <div className={`text-center py-12 px-4 rounded-xl border-2 border-dashed ${darkMode ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-500"}`}>
                  <UserCheck className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="font-semibold text-sm">Aucun RDV avec un confrere</p>
                  <p className="text-xs mt-1">Les RDV planifies suite a des demandes d'avis apparaitront ici</p>
                </div>
              ) : (
                colleagueAppointments.map((item) => (
                  <AppointmentListCard key={item.id} item={item} getStatusStyle={getStatusStyle} darkMode={darkMode} onReschedule={handleReschedule} onOpenPatient={() => {}} />
                ))
              )}
            </div>
          )}
        </>
      )}

      <NewAppointmentForm open={openForm} onClose={() => setOpenForm(false)} darkMode={darkMode} />
      <RescheduleForm open={openReschedule} onClose={() => setOpenReschedule(false)} selectedAppointment={selectedAppointment} darkMode={darkMode} onSave={handleSaveReschedule} />
      <AvailabilityForm open={openAvailability} onClose={() => setOpenAvailability(false)} darkMode={darkMode} onSave={(av) => console.log("Dispo sauvegardee:", av)} />
      <PatientProfileModal open={openPatientModal} onClose={() => setOpenPatientModal(false)} patient={selectedPatient} darkMode={darkMode} />
    </div>
  );
}