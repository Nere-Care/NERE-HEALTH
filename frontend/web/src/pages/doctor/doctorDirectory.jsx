import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Stethoscope } from "lucide-react";

import { get } from "../../services/apiClient";
import { getStoredUser } from "../../services/auth";

import AskOpinionModal from "../../components/doctors/AskOpinionModal";
import DemandeAvisModal from "../../components/doctors/DemandeAvisModal";
import DoctorCard from "../../components/doctors/doctorCard";
import DoctorDetails from "../../components/doctors/DoctorDetails";

export default function DoctorsDirectory({ darkMode }) {
  const navigate = useNavigate();
  const currentUser = getStoredUser();

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showMore, setShowMore] = useState(false);
  const [loading, setLoading] = useState(true);

  const [showOpinionModal, setShowOpinionModal] = useState(false);
  const [selectedOpinionDoctor, setSelectedOpinionDoctor] = useState(null);
  const [showDemandeAvisModal, setShowDemandeAvisModal] = useState(false);

  const [doctors, setDoctors] = useState([]);

  // ================= FETCH DOCTORS FROM API =================
  useEffect(() => {
    setLoading(true);
    get('/api/medecins')
      .then(async (medecinsData) => {
        const enriched = await Promise.all(medecinsData.map(async (m) => {
          let user = null, structure = null, specialiteNom = "", specialiteId = null;
          try {
            user = await get(`/api/users/${m.id}`);
          } catch { /* ignore */ }
          if (m.structure_id) {
            try {
              structure = await get(`/api/structures/${m.structure_id}`);
            } catch { /* ignore */ }
          }
          try {
            const specs = await get(`/api/medecin_specialites?medecin_id=${m.id}`);
            if (specs.length > 0) {
              const s = await get(`/api/specialites/${specs[0].specialite_id}`);
              specialiteNom = s.libelle_fr || "";
              specialiteId = specs[0].specialite_id;
            }
          } catch { /* ignore */ }
          return {
            id: m.id,
            name: user ? `Dr. ${user.prenom || ""} ${user.nom || ""}`.trim() : "Médecin",
            speciality: specialiteNom,
            specialty: specialiteNom,
            specialiteId,
            city: structure?.ville || "",
            hospital: structure?.nom_etablissement || "",
            experience: m.annees_experience || 0,
            rating: parseFloat(m.note_moyenne || 0),
            image: user?.photo_url || "",
            description: m.biographie || "",
            available: m.disponible_maintenant || false,
          };
        }));
        setDoctors(enriched);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // ================= SEARCH STATES =================
  const [doctorName, setDoctorName] = useState("");
  const [city, setCity] = useState("");
  const [hospital, setHospital] = useState("");

  // ================= SPECIALTY FILTER =================
  const [selectedSpecialty, setSelectedSpecialty] =
    useState("All");

  // ================= GET ALL SPECIALTIES =================
  const specialties = [
    "All",
    ...new Set(
      doctors.map((doctor) => doctor.specialty).filter(Boolean)
    ),
  ];

  const openDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setShowMore(false);
  };

const handleAskOpinion = (doctor) => {
  setSelectedOpinionDoctor(doctor);
  setShowOpinionModal(true);
};

const handleSendOpinion = (data) => {
  console.log("Opinion request:", data);
  setShowOpinionModal(false);
  setSelectedOpinionDoctor(null);
};

  // ================= FILTER =================
  const filteredDoctors = doctors.filter((doctor) => {

    const matchName =
      doctor.name
        .toLowerCase()
        .includes(doctorName.toLowerCase());

    const matchCity =
      doctor.city
        .toLowerCase()
        .includes(city.toLowerCase());

    const matchHospital =
      doctor.hospital
        .toLowerCase()
        .includes(hospital.toLowerCase());

    const matchSpecialty =
      selectedSpecialty === "All" ||
      doctor.specialty === selectedSpecialty;

    return (
      matchName &&
      matchCity &&
      matchHospital &&
      matchSpecialty
    );
  });

  return (
    <div
      className={`space-y-4 mt-6 sm:mt-4 sm:space-y-6 p-3 sm:p-5 lg:p-6 transition-colors ${
        darkMode
          ? "bg-gray-900"
          : "bg-gray-50"
      }`}
    >
      <div >

        <div
          className={`  transition-all duration-300 ${
            darkMode
              ? "bg-gray-900 "
              : "bg-gray-50  shadow-sm"
          }`}
        >

          {/* ================= HEADER ================= */}

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#3b82f6]"> 
                Directory of health professionals
              </h1>

              <p
        className={`text-sm sm:text-base mt-1 ${
          darkMode ? "text-gray-400" : "text-gray-500"
        }`}
      >
                Browse and consult healthcare professionals
              </p>
            </div>

            <button
              onClick={() => setShowDemandeAvisModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition whitespace-nowrap"
            >
              <Stethoscope size={18} />
              Demander un avis médical
            </button>

          </div>

          {/* ================= SEARCH BAR SECTION ================= */}

          <div className="mt-8 flex flex-col lg:flex-row gap-4">

            {/* SEARCH NAME */}
            <div
              className={`flex items-center gap-3 flex-1 px-4 py-3 rounded-2xl border ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <Search
                size={18}
                className="text-gray-400"
              />

              <input
                type="text"
                placeholder="Search by doctor name..."
                value={doctorName}
                onChange={(e) =>
                  setDoctorName(e.target.value)
                }
                className={`w-full outline-none bg-transparent text-sm ${
                  darkMode
                    ? "text-white placeholder-gray-500"
                    : "text-gray-700 placeholder-gray-400"
                }`}
              />
            </div>

            {/* SEARCH CITY */}
            <div
              className={`flex items-center gap-3 flex-1 px-4 py-3 rounded-2xl border ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <Search
                size={18}
                className="text-gray-400"
              />

              <input
                type="text"
                placeholder="Search by city..."
                value={city}
                onChange={(e) =>
                  setCity(e.target.value)
                }
                className={`w-full outline-none bg-transparent text-sm ${
                  darkMode
                    ? "text-white placeholder-gray-500"
                    : "text-gray-700 placeholder-gray-400"
                }`}
              />
            </div>

            {/* SEARCH HOSPITAL */}
            <div
              className={`flex items-center gap-3 flex-1 px-4 py-3 rounded-2xl border ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <Search
                size={18}
                className="text-gray-400"
              />

              <input
                type="text"
                placeholder="Search by health center..."
                value={hospital}
                onChange={(e) =>
                  setHospital(e.target.value)
                }
                className={`w-full outline-none bg-transparent text-sm ${
                  darkMode
                    ? "text-white placeholder-gray-500"
                    : "text-gray-700 placeholder-gray-400"
                }`}
              />
            </div>

            {/* SEARCH BUTTON */}
            <button
              className="
                px-6 py-3
                rounded-2xl
                bg-blue-600
                hover:bg-blue-700
                text-white
                font-medium
                transition-all duration-300
                whitespace-nowrap
              "
            >
              Search
            </button>

          </div>

          {/* ================= SPECIALTY FILTERS ================= */}

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">

            {specialties.map((specialty) => (

              <button
                key={specialty}
                onClick={() =>
                  setSelectedSpecialty(specialty)
                }
                className={`
                  w-full
                  px-4 py-3
                  rounded-2xl
                  text-sm font-medium
                  transition-all duration-300
                  truncate
                  ${
                    selectedSpecialty === specialty
                      ? "bg-blue-600 text-white shadow-lg"
                      : darkMode
                      ? "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                  }
                `}
              >
                {specialty}
              </button>

            ))}

          </div>

          {/* ================= DIVIDER ================= */}

          <div
            className={`h-[1px] my-6 ${
              darkMode
                ? "bg-gray-800"
                : "bg-gray-200"
            }`}
          />

          {/* ================= RESULTS ================= */}

          <div className="flex items-center justify-between mb-6">

            <p
              className={`text-sm ${
                darkMode
                  ? "text-gray-400"
                  : "text-gray-500"
              }`}
            >
              {filteredDoctors.length} doctors found
            </p>

          </div>

          {/* ================= LOADING ================= */}

          {loading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          )}

          {/* ================= MOBILE + TABLET ================= */}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-6">

            {!loading && filteredDoctors.map((doctor) => (

              <div
                key={doctor.id}
                onClick={() => openDoctor(doctor)}
                className="cursor-pointer"
              >
                <DoctorCard
  doctor={doctor}
  darkMode={darkMode}
  onAskOpinion={handleAskOpinion}
  currentUserId={currentUser?.id}
/>
              </div>

            ))}

          </div>

          {/* ================= DESKTOP ================= */}

          <div className="hidden lg:flex gap-6 items-start">

            {/* ================= LIST ================= */}

            <div
              className={`grid gap-6 transition-all duration-300 ${
                selectedDoctor
                  ? "w-[65%] grid-cols-2 xl:grid-cols-3"
                  : "w-full grid-cols-3 xl:grid-cols-4"
              }`}
            >

              {!loading && filteredDoctors.map((doctor) => (

                <div
                  key={doctor.id}
                  onClick={() => openDoctor(doctor)}
                  className="cursor-pointer hover:scale-[1.02] transition duration-300"
                >
                  <DoctorCard
                    doctor={doctor}
                    darkMode={darkMode}
                    onAskOpinion={handleAskOpinion}
                    currentUserId={currentUser?.id}
                  />
                </div>

              ))}

            </div>

            {/* ================= DETAILS PANEL ================= */}

            {selectedDoctor && (

              <div
                className={`w-[35%] sticky top-6 self-start rounded-3xl border overflow-hidden transition-all duration-300 ${
                  darkMode
                    ? "bg-gray-900 border-gray-800"
                    : "bg-white border-gray-200 shadow-sm"
                }`}
              >

                <DoctorDetails
                  doctor={selectedDoctor}
                  onClose={() =>
                    setSelectedDoctor(null)
                  }
                  showMore={showMore}
                  setShowMore={setShowMore}
                  darkMode={darkMode}
                  currentUserId={currentUser?.id}
                />

              </div>

            )}

          </div>

        </div>
      </div>

      {/* ================= MOBILE DRAWER ================= */}

      {selectedDoctor && (

        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex lg:hidden items-end z-50">

          <div
            className={`w-full rounded-t-[30px] p-5 relative max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300 ${
              darkMode
                ? "bg-gray-900"
                : "bg-white"
            }`}
          >

            <DoctorDetails
              doctor={selectedDoctor}
              onClose={() =>
                setSelectedDoctor(null)
              }
              showMore={showMore}
              setShowMore={setShowMore}
              darkMode={darkMode}
            />

          </div>

        </div>

      )}

{showOpinionModal && selectedOpinionDoctor && (
  <AskOpinionModal
    darkMode={darkMode}
    doctor={selectedOpinionDoctor}
    onClose={() => {
      setShowOpinionModal(false);
      setSelectedOpinionDoctor(null);
    }}
  />
)}

{showDemandeAvisModal && (
  <DemandeAvisModal
    darkMode={darkMode}
    onClose={() => setShowDemandeAvisModal(false)}
  />
)}

    </div>
  );
}