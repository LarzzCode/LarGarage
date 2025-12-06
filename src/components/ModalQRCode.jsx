import { useRef } from "react";
import { X, Printer, Download } from "lucide-react";
import QRCode from "react-qr-code";
import html2canvas from "html2canvas"; // Opsional: untuk download gambar, tapi kita pakai print browser dulu biar simpel

const ModalQRCode = ({ isOpen, onClose, item }) => {
  const labelRef = useRef();

  if (!isOpen || !item) return null;

  const handlePrint = () => {
    // Teknik Print Spesifik Area
    const printContent = labelRef.current.innerHTML;
    const originalContents = document.body.innerHTML;

    // Buat iframe sementara untuk print agar styling terjaga
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Print Label</title>');
    printWindow.document.write('<script src="https://cdn.tailwindcss.com"></script>'); // Load Tailwind di print window
    printWindow.document.write('</head><body class="flex justify-center items-center h-screen bg-white">');
    printWindow.document.write(printContent);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b bg-slate-50">
          <h3 className="font-bold text-slate-800">Cetak Label Rak</h3>
          <button onClick={onClose} className="hover:bg-slate-200 p-2 rounded-full text-slate-500"><X size={20} /></button>
        </div>

        {/* --- AREA LABEL YANG AKAN DICETAK --- */}
        <div className="p-8 bg-slate-100 flex justify-center">
          <div 
            ref={labelRef}
            className="bg-white p-4 w-64 border-2 border-black rounded-lg flex flex-col items-center text-center shadow-lg"
            style={{ fontFamily: 'monospace' }} // Font monospace ala struk/label
          >
            {/* Header Label */}
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">LarGarage</p>
            
            {/* Nama Barang */}
            <h2 className="text-xl font-black text-black leading-tight mb-1">{item.name}</h2>
            <p className="text-sm font-bold text-slate-600 mb-4">{item.sku || "NO-SKU"}</p>

            {/* QR Code */}
            <div className="p-2 border border-slate-200 rounded">
                <QRCode 
                    value={JSON.stringify({ id: item.id, sku: item.sku })} 
                    size={120} 
                    fgColor="#000000"
                    bgColor="#FFFFFF"
                />
            </div>

            {/* Footer Harga */}
            <div className="mt-4 border-t-2 border-dashed border-slate-300 w-full pt-2">
                <p className="text-[10px] text-slate-400 mb-1">HARGA SATUAN</p>
                <p className="text-2xl font-bold text-black tracking-tighter">
                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(item.price)}
                </p>
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-5 border-t bg-white flex gap-3">
          <button 
            onClick={handlePrint}
            className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95"
          >
            <Printer size={18} /> Print Label
          </button>
        </div>

      </div>
    </div>
  );
};

export default ModalQRCode;