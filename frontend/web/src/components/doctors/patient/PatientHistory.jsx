export default function PatientHistory({
  selectedPatient,
  consultations = [],
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
    <div className="p-5 border rounded-xl text-gray-700 space-y-6">

      <h3 className="font-semibold text-lg">
        Medical History Summary
      </h3>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">

        <div className="p-3 border rounded-xl">
          <p className="text-gray-500">Total Consultations</p>
          <p className="font-semibold">{totalConsultations}</p>
        </div>

        <div className="p-3 border rounded-xl">
          <p className="text-gray-500">Prescriptions</p>
          <p className="font-semibold">{totalPrescriptions}</p>
        </div>

        <div className="p-3 border rounded-xl">
          <p className="text-gray-500">Lab Results</p>
          <p className="font-semibold">{totalLabResults}</p>
        </div>

        <div className="p-3 border rounded-xl">
          <p className="text-gray-500">Last Visit</p>
          <p className="font-semibold">
            {lastVisit}
          </p>
        </div>

      </div>

      {/* LAST CONSULTATION */}
      {lastConsultation && (
        <div className="p-4 border rounded-xl space-y-2">

          <p className="font-medium">Last Consultation</p>

          <p className="text-sm text-gray-600">
            {lastConsultation?.reason || "N/A"} —{" "}
            {lastConsultation?.diagnosis || "N/A"}
          </p>

          <p className="text-xs text-gray-500">
            Dr {lastConsultation?.doctor || "Unknown"} •{" "}
            {lastConsultation?.date || "N/A"}
          </p>

        </div>
      )}

      {/* TIMELINE */}
      <div className="space-y-3">

        <h4 className="font-semibold text-sm">
          Consultation Timeline
        </h4>

        <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">

          {safeConsultations.length > 0 ? (
            safeConsultations.slice(0, 5).map((c) => (
              <div key={c.id} className="p-3 border rounded-xl text-sm">

                <p className="font-medium">
                  {c?.reason || "No reason"}
                </p>

                <p className="text-gray-600">
                  {c?.diagnosis || "No diagnosis"}
                </p>

                <p className="text-xs text-gray-500">
                  {c?.date || "N/A"} • Dr {c?.doctor || "Unknown"}
                </p>

              </div>
            ))
          ) : (
            <p className="text-sm text-gray-400">
              No consultation history available.
            </p>
          )}

        </div>
      </div>

    </div>
  );
}