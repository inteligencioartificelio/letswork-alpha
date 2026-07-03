export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="hidden lg:flex flex-col justify-between p-8 bg-ink text-paper border-r border-ink-border">
        <div>
          <h1 className="text-sm font-bold font-technical uppercase tracking-widest m-0">
            LETSWORK ALPHA
          </h1>
          <span className="text-[9px] font-technical uppercase tracking-widest text-paper/60">
            v1.0 · MINIMAL PRO
          </span>
        </div>

        <div className="space-y-4">
          <h2 className="text-3xl font-editorial font-light tracking-tight m-0 normal-case">
            Gestión de proyectos y tareas para equipos que valoran la claridad.
          </h2>
          <p className="text-xs font-technical uppercase tracking-widest text-paper/60 m-0 leading-relaxed">
            Espacios · Proyectos · Tareas · Kanban · 27 Presets Cromáticos
          </p>
        </div>

        <p className="text-[9px] font-technical uppercase tracking-widest text-paper/40 m-0">
          {`[████░░░░░░] Construido para tinta electrónica — 0ms de transición`}
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
