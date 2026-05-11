import { useState } from "react";

import {
  Search,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Filter,
  Users,
  UserCheck,
  UserX,
  Phone,
  Mail,
  Activity,
  MoreVertical,
  CalendarDays,
  Download,
  FileText,
  X,
  Save,
  MapPin,
  Briefcase,
  HeartPulse,
  Shield,
  UserRound,
} from "lucide-react";

/* ================= DATA ================= */

const initialPatients = [
  {
    id: 1,
    name: "Jean Mbarga",
    email: "jean@gmail.com",
    phone: "690000001",
    status: "active",
    age: 32,
    blood: "O+",
    gender: "Masculin",
    address: "Yaoundé, Cameroun",
    profession: "Ingénieur",
    insurance: "AXA Assurance",
    doctor: "Dr Ndzi",
    allergies: "Aucune",
    emergencyContact: "690112233",
    medicalHistory: "Hypertension",
    lastVisit: "12 May 2026",
  },

  {
    id: 2,
    name: "Marie Ngo",
    email: "marie@gmail.com",
    phone: "670000002",
    status: "inactive",
    age: 28,
    blood: "A+",
    gender: "Féminin",
    address: "Douala, Cameroun",
    profession: "Comptable",
    insurance: "SUNU Assurance",
    doctor: "Dr Essomba",
    allergies: "Pénicilline",
    emergencyContact: "677889900",
    medicalHistory: "Asthme",
    lastVisit: "08 May 2026",
  },
];

export default function Patient({ darkMode }) {
  const [patients, setPatients] = useState(initialPatients);

  const [search, setSearch] = useState("");

  const [selectedPatient, setSelectedPatient] = useState(null);

  const [editingPatient, setEditingPatient] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);

  const [newPatient, setNewPatient] = useState({
    name: "",
    email: "",
    phone: "",
    age: "",
    blood: "",
    gender: "",
    address: "",
    profession: "",
    insurance: "",
    doctor: "",
    allergies: "",
    emergencyContact: "",
    medicalHistory: "",
  });

  /* ================= FILTER ================= */

  const filtered = patients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  /* ================= STATS ================= */

  const stats = {
    total: patients.length,
    active: patients.filter((p) => p.status === "active").length,
    inactive: patients.filter((p) => p.status === "inactive").length,
  };

  /* ================= EXPORT CSV ================= */

  const exportPatients = () => {
    const headers = [
      "Nom",
      "Email",
      "Téléphone",
      "Âge",
      "Groupe sanguin",
      "Statut",
    ];

    const rows = patients.map((p) => [
      p.name,
      p.email,
      p.phone,
      p.age,
      p.blood,
      p.status,
    ]);

    const csvContent = [headers, ...rows]
      .map((e) => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);

    link.download = "patients.csv";

    link.click();
  };

  /* ================= REPORT ================= */

  const generateReport = () => {
    const reportWindow = window.open("", "_blank");

    reportWindow.document.write(`
      <html>
        <head>
          <title>Rapport Patients</title>

          <style>
            body {
              font-family: Arial;
              background: #111827;
              color: white;
              padding: 40px;
            }

            h1 {
              color: #3b82f6;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              background: #1f2937;
            }

            th, td {
              border: 1px solid #374151;
              padding: 12px;
              text-align: left;
            }

            th {
              background: #2563eb;
            }

            tr:nth-child(even) {
              background: #111827;
            }
          </style>
        </head>

        <body>

          <h1>Rapport des Patients</h1>

          <p>Total patients : ${stats.total}</p>
          <p>Patients actifs : ${stats.active}</p>
          <p>Patients inactifs : ${stats.inactive}</p>

          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th>Statut</th>
              </tr>
            </thead>

            <tbody>
              ${patients
                .map(
                  (p) => `
                    <tr>
                      <td>${p.name}</td>
                      <td>${p.email}</td>
                      <td>${p.phone}</td>
                      <td>${p.status}</td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>

          </table>

        </body>
      </html>
    `);

    reportWindow.document.close();

    reportWindow.print();
  };

  /* ================= DELETE ================= */

  const deletePatient = (id) => {
    const confirmDelete = window.confirm(
      "Voulez-vous vraiment supprimer ce patient ?"
    );

    if (confirmDelete) {
      setPatients((prev) =>
        prev.filter((patient) => patient.id !== id)
      );
    }
  };

  /* ================= VIEW ================= */

  const viewPatient = (patient) => {
    setSelectedPatient(patient);
  };

  /* ================= EDIT ================= */

  const startEdit = (patient) => {
    setEditingPatient({ ...patient });
  };

  const saveEdit = () => {
    setPatients((prev) =>
      prev.map((p) =>
        p.id === editingPatient.id ? editingPatient : p
      )
    );

    setEditingPatient(null);
  };

  /* ================= ADD ================= */

  const addPatient = () => {
    if (
      !newPatient.name ||
      !newPatient.email ||
      !newPatient.phone
    ) {
      alert("Veuillez remplir tous les champs");
      return;
    }

    const patient = {
      id: Date.now(),
      ...newPatient,
      status: "active",
      lastVisit: "Aujourd'hui",
    };

    setPatients((prev) => [patient, ...prev]);

    setShowAddModal(false);

    setNewPatient({
      name: "",
      email: "",
      phone: "",
      age: "",
      blood: "",
      gender: "",
      address: "",
      profession: "",
      insurance: "",
      doctor: "",
      allergies: "",
      emergencyContact: "",
      medicalHistory: "",
    });
  };

  /* ================= STYLE ================= */

  const inputClass = `
    w-full h-12 px-4 rounded-2xl outline-none transition-all text-sm
    ${
      darkMode
        ? "bg-gray-700 border border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500"
        : "bg-gray-50 border border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-blue-500"
    }
  `;

  return (
    <div
      className={`min-h-screen p-4 md:p-6 transition-all
      ${darkMode ? "bg-gray-900" : "bg-gray-100"}`}
    >
      {/* HEADER */}

      <div className="flex flex-col lg:flex-row justify-between gap-5 mb-6">
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center
            ${
              darkMode
                ? "bg-blue-500/20"
                : "bg-blue-100"
            }`}
          >
            <Users className="text-blue-500" size={28} />
          </div>

          <div>
            <h1
              className={`text-3xl font-bold
              ${darkMode ? "text-white" : "text-gray-800"}`}
            >
              Patients
            </h1>

            <p
              className={`text-sm
              ${darkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              Gestion complète des dossiers patients
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={exportPatients}
            className={`h-11 px-4 rounded-2xl flex items-center gap-2
            ${
              darkMode
                ? "bg-gray-800 text-white border border-gray-700 hover:bg-gray-700"
                : "bg-white border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Download size={16} />
            Exporter
          </button>

          <button
            onClick={generateReport}
            className={`h-11 px-4 rounded-2xl flex items-center gap-2
            ${
              darkMode
                ? "bg-gray-800 text-white border border-gray-700 hover:bg-gray-700"
                : "bg-white border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <FileText size={16} />
            Rapport
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="h-11 px-5 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
          >
            <UserPlus size={17} />
            Nouveau patient
          </button>
        </div>
      </div>

      {/* STATS */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          {
            title: "Total patients",
            value: stats.total,
            icon: Users,
          },

          {
            title: "Patients actifs",
            value: stats.active,
            icon: UserCheck,
          },

          {
            title: "Patients inactifs",
            value: stats.inactive,
            icon: UserX,
          },
        ].map((card, index) => {
          const Icon = card.icon;

          return (
            <div
              key={index}
              className={`rounded-2xl p-5 shadow
              ${darkMode ? "bg-gray-800" : "bg-white"}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={`text-sm
                    ${
                      darkMode
                        ? "text-gray-400"
                        : "text-gray-500"
                    }`}
                  >
                    {card.title}
                  </p>

                  <h2
                    className={`text-3xl font-bold mt-2
                    ${
                      darkMode
                        ? "text-white"
                        : "text-gray-800"
                    }`}
                  >
                    {card.value}
                  </h2>
                </div>

                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-500 flex items-center justify-center">
                  <Icon size={22} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* SEARCH */}

      <div
        className={`rounded-2xl p-4 mb-6 shadow flex gap-4
        flex-col lg:flex-row
        ${darkMode ? "bg-gray-800" : "bg-white"}`}
      >
        <div
          className={`flex items-center gap-3 flex-1 rounded-xl px-4 py-3
          ${
            darkMode
              ? "bg-gray-700 border border-gray-600"
              : "bg-gray-50 border border-gray-100"
          }`}
        >
          <Search size={18} className="text-gray-400" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un patient..."
            className={`bg-transparent outline-none w-full
            ${
              darkMode
                ? "text-white placeholder:text-gray-400"
                : "text-gray-700"
            }`}
          />
        </div>

        <button
          className={`h-12 px-5 rounded-xl flex items-center gap-2
          ${
            darkMode
              ? "bg-gray-700 text-white"
              : "bg-gray-50"
          }`}
        >
          <Filter size={16} />
          Filtrer
        </button>
      </div>

      {/* PATIENTS */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {filtered.map((p) => (
          <div
            key={p.id}
            className={`rounded-2xl p-5 shadow
            ${darkMode ? "bg-gray-800" : "bg-white"}`}
          >
            <div className="flex justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-blue-500 text-white flex items-center justify-center font-bold">
                  {p.name.charAt(0)}
                </div>

                <div>
                  <h3
                    className={`font-bold text-lg
                    ${
                      darkMode
                        ? "text-white"
                        : "text-gray-800"
                    }`}
                  >
                    {p.name}
                  </h3>

                  <div className="flex gap-2 mt-1">
                    <span
                      className={`text-xs px-2 py-1 rounded-full
                      ${
                        p.status === "active"
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-500"
                      }`}
                    >
                      {p.status}
                    </span>

                    <span className="text-xs text-gray-400">
                      {p.age} ans
                    </span>
                  </div>
                </div>
              </div>

              <button>
                <MoreVertical className="text-gray-400" />
              </button>
            </div>

            {/* DETAILS */}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
              {[
                {
                  icon: Mail,
                  label: "Email",
                  value: p.email,
                },

                {
                  icon: Phone,
                  label: "Téléphone",
                  value: p.phone,
                },

                {
                  icon: CalendarDays,
                  label: "Dernière visite",
                  value: p.lastVisit,
                },

                {
                  icon: Activity,
                  label: "Statut médical",
                  value: "Stable",
                },
              ].map((item, index) => {
                const Icon = item.icon;

                return (
                  <div
                    key={index}
                    className={`rounded-xl p-4
                    ${
                      darkMode
                        ? "bg-gray-700"
                        : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                      <Icon size={13} />
                      {item.label}
                    </div>

                    <p
                      className={`text-sm font-medium
                      ${
                        darkMode
                          ? "text-white"
                          : "text-gray-700"
                      }`}
                    >
                      {item.value}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* ACTIONS */}

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => viewPatient(p)}
                className="w-10 h-10 rounded-xl bg-blue-100 text-blue-500 flex items-center justify-center hover:scale-105"
              >
                <Eye size={18} />
              </button>

              <button
                onClick={() => startEdit(p)}
                className="w-10 h-10 rounded-xl bg-orange-100 text-orange-500 flex items-center justify-center hover:scale-105"
              >
                <Edit size={18} />
              </button>

              <button
                onClick={() => deletePatient(p.id)}
                className="w-10 h-10 rounded-xl bg-red-100 text-red-500 flex items-center justify-center hover:scale-105"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* VIEW MODAL */}

      {selectedPatient && (
        <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4">
          <div
            className={`w-full max-w-2xl rounded-2xl p-6
            ${darkMode ? "bg-gray-800" : "bg-white"}`}
          >
            <div className="flex justify-between mb-6">
              <h2
                className={`text-2xl font-bold
                ${
                  darkMode
                    ? "text-white"
                    : "text-gray-800"
                }`}
              >
                Détails Patient
              </h2>

              <button
                onClick={() => setSelectedPatient(null)}
              >
                <X className="text-gray-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  icon: UserRound,
                  label: "Nom",
                  value: selectedPatient.name,
                },

                {
                  icon: Mail,
                  label: "Email",
                  value: selectedPatient.email,
                },

                {
                  icon: Phone,
                  label: "Téléphone",
                  value: selectedPatient.phone,
                },

                {
                  icon: MapPin,
                  label: "Adresse",
                  value: selectedPatient.address,
                },

                {
                  icon: Briefcase,
                  label: "Profession",
                  value: selectedPatient.profession,
                },

                {
                  icon: HeartPulse,
                  label: "Groupe sanguin",
                  value: selectedPatient.blood,
                },

                {
                  icon: Shield,
                  label: "Assurance",
                  value: selectedPatient.insurance,
                },

                {
                  icon: Activity,
                  label: "Antécédents",
                  value: selectedPatient.medicalHistory,
                },
              ].map((item, index) => {
                const Icon = item.icon;

                return (
                  <div
                    key={index}
                    className={`rounded-xl p-4
                    ${
                      darkMode
                        ? "bg-gray-700"
                        : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                      <Icon size={13} />
                      {item.label}
                    </div>

                    <p
                      className={
                        darkMode
                          ? "text-white"
                          : "text-gray-700"
                      }
                    >
                      {item.value}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}

      {editingPatient && (
        <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4">
          <div
            className={`w-full max-w-2xl rounded-2xl p-6
            ${darkMode ? "bg-gray-800" : "bg-white"}`}
          >
            <div className="flex justify-between mb-6">
              <h2
                className={`text-2xl font-bold
                ${
                  darkMode
                    ? "text-white"
                    : "text-gray-800"
                }`}
              >
                Modifier Patient
              </h2>

              <button
                onClick={() => setEditingPatient(null)}
              >
                <X className="text-gray-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                className={inputClass}
                value={editingPatient.name}
                onChange={(e) =>
                  setEditingPatient({
                    ...editingPatient,
                    name: e.target.value,
                  })
                }
                placeholder="Nom"
              />

              <input
                className={inputClass}
                value={editingPatient.email}
                onChange={(e) =>
                  setEditingPatient({
                    ...editingPatient,
                    email: e.target.value,
                  })
                }
                placeholder="Email"
              />

              <input
                className={inputClass}
                value={editingPatient.phone}
                onChange={(e) =>
                  setEditingPatient({
                    ...editingPatient,
                    phone: e.target.value,
                  })
                }
                placeholder="Téléphone"
              />

              <input
                className={inputClass}
                value={editingPatient.address}
                onChange={(e) =>
                  setEditingPatient({
                    ...editingPatient,
                    address: e.target.value,
                  })
                }
                placeholder="Adresse"
              />
            </div>

            <button
              onClick={saveEdit}
              className="w-full h-12 mt-5 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center gap-2"
            >
              <Save size={17} />
              Enregistrer
            </button>
          </div>
        </div>
      )}

      {/* ADD MODAL */}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4">
          <div
            className={`w-full max-w-3xl rounded-2xl p-6
            ${darkMode ? "bg-gray-800" : "bg-white"}`}
          >
            <div className="flex justify-between mb-6">
              <h2
                className={`text-2xl font-bold
                ${
                  darkMode
                    ? "text-white"
                    : "text-gray-800"
                }`}
              >
                Nouveau Patient
              </h2>

              <button
                onClick={() => setShowAddModal(false)}
              >
                <X className="text-gray-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                className={inputClass}
                placeholder="Nom"
                value={newPatient.name}
                onChange={(e) =>
                  setNewPatient({
                    ...newPatient,
                    name: e.target.value,
                  })
                }
              />

              <input
                className={inputClass}
                placeholder="Email"
                value={newPatient.email}
                onChange={(e) =>
                  setNewPatient({
                    ...newPatient,
                    email: e.target.value,
                  })
                }
              />

              <input
                className={inputClass}
                placeholder="Téléphone"
                value={newPatient.phone}
                onChange={(e) =>
                  setNewPatient({
                    ...newPatient,
                    phone: e.target.value,
                  })
                }
              />

              <input
                className={inputClass}
                placeholder="Adresse"
                value={newPatient.address}
                onChange={(e) =>
                  setNewPatient({
                    ...newPatient,
                    address: e.target.value,
                  })
                }
              />
            </div>

            <button
              onClick={addPatient}
              className="w-full h-12 mt-5 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white"
            >
              Ajouter le patient
            </button>
          </div>
        </div>
      )}
    </div>
  );
}