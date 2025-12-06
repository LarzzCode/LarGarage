import { useState, useEffect } from "react";
import { Search, Calendar, Car, Loader2, Award, X, History, ChevronRight } from "lucide-react";
import { supabase } from "../utils/supabaseClient";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // State untuk Modal Detail
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // --- LOGIKA AGREGASI DATA ---
      const customerMap = {};

      data.forEach(service => {
        const nameKey = service.customer.trim().toLowerCase();
        const originalName = service.customer.trim();

        if (!customerMap[nameKey]) {
          customerMap[nameKey] = {
            id: nameKey,
            name: originalName,
            totalVisits: 0,
            totalSpent: 0,
            lastVisit: service.created_at,
            plates: new Set(),
            cars: new Set(),
            // FITUR BARU: Simpan detail riwayat
            history: [] 
          };
        }

        const customer = customerMap[nameKey];
        
        // Update Statistik
        customer.totalVisits += 1;
        customer.totalSpent += (service.price || 0);
        customer.plates.add(service.plate);
        customer.cars.add(service.car);
        
        if (new Date(service.created_at) > new Date(customer.lastVisit)) {
          customer.lastVisit = service.created_at;
        }

        // Push data ke history
        customer.history.push({
          date: service.created_at,
          car: service.car,
          plate: service.plate,
          price: service.price || 0,
          status: service.status
        });
      });

      const customerArray = Object.values(customerMap).map(c => ({
        ...c,
        plates: Array.from(c.plates).join(", "),
        cars: Array.from(c.cars).join(", ")
      }));

      setCustomers(customerArray.sort((a, b) => b.totalSpent - a.totalSpent));

    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.plates.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper Format Rupiah
  const formatRupiah = (num) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(num);

  return (
    <div>
      {/* --- MODAL DETAIL RIWAYAT (POPUP) --- */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header Modal */}
            <div className="flex justify-between items-center p-6 border-b bg-slate-50">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{selectedCustomer.name}</h3>
                <p className="text-sm text-slate-500">Riwayat Kunjungan & Transaksi</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500">
                <X size={24} />
              </button>
            </div>

            {/* Content Tabel (Scrollable) */}
            <div className="overflow-y-auto p-0">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 text-slate-600 text-xs uppercase font-bold sticky top-0">
                  <tr>
                    <th className="p-4 border-b">Tanggal</th>
                    <th className="p-4 border-b">Kendaraan</th>
                    <th className="p-4 border-b">Status</th>
                    <th className="p-4 border-b text-right">Biaya</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedCustomer.history.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-sm text-slate-600">
                        {new Date(item.date).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800 text-sm">{item.car}</div>
                        <div className="text-xs text-slate-400 font-mono">{item.plate}</div>
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] px-2 py-1 rounded-full font-bold border ${
                          item.status === 'Selesai' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4 text-right font-medium text-slate-700 text-sm">
                        {formatRupiah(item.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 font-bold text-slate-800">
                  <tr>
                    <td colSpan="3" className="p-4 text-right">TOTAL AKUMULASI:</td>
                    <td className="p-4 text-right text-indigo-600">{formatRupiah(selectedCustomer.totalSpent)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* HEADER PAGE */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Data Pelanggan</h1>
          <p className="text-slate-500 mt-1">Analisis loyalitas dan riwayat kendaraan.</p>
        </div>
        <div className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg font-bold text-sm">
          {customers.length} Pelanggan Unik
        </div>
      </div>

      <div className="bg-white p-2 rounded-2xl shadow-sm border border-indigo-50 mb-8 flex items-center gap-2 max-w-lg">
        <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600"><Search size={20} /></div>
        <input 
          type="text" 
          placeholder="Cari nama atau plat nomor..." 
          className="w-full bg-transparent outline-none text-slate-700 placeholder:text-slate-400 font-medium"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* CUSTOMER GRID */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 flex flex-col items-center gap-2"><Loader2 className="animate-spin" /> Menganalisis Data...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCustomers.map((customer, index) => (
            <div 
              key={customer.id} 
              onClick={() => setSelectedCustomer(customer)} // <-- KLIK DISINI MEMBUKA MODAL
              className="bg-white rounded-2xl border border-indigo-50 p-6 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 group relative overflow-hidden cursor-pointer"
            >
              {index < 3 && (
                <div className="absolute top-0 right-0 bg-yellow-400 text-white text-xs font-bold px-3 py-1 rounded-bl-xl shadow-sm flex items-center gap-1">
                  <Award size={12} /> TOP {index + 1}
                </div>
              )}

              <div className="flex items-center gap-4 mb-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg ${
                  index < 3 ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-white" : "bg-slate-100 text-slate-500"
                }`}>
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{customer.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                    <Calendar size={12} /> Terakhir: {new Date(customer.lastVisit).toLocaleDateString("id-ID")}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-indigo-50 p-3 rounded-xl">
                  <p className="text-xs text-indigo-600 font-medium mb-1">Total Kunjungan</p>
                  <p className="text-lg font-bold text-indigo-900">{customer.totalVisits}x</p>
                </div>
                <div className="bg-emerald-50 p-3 rounded-xl">
                  <p className="text-xs text-emerald-600 font-medium mb-1">Total Transaksi</p>
                  <p className="text-lg font-bold text-emerald-900 truncate">{formatRupiah(customer.totalSpent)}</p>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-100 pt-4 flex justify-between items-center text-slate-400 text-xs">
                <div className="flex items-center gap-2">
                  <History size={14} /> Lihat Riwayat Detail
                </div>
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform text-indigo-400" />
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Customers;