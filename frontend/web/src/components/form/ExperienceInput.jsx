export default function ExperienceInput({ value, setValue }) {
  return (
    <div className="flex items-center bg-[rgba(217,218,220,0.1)] border border-gray-300 rounded-lg overflow-hidden">
      <input
        readOnly
        value={`${value} Year(s) Experience`}
        className="w-full px-4 py-3 bg-transparent outline-none"
      />

      <div className="flex flex-col">
        <button
          type="button"
          onClick={() => setValue(value + 1)}
          className="bg-[#27AE60] text-white px-4 py-2"
        >
          +
        </button>

        <button
          type="button"
          onClick={() => setValue(value > 0 ? value - 1 : 0)}
          className="bg-[#1E8C4E] text-white px-4 py-2"
        >
          -
        </button>
      </div>
    </div>
  );
}