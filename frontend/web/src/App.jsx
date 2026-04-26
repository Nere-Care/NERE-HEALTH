import { Routes, Route } from "react-router-dom";

import Auth from "./pages/Auth/Auth";
import DoctorDirectory from "./pages/doctor/doctorDirectory";
import Appointment from "./pages/doctor/Appointment";
import Message from "./pages/doctor/Message";
import Patient from "./pages/doctor/Patient";
import TeleConsultation from "./pages/doctor/TeleConsultation";
import Payments from "./pages/doctor/Payments";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Auth />} />
      <Route path="/doctors" element={<DoctorDirectory />} />
      <Route path="/appointments" element={<Appointment />} />
      <Route path="/messages" element={<Message />} />
      <Route path="/patients" element={<Patient />} />
      <Route path="/teleconsultation" element={<TeleConsultation />} />
      <Route path="/payments" element={<Payments />} />
    </Routes>
  );
}