export default function PatientInfo({ selectedPatient, darkMode }) {
  if (!selectedPatient) return null;

  const consultations = Array.isArray(selectedPatient?.consultations)
    ? selectedPatient.consultations
    : [];

  const totalConsultations = consultations.length;

  const totalPrescriptions = consultations.reduce(
    (acc, c) => acc + (Array.isArray(c?.prescriptions) ? c.prescriptions.length : 0),
    0
  );

  const totalLabResults = consultations.reduce(
    (acc, c) => acc + (Array.isArray(c?.labResults) ? c.labResults.length : 0),
    0
  );

  const lastVisit = selectedPatient?.lastVisit || "No data available";

  return (
    <div
      className={`p-5 border mt-6 rounded-xl text-sm space-y-6 transition
      ${
        darkMode
          ? "bg-gray-900 text-gray-200 border-gray-700"
          : "bg-white text-gray-700 border-gray-200"
      }`}
    >
      <h3
        className={`font-semibold text-lg ${
          darkMode ? "text-white" : "text-gray-900"
        }`}
      >
        Patient Information
      </h3>

      {/* MAIN INFO GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        <p>
          <span className={darkMode ? "text-gray-400" : "text-gray-500"}>
            ID:
          </span>{" "}
          {selectedPatient?.patientId || "N/A"}
        </p>

        <p>
          <span className={darkMode ? "text-gray-400" : "text-gray-500"}>
            Age:
          </span>{" "}
          {selectedPatient?.age ?? "N/A"}
        </p>

        <p>
          <span className={darkMode ? "text-gray-400" : "text-gray-500"}>
            Gender:
          </span>{" "}
          {selectedPatient?.gender || "N/A"}
        </p>

        <p>
          <span className={darkMode ? "text-gray-400" : "text-gray-500"}>
            Blood Type:
          </span>{" "}
          {selectedPatient?.bloodType || "N/A"}
        </p>

        <p>
          <span className={darkMode ? "text-gray-400" : "text-gray-500"}>
            Risk Level:
          </span>{" "}
          {selectedPatient?.age > 50
            ? "High"
            : selectedPatient?.age > 35
            ? "Medium"
            : "Low"}
        </p>

        <p>
          <span className={darkMode ? "text-gray-400" : "text-gray-500"}>
            Status:
          </span>{" "}
          Active Patient
        </p>

      </div>

      {/* MEDICAL SUMMARY */}
      <div
        className={`p-4 border rounded-xl space-y-2 transition ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <p className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
          Medical Summary
        </p>

        <p className={darkMode ? "text-gray-300" : "text-gray-600"}>
          This patient has a total of{" "}
          <span className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
            {totalConsultations}
          </span>{" "}
          consultations recorded in the system.
        </p>

        <p className={darkMode ? "text-gray-300" : "text-gray-600"}>
          Prescriptions issued:{" "}
          <span className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
            {totalPrescriptions}
          </span>
        </p>

        <p className={darkMode ? "text-gray-300" : "text-gray-600"}>
          Lab tests performed:{" "}
          <span className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
            {totalLabResults}
          </span>
        </p>

      </div>

      {/* LAST VISIT */}
      <div
        className={`p-4 border rounded-xl transition ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <p className={darkMode ? "text-gray-400 text-xs" : "text-gray-500 text-xs"}>
          Last Visit
        </p>
        <p className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
          {lastVisit}
        </p>
      </div>

      {/* QUICK INSIGHT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        <div
          className={`p-3 border rounded-xl transition ${
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`}
        >
          <p className={darkMode ? "text-gray-400 text-xs" : "text-gray-500 text-xs"}>
            Consultation Load
          </p>
          <p className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
            {totalConsultations > 3 ? "Frequent" : "Normal"}
          </p>
        </div>

        <div
          className={`p-3 border rounded-xl transition ${
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`}
        >
          <p className={darkMode ? "text-gray-400 text-xs" : "text-gray-500 text-xs"}>
            Monitoring Level
          </p>
          <p className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
            {totalLabResults > 2 ? "High" : "Standard"}
          </p>
        </div>

      </div>

    </div>
  );
}