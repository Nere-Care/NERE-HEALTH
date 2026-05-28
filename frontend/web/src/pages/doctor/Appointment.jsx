// Appointment.jsx

import { useState } from "react";
import {
  CalendarDays,
  List,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import SearchBar from "../../components/common/SearchBar";
import FilterButton from "../../components/common/FilterButton";
import AppointmentListCard from "../../components/doctors/appointment/AppointmentListCard";
import AppointmentCalendarDayCard from "../../components/doctors/appointment/AppointmentCalendarDayCard";
import NewAppointmentForm from "../../components/doctors/appointment/NewAppointmentForm";
import RescheduleForm from "../../components/doctors/appointment/ResheduleForm";

import AvailabilityForm from "../../components/doctors/appointment/AvailabilityForm";

import { appointments } from "../../constants/doctors/appointmentsData";

import PatientProfileModal from "../../components/doctors/appointment/PatientProfileModal";



export default function Appointment({ darkMode }) {
const [openPatientModal, setOpenPatientModal] = useState(false);

const [selectedPatient, setSelectedPatient] =
  useState(null);

const handleOpenPatient = (patient) => {
  setSelectedPatient(patient);
  setOpenPatientModal(true);
};


const [availabilities, setAvailabilities] = useState([
  {
    id: 1,
    day: 12,
    month: 4,
    year: 2026,
    startTime: "08:00",
    endTime: "12:00",
    status: "available",
  },

  {
    id: 2,
    day: 15,
    month: 4,
    year: 2026,
    startTime: "14:00",
    endTime: "18:00",
    status: "available",
  },
]);



  const [openForm, setOpenForm] = useState(false);
  const [activeTab, setActiveTab] = useState("Upcoming  ");
  const [view, setView] = useState("list");
  const [search, setSearch] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [openReschedule, setOpenReschedule] = useState(false);


const handleReschedule = (item) => {
  setSelectedAppointment(item);
  setOpenReschedule(true);
};

const getAvailabilityForDay = (day) => {
  const current = new Date(year, month, day);

  const weekDay = current.toLocaleDateString("en-US", {
    weekday: "long",
  });

  return availabilities.filter(
    (a) => a.day === weekDay
  );
};

const handleSaveReschedule = (id, newDate, newTime) => {
  console.log("Update :", id, newDate, newTime);
};

const getStatusStyle = (status, darkMode) => {
  switch (status) {
    case "Confirmed":
      return darkMode
        ? "bg-green-900/40 text-green-300"
        : "bg-green-100 text-green-700";

    case "Pending":
      return darkMode
        ? "bg-yellow-900/40 text-yellow-300"
        : "bg-yellow-100 text-yellow-700";

    case "Cancelled":
      return darkMode
        ? "bg-red-900/40 text-red-300"
        : "bg-red-100 text-red-700";

    default:
      return darkMode
        ? "bg-gray-800 text-gray-300"
        : "bg-gray-100 text-gray-600";
  }
};

  const filteredAppointments = appointments.filter((item) => {
    if (activeTab === "Upcoming") return item.category === "upcoming";
    if (activeTab === "Past") return item.category === "past";
    return true;
  });


 const handleSaveAvailability = (newAvailabilities) => {
  setAvailabilities((prev) => [
    ...prev,
    ...newAvailabilities,
  ]);
};

  const tabClass = (tab) =>
    `px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
      activeTab === tab
        ? "bg-blue-600 text-white"
        : darkMode
        ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
    }`;

  const viewBtnClass = (mode) =>
    `flex items-center gap-2 px-3 py-2 rounded-xl text-sm border transition whitespace-nowrap ${
      view === mode
        ? "bg-blue-600 text-white border-blue-600"
        : darkMode
        ? "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"
        : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
    }`;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleString("default", {
    month: "long",
  });

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const firstDay = new Date(year, month, 1).getDay();
  const startDay = firstDay === 0 ? 6 : firstDay - 1;

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: startDay });

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getAppointmentsByDay = (day) => {
    return filteredAppointments.filter((a) => {
      const [dayPart, monthPart] = a.date.split(" ");
      const apptDay = parseInt(dayPart);
      const monthIndex = new Date(`${monthPart} 1, 2026`).getMonth();

      return apptDay === day && monthIndex === month;
    });
  };

  const today = new Date();

const [openAvailability, setOpenAvailability] = useState(false);

const [selectedAvailability, setSelectedAvailability] =
  useState(null);

  return (
    <div className={`space-y-4 mt-6 sm:mt-4 sm:space-y-6 p-3 sm:p-5 lg:p-6 transition-colors
      ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-black"}
    `}>
      <div >
        <div
          
        >

          {/* HEADER */}
          <div className="flex flex-col lg:flex-row lg:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#3b82f6]">
                Appointments
              </h1>

              <p
        className={`text-sm sm:text-base mt-1 ${
          darkMode ? "text-gray-400" : "text-gray-500"
        }`}
      >
                Latest updates from the last 7 days.
              </p>
            </div>

            <button
              onClick={() => setOpenForm(true)}
              className="bg-[#3B82F6] text-white px-4 sm:px-5 py-2 sm:py-3 rounded-xl text-sm w-full sm:w-auto hover:bg-blue-700 transition"
            >
               + Create new appointment
            </button>
          </div>

          <div className={`h-[1px] my-6 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>

          {/* TABS */}
          <div className="flex gap-3 mb-6 overflow-x-auto pb-1">
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

          {/* TOOLBAR */}
          <div className="flex flex-col xl:flex-row xl:justify-between gap-4">

           <div className="flex items-center gap-3">

  <div
    className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${
      darkMode
        ? "bg-green-900/30 border-green-700"
        : "bg-green-100 border-[#56B943]"
    }`}
  >
    <CalendarDays
      className={`w-4 h-4 ${
        darkMode ? "text-green-400" : "text-[#27772B]"
      }`}
    />
  </div>

  <span
    className={`font-medium text-sm sm:text-base ${
      darkMode ? "text-gray-200" : "text-gray-700"
    }`}
  >
    {activeTab} Appointments
  </span>

</div>

<button
  onClick={() => setOpenAvailability(true)}
  className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition text-sm"
>
  Manage Availability
</button>

            <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
              <SearchBar
                  placeholder="Search patient..."
                  value={search}
                   onChange={(e) => setSearch(e.target.value)}
              />
              <FilterButton />

              <div className="flex items-center gap-2 overflow-x-auto">
                <button onClick={() => setView("list")} className={viewBtnClass("list")}>
                  <List className="w-4 h-4" />
                  List
                </button>

                <button onClick={() => setView("calendar")} className={viewBtnClass("calendar")}>
                  <Calendar className="w-4 h-4" />
                  Calendar
                </button>
              </div>
            </div>

          </div>

          {/* CONTENT */}
          <div className="mt-6">

            {/* LIST VIEW */}
            {view === "list" && (
              <div className="space-y-4">
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
    } rounded-2xl p-3 sm:p-4`}
  >

    {/* HEADER */}
    <div className="flex items-center justify-between mb-4">

      <button
        onClick={previousMonth}
        className={`p-2 rounded-lg border transition ${
          darkMode
            ? "border-gray-700 hover:bg-gray-800 text-gray-200"
            : "border-gray-200 hover:bg-gray-100"
        }`}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <h2 className="font-semibold text-sm sm:text-lg capitalize text-center">
        {monthName} {year}
      </h2>

      <button
        onClick={nextMonth}
        className={`p-2 rounded-lg border transition ${
          darkMode
            ? "border-gray-700 hover:bg-gray-800 text-gray-200"
            : "border-gray-200 hover:bg-gray-100"
        }`}
      >
        <ChevronRight className="w-4 h-4" />
      </button>

    </div>

    {/* DAYS HEADER */}
   <div
  className={`hidden md:grid grid-cols-7 text-xs font-semibold mb-2`}
>
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
    <div
      className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2"
    >
      {/* EMPTY DAYS */}
      {emptyDays.map((_, index) => (
        <div key={`empty-${index}`} />
      ))}

      {/* REAL DAYS */}
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

        </div>
      </div>
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