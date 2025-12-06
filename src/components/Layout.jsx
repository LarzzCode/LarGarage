import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Wrench, Settings, LogOut, Car, Package, Menu, Users } from "lucide-react";
import { useState } from "react";

const Layout = ({ children }) => {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: "Dashboard", path: "/" },
    { icon: <Users size={20} />, label: "Pelanggan", path: "/customers" },
    { icon: <Wrench size={20} />, label: "Service List", path: "/services" },
    { icon: <Package size={20} />, label: "Inventory", path: "/inventory" },
    { icon: <Settings size={20} />, label: "Pengaturan", path: "/settings" },
  ];

  

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 text-slate-800 font-sans">
      <button className="md:hidden fixed top-4 right-4 z-50 bg-white p-2 rounded-full shadow-lg text-indigo-600" onClick={() => setIsMobileOpen(!isMobileOpen)}>
        <Menu size={24} />
      </button>

      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-72 bg-white/80 backdrop-blur-xl border-r border-indigo-100 transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="p-8 flex items-center gap-3">
          <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-600/30"><Car size={26} /></div>
          <div><h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Lar<span className="text-indigo-600">Garage</span></h1><p className="text-xs text-slate-500 font-medium">Garage Management</p></div>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} onClick={() => setIsMobileOpen(false)} className={`relative flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group ${isActive ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 translate-x-1" : "text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 hover:pl-6"}`}>
                <span className={isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-600"}>{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 mt-auto">
          <button className="flex items-center justify-center gap-2 px-4 py-3 text-rose-500 hover:bg-rose-50 rounded-xl w-full transition-colors font-medium text-sm"><LogOut size={18} /> Keluar Aplikasi</button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto h-screen">
        <div className="animate-in fade-in zoom-in duration-500">{children}</div>
      </main>
    </div>
  );
};
export default Layout;