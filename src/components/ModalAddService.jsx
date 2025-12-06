import { useState, useEffect } from "react";
import { X, Plus, Trash2, ShoppingCart, Wrench, Printer, Phone } from "lucide-react"; // Import Icon Phone
import { supabase } from "../utils/supabaseClient";

const ModalAddService = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    customer: "", 
    phone: "", // <-- 1. STATE BARU
    plate: "", car: "", vin: "", status: "Pending", 
    items: [], price: 0
  });

  const [inventoryList, setInventoryList] = useState([]);
  const [selectedItem, setSelectedItem] = useState("");

  useEffect(() => {
    if (isOpen) {
      const fetchInventory = async () => {
        const { data } = await supabase.from('inventory').select('*').gt('stock', 0);
        if (data) setInventoryList(data);
      };
      fetchInventory();

      if (initialData) {
        setFormData(initialData);
      } else {
        setFormData({ customer: "", phone: "", plate: "", car: "", vin: "", status: "Pending", items: [], price: 0 });
      }
    }
  }, [isOpen, initialData]);

  // --- LOGIKA KERANJANG & ITEM (TIDAK BERUBAH) ---
  const handleAddItem = () => {
    if (!selectedItem) return;
    const product = inventoryList.find(p => p.id === parseInt(selectedItem));
    const existingItemIndex = formData.items.findIndex(i => i.id === product.id);
    let newItems = [...formData.items];
    if (existingItemIndex >= 0) {
      newItems[existingItemIndex].qty += 1;
      newItems[existingItemIndex].total = newItems[existingItemIndex].qty * newItems[existingItemIndex].price;
    } else {
      newItems.push({ id: product.id, name: product.name, price: product.price, qty: 1, total: product.price, category: product.category });
    }
    updatePrice(newItems);
  };

  const handleAddServiceFee = () => {
    const fee = prompt("Masukkan Nama Jasa:", "Jasa Servis");
    const price = prompt("Biaya Jasa (Rp):", "100000");
    if (fee && price) {
      const newItem = { id: `manual-${Date.now()}`, name: fee, price: parseInt(price), qty: 1, total: parseInt(price), category: "Jasa" };
      updatePrice([...formData.items, newItem]);
    }
  };

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    updatePrice(newItems);
  };

  const updatePrice = (items) => {
    const total = items.reduce((acc, curr) => acc + curr.total, 0);
    setFormData(prev => ({ ...prev, items: items, price: total }));
    setSelectedItem("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-4 flex flex-col md:flex-row h-[90vh]">
        
        {/* KOLOM KIRI: FORM */}
        <div className="w-full md:w-7/12 flex flex-col border-r border-slate-100">
          <div className="flex justify-between items-center p-6 border-b bg-white sticky top-0 z-10">
            <h3 className="font-bold text-gray-800 text-xl">{initialData ? "Edit Transaksi" : "Transaksi Baru"}</h3>
            <button onClick={onClose} className="hover:bg-slate-100 p-2 rounded-full text-gray-500"><X size={24} /></button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider">Informasi Kendaraan</h4>
              <div className="grid grid-cols-2 gap-4">
                <input className="border p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Nama Pelanggan" value={formData.customer} onChange={e => setFormData({...formData, customer: e.target.value})} required />
                
                {/* 2. INPUT NO HP BARU */}
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    className="border p-3 pl-10 rounded-xl w-full focus:ring-2 focus:ring-indigo-500 outline-none" 
                    placeholder="No. HP / WA (08xx)" 
                    type="number"
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                  />
                </div>

                <input className="border p-3 rounded-xl uppercase focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Plat Nomor" value={formData.plate} onChange={e => setFormData({...formData, plate: e.target.value})} required />
                <input className="border p-3 rounded-xl uppercase focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="VIN / Rangka" value={formData.vin} onChange={e => setFormData({...formData, vin: e.target.value})} />
                <input className="border p-3 rounded-xl col-span-2 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Jenis Mobil (Merk/Tipe)" value={formData.car} onChange={e => setFormData({...formData, car: e.target.value})} required />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider">Input Item & Jasa</h4>
              <div className="flex gap-2">
                <select className="flex-1 border p-3 rounded-xl bg-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={selectedItem} onChange={(e) => setSelectedItem(e.target.value)}>
                  <option value="">-- Pilih Sparepart --</option>
                  {inventoryList.map(item => <option key={item.id} value={item.id}>{item.name} (Stok: {item.stock})</option>)}
                </select>
                <button type="button" onClick={handleAddItem} className="bg-indigo-100 text-indigo-700 px-4 rounded-xl hover:bg-indigo-200"><Plus size={20}/></button>
                <button type="button" onClick={handleAddServiceFee} className="bg-orange-100 text-orange-700 px-4 rounded-xl hover:bg-orange-200"><Wrench size={20}/></button>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                {formData.items.length === 0 ? <p className="text-xs text-center text-gray-400 py-6">Keranjang masih kosong.</p> : formData.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border-b border-slate-200 last:border-0 text-sm hover:bg-white transition-colors">
                    <div><span className="font-bold text-slate-700 block">{item.name}</span><span className="text-xs text-slate-400">{item.qty} x Rp {item.price.toLocaleString()}</span></div>
                    <div className="flex items-center gap-3"><span className="font-bold text-slate-700">Rp {item.total.toLocaleString()}</span><button type="button" onClick={() => handleRemoveItem(index)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button></div>
                  </div>
                ))}
              </div>
            </div>
          </form>

          <div className="p-6 border-t bg-white sticky bottom-0 z-10 flex gap-4 items-center">
            <div className="flex-1">
              <span className="text-xs text-gray-500 font-bold uppercase">Status</span>
              <select className="w-full mt-1 border-none bg-slate-100 py-2 px-3 rounded-lg font-bold text-slate-700 cursor-pointer" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                <option>Pending</option><option>Proses</option><option>Selesai</option>
              </select>
            </div>
            <button onClick={handleSubmit} className="flex-2 bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-all active:scale-95 flex items-center gap-2">
              <Printer size={20} /> Simpan & Proses
            </button>
          </div>
        </div>

        {/* KOLOM KANAN: LIVE RECEIPT (DENGAN TAMBAHAN NO HP) */}
        <div className="w-full md:w-5/12 bg-slate-100 p-8 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <div className="bg-white w-full max-w-sm shadow-2xl p-6 relative text-xs font-mono text-slate-600 transform rotate-1 transition-transform hover:rotate-0 duration-300">
            <div className="absolute top-0 left-0 right-0 h-2 bg-slate-100" style={{clipPath: "polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)"}}></div>
            
            <div className="text-center mb-6 mt-4">
              <h2 className="text-lg font-bold text-black uppercase tracking-widest border-b-2 border-black pb-2 mb-2">Bengkel PRO</h2>
              <p>Jl. Raya Otomotif No. 88</p>
            </div>

            <div className="mb-4 space-y-1">
              <div className="flex justify-between"><span>Customer:</span> <span className="font-bold text-black">{formData.customer || "..."}</span></div>
              <div className="flex justify-between"><span>Phone:</span> <span className="font-bold text-black">{formData.phone || "-"}</span></div> {/* TAMPILKAN HP */}
              <div className="flex justify-between"><span>Plat No:</span> <span className="font-bold text-black uppercase">{formData.plate || "..."}</span></div>
            </div>

            <div className="border-b border-dashed border-slate-300 mb-4"></div>

            <div className="space-y-2 mb-4 min-h-[100px]">
              {formData.items.map((item, idx) => (
                <div key={idx} className="flex flex-col">
                  <span className="font-bold text-slate-800">{item.name}</span>
                  <div className="flex justify-between pl-2"><span>{item.qty} x {item.price.toLocaleString()}</span><span>{item.total.toLocaleString()}</span></div>
                </div>
              ))}
            </div>

            <div className="border-b-2 border-black mb-4"></div>
            <div className="flex justify-between text-base font-bold text-black mb-8"><span>TOTAL</span><span>Rp {formData.price.toLocaleString()}</span></div>
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-slate-100" style={{clipPath: "polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)"}}></div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ModalAddService;