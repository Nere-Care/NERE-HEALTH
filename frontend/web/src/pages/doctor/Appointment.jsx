// Appointment.jsx
import { useState } from "react";
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

import { appointments } from "../../constants/doctors/appointmentsData";

export default function Appointment({ darkMode }) {
  // ============ STATES ============
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
  const [selectedAvailability, setSelectedAvailability] = useState(null);

  const [availabilities, setAvailabilities] = useState([
    { id: 1, day: 12, month: 4, year: 2026, startTime: "08:00", endTime: "12:00", status: "available" },
    { id: 2, day: 15, month: 4, year: 2026, startTime: "14:00", endTime: "18:00", status: "available" },
  ]);

  const [mainTab, setMainTab] = useState("patients");
  const [opinionRequests, setOpinionRequests] = useState([
    {
      id: 1,
      requesterName: "Ngassa Pierre",
      requesterSpeciality: "Médecin généraliste",
      motif: "Confirmation diagnostique",
      urgence: "normal",
      contexte: "Patient de 45 ans, diabétique, présentant des douleurs thoraciques...",
      question: "Pouvez-vous confirmer l'indication d'un test d'effort ?",
      examens: "ECG normal, Troponine négative",
      date: "2026-06-04T10:30:00",
      statut: "en_attente",
      attachments: [],
    },
  ]);
  const [myOpinionRequests, setMyOpinionRequests] = useState([]);
  const [colleagueAppointments, setColleagueAppointments] = useState([]);

  // ============ HANDLERS ============
  const handleOpenPatient = (patient) => {
    setSelectedPatient(patient);
    setOpenPatientModal(true);
  };

  const handleReschedule = (item) => {
    setSelectedAppointment(item);
    setOpenReschedule(true);
  };

  const handleSaveReschedule = (id, newDate, newTime) => {
    console.log("Update :", id, newDate, newTime);
  };

  const handleSaveAvailability = (newAvailabilities) => {
    setAvailabilities((prev) => [...prev, ...newAvailabilities]);
  };

  const handleUpdateOpinionRequest = (id, newStatus, data) => {
    setOpinionRequests(prev =>
      prev.map(req => (req.id === id ? { ...req, statut: newStatus, ...data } : req))
    );

    if (newStatus === "acceptee" && data.meetingDate) {
      const request = opinionRequests.find(r => r.id === id);
      const newAppointment = {
        id: Date.now(),
        type: "opinion_meeting",
        patientName: `Dr. ${request.requesterName}`,
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
  };

  // ============ FILTRAGE ============
  const filteredAppointments = appointments.filter((item) => {
    if (activeTab === "Upcoming") return item.category === "upcoming";
    if (activeTab === "Past") return item.category === "past";
    return true;
  });

  // ============ STATS ============
  const stats = {
    today: filteredAppointments.filter(a => {
      const today = new Date().toLocaleDateString();
      return new Date(a.date).toLocaleDateString() === today;
    }).length,
    pending: filteredAppointments.filter(a => a.status === "Pending").length,
    week: filteredAppointments.filter(a => {
      const apptDate = new Date(a.date);
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return apptDate >= now && apptDate <= weekFromNow;
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

  const previousMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getAvailabilityForDay = (day) => {
    const current = new Date(year, month, day);
    const weekDay = current.toLocaleDateString("en-US", { weekday: "long" });
    return availabilities.filter((a) => a.day === weekDay);
  };

  const getAppointmentsByDay = (day) => {
    return filteredAppointments.filter((a) => {
      const [dayPart, monthPart] = a.date.split(" ");
      const apptDay = parseInt(dayPart);
      const monthIndex = new Date(`${monthPart} 1, 2026`).getMonth();
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
                    onOpenPatient={handleOpenPatient}
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
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
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
                      isToday={
                        day === today.getDate() &&
                        month === today.getMonth() &&
                        year === today.getFullYear()
                      }
                      darkMode={darkMode}
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
      />
      <PatientProfileModal
        open={openPatientModal}
        onClose={() => setOpenPatientModal(false)}
        patient={selectedPatient}
        darkMode={darkMode}
      />
    </div>
  );
}