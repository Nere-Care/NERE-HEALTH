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

import { appointments } from "../../constants/doctors/appointmentsData";

export default function Appointment() {
  const [activeTab, setActiveTab] = useState("Uncoming");
  const [view, setView] = useState("list");

  // Etat du mois affiché
  const [currentDate, setCurrentDate] = useState(new Date());

  const getStatusStyle = (status) => {
    switch (status) {
      case "Confirmed":
        return "bg-green-100 text-green-700";
      case "Pending":
        return "bg-yellow-100 text-yellow-700";
      case "Cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  // Filtre des rendez-vous
  const filteredAppointments = appointments.filter((item) => {
    if (activeTab === "Uncoming") return item.category === "upcoming";
    if (activeTab === "Past") return item.category === "past";
    return true;
  });

  // Style tabs
  const tabClass = (tab) =>
    `px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
      activeTab === tab
        ? "bg-blue-600 text-white"
        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
    }`;

  // Style switch view
  const viewBtnClass = (mode) =>
    `flex items-center gap-2 px-3 py-2 rounded-xl text-sm border transition whitespace-nowrap ${
      view === mode
        ? "bg-blue-600 text-white border-blue-600"
        : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
    }`;

  // Infos mois actuel
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

  // Navigation mois
  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Récupérer rendez-vous du jour + mois
  const getAppointmentsByDay = (day) => {
    return filteredAppointments.filter((a) => {
      const [dayPart, monthPart] = a.date.split(" ");

      const apptDay = parseInt(dayPart);

      const monthIndex = new Date(`${monthPart} 1, 2026`).getMonth();

      return apptDay === day && monthIndex === month;
    });
  };

  const today = new Date();

  return (
    <div className="min-h-screen bg-[#F8F8F8] p-3 sm:p-4 md:p-8">
      <div className="ml-0 md:ml-[260px] pt-0 md:pt-[90px]">
        <div className="bg-white rounded-2xl shadow-sm p-3 sm:p-4 md:p-6">

          {/* HEADER */}
          <div className="flex flex-col lg:flex-row lg:justify-between gap-4">

            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-[#2C3850]">
                Appointments
              </h1>

              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Latest updates from the last 7 days.
              </p>
            </div>

            <button className="bg-[#3B82F6] text-white px-4 sm:px-5 py-2 sm:py-3 rounded-xl text-sm w-full sm:w-auto">
              + Create new appointment
            </button>

          </div>

          <div className="h-[1px] bg-gray-200 my-6"></div>

          {/* TABS */}
          <div className="flex gap-3 mb-6 overflow-x-auto pb-1">
            {["Uncoming", "Past", "All"].map((tab) => (
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

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full border border-[#56B943] bg-green-100 flex items-center justify-center shrink-0">
                <CalendarDays className="w-4 h-4 text-[#27772B]" />
              </div>

              <span className="font-medium text-gray-700 text-sm sm:text-base">
                {activeTab} Appointments
              </span>
            </div>

            <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">

              <SearchBar placeholder="Search appointment..." />
              <FilterButton />

              <div className="flex items-center gap-2 overflow-x-auto">

                <button
                  onClick={() => setView("list")}
                  className={viewBtnClass("list")}
                >
                  <List className="w-4 h-4" />
                  List
                </button>

                <button
                  onClick={() => setView("calendar")}
                  className={viewBtnClass("calendar")}
                >
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
                  />
                ))}
              </div>
            )}

            {/* CALENDAR VIEW */}
            {view === "calendar" && (
              <div className="bg-white rounded-2xl p-2 sm:p-4 overflow-x-auto">

                {/* Header Calendar */}
                <div className="flex items-center justify-between mb-4 min-w-[700px]">

                  <button
                    onClick={previousMonth}
                    className="p-2 rounded-lg border hover:bg-gray-100"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <h2 className="font-semibold text-lg capitalize">
                    {monthName} {year}
                  </h2>

                  <button
                    onClick={nextMonth}
                    className="p-2 rounded-lg border hover:bg-gray-100"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                </div>

                {/* Week days */}
                <div className="grid grid-cols-7 min-w-[700px] text-xs font-semibold text-gray-500 mb-3">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                    <div key={d} className="text-center py-2">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-7 gap-2 min-w-[700px]">

                  {/* Cases vides */}
                  {emptyDays.map((_, index) => (
                    <div key={`empty-${index}`} />
                  ))}

                  {/* Jours du mois */}
                  {days.map((day) => (
                    <AppointmentCalendarDayCard
                      key={day}
                      day={day}
                      dayAppointments={getAppointmentsByDay(day)}
                      isToday={
                        day === today.getDate() &&
                        month === today.getMonth() &&
                        year === today.getFullYear()
                      }
                    />
                  ))}

                </div>

              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}