"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function entrar() {
    setError("");
    setCargando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setCargando(false);
    if (error) {
      setError("Correo o contraseña incorrectos.");
      return;
    }
    router.push("/");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f5f7" }}>
      <div style={{ background: "white", padding: 40, borderRadius: 12, width: 360, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4, color: "#00369C" }}>
          electro<span style={{ color: "#F6D000" }}>ingeniería</span>
        </h2>
        <p style={{ color: "#6b7280", marginBottom: 24, fontSize: 14 }}>Gestión de Proyectos</p>

        <label style={{ display: "block", fontSize: 13, color: "#374151", marginBottom: 4 }}>Correo</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} placeholder="tucorreo@ei.com.co" />

        <label style={{ display: "block", fontSize: 13, color: "#374151", margin: "14px 0 4px" }}>Contraseña</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && entrar()} style={inputStyle} placeholder="********" />

        {error && <p style={{ color: "#dc2626", fontSize: 13, marginTop: 12 }}>{error}</p>}

        <button onClick={entrar} disabled={cargando} style={{ width: "100%", marginTop: 20, padding: "12px", borderRadius: 8, border: "none", background: "#00369C", color: "white", fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: cargando ? 0.6 : 1 }}>
          {cargando ? "Entrando..." : "Entrar"}
        </button>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  fontSize: 14,
  boxSizing: "border-box",
};
