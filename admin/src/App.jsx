import { Routes, Route, useLocation } from "react-router-dom";
import { useState } from "react";
import { Toaster } from "react-hot-toast";

import Sidebar from "./components/sideBar";
import Header from "./components/Header";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patient";
import Doctors from "./pages/Doctor";
import Structures from "./pages/Structure";
import Reports from "./pages/Report";
import Settings from "./pages/Setting";
import Appointments from "./pages/Appointment";
import Payments from "./pages/Payment";
import Conversations from "./pages/Conversation";
import Observator from "./pages/Observator";

import Notifications from "./pages/NotificationPage";

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  
  // ✅ 1. On récupère l'URL actuelle pour savoir où on se trouve
  const location = useLocation();
  const isLoginPage = location.pathname === "/admin/login" || location.pathname === "/";

  return (
    <div className={`flex min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-100"}`}>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: "#1e293b",
            color: "#fff",
          },
          success: { duration: 3000, icon: "✅" },
          error: { duration: 4000, icon: "❌" },
        }}
      />

      {/* ✅ 2. On affiche la Sidebar SEULEMENT si on n'est PAS sur la page de login */}
      {!isLoginPage && (
        <Sidebar
          darkMode={darkMode}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />
      )}

      {/* MAIN */}
      <div
        className={`
          flex flex-col flex-1 transition-all duration-300
          ${!isLoginPage ? (collapsed ? "lg:ml-20" : "lg:ml-64") : "w-full"}
        `}
      >
        {/* ✅ 3. On affiche le Header SEULEMENT si on n'est PAS sur la page de login */}
        {!isLoginPage && (
          <Header
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            collapsed={collapsed}
          />
        )}

        {/* ✅ 4. On ajuste le margin-top uniquement pour les pages avec Header */}
        <main className={`p-6 ${!isLoginPage ? "mt-16" : "w-full flex items-center justify-center min-h-screen"}`}>
          <Routes>
            {/* ✅ 5. La route racine "/" affiche maintenant le Login en premier */}
            <Route path="/" element={<Login />} />
            <Route path="/admin/login" element={<Login />} />
            
            {/* ✅ 6. Le Dashboard est déplacé sur "/dashboard" (ou tu peux garder "/" si tu préfères) */}
            <Route path="/dashboard" element={<Dashboard darkMode={darkMode} />} />

            <Route path="/admin/notifications" element={<Notifications darkMode={darkMode}/>} />
            
            <Route path="/patients" element={<Patients darkMode={darkMode} />} />
            <Route path="/doctors" element={<Doctors darkMode={darkMode} />} />
            <Route path="/structures" element={<Structures darkMode={darkMode} />} />
            <Route path="/observator" element={<Observator darkMode={darkMode} />} />
            <Route path="/reports" element={<Reports darkMode={darkMode} />} />
            <Route path="/settings" element={<Settings darkMode={darkMode} />} />
            <Route path="/appointments" element={<Appointments darkMode={darkMode} />} />
            <Route path="/payments" element={<Payments darkMode={darkMode} />} />
            <Route path="/conversations" element={<Conversations darkMode={darkMode} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}