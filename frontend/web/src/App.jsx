import { useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import "./style.css";

/* LAYOUT */
import Sidebar from "./components/sidebar";
import Header from "./components/header";

/* AUTH */
import Auth from "./pages/Auth/Auth";

/* PATIENT */
import DashboardPatient from "./pages/patient/dashboard";
import Annuaire from "./pages/patient/Annuaire";
import DossierPatient from "./pages/patient/dossierpatient";
import Notifications from "./pages/patient/notifications";
import Aide from "./pages/patient/Aides";
import Parametres from "./pages/patient/parametre";
import StructuresSante from "./pages/patient/structuressante";
import ProfilMedecin from "./pages/patient/profilMedecin";
import Prescriptions from "./pages/patient/prescriptions";
import Factures from "./pages/patient/factures";
import Paiement from "./pages/patient/Paiement";
import MiseAJour from "./pages/patient/MiseAJour";
import DetailNotification from "./pages/patient/DetailNotification";
import PrescriptionDetail from "./pages/patient/PrescriptionDetail";
import ProfilStructurePatient from "./pages/patient/profilStructure";
import MessagesPatient from "./pages/patient/messages";
import RendezVous from "./pages/patient/RendezVous";
import MesTickets from "./pages/patient/MesTickets";

/* DOCTOR */
import DoctorDirectory from "./pages/doctor/doctorDirectory";
import Appointment from "./pages/doctor/Appointment";
import Messages from "./pages/doctor/Message";
import Patient from "./pages/doctor/Patient";
import TeleConsultation from "./pages/doctor/TeleConsultation";
import Payments from "./pages/doctor/Payments";
import Dashboard from "./pages/doctor/Dashboard";

/* OBSERVER */
import ObserverDashboard from "./pages/observer/Dashboard";
import DoctorObserver from "./pages/observer/Doctor";
import PatientObserver from "./pages/observer/Patient";
import StructureObserver from "./pages/observer/Structure";

/* STRUCTURE */
import ProfilStructure from "./pages/structure/ProfilStructure";
import DemandesStructure from "./pages/structure/DemandesStructure";
import PersonnelStructure from "./pages/structure/PersonnelStructure";
import DashboardStructure from "./pages/structure/DashboardStructure";
import AideStructure from "./pages/structure/AideStructure";
import ParametresStructure from "./pages/structure/ParametresStructure";

/* ─────────────────────────────────────────────────────────────
   Routes that need a "full-height, no-padding" <main>
   (chat-like pages where the content manages its own scroll)
───────────────────────────────────────────────────────────── */
const FULLSCREEN_ROUTES = ["/doctor-messages", "/messages"];

/* Inner layout — must be inside <BrowserRouter> to use useLocation */
function AppLayout({ darkMode, setDarkMode, collapsed, setCollapsed, role }) {
  const { pathname } = useLocation();
  const isChatPage = FULLSCREEN_ROUTES.includes(pathname);

  return (
    <div
      className={`flex min-h-screen transition-all duration-300
        ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}
    >
      {/* SIDEBAR */}
      <Sidebar
        darkMode={darkMode}
        role={role}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* MAIN AREA */}
      <div
        className={`flex flex-col flex-1 transition-all duration-300
          ${collapsed ? "lg:ml-20" : "lg:ml-56"}`}
      >
        {/* HEADER — always fixed at top */}
        <Header
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          role={role}
          collapsed={collapsed}
        />

        {/*
          PAGE CONTENT
          • Chat pages: no padding, no overflow-auto → the chat
            component fills the remaining height and manages its
            own scroll internally.
          • All other pages: normal padding + overflow-auto.
        */}
        <main
          className={
            isChatPage
              ? "flex flex-col flex-1 min-h-0 overflow-hidden"
              : "flex flex-col flex-1 min-h-0 overflow-auto px-4 md:px-6 pb-4 md:pb-6 pt-24 md:pt-28"
          }
        >
          <Routes>
            {/* ══════════ PATIENT ══════════ */}
            <Route path="/Patient-dashboard" element={<DashboardPatient darkMode={darkMode} />} />
            <Route path="/dashboard" element={<DashboardPatient darkMode={darkMode} />} />
            <Route path="/annuaire" element={<Annuaire darkMode={darkMode} />} />
            <Route path="/medecin/:id" element={<ProfilMedecin darkMode={darkMode} />} />
            <Route path="/dossiers" element={<DossierPatient darkMode={darkMode} />} />
            <Route path="/prescriptions" element={<Prescriptions darkMode={darkMode} />} />
            <Route path="/prescription/:id" element={<PrescriptionDetail darkMode={darkMode} />} />
            <Route path="/factures" element={<Factures darkMode={darkMode} />} />
            <Route path="/paiement" element={<Paiement darkMode={darkMode} />} />
            <Route path="/miseajour/:id" element={<MiseAJour darkMode={darkMode} />} />
            <Route path="/notifications" element={<Notifications darkMode={darkMode} />} />
            <Route path="/notification/:id" element={<DetailNotification darkMode={darkMode} />} />
            <Route path="/aide" element={<Aide darkMode={darkMode} />} />
            <Route path="/parametres" element={<Parametres darkMode={darkMode} />} />
            <Route path="/structures" element={<StructuresSante darkMode={darkMode} />} />
            <Route path="/profilStructure/:id" element={<ProfilStructurePatient darkMode={darkMode} />} />
            <Route path="/messages" element={<MessagesPatient darkMode={darkMode} />} />
            <Route path="/rendez-vous" element={<RendezVous darkMode={darkMode} />} />
            <Route path="/mes-tickets" element={<MesTickets darkMode={darkMode} />} />

            {/* ══════════ DOCTOR ══════════ */}
            <Route path="/doctors" element={<DoctorDirectory darkMode={darkMode} />} />
            <Route path="/appointments" element={<Appointment darkMode={darkMode} />} />
            <Route path="/doctor-messages" element={<Messages darkMode={darkMode} />} />
            <Route path="/patients" element={<Patient darkMode={darkMode} />} />
            <Route path="/teleconsultation" element={<TeleConsultation darkMode={darkMode} />} />
            <Route path="/payments" element={<Payments darkMode={darkMode} />} />
            <Route path="/doctor-dashboard" element={<Dashboard darkMode={darkMode} />} />

            {/* ══════════ OBSERVER ══════════ */}
            <Route path="/observer-dashboard" element={<ObserverDashboard darkMode={darkMode} />} />
            <Route path="/observer/doctor" element={<DoctorObserver darkMode={darkMode} />} />
            <Route path="/observer/patient" element={<PatientObserver darkMode={darkMode} />} />
            <Route path="/observer/structure" element={<StructureObserver darkMode={darkMode} />} />

            {/* ══════════ STRUCTURE ══════════ */}
            <Route path="/structure" element={<DashboardStructure darkMode={darkMode} />} />
            <Route path="/structure-dashboard" element={<DashboardStructure darkMode={darkMode} />} />
            <Route path="/structure/profil" element={<ProfilStructure darkMode={darkMode} />} />
            <Route path="/structure/personnel" element={<PersonnelStructure darkMode={darkMode} />} />
            <Route path="/structure/demandes" element={<DemandesStructure darkMode={darkMode} />} />
            <Route path="/structure/aide" element={<AideStructure darkMode={darkMode} />} />
            <Route path="/structure/parametres" element={<ParametresStructure darkMode={darkMode} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [role] = useState(() => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user).role : "patient";
  });
  const [collapsed, setCollapsed] = useState(false);

  return (
    <BrowserRouter>
      <Routes>
        {/* LOGIN */}
        <Route path="/" element={<Auth />} />

        {/* ALL OTHER PAGES */}
        <Route
          path="*"
          element={
            <AppLayout
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              role={role}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
