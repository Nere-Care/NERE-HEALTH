export default function RoleCard({ active, onClick, icon, text }) {
  return (
    <div
      onClick={onClick}
      className={`
        h-[130px]
        rounded-2xl
        border-2
        cursor-pointer
        flex flex-col
        items-center
        justify-center
        transition-all
        duration-300
        shadow-sm
        hover:shadow-md

        ${
          active
            ? "bg-[#2F80ED] border-[#2F80ED] text-white scale-[1.02]"
            : "bg-white border-gray-200 text-gray-800 hover:border-[#2F80ED]"
        }
      `}
    >
      <div className="mb-3">
        {icon}
      </div>

      <p className="text-sm font-semibold text-center px-2">
        {text}
      </p>
    </div>
  );
}