"use client";

import { Search } from "lucide-react";
import { useApp } from "@/components/app-shell";

export default function CommandPaletteTrigger() {
  const { openPalette } = useApp();
  return (
    <button
      onClick={openPalette}
      className="w-full flex items-center gap-2 px-3 py-2 border border-ink-border hover:bg-surface text-left text-[10px] font-technical uppercase tracking-widest text-ink-muted"
    >
      <Search className="w-3.5 h-3.5" strokeWidth={2.5} />
      <span>Buscar…</span>
      <span className="ml-auto text-[9px] border border-ink-border px-1 py-0.5">⌘K</span>
    </button>
  );
}
