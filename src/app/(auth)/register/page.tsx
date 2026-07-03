"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction } from "@/app/actions";
import { ArrowRight } from "lucide-react";

type FormState = { error?: string } | null;

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(
    registerAction as unknown as (state: FormState, fd: FormData) => Promise<FormState>,
    null,
  );

  return (
    <div className="space-y-6">
      <div className="space-y-1 border-b border-ink-border pb-4">
        <h2 className="text-xs font-bold font-technical uppercase tracking-widest m-0">
          Alta de Cuenta
        </h2>
        <p className="text-[10px] font-technical uppercase tracking-widest text-ink-muted m-0">
          Crea tu perfil para empezar a colaborar
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[9px] font-technical uppercase text-ink-muted tracking-widest block">
            Usuario
          </label>
          <input
            name="username"
            type="text"
            required
            autoFocus
            minLength={3}
            className="w-full bg-transparent text-sm font-medium px-3 py-2.5 border border-ink-border focus:border-ink focus:outline-none"
            placeholder="mínimo 3 caracteres"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[9px] font-technical uppercase text-ink-muted tracking-widest block">
            Contraseña
          </label>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            className="w-full bg-transparent text-sm font-medium px-3 py-2.5 border border-ink-border focus:border-ink focus:outline-none"
            placeholder="mínimo 6 caracteres"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[9px] font-technical uppercase text-ink-muted tracking-widest block">
            Repetir Contraseña
          </label>
          <input
            name="confirmPassword"
            type="password"
            required
            minLength={6}
            className="w-full bg-transparent text-sm font-medium px-3 py-2.5 border border-ink-border focus:border-ink focus:outline-none"
            placeholder="••••••••"
          />
        </div>

        {state?.error && (
          <p className="text-[10px] font-technical uppercase tracking-widest text-highlight border border-ink-border bg-surface px-2 py-1.5">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full flex items-center justify-center gap-1.5 bg-ink text-paper hover:bg-highlight py-2.5 text-xs font-bold font-technical uppercase tracking-wider disabled:opacity-50"
        >
          <span>{pending ? "Creando…" : "Crear cuenta"}</span>
          {!pending && <ArrowRight className="w-4 h-4" strokeWidth={2.5} />}
        </button>
      </form>

      <div className="border-t border-ink-border pt-4 flex items-center justify-between text-[10px] font-technical uppercase tracking-widest text-ink-muted">
        <span>¿Ya tienes cuenta?</span>
        <Link href="/login" className="text-ink font-bold hover:text-highlight">
          Acceder →
        </Link>
      </div>
    </div>
  );
}
