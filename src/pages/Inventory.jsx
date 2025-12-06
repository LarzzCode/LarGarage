import { useState, useEffect, useRef } from "react";
import { Search, Plus, Package, AlertTriangle, FileSpreadsheet, Trash2, Edit3, TrendingUp, Layers, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "../utils/supabaseClient";
import ModalAddInventory from "../components/ModalAddInventory";
import ModalQRCode from "../components/ModalQRCode"; // Pastikan modal QR diimport
import * as XLSX from 'xlsx';

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [qrItem, setQrItem] = useState(null); // State untuk QR Code
  
  const fileInputRef = useRef(null);

  const fetchInventory = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('inventory').select('*').order('name', { ascending: true });
    if (!error) setItems(data);
    setLoading(false);
  };

  useEffect(() => { fetchInventory(); }, []);

  // --- STATISTIK RINGKAS ---
  // Menghitung data secara real-time dari state 'items'
  const totalItems = items.length;
  const totalAssetValue = items.reduce((acc, item) => acc + (item.price * item.stock), 0);
  const lowStockCount = items.filter(item => item.stock <= 5).length;

  // --- LOGIKA IMPORT, SIMPAN, HAPUS (TETAP SAMA) ---
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const dataExcel = XLSX.utils.sheet_to_json(ws);
        const formattedData = dataExcel.map(row => {
            // Helper pembersih angka
            const parseNum = (val) => {
                if (typeof val === 'number') return Math.round(val);
                if (typeof val === 'string') return Math.round(parseFloat(val.replace(/[^0-9.]/g, ''))) || 0;
                return 0;
            };
            return {
                name: row['Nama Barang'] || row['Name'] || row['nama'] || 'Tanpa Nama',
                brand: row['Merek'] || row['Brand'] || row['Merk'] || '-',
                category: row['Kategori'] || row['Category'] || 'Umum',
                price: parseNum(row['Harga'] || row['Price']),
                stock: parseNum(row['Stok'] || row['Stock']),
                sku: row['SKU'] || row['Kode'] || `AUTO-${Math.floor(Math.random()*10000)}`
            };
        });

        if (formattedData.length === 0) { alert("Data kosong!"); setIsImporting(false); return; }
        const { error } = await supabase.from('inventory').insert(formattedData);
        if (error) throw error;
        alert(`Sukses import ${formattedData.length} barang!`);
        fetchInventory();
      } catch (error) { alert("Gagal import Excel. Cek format data."); } finally { setIsImporting(false); e.target.value = null; }
    };
    reader.readAsBinaryString(file);
  };

  const handleSaveData = async (formData) => {
    try {
      if (editingItem) {
        await supabase.from('inventory').update(formData).eq('id', editingItem.id);
      } else {
        await supabase.from('inventory').insert([formData]);
      }
      fetchInventory();
      setIsModalOpen(false);
    } catch (error) { alert("Gagal menyimpan data!"); }
  };

  const handleDelete = async (id, name) => {
    if (confirm(`Hapus permanen "${name}"?`)) {
      await supabase.from('inventory').delete().eq('id', id);
      setItems(items.filter(item => item.id !== id));
    }
  };

  const openEditModal = (item) => { setEditingItem(item); setIsModalOpen(true); };
  const openAddModal = () => { setEditingItem(null); setIsModalOpen(true); };

  // Filter
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <ModalAddInventory isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveData} initialData={editingItem} />
      <ModalQRCode isOpen={!!qrItem} onClose={() => setQrItem(null)} item={qrItem} />

      {/* --- SECTION 1: RINGKASAN STATISTIK (DASHBOARD MINI) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card Total Barang */}
        <div className="bg-white p-6 rounded-2xl border border-indigo-50 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Layers size={28} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Item</p>
            <h3 className="text-2xl font-bold text-slate-800">{totalItems} <span className="text-sm font-normal text-slate-400">SKU</span></h3>
          </div>
        </div>

        {/* Card Estimasi Aset */}
        <div className="bg-white p-6 rounded-2xl border border-indigo-50 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp size={28} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Estimasi Aset</p>
            <h3 className="text-2xl font-bold text-slate-800">
                {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(totalAssetValue)}
            </h3>
          </div>
        </div>

        {/* Card Stok Menipis */}
        <div className="bg-white p-6 rounded-2xl border border-indigo-50 shadow-sm flex items-center gap-4">
          <div className={`p-3 rounded-xl ${lowStockCount > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400'}`}>
            <AlertCircle size={28} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Stok Menipis</p>
            <h3 className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                {lowStockCount} <span className="text-sm font-normal text-slate-400">Item</span>
            </h3>
          </div>
        </div>
      </div>

      {/* --- SECTION 2: TOOLBAR (SEARCH & ACTIONS) --- */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        
        {/* Search */}
        <div className="w-full md:w-1/3 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
                type="text" 
                placeholder="Cari Barang, Merek, atau SKU..." 
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
            <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
            
            <button 
                onClick={() => fileInputRef.current.click()} 
                disabled={isImporting}
                className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
                {isImporting ? <Loader2 className="animate-spin" size={18}/> : <FileSpreadsheet size={18} />} 
                <span className="hidden md:inline">Import</span>
            </button>

            <button 
                onClick={openAddModal}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
            >
                <Plus size={20} /> Tambah Barang
            </button>
        </div>
      </div>

      {/* --- SECTION 3: DATA TABLE (TAMPILAN BARU YANG LEBIH CLEAN) --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
            <div className="p-20 text-center flex flex-col items-center text-slate-400">
                <Loader2 className="animate-spin mb-4" size={32} /> Memuat Data Gudang...
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                            <th className="px-6 py-4">Nama Barang</th>
                            <th className="px-6 py-4">Merek</th>
                            <th className="px-6 py-4">Kategori</th>
                            <th className="px-6 py-4 text-right">Harga</th>
                            <th className="px-6 py-4 w-40">Stok</th>
                            <th className="px-6 py-4 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredItems.length === 0 ? (
                            <tr><td colSpan="6" className="p-8 text-center text-slate-400 italic">Data tidak ditemukan.</td></tr>
                        ) : (
                            filteredItems.map((item) => {
                                // Logic warna stok
                                const stockColor = item.stock === 0 ? "bg-red-500" : item.stock <= 5 ? "bg-amber-500" : "bg-emerald-500";
                                const stockWidth = Math.min((item.stock / 20) * 100, 100) + "%"; // Visual bar (max 20 unit)

                                return (
                                    <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors group">
                                        {/* Nama & SKU */}
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800">{item.name}</div>
                                            <div className="text-xs text-slate-400 font-mono mt-0.5">{item.sku || "-"}</div>
                                        </td>

                                        {/* Merek */}
                                        <td className="px-6 py-4">
                                            <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold border border-slate-200">
                                                {item.brand}
                                            </span>
                                        </td>

                                        {/* Kategori */}
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {item.category}
                                        </td>

                                        {/* Harga */}
                                        <td className="px-6 py-4 text-right font-mono font-bold text-slate-700">
                                            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(item.price)}
                                        </td>

                                        {/* Stok Visual */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={`text-sm font-bold ${item.stock <= 5 ? 'text-red-600' : 'text-slate-700'}`}>
                                                    {item.stock}
                                                </span>
                                                {item.stock === 0 && <AlertTriangle size={14} className="text-red-500" />}
                                            </div>
                                            {/* Progress Bar Stok */}
                                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${stockColor}`} style={{ width: stockWidth }}></div>
                                            </div>
                                        </td>

                                        {/* Aksi (Edit, Hapus, QR) */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => setQrItem(item)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600" title="Cetak QR">
                                                    <Package size={18} />
                                                </button>
                                                <button onClick={() => openEditModal(item)} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600" title="Edit">
                                                    <Edit3 size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(item.id, item.name)} className="p-2 hover:bg-red-50 rounded-lg text-red-600" title="Hapus">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;