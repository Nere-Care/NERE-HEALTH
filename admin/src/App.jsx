import { Routes, Route, Navigate } from "react-router-dom";
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
import Tickets from "./pages/Tickets";
import Notifications from "./pages/Notifications";
import MiseAJour from "./pages/MiseAJour";
import Actualite from "./pages/Actualite";
import Signalements from "./pages/Signalements";
import { isAdminAuthenticated } from "./services/auth";

function ProtectedRoute({ children }) {
  if (!isAdminAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
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

      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className={`flex min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-100"}`}>
                <Sidebar darkMode={darkMode} collapsed={collapsed} setCollapsed={setCollapsed} />
                <div
                  className={`flex flex-col flex-1 transition-all duration-300 ${
                    collapsed ? "lg:ml-20" : "lg:ml-64"
                  }`}
                >
                  <Header darkMode={darkMode} setDarkMode={setDarkMode} collapsed={collapsed} />
                  <main className="p-6 mt-16">
                    <Routes>
                      <Route path="/" element={<Dashboard darkMode={darkMode} />} />
                      <Route path="/patients" element={<Patients darkMode={darkMode} />} />
                      <Route path="/doctors" element={<Doctors darkMode={darkMode} />} />
                      <Route path="/structures" element={<Structures darkMode={darkMode} />} />
                      <Route path="/observator" element={<Observator darkMode={darkMode} />} />
                      <Route path="/reports" element={<Reports darkMode={darkMode} />} />
                      <Route path="/settings" element={<Settings darkMode={darkMode} />} />
                      <Route path="/appointments" element={<Appointments darkMode={darkMode} />} />
                      <Route path="/payments" element={<Payments darkMode={darkMode} />} />
                      <Route path="/conversations" element={<Conversations darkMode={darkMode} />} />
                      <Route path="/tickets" element={<Tickets darkMode={darkMode} />} />
                      <Route path="/notifications" element={<Notifications darkMode={darkMode} />} />
                      <Route path="/mises-a-jour" element={<MiseAJour darkMode={darkMode} />} />
                      <Route path="/actualites" element={<Actualite darkMode={darkMode} />} />
                      <Route path="/signalements" element={<Signalements darkMode={darkMode} />} />
                    </Routes>
                  </main>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}
