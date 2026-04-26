import {
  X,
  FileText,
  Building2,
  MapPin,
  Star,
  BriefcaseBusiness,
} from "lucide-react";

export default function DoctorDetails({
  doctor,
  onClose,
  showMore,
  setShowMore,
}) {
  if (!doctor) return null;

  return (
    <div className="w-full h-full relative">

      {/* CLOSE */}
      <button
        onClick={onClose}
        className=" top-0 right-0 bg-[#DBF4D3] border mb-6 border-[#56B943] text-white p-2 rounded-full shadow hover:scale-105 transition"
      >
        <X className="w-4 h-4 text-[#000000]" />
      </button>

      {/* IMAGE */}
      <img
        src={doctor.image}
        className="w-full h-60 object-cover rounded-xl"
        alt={doctor.name}
      />

      {/* NAME */}
      <h2 className="text-xl font-semibold mt-4">
        {doctor.name}
      </h2>

      <p className="text-gray-500">
        {doctor.specialty}
      </p>

      {/* INFO */}
      <div className="mt-4 space-y-3 text-gray-600 text-sm">

        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 " />
          <span>{doctor.hospital}</span>
        </div>

        <div className="flex items-center justify-between gap-4">

          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 " />
            <span>{doctor.city}</span>
          </div>

          <div className="flex items-center gap-1 font-bold">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span>{doctor.rating}</span>
          </div>

        </div>

        <div className="flex items-center gap-2">
          <BriefcaseBusiness className="w-4 h-4 " />
          <span>{doctor.experience} years experience</span>
        </div>

      </div>

      {/* DESCRIPTION */}
      <div className="mt-5">

        <div className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
          <FileText className="w-4 h-4 " />
          <span>Description</span>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed">
          {showMore
            ? doctor.description
            : doctor.description?.slice(0, 120) + "..."}
        </p>

        {doctor.description?.length > 120 && (
          <button
            onClick={() => setShowMore(!showMore)}
            className="text-[#27772B] text-sm mt-2 font-medium hover:underline"
          >
            {showMore ? "See less" : "See more"}
          </button>
        )}

      </div>

      {/* ACTION */}
      <button className="w-full mt-6 bg-blue-500 text-white py-2 rounded-lg">
        Ask for opinion
      </button>

    </div>
  );
}