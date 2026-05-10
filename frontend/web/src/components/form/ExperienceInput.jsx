export default function ExperienceInput({ value, setValue }) {
  return (
    <div className="
      flex items-center
      bg-white
      border border-gray-200
      rounded-2xl
      overflow-hidden
      shadow-sm
    ">
      <input
        readOnly
        value={`${value} Year(s) Experience`}
        className="
          w-full
          px-4
          py-4
          bg-transparent
          outline-none
          text-gray-700
        "
      />

      <div className="flex flex-col border-l border-gray-200">
        <button
          type="button"
          onClick={() => setValue(value + 1)}
          className="
            bg-[#27AE60]
            hover:bg-[#219150]
            text-white
            px-5 py-2
            transition
          "
        >
          +
        </button>

        <button
          type="button"
          onClick={() => setValue(value > 0 ? value - 1 : 0)}
          className="
            bg-[#1E8C4E]
            hover:bg-[#176C3B]
            text-white
            px-5 py-2
            transition
          "
        >
          -
        </button>
      </div>
    </div>
  );
}