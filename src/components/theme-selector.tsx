"use client";

import { useState, useEffect } from "react";
import { PRESETS, PRESET_CATEGORIES } from "@/lib/presets";
import { updateUserSettingsAction } from "@/app/actions";
import { Settings, Check, X } from "lucide-react";

interface Props {
  initialPreset: string;
  initialDualInk: boolean;
  initialCompact: boolean;
}

export default function ThemeSelector({ initialPreset, initialDualInk, initialCompact }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [preset, setPreset] = useState(initialPreset);
  const [dualInk, setDualInk] = useState(initialDualInk);
  const [compact, setCompact] = useState(initialCompact);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", preset);
    const active = PRESETS.find((p) => p.id === preset);
    if (dualInk && active) {
      root.style.setProperty("--color-accent-highlight", active.ink);
    } else {
      root.style.removeProperty("--color-accent-highlight");
    }
    root.classList.toggle("compact-mode", compact);
  }, [preset, dualInk, compact]);

  const selectPreset = async (id: string) => {
    setPreset(id);
    document.documentElement.setAttribute("data-theme", id);
    await updateUserSettingsAction(id, dualInk, compact);
  };
  const toggleDualInk = async (v: boolean) => {
    setDualInk(v);
    await updateUserSettingsAction(preset, v, compact);
  };
  const toggleCompact = async (v: boolean) => {
    setCompact(v);
    await updateUserSettingsAction(preset, dualInk, v);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center gap-2 px-3 py-2 border border-ink-border hover:bg-ink hover:text-paper text-left text-xs font-technical uppercase font-bold tracking-wider"
        title="Configuración de Sistema de Diseño"
      >
        <Settings className="w-4 h-4" strokeWidth={2} />
        <span>Configuración</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-ink/50 z-[70] flex items-center justify-center p-6">
          <div className="bg-paper border border-ink-border w-full max-w-2xl h-[80vh] flex flex-col rounded-[var(--radius)] overflow-hidden">
            <div className="p-4 border-b border-ink-border flex justify-between items-center bg-surface">
              <h2 className="text-sm font-bold font-technical uppercase tracking-wider m-0">
                Ajustes Minimal Pro Alpha
              </h2>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-ink hover:text-paper">
                <X className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Dual Ink */}
                <div className="border border-ink-border p-3 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold font-technical uppercase tracking-wider m-0">
                      Soberanía Absoluta (Dual-Ink)
                    </h3>
                    <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                      Fuerza el color de Realce a la Tinta, creando una interfaz bicolor pura.
                    </p>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    {[
                      { v: true, l: "Activado" },
                      { v: false, l: "Desactivado" },
                    ].map((o) => (
                      <button
                        key={o.l}
                        onClick={() => toggleDualInk(o.v)}
                        className={`px-3 py-1 text-[11px] font-bold font-editorial uppercase tracking-wider border ${
                          dualInk === o.v
                            ? "bg-ink text-paper border-ink-border"
                            : "border-ink-border hover:bg-surface"
                        }`}
                      >
                        {o.l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Compact */}
                <div className="border border-ink-border p-3 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold font-technical uppercase tracking-wider m-0">
                      Diseño Compacto
                    </h3>
                    <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                      Reduce márgenes a múltiplos de 2px para mayor densidad de datos.
                    </p>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    {[
                      { v: true, l: "Compacto" },
                      { v: false, l: "Estándar" },
                    ].map((o) => (
                      <button
                        key={o.l}
                        onClick={() => toggleCompact(o.v)}
                        className={`px-3 py-1 text-[11px] font-bold font-editorial uppercase tracking-wider border ${
                          compact === o.v
                            ? "bg-ink text-paper border-ink-border"
                            : "border-ink-border hover:bg-surface"
                        }`}
                      >
                        {o.l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <hr className="border-t border-ink-border" />

              <div>
                <h3 className="text-xs font-bold font-technical uppercase tracking-wider mb-3">
                  Catálogo Maestro de Presets Cromáticos (27 Temas)
                </h3>
                <div className="space-y-6">
                  {PRESET_CATEGORIES.map((cat) => (
                    <div key={cat} className="space-y-2">
                      <h4 className="text-[10px] font-bold font-technical uppercase tracking-widest text-ink-muted">
                        {cat}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {PRESETS.filter((p) => p.category === cat).map((p) => {
                          const selected = preset === p.id;
                          return (
                            <button
                              key={p.id}
                              onClick={() => selectPreset(p.id)}
                              className={`w-full flex items-center justify-between p-2 border text-left ${
                                selected
                                  ? "border-ink-border bg-surface font-bold"
                                  : "border-ink-border hover:bg-surface"
                              }`}
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                <span className="text-[10px] font-technical text-ink-muted">{p.id}</span>
                                <span className="text-xs font-medium truncate">{p.name}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <div className="flex -space-x-1 border border-ink-border p-[1px]">
                                  <span className="w-3 h-3 block" style={{ backgroundColor: p.paper }} />
                                  <span className="w-3 h-3 block" style={{ backgroundColor: p.ink }} />
                                  <span className="w-3 h-3 block" style={{ backgroundColor: p.highlight }} />
                                </div>
                                {selected && <Check className="w-4 h-4 shrink-0 text-ink" strokeWidth={3} />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-ink-border bg-surface flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="bg-ink text-paper px-4 py-2 text-xs font-technical uppercase font-bold tracking-wider"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
