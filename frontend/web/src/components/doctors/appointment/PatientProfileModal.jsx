import {
  X,
  Mail,
  Phone,
  CalendarDays,
  MapPin,
  HeartPulse,
} from "lucide-react";

export default function PatientProfileModal({
  open,
  onClose,
  patient,
  darkMode,
}) {
  if (!open || !patient) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">

      <div
        className={`w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl ${
          darkMode
            ? "bg-gray-900 text-white"
            : "bg-white text-gray-900"
        }`}
      >

        {/* HEADER */}
        <div
          className={`relative p-6 ${
            darkMode
              ? "bg-gray-800"
              : "bg-blue-50"
          }`}
        >

          <button
            onClick={onClose}
            className="absolute top-4 right-4"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center">

            {/* Dans le HEADER de PatientProfileModal, remplace le bloc img par : */}
<div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold border-4 border-white shadow-lg
  ${darkMode ? "bg-blue-900 text-blue-300" : "bg-blue-100 text-blue-600"}`}>
  {patient.patientName?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
</div>

            <h2 className="mt-4 text-xl font-bold">
              {patient.patientName}
            </h2>

            <p
              className={`text-sm mt-1 ${
                darkMode
                  ? "text-gray-400"
                  : "text-gray-500"
              }`}
            >
              Patient Profile
            </p>

          </div>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-4">

          {/* EMAIL */}
          <div
            className={`flex items-center gap-3 p-4 rounded-2xl ${
              darkMode
                ? "bg-gray-800"
                : "bg-gray-50"
            }`}
          >
            <Mail className="w-5 h-5 text-blue-500" />

            <div>
              <p className="text-xs text-gray-500">
                Email
              </p>

              <p className="font-medium">
                {patient.email || "patient@email.com"}
              </p>
            </div>
          </div>

          {/* PHONE */}
          <div
            className={`flex items-center gap-3 p-4 rounded-2xl ${
              darkMode
                ? "bg-gray-800"
                : "bg-gray-50"
            }`}
          >
            <Phone className="w-5 h-5 text-green-500" />

            <div>
              <p className="text-xs text-gray-500">
                Phone
              </p>

              <p className="font-medium">
                {patient.phone || "+237 6XX XXX XXX"}
              </p>
            </div>
          </div>

          {/* LOCATION */}
          <div
            className={`flex items-center gap-3 p-4 rounded-2xl ${
              darkMode
                ? "bg-gray-800"
                : "bg-gray-50"
            }`}
          >
            <MapPin className="w-5 h-5 text-red-500" />

            <div>
              <p className="text-xs text-gray-500">
                Location
              </p>

              <p className="font-medium">
                {patient.city || "Douala"}
              </p>
            </div>
          </div>

          {/* LAST APPOINTMENT */}
          <div
            className={`flex items-center gap-3 p-4 rounded-2xl ${
              darkMode
                ? "bg-gray-800"
                : "bg-gray-50"
            }`}
          >
            <CalendarDays className="w-5 h-5 text-purple-500" />

            <div>
              <p className="text-xs text-gray-500">
                Appointment
              </p>

              <p className="font-medium">
                {patient.date} • {patient.time}
              </p>
            </div>
          </div>

          {/* HEALTH INFO */}
          <div
            className={`flex items-center gap-3 p-4 rounded-2xl ${
              darkMode
                ? "bg-gray-800"
                : "bg-gray-50"
            }`}
          >
            <HeartPulse className="w-5 h-5 text-pink-500" />

            <div>
              <p className="text-xs text-gray-500">
                Medical Note
              </p>

              <p className="font-medium">
                {patient.note || "No medical note"}
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}