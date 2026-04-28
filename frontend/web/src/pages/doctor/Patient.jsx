import { useState } from "react";
import {
  Users,
  Stethoscope,
  History,
  Download,
  Info,
} from "lucide-react";

import SearchBar from "../../components/common/SearchBar";
import FilterButton from "../../components/common/FilterButton";

import PatientListCard from "../../components/doctors/patient/PatientListCard";
import PatientConsultationCard from "../../components/doctors/patient/PatientConsultationCard";

import { patients } from "../../constants/doctors/patientData";

import PatientHistory from "../../components/doctors/patient/PatientHistory";
import PatientInfo from "../../components/doctors/patient/PatientInfo";
import NewConsultationForm from "../../components/doctors/consultation/NewConsultationForm";

import PatientConsultationDetails from "../../components/doctors/patient/PatientConsultationDetails";

export default function Patients({ darkMode }) {
  const [activeTab, setActiveTab] = useState("All");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientTab, setPatientTab] = useState("Consultation");

  const [search, setSearch] = useState("");
  const [consultationSearch, setConsultationSearch] = useState("");

  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [isNewConsultation, setIsNewConsultation] = useState(false);

  /* ===============================
     FILTER PATIENTS
  =============================== */
  const filteredPatients = patients.filter((patient) => {
    const keyword = search?.toLowerCase() || "";

    const name = patient?.name?.toLowerCase() || "";
    const id = patient?.patientId?.toLowerCase() || "";

    const matches = name.includes(keyword) || id.includes(keyword);

    if (activeTab === "Male") return matches && patient?.gender === "Male";
    if (activeTab === "Female") return matches && patient?.gender === "Female";

    return matches;
  });

  /* ===============================
     FILTER CONSULTATIONS
  =============================== */
  const filteredConsultations =
    (selectedPatient?.consultations ?? []).filter((item) => {
      const keyword = consultationSearch.toLowerCase();

      const reason = item?.reason?.toLowerCase() || "";
      const diagnosis = item?.diagnosis?.toLowerCase() || "";
      const doctor = item?.doctor?.toLowerCase() || "";

      return (
        reason.includes(keyword) ||
        diagnosis.includes(keyword) ||
        doctor.includes(keyword)
      );
    });

  /* ===============================
     TAB STYLE (darkMode like Sidebar)
  =============================== */
  const tabClass = (tab) =>
    `px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap
    ${
      activeTab === tab
        ? "bg-blue-600 text-white"
        : darkMode
        ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
    }`;

  const patientTabClass = (tab) =>
    `px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap
    ${
      patientTab === tab
        ? "bg-blue-600 text-white"
        : darkMode
        ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
    }`;

  const consultations = selectedPatient?.consultations || [];

  return (
    <div className="min-h-screen">
      <div className="p-3 sm:p-4 md:p-6">

        {/* MAIN CARD */}
        <div
          className={`rounded-2xl shadow-sm p-3 sm:p-4 md:p-6
          ${darkMode ? "bg-gray-900" : "bg-white"}`}
        >

          {/* HEADER */}
          {!selectedPatient && (
            <>
              <div className="flex flex-col lg:flex-row lg:justify-between gap-4">
                <div>
                  <h1 className="text-lg sm:text-xl font-semibold text-[#3b82f6]">
                    Patients
                  </h1>

                  <p
                    className={`text-xs sm:text-sm mt-1
                    ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Manage your patients and consultation history.
                  </p>
                </div>
              </div>

              <div
                className={`h-[1px] my-6
                ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
              />

              {/* TABS */}
              <div className="flex gap-3 overflow-x-auto pb-1 mb-6">
                {["All", "Male", "Female"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={tabClass(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* TOOLBAR */}
              <div className="flex flex-col xl:flex-row xl:justify-between gap-4">

                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center
                    ${darkMode ? "bg-green-900" : "bg-green-100"}`}
                  >
                    <Users className="w-4 h-4 text-[#27772B]" />
                  </div>

                  <span
                    className={`font-medium
                    ${darkMode ? "text-gray-200" : "text-gray-700"}`}
                  >
                    All Patients
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <SearchBar
                    placeholder="Search patient..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <FilterButton />
                </div>
              </div>

              {/* LIST */}
              <div className="mt-6 space-y-4">
                {filteredPatients.map((patient) => (
                  <PatientListCard
                    key={patient.id}
                    patient={patient}
                    darkMode={darkMode}
                    onClick={() => {
                      setSelectedPatient(patient);
                      setPatientTab("Consultation");
                      setConsultationSearch("");
                      setSelectedConsultation(null);
                    }}
                  />
                ))}
              </div>
            </>
          )}

          {/* PATIENT DETAILS */}
          {selectedPatient && (
            <>
              <button
                onClick={() => {
                  setSelectedPatient(null);
                  setSearch("");
                  setConsultationSearch("");
                  setSelectedConsultation(null);
                  setIsNewConsultation(false);
                }}
                className="text-sm text-blue-600 font-medium mb-5"
              >
                ← Back to patients
              </button>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                <div className="flex items-center gap-3">
                  <img
                    src={selectedPatient?.image}
                    className="w-12 h-12 rounded-xl object-cover"
                  />

                  <div>
                    <h2
                      className={`font-semibold
                      ${darkMode ? "text-white" : ""}`}
                    >
                      {selectedPatient?.name}
                    </h2>

                    <p
                      className={`text-sm
                      ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      {selectedPatient?.patientId}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">

                  <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm">
                    <Download className="w-4 h-4" />
                    Medical File
                  </button>

                  <button
                    onClick={() => setIsNewConsultation(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm"
                  >
                    + New Consultation
                  </button>

                </div>
              </div>

              {/* FORM */}
              {isNewConsultation && (
                <NewConsultationForm
                  selectedPatient={selectedPatient}
                  setIsNewConsultation={setIsNewConsultation}
                />
              )}

              <div
                className={`h-[1px] my-6
                ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
              />

              {/* SUB TABS */}
              <div className="flex flex-col md:flex-row md:justify-between gap-4">

                <div className="flex gap-3 flex-wrap ">
                  <button
                    onClick={() => setPatientTab("Consultation")}
                    className={patientTabClass("Consultation")}
                  >
                    <Stethoscope className="w-4 h-4 inline mr-2" />
                    Consultation
                  </button>

                  <button
                    onClick={() => setPatientTab("Historique")}
                    className={patientTabClass("Historique")}
                  >
                    <History className="w-4 h-4 inline mr-2" />
                    Historique
                  </button>

                  <button
                    onClick={() => setPatientTab("Information")}
                    className={patientTabClass("Information")}
                  >
                    <Info className="w-4 h-4 inline mr-2" />
                    Information
                  </button>
                </div>

                <SearchBar
                  placeholder="Search consultation..."
                  value={consultationSearch}
                  onChange={(e) => setConsultationSearch(e.target.value)}
                />
              </div>

              {/* CONSULTATIONS */}
              {patientTab === "Consultation" && (
                <div className="flex flex-col mt-6 md:flex-row gap-4 items-start">

                  <div className="flex-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">

                      {filteredConsultations.length > 0 ? (
                        filteredConsultations.map((consultation) => (
                          <div
                            key={consultation.id}
                            onClick={() =>
                              setSelectedConsultation({
                                ...consultation,
                                prescriptions: consultation.prescriptions || [],
                                labResults: consultation.labResults || [],
                              })
                            }
                            className="cursor-pointer"
                          >
                            <PatientConsultationCard
                              consultation={consultation}
                              darkMode={darkMode}
                            />
                          </div>
                        ))
                      ) : (
                        <p
                          className={`text-sm col-span-full
                          ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                        >
                          No consultations found.
                        </p>
                      )}

                    </div>
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

              {/* HISTORY */}
              {patientTab === "Historique" && (
                <PatientHistory
                  selectedPatient={selectedPatient}
                  consultations={consultations}
                  darkMode={darkMode}
                />
              )}

              {/* INFO */}
              {patientTab === "Information" && (
                <PatientInfo
                  selectedPatient={selectedPatient}
                  darkMode={darkMode}
                />
              )}

            </>
          )}

        </div>
      </div>
    </div>
  );
}