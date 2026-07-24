export default function Input({  icon,
  placeholder,
  type = "text",
  value,
  onChange,
  error, }) {
  return (
    <div>
      <div className={`
        flex items-center
        bg-white
        border ${error ? 'border-red-400' : 'border-gray-200'}
        rounded-2xl
        px-4 py-4
        shadow-sm
        hover:border-[#2F80ED]
        focus-within:border-[#2F80ED]
        focus-within:ring-2
        focus-within:ring-blue-100
        transition-all
      `}>
        <span className="mr-3 text-gray-500">
          {icon}
        </span>

        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="
            w-full
            outline-none
            bg-transparent
            text-gray-700
            placeholder:text-gray-400
          "
        />
      </div>
      {error && <p className="text-red-500 text-xs mt-1 ml-2">{error}</p>}
    </div>
  );
}