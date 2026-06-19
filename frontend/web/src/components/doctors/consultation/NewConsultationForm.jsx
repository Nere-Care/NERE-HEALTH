export default function NewConsultationForm({
  selectedPatient,
  setIsNewConsultation,
}) {
  return (
    <div className="mt-6 p-5 border rounded-2xl bg-white space-y-6">

      <h3 className="font-semibold text-lg">
        New Clinical Consultation
      </h3>

      {/* ================= PATIENT CONTEXT ================= */}
      <div className="p-3 border rounded-xl bg-gray-50 text-sm">
        <p className="font-medium">Patient Context</p>
        <p>
          {selectedPatient?.name} — {selectedPatient?.patientId}
        </p>
        <p className="text-gray-500">
          Age: {selectedPatient?.age} • Gender: {selectedPatient?.gender}
        </p>
      </div>

      {/* ================= CHIEF COMPLAINT ================= */}
      <div className="space-y-2">
        <label className="font-medium text-sm">Chief Complaint</label>
        <input
          type="text"
          placeholder="Main reason for consultation"
          className="border p-3 rounded-xl w-full"
        />
      </div>

      {/* ================= CLINICAL EXAM ================= */}
      <div className="space-y-2">
        <label className="font-medium text-sm">Clinical Examination</label>
        <textarea
          rows={3}
          placeholder="Physical examination findings..."
          className="border p-3 rounded-xl w-full"
        />
      </div>

      {/* ================= DIAGNOSIS + TREATMENT ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div className="space-y-2">
          <label className="font-medium text-sm">Diagnosis</label>
          <input
            type="text"
            className="border p-3 rounded-xl w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="font-medium text-sm">Treatment Plan</label>
          <input
            type="text"
            className="border p-3 rounded-xl w-full"
          />
        </div>

      </div>

      {/* ================= PRESCRIPTION ================= */}
      <div className="space-y-2">
        <label className="font-medium text-sm">Prescription</label>

        <textarea
          rows={3}
          className="border p-3 rounded-xl w-full"
        />
      </div>

      {/* ================= LAB REQUEST ================= */}
      <div className="space-y-2">
        <label className="font-medium text-sm">Laboratory Requests</label>

        <input
          type="text"
          className="border p-3 rounded-xl w-full"
        />
      </div>

      {/* ================= NOTES ================= */}
      <div className="space-y-2">
        <label className="font-medium text-sm">Clinical Notes</label>

        <textarea
          rows={4}
          className="border p-3 rounded-xl w-full"
        />
      </div>

      {/* ================= FOLLOW UP ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div className="space-y-2">
          <label className="font-medium text-sm">Follow-up Date</label>
          <input type="date" className="border p-3 rounded-xl w-full" />
        </div>

        <div className="space-y-2">
          <label className="font-medium text-sm">Medical Priority</label>
          <select className="border p-3 rounded-xl w-full">
            <option>Normal</option>
            <option>Medium</option>
            <option>High</option>
            <option>Emergency</option>
          </select>
        </div>

      </div>

      {/* ================= FILE UPLOAD ================= */}
      <div className="border rounded-xl p-3">
        <p className="text-sm font-medium mb-2">
          Attach Medical Documents
        </p>
        <input type="file" multiple />
      </div>

      {/* ================= ACTIONS ================= */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end">

        <button
          onClick={() => setIsNewConsultation(false)}
          className="px-4 py-2 rounded-xl bg-gray-100"
        >
          Cancel
        </button>

        <button className="px-4 py-2 rounded-xl bg-blue-600 text-white">
          Save Consultation
        </button>

      </div>

    </div>
  );
}