import { useState, useEffect } from "react";
import { Search, Plus, FileText, Trash2, Edit, Loader2, LayoutList, Kanban, MessageCircle, Phone } from "lucide-react";
import { generateInvoice } from "../utils/invoiceGenerator";
import ModalAddService from "../components/ModalAddService";
import ServiceKanban from "../components/ServiceKanban";
import { supabase } from "../utils/supabaseClient";

const Services = () => {
  const [services, setServices] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewMode, setViewMode] = useState("table");

  // Fetch Data (Sama seperti sebelumnya)
  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: servicesData, error: servicesError } = await supabase.from('services').select('*').order('created_at', { ascending: false });
      if (servicesError) throw servicesError;
      setServices(servicesData);

      const { data: settingsData } = await supabase.from('settings').select('*').eq('id', 1).single();
      if (settingsData) setSettings(settingsData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Update Handle Save (Tambahkan 'phone')
  const handleSaveData = async (formData) => {
    try {
      const payload = {
        customer: formData.customer,
        phone: formData.phone, // <--- TAMBAHKAN INI
        plate: formData.plate,
        car: formData.car,
        vin: formData.vin,
        status: formData.status,
        price: formData.price,
        items: formData.items,
        signature: formData.signature
      };

      if (editingItem) {
        const { error } = await supabase.from('services').update(payload).eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('services').insert([payload]);
        if (error) throw error;
      }
      fetchData();
      setIsModalOpen(false);
    } catch (error) {
      alert("Gagal menyimpan data!");
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Hapus data?")) {
      await supabase.from('services').delete().eq('id', id);
      setServices(services.filter(item => item.id !== id));
    }
  };

  // --- LOGIKA WHATSAPP PINTAR ---
  const sendWhatsApp = (item) => {
    if (!item.phone) return alert("Nomor HP pelanggan belum diisi!");

    // Bersihkan nomor (ganti 08... jadi 628...)
    let phone = item.phone.replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) phone = '62' + phone.substring(1);

    // Template Pesan Berdasarkan Status
    let message = "";
    const total = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(item.price);

    if (item.status === "Selesai") {
      message = `Halo Kak ${item.customer},%0A%0AKabar gembira! Mobil ${item.car} (${item.plate}) sudah *SELESAI* diservis.%0ATotal Biaya: *${total}*.%0A%0ASilakan datang untuk pengambilan unit. Terima kasih!%0A- BengkelPRO`;
    } else if (item.status === "Proses") {
      message = `Halo Kak ${item.customer},%0A%0AMobil ${item.car} (${item.plate}) sedang kami *PROSES* perbaikan.%0AEtimasi biaya saat ini: ${total}.%0A%0AKami akan kabari jika sudah selesai. Terima kasih!`;
    } else {
      message = `Halo Kak ${item.customer},%0A%0AMobil ${item.car} (${item.plate}) sudah terdaftar dalam antrean servis kami.%0AMohon ditunggu updatenya.%0A- BengkelPRO`;
    }

    // Buka WhatsApp Web / App
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  // Helper
  const handleEditClick = (item) => { setEditingItem(item); setIsModalOpen(true); };
  const getStatusColor = (status) => {
    switch (status) {
      case "Selesai": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Proses": return "bg-blue-100 text-blue-700 border-blue-200";
      default: return "bg-amber-100 text-amber-700 border-amber-200";
    }
  };

  const filtered = services.filter(s => s.customer.toLowerCase().includes(searchTerm.toLowerCase()) || s.plate.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div>
      <ModalAddService isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveData} initialData={editingItem} />

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div><h1 className="text-2xl font-bold text-slate-800">Daftar Servis</h1><p className="text-slate-500 text-sm">Kelola transaksi dan notifikasi pelanggan.</p></div>
        <div className="flex gap-3">
          <div className="bg-white border border-indigo-100 p-1 rounded-lg flex shadow-sm">
            <button onClick={() => setViewMode("table")} className={`p-2 rounded-md ${viewMode === "table" ? "bg-indigo-100 text-indigo-700" : "text-slate-400"}`}><LayoutList size={20} /></button>
            <button onClick={() => setViewMode("board")} className={`p-2 rounded-md ${viewMode === "board" ? "bg-indigo-100 text-indigo-700" : "text-slate-400"}`}><Kanban size={20} /></button>
          </div>
          <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-lg"><Plus size={20} /> Tambah Servis</button>
        </div>
      </div>

      {viewMode === "board" ? <ServiceKanban services={filtered} onStatusChange={fetchData} /> : (
        <>
          <div className="bg-white p-4 rounded-xl border border-indigo-50 shadow-sm mb-6 flex items-center gap-4">
            <Search className="text-slate-400" />
            <input className="w-full outline-none" placeholder="Cari..." onChange={(e) => setSearchTerm(e.target.value)} />
          </div>

          <div className="bg-white rounded-xl border border-indigo-50 shadow-sm overflow-hidden">
            {loading ? <div className="p-12 text-center"><Loader2 className="animate-spin inline" /> Loading...</div> : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr><th className="p-4">Pelanggan</th><th className="p-4">Kendaraan</th><th className="p-4">Biaya</th><th className="p-4">Status</th><th className="p-4 text-right">Aksi</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-slate-800">{item.customer}</div>
                          {/* TAMPILKAN NO HP */}
                          <div className="text-xs text-slate-500 font-mono flex items-center gap-1">
                            <Phone size={10} /> {item.phone || "-"}
                          </div>
                        </td>
                        <td className="p-4 text-slate-700"><div>{item.car}</div><div className="text-xs font-mono text-slate-400">{item.plate}</div></td>
                        <td className="p-4 text-slate-700 font-medium">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(item.price)}</td>
                        <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(item.status)}`}>{item.status}</span></td>
                        <td className="p-4">
                          <div className="flex justify-end gap-2">
                            {/* TOMBOL WHATSAPP BARU */}
                            <button onClick={() => sendWhatsApp(item)} title="Kirim Status via WA" className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-100">
                              <MessageCircle size={18} />
                            </button>

                            <button onClick={() => generateInvoice(item, settings)} title="Cetak Invoice" className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><FileText size={18} /></button>
                            <button onClick={() => handleEditClick(item)} title="Edit" className="p-2 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"><Edit size={18} /></button>
                            <button onClick={() => handleDelete(item.id)} title="Hapus" className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Services;