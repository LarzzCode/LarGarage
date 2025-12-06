import { useRef } from "react";
import { Eraser } from "lucide-react";

const CarInspector = ({ marks, setMarks, readOnly = false }) => {
  // Gambar Rangka Mobil (Ganti dengan gambar Anda sendiri jika ada)
  const carImage = "https://img.freepik.com/free-vector/car-outline-icons-front-side-rear-view_116137-2708.jpg?w=1380";
  const imageRef = useRef(null);

  // Fungsi Tambah Titik
  const handleImageClick = (e) => {
    if (readOnly) return;

    const rect = imageRef.current.getBoundingClientRect();
    // Hitung posisi persen (%) agar responsif
    const x = ((e.clientX - rect.left) / rect.width) * 100; 
    const y = ((e.clientY - rect.top) / rect.height) * 100; 

    setMarks([...marks, { x, y, note: "Kerusakan" }]);
  };

  // Fungsi Hapus Titik
  const removeMark = (index) => {
    if (readOnly) return;
    const updatedMarks = marks.filter((_, i) => i !== index);
    setMarks(updatedMarks);
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-bold text-gray-700">
          Inspeksi Bodi Kendaraan
        </label>
        {!readOnly && (
          <button 
            type="button"
            onClick={() => setMarks([])} 
            className="text-xs flex items-center gap-1 text-red-500 hover:text-red-700 bg-red-50 px-2 py-1 rounded"
          >
            <Eraser size={14} /> Reset
          </button>
        )}
      </div>

      <div className="relative w-full border border-gray-200 rounded-lg overflow-hidden bg-white shadow-inner select-none">
        
        {/* Gambar Utama */}
        <img
          ref={imageRef}
          src={carImage}
          alt="Car Blueprint"
          className={`w-full h-auto object-contain ${!readOnly ? "cursor-crosshair" : ""}`}
          onClick={handleImageClick}
        />

        {/* Render Titik Merah */}
        {marks.map((mark, index) => (
          <div
            key={index}
            onClick={(e) => { e.stopPropagation(); removeMark(index); }}
            className={`absolute w-4 h-4 bg-red-500/80 rounded-full border-2 border-white shadow-sm transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center group ${!readOnly ? "cursor-pointer hover:scale-125 hover:bg-red-600" : ""}`}
            style={{ left: `${mark.x}%`, top: `${mark.y}%` }}
          >
            {!readOnly && (
              <span className="absolute bottom-5 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                Hapus
              </span>
            )}
          </div>
        ))}

        {!readOnly && marks.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="bg-black/50 text-white px-3 py-1 rounded-full text-xs backdrop-blur-sm">
              Klik pada gambar untuk menandai kerusakan
            </span>
          </div>
        )}
      </div>
      
      <p className="text-xs text-gray-400 mt-2 text-center">
        {readOnly 
          ? `${marks.length} titik kerusakan tercatat.` 
          : "Klik bagian mobil yang rusak/baret. Klik titik merah untuk menghapus."
        }
      </p>
    </div>
  );
};

export default CarInspector;