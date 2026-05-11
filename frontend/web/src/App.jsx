import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./style.css";
import { useTheme } from "./context/ThemeContext";


/* =========================
   GLOBAL LAYOUT COMPONENTS
========================= */
import Sidebar from "./components/sidebar";
import Header from "./components/header";

/* =========================
   AUTH
========================= */
import Auth from "./pages/Auth/Auth";

/* =========================
   YOUR OLD PAGES
========================= */
import DashboardPatient from "./pages/patient/dashboard";
import Annuaire from "./pages/patient/Annuaire";
import DossierPatient from "./pages/patient/dossierpatient";
import Notifications from "./pages/patient/notifications";
import Aide from "./pages/patient/Aides";
import Parametres from "./pages/patient/parametre";
import StructuresSante from "./pages/patient/structuressante";

/* =========================
   NEW DOCTOR PAGES
========================= */
import DoctorDirectory from "./pages/doctor/doctorDirectory";
import Appointment from "./pages/doctor/Appointment";
import Messages from "./pages/doctor/Message";
import Patient from "./pages/doctor/Patient";
import TeleConsultation from "./pages/doctor/TeleConsultation";
import Payments from "./pages/doctor/Payments";
import ObserverDashboard from "./pages/observer/Dashboard";

import ProfilStructure from "./pages/structure/profilStructure";
import DemandesStructure from "./pages/structure/DemandesStructure";
import PersonnelStructure from "./pages/structure/PersonnelStructure";
import DashboardStructure from "./pages/structure/DashboardStructure";

import Dashboard from "./pages/doctor/Dashboard";

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [langue, setLangue] = useState("fr");

  // SIDEBAR COLLAPSE
  const [collapsed, setCollapsed] = useState(true);


  return (
    <BrowserRouter>

      <Routes>

        {/* ================= LOGIN PAGE ================= */}
        <Route path="/" element={<Auth />} />

        {/* ================= DASHBOARD LAYOUT ================= */}
        <Route
          path="*"
          element={
            <div
              className={`flex min-h-screen transition-colors duration-300 overflow-x-hidden
              ${darkMode ? "bg-gray-900" : "bg-white"}`}
            >

              {/* ================= SIDEBAR ================= */}
              <Sidebar
                darkMode={darkMode}
                langue={langue}
                collapsed={collapsed}
                setCollapsed={setCollapsed}
              />

              {/* ================= CONTENT ================= */}
              <div
                className={`
                  flex flex-col flex-1 transition-all duration-300
                  ${collapsed ? "md:ml-20" : "md:ml-56"}
                `}
              >

                {/* ================= HEADER ================= */}
                <Header
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                  langue={langue}
                  setLangue={setLangue}
                />

                {/* ================= MAIN ================= */}
                <main className="flex-1 mt-8 p-4 md:p-6 overflow-x-hidden">
                  <Routes>

                    {/* OLD PAGES */}
                    <Route path="/patient-dashboard" element={<DashboardPatient darkMode={darkMode} />} />
                    <Route path="/annuaire" element={<Annuaire darkMode={darkMode} />} />
                    <Route path="/dossiers" element={<DossierPatient darkMode={darkMode} />} />
                    <Route path="/messages" element={<Messages darkMode={darkMode} />} />
                    <Route path="/notifications" element={<Notifications  darkMode={darkMode}/>} />
                    <Route path="/aide" element={<Aide darkMode={darkMode} />} />
                    <Route path="/parametres" element={<Parametres  darkMode={darkMode}/>} />
                    <Route path="/structures" element={<StructuresSante darkMode={darkMode} />} />

                    {/* DOCTOR */}
                    <Route
                      path="/doctors"
                      element={<DoctorDirectory darkMode={darkMode} />}
                    />

                    <Route
                      path="/appointments"
                      element={<Appointment darkMode={darkMode} />}
                    />

                    <Route
                      path="/messages"
                      element={<Messages darkMode={darkMode} />}
                    />

                    <Route
                      path="/patients"
                      element={<Patient darkMode={darkMode} />}
                    />

                    <Route
                      path="/teleconsultation"
                      element={<TeleConsultation darkMode={darkMode} />}
                    />

                    <Route
                      path="/payments"
                      element={<Payments darkMode={darkMode} />}
                    />

                    <Route
                      path="/doctor-dashboard"
                      element={<Dashboard darkMode={darkMode} />}
                    />

                    {/* OBSERVER */}
                    <Route
                      path="/observer-dashboard"
                      element={<ObserverDashboard darkMode={darkMode} />}
                    />

                    {/* STRUCTURE */}
                    <Route
                      path="/structure-dashboard"
                      element={<DashboardStructure darkMode={darkMode} />}
                    />

                    

                    

                    <Route
                      path="/structure/profil"
                      element={<ProfilStructure darkMode={darkMode} />}
                    />

                    <Route
                      path="/structure/personnel"
                      element={<PersonnelStructure darkMode={darkMode} />}
                    />

                    <Route
                      path="/structure/demandes"
                      element={<DemandesStructure darkMode={darkMode} />}
                    />

                  </Routes>
                </main>

              </div>
            </div>
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;