import { Video, Calendar, Clock } from "lucide-react";

export default function IdleScreen({ darkMode, startCall }) {
  return (
    <div className={`min-h-screen flex flex-col items-center justify-center px-4 text-center
      ${darkMode ? "bg-gray-950 text-white" : "bg-gray-50 text-gray-900"}
    `}>

      {/* ICON */}
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6
        ${darkMode ? "bg-blue-900/30" : "bg-blue-100"}
      `}>
        <Video className={`w-10 h-10 ${darkMode ? "text-blue-400" : "text-blue-600"}`} />
      </div>

      {/* TITLE */}
      <h1 className="text-xl sm:text-2xl font-semibold mb-2">
        No Active Consultation
      </h1>

      <p className={`text-sm mb-6 max-w-md
        ${darkMode ? "text-gray-400" : "text-gray-500"}
      `}>
        You currently have no ongoing teleconsultation session.
        Start a session or wait for a patient to connect.
      </p>

      {/* ACTION BUTTON */}
      <button
        onClick={startCall}
        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition"
      >
        <Video className="w-4 h-4" />
        Start New Consultation
      </button>

      {/* OPTIONAL INFO */}
      <div className="mt-8 space-y-2 text-xs opacity-80">

        <div className="flex items-center gap-2 justify-center">
          <Calendar className="w-4 h-4" />
          <span>Next appointment: 14:00</span>
        </div>

        <div className="flex items-center gap-2 justify-center">
          <Clock className="w-4 h-4" />
          <span>Estimated duration: 30 min</span>
        </div>

      </div>

    </div>
  );
}