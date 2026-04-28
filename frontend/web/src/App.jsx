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
import Annuaire from "./pages/Annuaire";
import DossierPatient from "./pages/dossierpatient";
import Messages from "./pages/messages";
import Notifications from "./pages/notifications";
import Aide from "./pages/Aides";
import Parametres from "./pages/parametre";
import StructuresSante from "./pages/structuressante";

/* =========================
   NEW DOCTOR PAGES
========================= */
import DoctorDirectory from "./pages/doctor/doctorDirectory";
import Appointment from "./pages/doctor/Appointment";
import Message from "./pages/doctor/Message";
import Patient from "./pages/doctor/Patient";
import TeleConsultation from "./pages/doctor/TeleConsultation";
import Payments from "./pages/doctor/Payments";
import ObserverDashboard from "./pages/observer/Dashboard";


import Dashboard from "./pages/doctor/Dashboard";

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [langue, setLangue] = useState('fr');

  

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
            className={`flex min-h-screen transition-colors duration-300
            ${darkMode ? "bg-gray-900" : "bg-white"}`}
          >
                <Sidebar darkMode={darkMode} langue={langue}  />

                <div className="flex flex-col flex-1 md:ml-56">
                 <Header darkMode={darkMode} setDarkMode={setDarkMode}  langue={langue} setLangue={setLangue} />

    <main className="flex-1 mt-16 p-4 md:p-6 w-full">
      <Routes>
        <Route path="/annuaire" element={<Annuaire />} />
        <Route path="/dossiers" element={<DossierPatient />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/aide" element={<Aide />} />
        <Route path="/parametres" element={<Parametres />} />
        <Route path="/structures" element={<StructuresSante  />} />

        <Route path="/doctors" element={<DoctorDirectory darkMode={darkMode} />} />
        <Route path="/appointments" element={<Appointment darkMode={darkMode} />} />
        <Route path="/doctors" element={<DoctorDirectory darkMode={darkMode} />} />
        <Route path="/doctor-messages" element={<Message  darkMode={darkMode}  />} />
        <Route path="/patients" element={<Patient darkMode={darkMode} />} />
        <Route path="/teleconsultation" element={<TeleConsultation darkMode={darkMode} />} />
        <Route path="/payments" element={<Payments darkMode={darkMode} />} />
        <Route path="/doctor-dashboard" element={<Dashboard darkMode={darkMode} />} />

        <Route path="/observer-dashboard" element={<ObserverDashboard darkMode={darkMode} />} />
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