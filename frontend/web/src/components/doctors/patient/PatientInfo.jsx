export default function PatientInfo({ selectedPatient }) {
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
    <div className="p-5 border rounded-xl text-sm text-gray-700 space-y-6">

      <h3 className="font-semibold text-lg">
        Patient Information
      </h3>

      {/* MAIN INFO GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        <p>
          <span className="text-gray-500">ID:</span>{" "}
          {selectedPatient?.patientId || "N/A"}
        </p>

        <p>
          <span className="text-gray-500">Age:</span>{" "}
          {selectedPatient?.age ?? "N/A"}
        </p>

        <p>
          <span className="text-gray-500">Gender:</span>{" "}
          {selectedPatient?.gender || "N/A"}
        </p>

        <p>
          <span className="text-gray-500">Blood Type:</span>{" "}
          {selectedPatient?.bloodType || "N/A"}
        </p>

        <p>
          <span className="text-gray-500">Risk Level:</span>{" "}
          {selectedPatient?.age > 50
            ? "High"
            : selectedPatient?.age > 35
            ? "Medium"
            : "Low"}
        </p>

        <p>
          <span className="text-gray-500">Status:</span>{" "}
          Active Patient
        </p>

      </div>

      {/* MEDICAL SUMMARY */}
      <div className="p-4 border rounded-xl space-y-2">

        <p className="font-medium">Medical Summary</p>

        <p className="text-gray-600">
          This patient has a total of{" "}
          <span className="font-semibold">{totalConsultations}</span>{" "}
          consultations recorded in the system.
        </p>

        <p className="text-gray-600">
          Prescriptions issued:{" "}
          <span className="font-semibold">{totalPrescriptions}</span>
        </p>

        <p className="text-gray-600">
          Lab tests performed:{" "}
          <span className="font-semibold">{totalLabResults}</span>
        </p>

      </div>

      {/* LAST VISIT */}
      <div className="p-4 border rounded-xl">
        <p className="text-gray-500 text-xs">Last Visit</p>
        <p className="font-medium">{lastVisit}</p>
      </div>

      {/* QUICK INSIGHT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        <div className="p-3 border rounded-xl">
          <p className="text-gray-500 text-xs">Consultation Load</p>
          <p className="font-semibold">
            {totalConsultations > 3 ? "Frequent" : "Normal"}
          </p>
        </div>

        <div className="p-3 border rounded-xl">
          <p className="text-gray-500 text-xs">Monitoring Level</p>
          <p className="font-semibold">
            {totalLabResults > 2 ? "High" : "Standard"}
          </p>
        </div>

      </div>

    </div>
  );
}