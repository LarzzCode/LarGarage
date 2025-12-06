import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Calendar, User, Wrench, MoreHorizontal } from "lucide-react";
import { supabase } from "../utils/supabaseClient";

const ServiceKanban = ({ services, onStatusChange }) => {
  // State lokal untuk kolom
  const [columns, setColumns] = useState({
    Pending: [],
    Proses: [],
    Selesai: []
  });

  // 1. Grouping Data (Mengelompokkan servis berdasarkan status)
  useEffect(() => {
    const newColumns = { Pending: [], Proses: [], Selesai: [] };
    
    services.forEach(item => {
      if (newColumns[item.status]) {
        newColumns[item.status].push(item);
      } else {
        // Fallback jika ada status aneh, masukkan ke Pending
        newColumns.Pending.push(item);
      }
    });

    setColumns(newColumns);
  }, [services]);

  // 2. Logika saat Kartu Dilepas (Dropped)
  const onDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    // Jika posisi tidak berubah, jangan lakukan apa-apa
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // --- OPTIMISTIC UI UPDATE (Update Tampilan Dulu Biar Cepat) ---
    const startCol = columns[source.droppableId];
    const finishCol = columns[destination.droppableId];
    const movedItem = startCol[source.index];

    // Jika pindah di kolom yang sama (Reorder)
    if (source.droppableId === destination.droppableId) {
      const newItems = Array.from(startCol);
      newItems.splice(source.index, 1);
      newItems.splice(destination.index, 0, movedItem);
      setColumns({ ...columns, [source.droppableId]: newItems });
    } 
    // Jika pindah ke kolom lain (Ganti Status)
    else {
      const sourceItems = Array.from(startCol);
      sourceItems.splice(source.index, 1);
      const destItems = Array.from(finishCol);
      destItems.splice(destination.index, 0, { ...movedItem, status: destination.droppableId });
      
      setColumns({
        ...columns,
        [source.droppableId]: sourceItems,
        [destination.droppableId]: destItems
      });

      // --- UPDATE DATABASE ---
      try {
        await supabase
          .from('services')
          .update({ status: destination.droppableId }) // Update status baru
          .eq('id', draggableId); // Berdasarkan ID
        
        // Panggil fungsi refresh di parent jika perlu
        if (onStatusChange) onStatusChange();
        
      } catch (error) {
        console.error("Gagal update status:", error);
        alert("Gagal memindahkan kartu (Koneksi Error)");
      }
    }
  };

  // Helper Warna Header Kolom
  const getColColor = (status) => {
    switch (status) {
      case "Pending": return "bg-amber-100 text-amber-700 border-amber-200";
      case "Proses": return "bg-blue-100 text-blue-700 border-blue-200";
      case "Selesai": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      default: return "bg-slate-100";
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-6 overflow-x-auto pb-8 h-[calc(100vh-200px)]">
        
        {Object.entries(columns).map(([columnId, items]) => (
          <div key={columnId} className="flex-1 min-w-[300px] flex flex-col bg-slate-50/50 rounded-xl border border-slate-200">
            
            {/* Header Kolom */}
            <div className={`p-4 font-bold flex justify-between items-center border-b ${getColColor(columnId)} rounded-t-xl`}>
              <span>{columnId}</span>
              <span className="bg-white/50 px-2 py-0.5 rounded text-sm">{items.length}</span>
            </div>

            {/* Area Drop */}
            <Droppable droppableId={columnId}>
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`p-4 flex-1 transition-colors ${snapshot.isDraggingOver ? "bg-indigo-50/50" : ""}`}
                >
                  {items.map((item, index) => (
                    <Draggable key={item.id.toString()} draggableId={item.id.toString()} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`bg-white p-4 mb-3 rounded-xl border shadow-sm hover:shadow-md transition-shadow group ${
                            snapshot.isDragging ? "shadow-xl ring-2 ring-indigo-500 rotate-2" : "border-slate-200"
                          }`}
                          style={{ ...provided.draggableProps.style }}
                        >
                          {/* Konten Kartu */}
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-500">
                              {item.plate}
                            </span>
                            <button className="text-slate-300 hover:text-slate-600"><MoreHorizontal size={16} /></button>
                          </div>
                          
                          <h4 className="font-bold text-slate-800 mb-1">{item.car}</h4>
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <User size={12} /> {item.customer}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Calendar size={12} /> {new Date(item.created_at).toLocaleDateString("id-ID")}
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t border-dashed border-slate-100 flex justify-between items-center">
                            <span className="font-bold text-indigo-600 text-sm">
                              Rp {item.price.toLocaleString()}
                            </span>
                            {item.vin && (
                                <span className="text-[10px] text-slate-400 bg-slate-50 px-1 rounded border border-slate-100">
                                    VIN OK
                                </span>
                            )}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
};

export default ServiceKanban;