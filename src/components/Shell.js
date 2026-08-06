"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function Shell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sesion, setSesion] = useState(undefined);
  const [perfil, setPerfil] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSesion(data.session);
      if (data.session) cargarPerfil(data.session.user.id);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSesion(s);
      if (s) cargarPerfil(s.user.id);
      else setPerfil(null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function cargarPerfil(id) {
    const { data } = await supabase.from("perfiles").select("nombre, rol").eq("id", id).single();
    setPerfil(data);
  }

  useEffect(() => {
    if (sesion === undefined) return;
    if (!sesion && pathname !== "/login") router.replace("/login");
    if (sesion && pathname === "/login") router.replace("/");
  }, [sesion, pathname]);

  async function salir() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (pathname === "/login") return <>{children}</>;
  if (sesion === undefined || !sesion) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <aside style={{ width: 230, background: "#00369C", color: "white", padding: "28px 20px" }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 40, letterSpacing: -0.5 }}>
          electro<span style={{ color: "#F6D000" }}>ingeniería</span>
        </h2>
        <nav style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <a href="/" style={linkStyle}>Inicio</a>
          <a href="/clientes" style={linkStyle}>Clientes</a>
          <a href="/materiales" style={linkStyle}>Materiales</a>
          <a href="/recursos-mo" style={linkStyle}>Mano de Obra</a>
          <a href="/transporte" style={linkStyle}>Transporte</a>
          <a href="/viaticos" style={linkStyle}>Viáticos</a>
          <a href="/equipo-herramienta" style={linkStyle}>Equipo y herramienta</a>
          <a href="/diseno" style={linkStyle}>Diseño y trámites</a>
          <a href="/apus" style={linkStyle}>APUs</a>
        </nav>
      </aside>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <header style={{ height: 56, background: "white", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "0 24px", gap: 16 }}>
          <div style={{ textAlign: "right", lineHeight: 1.2 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{perfil?.nombre || sesion.user.email}</div>
            <div style={{ fontSize: 12, color: "#6b7280", textTransform: "capitalize" }}>{perfil?.rol}</div>
          </div>
          <button onClick={salir} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #d1d5db", background: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#374151" }}>
            Cerrar sesión
          </button>
        </header>
        <main style={{ flex: 1, background: "#f4f5f7", padding: 40, color: "#1a1a1a" }}>
          {children}
        </main>
      </div>
    </div>
  );
}

const linkStyle = {
  color: "white",
  textDecoration: "none",
  padding: "10px 14px",
  borderRadius: 8,
  fontSize: 15,
};
