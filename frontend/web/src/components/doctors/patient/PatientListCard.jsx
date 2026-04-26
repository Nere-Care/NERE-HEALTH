

import React from "react";
import {
  Droplets,
  CalendarDays,
  ChevronRight,
} from "lucide-react";

export default function PatientListCard({ patient, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-2xl px-4 py-4 cursor-pointer hover:shadow-md transition overflow-hidden"
    >
      {/* ONE SINGLE ROW */}
      <div className="flex items-center gap-4 w-full min-w-0">

        {/* PHOTO */}
        <img
          src={patient.image}
          alt={patient.name}
          className="w-16 h-16 rounded-2xl object-cover shrink-0"
        />

        {/* NAME + ID */}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-[#2C3850] text-sm sm:text-base truncate">
            {patient.name}
          </h3>

          <p className="text-xs sm:text-sm text-gray-500 truncate">
            {patient.patientId}
          </p>
        </div>

        {/* AGE + GENDER */}
        <div className="hidden md:block text-sm text-gray-600 whitespace-nowrap shrink-0">
          {patient.age} yrs • {patient.gender}
        </div>

        {/* BLOOD TYPE */}
        <div className="hidden lg:flex items-center gap-1 text-sm text-gray-600 whitespace-nowrap shrink-0">
          <Droplets className="w-4 h-4 text-red-500" />
          {patient.bloodType}
        </div>

        {/* LAST VISIT */}
        <div className="hidden xl:flex items-center gap-1 text-sm text-gray-600 whitespace-nowrap shrink-0">
          <CalendarDays className="w-4 h-4 text-blue-500" />
          {patient.lastVisit}
        </div>

        {/* ARROW */}
        <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />

      </div>
    </div>
  );
}