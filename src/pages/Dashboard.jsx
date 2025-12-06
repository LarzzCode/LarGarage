import { useEffect, useState } from "react";
import { Users, DollarSign, Car, Clock, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { supabase } from "../utils/supabaseClient";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalServices: 0, totalIncome: 0, pendingCount: 0, recentServices: [] });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data: allServices, error } = await supabase.from('services').select('*').order('created_at', { ascending: false });
      if (error) throw error;

      const totalServices = allServices.length;
      const totalIncome = allServices.reduce((acc, curr) => acc + (curr.price || 0), 0);
      const pendingCount = allServices.filter(s => s.status === 'Pending').length;
      const recentServices = allServices.slice(0, 5);

      setStats({ totalServices, totalIncome, pendingCount, recentServices });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  const chartData = [ { name: 'Sen', total: 4 }, { name: 'Sel', total: 6 }, { name: 'Rab', total: 8 }, { name: 'Kam', total: 5 }, { name: 'Jum', total: 9 }, { name: 'Sab', total: 12 } ];

  if (loading) return <div className="h-screen flex justify-center items-center"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-slate-800">Dashboard Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon={<Car size={24} />} color="bg-blue-500" label="Total Servis" value={stats.totalServices} />
        <StatCard icon={<DollarSign size={24} />} color="bg-green-500" label="Pendapatan" value={`Rp ${stats.totalIncome.toLocaleString()}`} />
        <StatCard icon={<Clock size={24} />} color="bg-orange-500" label="Pending" value={stats.pendingCount} />
        <StatCard icon={<Users size={24} />} color="bg-purple-500" label="Pelanggan" value={stats.totalServices} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-indigo-50 shadow-sm">
          <h3 className="font-bold mb-4 text-slate-700">Statistik Kunjungan</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#F3F4F6' }} />
                <Bar dataKey="total" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-indigo-50 shadow-sm">
          <h3 className="font-bold mb-4 text-slate-700">Antrean Terbaru</h3>
          <div className="space-y-4">
            {stats.recentServices.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm">{item.customer.charAt(0)}</div>
                <div className="overflow-hidden"><h4 className="font-bold text-sm truncate">{item.customer}</h4><p className="text-xs text-slate-500 truncate">{item.car} • {item.plate}</p></div>
                <span className={`text-[10px] px-2 py-1 rounded-full font-bold ml-auto ${item.status === 'Selesai' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, color, label, value }) => (
  <div className="bg-white p-6 rounded-xl border border-indigo-50 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
    <div className={`p-4 rounded-lg text-white ${color}`}>{icon}</div>
    <div><p className="text-sm text-slate-500">{label}</p><h3 className="text-2xl font-bold text-slate-800">{value}</h3></div>
  </div>
);

export default Dashboard;