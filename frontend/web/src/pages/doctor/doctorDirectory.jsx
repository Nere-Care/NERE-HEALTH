import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";


import SearchBar from "../../components/common/SearchBar";
import FilterButton from "../../components/common/FilterButton";

import { doctors } from "../../constants/doctors/doctorData";
import DoctorCard from "../../components/doctors/doctorCard";
import DoctorDetails from "../../components/doctors/DoctorDetails";

export default function DoctorsDirectory() {
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showMore, setShowMore] = useState(false);

  const openDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setShowMore(false);
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8] p-4 md:p-8">

      <div className="ml-0 md:ml-[260px] pt-0 md:pt-[90px]">

        <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6">

          {/* HEADER */}
          <div className="flex flex-col md:flex-row md:justify-between gap-4">

  <h1 className="text-lg md:text-xl font-semibold text-[#2C3850]">
    Directory of health professionals
  </h1>

  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">

    <SearchBar
      placeholder="Search doctor..."
    />

    <FilterButton />

  </div>

</div>

          <div className="h-[1px] bg-gray-200 my-6"></div>

          {/* MOBILE + TABLET */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-6">

            {doctors.map((doctor) => (
              <div
                key={doctor.id}
                onClick={() => openDoctor(doctor)}
                className="cursor-pointer"
              >
                <DoctorCard doctor={doctor} />
              </div>
            ))}

          </div>

          {/* DESKTOP */}
          <div className="hidden lg:flex gap-6">

            {/* LIST */}
            <div
              className={`grid grid-cols-2 xl:grid-cols-3 gap-6 transition-all duration-300 ${
                selectedDoctor ? "w-2/3" : "w-full"
              }`}
            >
              {doctors.map((doctor) => (
                <div
                  key={doctor.id}
                  onClick={() => openDoctor(doctor)}
                  className="cursor-pointer hover:scale-[1.02] transition"
                >
                  <DoctorCard doctor={doctor} />
                </div>
              ))}
            </div>

            {/* DETAILS */}
            {selectedDoctor && (
              <div className="w-1/3 border-l pl-6">
                <DoctorDetails
                  doctor={selectedDoctor}
                  onClose={() => setSelectedDoctor(null)}
                  showMore={showMore}
                  setShowMore={setShowMore}
                />
              </div>
            )}

          </div>

        </div>
      </div>

      {/* MOBILE DRAWER */}
      {selectedDoctor && (
        <div className="fixed inset-0 bg-black/40 flex lg:hidden items-end z-50">

          <div className="bg-white w-full rounded-t-2xl p-5 relative max-h-[90vh] overflow-y-auto">

            <DoctorDetails
              doctor={selectedDoctor}
              onClose={() => setSelectedDoctor(null)}
              showMore={showMore}
              setShowMore={setShowMore}
            />

          </div>

        </div>
      )}

    </div>
  );
}