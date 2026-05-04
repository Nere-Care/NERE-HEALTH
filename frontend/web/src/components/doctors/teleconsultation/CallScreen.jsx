import { useState } from "react";
import {
  Video,
  PhoneOff,
  Mic,
  MicOff,
  VideoOff,
  User,
  FileText,
  Stethoscope,
} from "lucide-react";

export default function CallScreen({ darkMode, endCall }) {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-950" : "bg-gray-50"}`}>
      <div className="p-3 sm:p-4 md:p-6">

        {/* ================= HEADER ================= */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6">

          <div>
            <h1 className="text-lg md:text-xl font-semibold text-[#3b82f6]">
              Teleconsultation Room
            </h1>
            <p className={`text-xs sm:text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Real-time medical consultation session
            </p>
          </div>

          <button onClick={endCall} className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-red-700 transition w-full sm:w-auto">
            <PhoneOff className="w-4 h-4" />
            End Call
          </button>

        </div>

        {/* ================= MAIN GRID ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* ================= VIDEO ================= */}
          <div className="lg:col-span-2 bg-black rounded-2xl relative h-[45vh] sm:h-[55vh] lg:h-[70vh] min-h-[320px] overflow-hidden flex items-center justify-center">

            <div className="text-center text-white space-y-2 px-3">
              <Video className="w-8 sm:w-10 h-8 sm:h-10 mx-auto opacity-70" />
              <p className="text-xs sm:text-sm text-gray-300">
                Waiting for video stream...
              </p>
            </div>

            {/* STATUS */}
            <div className="absolute top-3 left-3 bg-black/60 text-white text-[10px] sm:text-xs px-3 py-1 rounded-lg">
              ● Live Session
            </div>

            {/* CONTROLS */}
            <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-2 sm:gap-3 bg-black/60 p-2 rounded-full backdrop-blur">

              <button
                onClick={() => setMicOn(!micOn)}
                className={`p-2 sm:p-3 rounded-full transition ${
                  micOn ? "bg-white text-black" : "bg-red-500 text-white"
                }`}
              >
                {micOn ? <Mic className="w-4 h-4 sm:w-5 sm:h-5" /> : <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>

              <button
                onClick={() => setCamOn(!camOn)}
                className={`p-2 sm:p-3 rounded-full transition ${
                  camOn ? "bg-white text-black" : "bg-red-500 text-white"
                }`}
              >
                {camOn ? <Video className="w-4 h-4 sm:w-5 sm:h-5" /> : <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>

            </div>

          </div>

          {/* ================= MEDICAL PANEL ================= */}
          <div
            className={`rounded-2xl p-4 sm:p-5 space-y-4 sm:space-y-5 shadow-sm h-auto lg:max-h-[70vh] lg:overflow-y-auto
            ${darkMode ? "bg-gray-900 text-gray-200" : "bg-white text-gray-700"}`}
          >

            {/* HEADER PANEL */}
            <div className={`flex items-center gap-2 font-semibold text-sm sm:text-base
              ${darkMode ? "text-white" : "text-[#2C3850]"}`}>
              <Stethoscope className="w-4 h-4" />
              Clinical Panel
            </div>

            {/* PATIENT CARD */}
            <div className={`p-3 rounded-xl text-sm space-y-1
              ${darkMode ? "bg-gray-800" : "bg-gray-50"}`}>

              <div className={`flex items-center gap-2 text-xs sm:text-sm
                ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                <User className="w-4 h-4" />
                Patient
              </div>

              <p className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                John Doe
              </p>

              <p className={darkMode ? "text-gray-400 text-xs" : "text-gray-500 text-xs"}>
                ID: PT-2026-001
              </p>
            </div>

            {/* NOTES */}
            <div className="space-y-2">
              <label className={`text-xs sm:text-sm font-medium
                ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                Clinical Notes
              </label>

              <textarea
                className={`w-full border p-2 sm:p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300"}`}
                rows={3}
                placeholder="Write clinical observations..."
              />
            </div>

            {/* DIAGNOSIS */}
            <div className="space-y-2">
              <label className={`text-xs sm:text-sm font-medium
                ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                Diagnosis
              </label>

              <input
                className={`w-full border p-2 sm:p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300"}`}
                placeholder="Enter medical diagnosis..."
              />
            </div>

            {/* PRESCRIPTION */}
            <div className="space-y-2">
              <label className={`text-xs sm:text-sm font-medium
                ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                Prescription
              </label>

              <textarea
                className={`w-full border p-2 sm:p-3 rounded-xl text-sm
                ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300"}`}
                rows={3}
                placeholder="Drugs, dosage, duration..."
              />
            </div>

            {/* ACTIONS */}
            <div className="space-y-2 pt-2">

              <button className="w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition text-sm sm:text-base">
                Save Consultation
              </button>

              <button
                className={`w-full border py-2 rounded-xl transition flex items-center justify-center gap-2 text-sm sm:text-base
                ${darkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800" : "text-gray-600 hover:bg-gray-50"}`}
              >
                <FileText className="w-4 h-4" />
                Generate Report
              </button>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}