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

export default function TeleConsultation() {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  return (
    <div className="min-h-screen bg-[#F8F8F8]">

      {/* DASHBOARD OFFSET */}
      <div className="ml-0 md:ml-[260px] pt-0 md:pt-[90px] p-3 sm:p-4 md:p-6">

        {/* ================= HEADER ================= */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6">

          <div>
            <h1 className="text-lg md:text-xl font-semibold text-[#2C3850]">
              Teleconsultation Room
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Real-time medical consultation session
            </p>
          </div>

          <button className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-red-700 transition w-full sm:w-auto">
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
          <div className="bg-white rounded-2xl p-4 sm:p-5 space-y-4 sm:space-y-5 shadow-sm h-auto lg:max-h-[70vh] lg:overflow-y-auto">

            {/* HEADER PANEL */}
            <div className="flex items-center gap-2 font-semibold text-[#2C3850] text-sm sm:text-base">
              <Stethoscope className="w-4 h-4" />
              Clinical Panel
            </div>

            {/* PATIENT CARD */}
            <div className="p-3 bg-gray-50 rounded-xl text-sm space-y-1">
              <div className="flex items-center gap-2 text-gray-600 text-xs sm:text-sm">
                <User className="w-4 h-4" />
                Patient
              </div>

              <p className="font-medium">John Doe</p>
              <p className="text-xs text-gray-500">ID: PT-2026-001</p>
            </div>

            {/* NOTES */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-gray-700">
                Clinical Notes
              </label>
              <textarea
                className="w-full border p-2 sm:p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Write clinical observations..."
              />
            </div>

            {/* DIAGNOSIS */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-gray-700">
                Diagnosis
              </label>
              <input
                className="w-full border p-2 sm:p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter medical diagnosis..."
              />
            </div>

            {/* PRESCRIPTION */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-gray-700">
                Prescription
              </label>
              <textarea
                className="w-full border p-2 sm:p-3 rounded-xl text-sm"
                rows={3}
                placeholder="Drugs, dosage, duration..."
              />
            </div>

            {/* ACTIONS */}
            <div className="space-y-2 pt-2">

              <button className="w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition text-sm sm:text-base">
                Save Consultation
              </button>

              <button className="w-full border py-2 rounded-xl text-gray-600 hover:bg-gray-50 transition flex items-center justify-center gap-2 text-sm sm:text-base">
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