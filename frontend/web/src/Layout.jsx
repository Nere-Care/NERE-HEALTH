import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function Layout({ children, darkMode, setDarkMode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="h-screen w-full">

      {/* HEADER FIXE */}
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />

      <div className="flex pt-[90px]">

        {/* SIDEBAR */}
        <Sidebar
          darkMode={darkMode}
          open={sidebarOpen}
          setOpen={setSidebarOpen}
        />

        {/* CONTENT ADAPTATIF */}
        <div
          className={`flex-1 transition-all duration-300
            ${sidebarOpen ? "ml-60" : "ml-20"}`}
        >
          {children}
        </div>

      </div>
    </div>
  );
}