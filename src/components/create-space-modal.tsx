"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { createWorkspaceAction } from "@/app/actions";
import { toast } from "sonner";

export default function CreateSpaceModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-ink-muted hover:text-ink"
        title="Crear Nuevo Espacio"
      >
        <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/20 backdrop-blur-sm p-4">
          <div className="bg-paper border border-ink-border p-6 w-[340px] max-w-full shadow-2xl relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[10px] font-bold font-technical uppercase tracking-widest m-0">
                Crear Nuevo Espacio
              </h2>
              <button onClick={() => setIsOpen(false)} className="text-ink-muted hover:text-ink">
                <X className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
            <hr className="border-t border-ink-border mb-4" />
            <form
              action={async (fd) => {
                try {
                  await createWorkspaceAction(fd);
                } catch (e: any) {
                  toast.error(e?.message || "Error al crear el espacio");
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-[9px] font-technical uppercase text-ink-muted tracking-widest block">
                  Nombre del Espacio
                </label>
                <input
                  name="name"
                  type="text"
                  placeholder="Escribe el nombre..."
                  required
                  autoFocus
                  className="w-full bg-transparent text-xs font-medium px-3 py-2 border border-ink-border focus:border-ink focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-technical uppercase text-ink-muted tracking-widest block">
                  Descripción (Opcional)
                </label>
                <input
                  name="description"
                  type="text"
                  placeholder="Detalles del espacio..."
                  className="w-full bg-transparent text-[10px] font-medium px-3 py-2 border border-ink-border focus:border-ink focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 bg-ink text-paper hover:bg-highlight py-2.5 text-xs font-bold font-technical uppercase tracking-wider"
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                <span>Crear Espacio</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
