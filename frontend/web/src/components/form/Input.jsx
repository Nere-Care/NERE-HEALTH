export default function Input({ icon, placeholder, type = "text" }) {
  return (
    <div className="flex items-center bg-[rgba(217,218,220,0.1)] border border-gray-300 rounded-lg px-3 py-3">
      <span className="mr-2">{icon}</span>

      <input
        type={type}
        placeholder={placeholder}
        className="w-full outline-none bg-transparent"
      />
    </div>
  );
}