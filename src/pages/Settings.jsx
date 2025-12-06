import { useState, useEffect } from "react";
import { Save, Building2, MapPin, Phone, User, Loader2 } from "lucide-react";
import { supabase } from "../utils/supabaseClient";

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    workshop_name: "",
    address: "",
    phone: "",
    owner: ""
  });

  // 1. Fetch Data saat halaman dibuka
  const fetchSettings = async () => {
    try {
      setLoading(true);
      // Kita ambil data dengan ID = 1 (Karena cuma ada 1 baris pengaturan)
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (error) throw error;
      if (data) setFormData(data);
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // 2. Simpan Perubahan
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from('settings')
        .update({
          workshop_name: formData.workshop_name,
          address: formData.address,
          phone: formData.phone,
          owner: formData.owner
        })
        .eq('id', 1);

      if (error) throw error;
      alert("Pengaturan berhasil disimpan!");
    } catch (error) {
      alert("Gagal menyimpan pengaturan.");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Pengaturan Bengkel</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-indigo-50 overflow-hidden">
        <div className="bg-indigo-50/50 p-6 border-b border-indigo-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-600">
              <Building2 size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-indigo-900">Profil Usaha</h2>
              <p className="text-sm text-indigo-600/80">Informasi ini akan tampil di Header Invoice PDF.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-8 space-y-6">
          
          {/* Nama Bengkel */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-600 mb-2">
              <Building2 size={16} /> Nama Bengkel
            </label>
            <input 
              type="text" 
              name="workshop_name"
              value={formData.workshop_name}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-slate-800"
            />
          </div>

          {/* Alamat */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-600 mb-2">
              <MapPin size={16} /> Alamat Lengkap
            </label>
            <textarea 
              name="address"
              rows="3"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* No Telepon */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-600 mb-2">
                <Phone size={16} /> No. Telepon / HP
              </label>
              <input 
                type="text" 
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>

            {/* Pemilik / Admin */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-600 mb-2">
                <User size={16} /> Nama Pemilik / Admin
              </label>
              <input 
                type="text" 
                name="owner"
                value={formData.owner}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button 
              type="submit" 
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-70"
            >
              {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              Simpan Perubahan
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Settings;