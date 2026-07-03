"use client";

import { useState, useEffect } from "react";
import { Menu, ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export default function CollapsibleSidebarContainer({ sidebar, children }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, []);

  return (
    <div className="flex h-screen bg-paper text-ink overflow-hidden w-screen relative">
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-12 flex items-center px-3 border-b border-ink-border bg-paper">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 border border-ink-border hover:bg-surface"
          aria-label="Abrir menú"
        >
          <Menu className="w-4 h-4" strokeWidth={2.5} />
        </button>
        <span className="ml-3 text-[10px] font-technical uppercase tracking-widest font-bold">
          LETSWORK ALPHA
        </span>
      </div>

      {/* Desktop sidebar */}
      <div
        className={`hidden md:flex relative flex-col shrink-0 ${
          collapsed ? "w-0 border-r-0" : "w-[280px] border-r border-ink-border"
        }`}
      >
        <div className={`w-full h-full overflow-hidden ${collapsed ? "hidden" : "block"}`}>
          {sidebar}
        </div>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="absolute top-6 right-[-14px] z-50 w-7 h-7 bg-paper border border-ink-border hover:bg-surface flex items-center justify-center"
            title="Colapsar panel"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
          </button>
        )}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="absolute top-6 left-4 z-50 w-7 h-7 bg-paper border border-ink-border hover:bg-surface flex items-center justify-center"
            title="Expandir panel"
          >
            <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-[280px] h-full border-r border-ink-border bg-paper">{sidebar}</div>
          <button
            className="flex-1 bg-ink/30"
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú"
          />
        </div>
      )}

      <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden scrollbar-hide bg-paper flex flex-col pt-12 md:pt-0">
        {children}
      </main>
    </div>
  );
}
