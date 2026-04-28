// ================================
// DoctorsDirectory.jsx
// ================================
import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

import SearchBar from "../../components/common/SearchBar";
import FilterButton from "../../components/common/FilterButton";

import { doctors } from "../../constants/doctors/doctorData";
import DoctorCard from "../../components/doctors/doctorCard";
import DoctorDetails from "../../components/doctors/DoctorDetails";

export default function DoctorsDirectory({ darkMode }) {
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showMore, setShowMore] = useState(false);
  const [search, setSearch] = useState("");

  const openDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setShowMore(false);
  };

  const filteredDoctors = doctors.filter(
    (doctor) =>
      doctor.name.toLowerCase().includes(search.toLowerCase()) ||
      doctor.specialty.toLowerCase().includes(search.toLowerCase()) ||
      doctor.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-white"}`}>
      <div className="p-3 sm:p-4 md:p-6">
        <div
          className={`rounded-2xl shadow-sm p-4 md:p-6 ${
            darkMode ? "bg-gray-900" : "bg-white"
          }`}
        >
          {/* HEADER */}
          <div className="flex flex-col md:flex-row md:justify-between gap-4">
            <h1 className="text-lg md:text-xl font-semibold text-[#3b82f6]">
              Directory of health professionals
            </h1>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <SearchBar
                placeholder="Search doctor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <FilterButton />
            </div>
          </div>

          <div className="h-[1px] bg-gray-200 my-6"></div>

          {/* MOBILE + TABLET */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-6">
            {filteredDoctors.map((doctor) => (
              <div
                key={doctor.id}
                onClick={() => openDoctor(doctor)}
                className="cursor-pointer"
              >
                <DoctorCard doctor={doctor} darkMode={darkMode} />
              </div>
            ))}
          </div>

          {/* DESKTOP */}
          <div className="hidden lg:flex gap-6">
            {/* LIST */}
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 transition-all duration-300 ${
                selectedDoctor ? "w-2/3" : "w-full"
              }`}
            >
              {filteredDoctors.map((doctor) => (
                <div
                  key={doctor.id}
                  onClick={() => openDoctor(doctor)}
                  className="cursor-pointer hover:scale-[1.02] transition"
                >
                  <DoctorCard doctor={doctor} darkMode={darkMode} />
                </div>
              ))}
            </div>

            {/* DETAILS */}
            {selectedDoctor && (
              <div
                className={`w-1/3 border-l pl-6 ${
                  darkMode ? "border-gray-700" : ""
                }`}
              >
                <DoctorDetails
                  doctor={selectedDoctor}
                  onClose={() => setSelectedDoctor(null)}
                  showMore={showMore}
                  setShowMore={setShowMore}
                  darkMode={darkMode}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {selectedDoctor && (
        <div className="fixed inset-0 bg-black/40 flex lg:hidden items-end z-50">
          <div
            className={`w-full rounded-t-2xl p-5 relative max-h-[90vh] overflow-y-auto ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <DoctorDetails
              doctor={selectedDoctor}
              onClose={() => setSelectedDoctor(null)}
              showMore={showMore}
              setShowMore={setShowMore}
              darkMode={darkMode}
            />
          </div>
        </div>
      )}
    </div>
  );
}