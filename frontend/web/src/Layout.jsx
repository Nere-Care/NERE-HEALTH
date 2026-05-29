import Sidebar from "./Sidebar";
import Header from "./Header";

export default function Layout({ children, darkMode, setDarkMode }) {
  return (
    <div className="h-screen w-full overflow-hidden">

      {/* HEADER */}
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />

      {/* ZONE SOUS LE HEADER */}
      <div className="fixed top-[70px] left-0 right-0 bottom-0 flex overflow-hidden">

        {/* SIDEBAR — cachée sur mobile, visible desktop */}
        <div className="hidden lg:block shrink-0 w-[256px] h-full">
          <Sidebar darkMode={darkMode} />
        </div>

        {/* SIDEBAR MOBILE — gérée par la sidebar elle-même */}
        <div className="lg:hidden">
          <Sidebar darkMode={darkMode} />
        </div>

        {/* CONTENU */}
      <main
  style={{ marginLeft: "256px", marginTop: "70px", height: "calc(100vh - 70px)" }}
  className={`
    overflow-y-auto
    px-6 py-4
    ${darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-800"}
  `}
>
  {children}
</main>

      </div>
    </div>
  );
}