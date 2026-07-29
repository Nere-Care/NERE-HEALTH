import { useState, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

import "./style.css";

/* LAYOUT */
import Sidebar from "./components/sidebar";
import Header from "./components/header";

/* LAZY LOADED PAGES */
/* AUTH */
const Auth = lazy(() => import("./pages/Auth/Auth"));

/* PATIENT */
const DashboardPatient = lazy(() => import("./pages/patient/dashboard"));
const Annuaire = lazy(() => import("./pages/patient/Annuaire"));
const DossierPatient = lazy(() => import("./pages/patient/dossierpatient"));
const Notifications = lazy(() => import("./pages/patient/notifications"));
const Aide = lazy(() => import("./pages/patient/Aides"));
const Parametres = lazy(() => import("./pages/patient/parametre"));
const StructuresSante = lazy(() => import("./pages/patient/structuressante"));
const ProfilMedecin = lazy(() => import("./pages/patient/profilMedecin"));
const Prescriptions = lazy(() => import("./pages/patient/prescriptions"));
const Factures = lazy(() => import("./pages/patient/factures"));
const Paiement = lazy(() => import("./pages/patient/Paiement"));
const MiseAJour = lazy(() => import("./pages/patient/MiseAJour"));
const DetailNotification = lazy(() => import("./pages/patient/DetailNotification"));
const PrescriptionDetail = lazy(() => import("./pages/patient/PrescriptionDetail"));
const ProfilStructurePatient = lazy(() => import("./pages/patient/profilStructure"));
const MessagesPatient = lazy(() => import("./pages/patient/messages"));
const RendezVous = lazy(() => import("./pages/patient/RendezVous"));
const MesTickets = lazy(() => import("./pages/patient/MesTickets"));

/* DOCTOR */
const DoctorDirectory = lazy(() => import("./pages/doctor/doctorDirectory"));
const Appointment = lazy(() => import("./pages/doctor/Appointment"));
const Messages = lazy(() => import("./pages/doctor/Message"));
const Patient = lazy(() => import("./pages/doctor/Patient"));
const TeleConsultation = lazy(() => import("./pages/doctor/TeleConsultation"));
const Payments = lazy(() => import("./pages/doctor/Payments"));
const Dashboard = lazy(() => import("./pages/doctor/Dashboard"));
const ConsultationDetail = lazy(() => import("./pages/doctor/ConsultationDetail"));
const DossierDetail = lazy(() => import("./pages/doctor/DossierDetail"));

/* OBSERVER */
const ObserverDashboard = lazy(() => import("./pages/observer/Dashboard"));
const DoctorObserver = lazy(() => import("./pages/observer/Doctor"));
const PatientObserver = lazy(() => import("./pages/observer/Patient"));
const StructureObserver = lazy(() => import("./pages/observer/Structure"));

/* STRUCTURE */
const ProfilStructure = lazy(() => import("./pages/structure/ProfilStructure"));
const DemandesStructure = lazy(() => import("./pages/structure/DemandesStructure"));
const PersonnelStructure = lazy(() => import("./pages/structure/PersonnelStructure"));
const DashboardStructure = lazy(() => import("./pages/structure/DashboardStructure"));
const AideStructure = lazy(() => import("./pages/structure/AideStructure"));
const ParametresStructure = lazy(() => import("./pages/structure/ParametresStructure"));

const GlobalLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
  </div>
);

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
          <Suspense fallback={<GlobalLoader />}>
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
              <Route path="/consultation/:id" element={<ConsultationDetail darkMode={darkMode} />} />
              <Route path="/dossier/:id" element={<DossierDetail darkMode={darkMode} />} />

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
          </Suspense>
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
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ""}>
      <BrowserRouter>
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        }>
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
        </Suspense>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
