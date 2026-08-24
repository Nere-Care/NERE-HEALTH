import { useState, useEffect, useCallback } from "react";
import { Users, Stethoscope, History, Download, Info, AlertCircle, Lock } from "lucide-react";
import SearchBar from "../../components/common/SearchBar";
import FilterButton from "../../components/common/FilterButton";
import PatientListCard from "../../components/doctors/patient/PatientListCard";
import PatientConsultationCard from "../../components/doctors/patient/PatientConsultationCard";
import PatientHistory from "../../components/doctors/patient/PatientHistory";
import PatientInfo from "../../components/doctors/patient/PatientInfo";
import NewConsultationForm from "../../components/doctors/consultation/NewConsultationForm";
import PatientConsultationDetails from "../../components/doctors/patient/PatientConsultationDetails";
import {
  fetchMesPatients,
  fetchPatientConsultations,
  telechargerDossierPatient,
} from "../../services/patientService";

import PasswordConfirmModal from "../../components/common/PasswordConfirmModal";

export default function Patients({ darkMode }) {
  const [activeTab, setActiveTab] = useState("All");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientTab, setPatientTab] = useState("Consultation");
  const [search, setSearch] = useState("");
  const [consultationSearch, setConsultationSearch] = useState("");
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [isNewConsultation, setIsNewConsultation] = useState(false);

  const [patients, setPatients] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingConsultations, setLoadingConsultations] = useState(false);
  const [erreur, setErreur] = useState(null);

  const [telechargement, setTelechargement] = useState(false);

  // --- États pour le verrouillage par mot de passe ---
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(true);


  const chargerPatients = useCallback(async () => {
    try {
      setLoading(true);
      setErreur(null);
      const data = await fetchMesPatients(search);
      setPatients(data ?? []);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (!isUnlocked) return;
    const delay = setTimeout(chargerPatients, 300);
    return () => clearTimeout(delay);
  }, [chargerPatients, isUnlocked]);


// Handler de succès du mot de passe
  const handlePasswordSuccess = () => {
    setShowPasswordModal(false);
    setIsUnlocked(true);
  };

  const ouvrirPatient = async (patient) => {
    setSelectedPatient(patient);
    setPatientTab("Consultation");
    setConsultationSearch("");
    setSelectedConsultation(null);
    setIsNewConsultation(false);

    try {
      setLoadingConsultations(true);
      const data = await fetchPatientConsultations(patient.id);
      setConsultations(data ?? []);
    } catch (err) {
      setConsultations([]);
    } finally {
      setLoadingConsultations(false);
    }
  };

  const handleTelecharger = async () => {
  try {
    setTelechargement(true);
    await telechargerDossierPatient(selectedPatient.id);
  } catch (err) {
    setErreur(err.message);
  } finally {
    setTelechargement(false);
  }
};

  const filteredPatients = patients.filter((p) => {
    if (activeTab === "Male") return p.sexe === "M";
    if (activeTab === "Female") return p.sexe === "F";
    return true;
  });

  const filteredConsultations = consultations.filter((c) => {
    const kw = consultationSearch.toLowerCase();
    return (
      c.motif?.toLowerCase().includes(kw) ||
      c.diagnostic?.toLowerCase().includes(kw)
    );
  });

  const tabClass = (tab) =>
    `px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
      activeTab === tab
        ? "bg-blue-600 text-white"
        : darkMode
        ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
    }`;

  const patientTabClass = (tab) =>
    `px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
      patientTab === tab
        ? "bg-blue-600 text-white"
        : darkMode
        ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
    }`;



    // -------------------------------------------------------------
  // ÉCRAN DE VERROUILLAGE (Si non déverrouillé)
  // -------------------------------------------------------------
  if (!isUnlocked) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className={`p-8 rounded-3xl shadow-xl border text-center max-w-sm w-full mb-6 ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-100 text-gray-800"}`}>
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
            <Lock size={32} />
          </div>
          <h2 className="text-xl font-bold mb-2">
            Accès aux Patients Protégé
          </h2>
          <p className={`text-xs mb-6 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Veuillez confirmer votre mot de passe pour accéder au dossier des patients.
          </p>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition shadow-lg shadow-blue-500/20"
          >
            Saisir le mot de passe
          </button>
        </div>

        <PasswordConfirmModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          onSuccess={handlePasswordSuccess}
          title="Accès sécurisé aux patients"
          description="Veuillez saisir votre mot de passe pour afficher les données des patients."
          darkMode={darkMode}
        />
      </div>
    );
  }

 

  return (
    <div className={`min-h-screen mt-6 sm:mt-4 p-3 sm:p-4 md:p-6 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>

      {!selectedPatient ? (
        <>
          <div className="flex flex-col lg:flex-row lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-blue-500">Patients</h1>
              <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Vos patients et leur historique de consultations.
              </p>
            </div>
          </div>

          {erreur && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm mb-4
              ${darkMode ? "bg-red-900/30 text-red-300" : "bg-red-50 text-red-600"}`}>
              <AlertCircle size={16} /> {erreur}
            </div>
          )}

          <div className={`h-px my-4 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />

          <div className="flex gap-3 overflow-x-auto pb-1 mb-6">
            {["All", "Male", "Female"].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={tabClass(tab)}>
                {tab}
              </button>
            ))}
          </div>

          <div className="flex flex-col xl:flex-row xl:justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${darkMode ? "bg-green-900" : "bg-green-100"}`}>
                <Users className="w-4 h-4 text-green-700" />
              </div>
              <span className={`font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                {filteredPatients.length} patient{filteredPatients.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
              <SearchBar
                placeholder="Rechercher un patient..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <FilterButton />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className={`text-center py-16 rounded-2xl border-2 border-dashed ${darkMode ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-500"}`}>
              <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="font-semibold">Aucun patient trouve</p>
              <p className="text-sm mt-1">Les patients avec qui vous avez eu des RDV apparaitront ici.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPatients.map((patient) => (
                <PatientListCard
                  key={patient.id}
                  patient={patient}
                  darkMode={darkMode}
                  onClick={() => ouvrirPatient(patient)}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <button
            onClick={() => { setSelectedPatient(null); setConsultations([]); }}
            className="text-sm text-blue-600 font-medium mb-5"
          >
            Retour aux patients
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold
                ${darkMode ? "bg-blue-900 text-blue-300" : "bg-blue-100 text-blue-600"}`}>
                {selectedPatient.initiales}
              </div>
              <div>
                <h2 className={`font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>
                  {selectedPatient.nom}
                </h2>
                <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {selectedPatient.numero_patient}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={() => setIsNewConsultation(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-700 transition"
              >
                + Nouvelle consultation
              </button>
              <button
  onClick={handleTelecharger}
  disabled={telechargement}
  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition disabled:opacity-50
    ${darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
>
  <Download size={16} />
  {telechargement ? "Génération..." : "Télécharger le dossier"}
</button>
            </div>
          </div>

          {isNewConsultation && (
            <NewConsultationForm
              selectedPatient={selectedPatient}
              setIsNewConsultation={setIsNewConsultation}
              onSuccess={() => {
                setIsNewConsultation(false);
                fetchPatientConsultations(selectedPatient.id).then(setConsultations);
              }}
              darkMode={darkMode}
            />
          )}

          <div className={`h-px my-4 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />

          <div className="flex flex-col md:flex-row md:justify-between gap-4 mb-6">
            <div className="flex gap-3 flex-wrap">
              <button onClick={() => setPatientTab("Consultation")} className={patientTabClass("Consultation")}>
                <Stethoscope className="w-4 h-4 inline mr-2" />
                Consultations
              </button>
              <button onClick={() => setPatientTab("Historique")} className={patientTabClass("Historique")}>
                <History className="w-4 h-4 inline mr-2" />
                Historique
              </button>
              <button onClick={() => setPatientTab("Information")} className={patientTabClass("Information")}>
                <Info className="w-4 h-4 inline mr-2" />
                Informations
              </button>
            </div>
            {patientTab === "Consultation" && (
              <SearchBar
                placeholder="Rechercher une consultation..."
                value={consultationSearch}
                onChange={(e) => setConsultationSearch(e.target.value)}
              />
            )}
          </div>

          {patientTab === "Consultation" && (
            <div className="flex flex-col mt-2 md:flex-row gap-4 items-start">
              <div className="flex-1">
                {loadingConsultations ? (
                  <div className="flex justify-center py-10">
                    <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : filteredConsultations.length === 0 ? (
                  <div className={`text-center py-12 rounded-xl border-2 border-dashed ${darkMode ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-500"}`}>
                    <Stethoscope className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Aucune consultation trouvee</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredConsultations.map((consultation) => (
                      <div
                        key={consultation.id}
                        onClick={() => setSelectedConsultation(consultation)}
                        className="cursor-pointer"
                      >
                        <PatientConsultationCard consultation={consultation} darkMode={darkMode} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedConsultation && (
                <div className="w-full md:w-[380px]">
                  <PatientConsultationDetails
                    consultation={selectedConsultation}
                    onClose={() => setSelectedConsultation(null)}
                    darkMode={darkMode}
                  />
                </div>
              )}
            </div>
          )}

          {patientTab === "Historique" && (
            <PatientHistory
              selectedPatient={selectedPatient}
              consultations={consultations}
              darkMode={darkMode}
            />
          )}

          {patientTab === "Information" && (
            <PatientInfo selectedPatient={selectedPatient} darkMode={darkMode} />
          )}
        </>
      )}
    </div>
  );
}