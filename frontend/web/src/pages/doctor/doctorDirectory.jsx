import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { fetchAnnuaire, sendOpinionRequest } from "../../services/medecinService";
import AskOpinionModal from "../../components/doctors/AskOpinionModal";
import DoctorCard from "../../components/doctors/doctorCard";
import DoctorDetails from "../../components/doctors/DoctorDetails";

export default function DoctorsDirectory({ darkMode }) {
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showMore, setShowMore] = useState(false);
  const [showOpinionModal, setShowOpinionModal] = useState(false);
  const [selectedOpinionDoctor, setSelectedOpinionDoctor] = useState(null);

  // Search states
  const [doctorName, setDoctorName] = useState("");
  const [city, setCity] = useState("");
  const [hospital, setHospital] = useState("");

  // Specialty filter
  const [selectedSpecialty, setSelectedSpecialty] = useState("All");

  // Data states
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les médecins depuis le backend
  useEffect(() => {
    const chargerMedecins = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Construire les paramètres de recherche
        const searchParams = {
          search: doctorName || city || hospital, // Combinaison des filtres
          specialite: selectedSpecialty === "All" ? "" : selectedSpecialty,
        };

        const data = await fetchAnnuaire(searchParams);
        
        // Mapper les champs du backend (français) vers le frontend (anglais)
       const mappedDoctors = data.map((doc) => ({
  id: doc.id,
  nom: doc.nom,
  name: doc.nom,
  specialty: doc.specialite,
  specialite: doc.specialite,
  ville: doc.lieu_exercice,
  city: doc.lieu_exercice,
  hospital: doc.lieu_exercice,
  structure_nom: doc.lieu_exercice,
  note_moyenne: doc.note,
  rating: doc.note,
  annees_experience: parseInt(doc.experience) || 0,
  experience: doc.experience,
  photo_url: doc.photo_url || null,   // ← ajouter cette ligne
  image_url: doc.photo_url || null, 
  biographie: doc.biographie,
  description: doc.biographie || "",
  disponible: doc.disponible,
  tarif: doc.tarif,
  devise: doc.devise,
  teleconsultation: doc.teleconsultation,
  _original: doc,
}));

        setDoctors(mappedDoctors);
      } catch (err) {
        console.error("Erreur chargement médecins:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    chargerMedecins();
  }, [doctorName, city, hospital, selectedSpecialty]);

  // Extraire les spécialités uniques
  const specialties = [
    "All",
    ...new Set(doctors.map((doctor) => doctor.specialty).filter(Boolean)),
  ];

  const openDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setShowMore(false);
  };

  const handleAskOpinion = (doctor) => {
    setSelectedOpinionDoctor(doctor);
    setShowOpinionModal(true);
  };

 const handleSendOpinion = async (data) => {
  try {
    const medecinId = selectedOpinionDoctor._original?.id || selectedOpinionDoctor.id;
    await sendOpinionRequest({
      medecin_id: medecinId,
      motif: data.motif,
      urgence: data.urgence,
      contexte: data.contexte,
      question: data.question,
      examens: data.examens || "",
    });
    setShowOpinionModal(false);
    setSelectedOpinionDoctor(null);
  } catch (err) {
    console.error("Erreur envoi demande:", err);
  }
};

  // Filtrer les médecins côté frontend (complément au filtre backend)
  const filteredDoctors = doctors.filter((doctor) => {
    const matchName = doctor.name
      .toLowerCase()
      .includes(doctorName.toLowerCase());

    const matchCity = doctor.city
      ?.toLowerCase()
      .includes(city.toLowerCase());

    const matchHospital = doctor.hospital
      ?.toLowerCase()
      .includes(hospital.toLowerCase());

    const matchSpecialty =
      selectedSpecialty === "All" || doctor.specialty === selectedSpecialty;

    return matchName && matchCity && matchHospital && matchSpecialty;
  });

  return (
    <div
      className={`space-y-4 mt-6 sm:mt-4 sm:space-y-6 p-3 sm:p-5 lg:p-6 transition-colors ${
        darkMode ? "bg-gray-900" : "bg-gray-50"
      }`}
    >
      <div>
        <div
          className={`transition-all duration-300 ${
            darkMode ? "bg-gray-900" : "bg-gray-50 shadow-sm"
          }`}
        >
          {/* HEADER */}
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
          </div>

          {/* SEARCH BAR SECTION */}
          <div className="mt-8 flex flex-col lg:flex-row gap-4">
            {/* SEARCH NAME */}
            <div
              className={`flex items-center gap-3 flex-1 px-4 py-3 rounded-2xl border ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <Search size={18} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search by doctor name..."
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
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
              <Search size={18} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search by city..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
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
              <Search size={18} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search by health center..."
                value={hospital}
                onChange={(e) => setHospital(e.target.value)}
                className={`w-full outline-none bg-transparent text-sm ${
                  darkMode
                    ? "text-white placeholder-gray-500"
                    : "text-gray-700 placeholder-gray-400"
                }`}
              />
            </div>
          </div>

          {/* SPECIALTY FILTERS */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
            {specialties.map((specialty) => (
              <button
                key={specialty}
                onClick={() => setSelectedSpecialty(specialty)}
                className={`w-full px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300 truncate ${
                  selectedSpecialty === specialty
                    ? "bg-blue-600 text-white shadow-lg"
                    : darkMode
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                }`}
              >
                {specialty}
              </button>
            ))}
          </div>

          {/* DIVIDER */}
          <div
            className={`h-[1px] my-6 ${
              darkMode ? "bg-gray-800" : "bg-gray-200"
            }`}
          />

          {/* RESULTS */}
          <div className="flex items-center justify-between mb-6">
            <p
              className={`text-sm ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {loading
                ? "Loading..."
                : error
                ? "Error loading doctors"
                : `${filteredDoctors.length} doctors found`}
            </p>
          </div>

          {/* LOADING STATE */}
          {loading && (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* ERROR STATE */}
          {error && !loading && (
            <div className={`text-center py-12 ${darkMode ? "text-red-400" : "text-red-500"}`}>
              <p className="font-semibold">Error loading doctors</p>
              <p className="text-sm mt-2">{error}</p>
            </div>
          )}

          {/* DOCTORS LIST */}
          {!loading && !error && (
            <>
              {/* MOBILE + TABLET */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-6">
                {filteredDoctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    onClick={() => openDoctor(doctor)}
                    className="cursor-pointer"
                  >
                    <DoctorCard
                      doctor={doctor}
                      darkMode={darkMode}
                      onAskOpinion={handleAskOpinion}
                    />
                  </div>
                ))}
              </div>

              {/* DESKTOP */}
              <div className="hidden lg:flex gap-6 items-start">
                {/* LIST */}
                <div
                  className={`grid gap-6 transition-all duration-300 ${
                    selectedDoctor
                      ? "w-[65%] grid-cols-2 xl:grid-cols-3"
                      : "w-full grid-cols-3 xl:grid-cols-4"
                  }`}
                >
                  {filteredDoctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      onClick={() => openDoctor(doctor)}
                      className="cursor-pointer hover:scale-[1.02] transition duration-300"
                    >
                      <DoctorCard
                        doctor={doctor}
                        darkMode={darkMode}
                        onAskOpinion={handleAskOpinion}
                      />
                    </div>
                  ))}
                </div>

                {/* DETAILS PANEL */}
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
                      onClose={() => setSelectedDoctor(null)}
                      showMore={showMore}
                      setShowMore={setShowMore}
                      darkMode={darkMode}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {selectedDoctor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex lg:hidden items-end z-50">
          <div
            className={`w-full rounded-t-[30px] p-5 relative max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300 ${
              darkMode ? "bg-gray-900" : "bg-white"
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

      {showOpinionModal && selectedOpinionDoctor && (
        <AskOpinionModal
          darkMode={darkMode}
          doctor={selectedOpinionDoctor}
          onClose={() => {
            setShowOpinionModal(false);
            setSelectedOpinionDoctor(null);
          }}
          onSend={handleSendOpinion}
        />
      )}
    </div>
  );
}