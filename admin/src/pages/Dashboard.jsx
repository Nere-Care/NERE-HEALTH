import StatCard from "../components/StatCard";

export default function Dashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Users" value="12,450" />
        <StatCard title="Doctors" value="1,250" />
        <StatCard title="Hospitals" value="85" />
        <StatCard title="Consultations" value="9,420" />
      </div>
    </div>
  );
}