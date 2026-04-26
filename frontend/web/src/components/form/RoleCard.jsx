export default function RoleCard({ active, onClick, icon, text }) {
  return (
    <div
      onClick={onClick}
      className={`h-[115px] rounded-xl border cursor-pointer flex flex-col items-center justify-center transition
      ${
        active
          ? "bg-[#2F80ED] border-[#2F80ED] text-white"
          : "bg-white border-gray-300 text-gray-800"
      }`}
    >
      <div className="mb-2">{icon}</div>
      <p className="text-sm font-medium">{text}</p>
    </div>
  );
}