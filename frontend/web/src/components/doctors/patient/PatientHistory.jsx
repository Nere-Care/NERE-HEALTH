export default function PatientHistory({
  selectedPatient,
  consultations = [],
  darkMode,
}) {
  const safeConsultations = Array.isArray(consultations)
    ? consultations
    : [];

  const totalConsultations = safeConsultations.length;

  const totalPrescriptions = safeConsultations.reduce(
    (acc, c) =>
      acc + (Array.isArray(c?.prescriptions) ? c.prescriptions.length : 0),
    0
  );

  const totalLabResults = safeConsultations.reduce(
    (acc, c) =>
      acc + (Array.isArray(c?.labResults) ? c.labResults.length : 0),
    0
  );

  const lastConsultation =
    safeConsultations.length > 0 ? safeConsultations[0] : null;

  const lastVisit = selectedPatient?.lastVisit || "No data available";

  return (
    <div
      className={`p-5 border rounded-xl mt-6 space-y-6 text-sm transition
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
        Medical History Summary
      </h3>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">

        <div
          className={`p-3 border rounded-xl transition ${
            darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
          }`}
        >
          <p className={darkMode ? "text-gray-400" : "text-gray-500"}>
            Total Consultations
          </p>
          <p className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
            {totalConsultations}
          </p>
        </div>

        <div
          className={`p-3 border rounded-xl transition ${
            darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
          }`}
        >
          <p className={darkMode ? "text-gray-400" : "text-gray-500"}>
            Prescriptions
          </p>
          <p className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
            {totalPrescriptions}
          </p>
        </div>

        <div
          className={`p-3 border rounded-xl transition ${
            darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
          }`}
        >
          <p className={darkMode ? "text-gray-400" : "text-gray-500"}>
            Lab Results
          </p>
          <p className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
            {totalLabResults}
          </p>
        </div>

        <div
          className={`p-3 border rounded-xl transition ${
            darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
          }`}
        >
          <p className={darkMode ? "text-gray-400" : "text-gray-500"}>
            Last Visit
          </p>
          <p className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
            {lastVisit}
          </p>
        </div>

      </div>

      {/* LAST CONSULTATION */}
      {lastConsultation && (
        <div
          className={`p-4 border rounded-xl space-y-2 transition ${
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`}
        >
          <p className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
            Last Consultation
          </p>

          <p className={darkMode ? "text-gray-300 text-sm" : "text-gray-600 text-sm"}>
            {lastConsultation?.reason || "N/A"} —{" "}
            {lastConsultation?.diagnosis || "N/A"}
          </p>

          <p className={darkMode ? "text-gray-400 text-xs" : "text-gray-500 text-xs"}>
            Dr {lastConsultation?.doctor || "Unknown"} •{" "}
            {lastConsultation?.date || "N/A"}
          </p>
        </div>
      )}

      {/* TIMELINE */}
      <div className="space-y-3">

        <h4 className={`font-semibold text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>
          Consultation Timeline
        </h4>

        <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">

          {safeConsultations.length > 0 ? (
            safeConsultations.slice(0, 5).map((c) => (
              <div
                key={c.id}
                className={`p-3 border rounded-xl text-sm transition ${
                  darkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }`}
              >
                <p className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                  {c?.reason || "No reason"}
                </p>

                <p className={darkMode ? "text-gray-300" : "text-gray-600"}>
                  {c?.diagnosis || "No diagnosis"}
                </p>

                <p className={darkMode ? "text-gray-400 text-xs" : "text-gray-500 text-xs"}>
                  {c?.date || "N/A"} • Dr {c?.doctor || "Unknown"}
                </p>
              </div>
            ))
          ) : (
            <p className={darkMode ? "text-gray-400" : "text-gray-500"}>
              No consultation history available.
            </p>
          )}

        </div>
      </div>

    </div>
  );
}