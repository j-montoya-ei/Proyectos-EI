"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function Materiales() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [cargando, setCargando] = useState(false);

  async function buscar() {
    setCargando(true);
    let query = supabase.from("materiales").select("*").order("descripcion").limit(100);
    if (q.trim()) {
      query = supabase
        .from("materiales")
        .select("*")
        .or(`descripcion.ilike.%${q}%,codigo.ilike.%${q}%`)
        .order("descripcion")
        .limit(100);
    }
    const { data } = await query;
    setItems(data || []);
    setCargando(false);
  }

  useEffect(() => { buscar(); }, []);

  const money = (n) => "$" + Number(n || 0).toLocaleString("es-CO");

  return (
    <div>
      <h1 style={{ color: "#00369C", marginBottom: 20 }}>Materiales (SIESA)</h1>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input
          placeholder="Buscar por descripción o código..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && buscar()}
          style={{ flex: 1, padding: "10px 14px", border: "1px solid #ccc", borderRadius: 8, fontSize: 14 }}
        />
        <button onClick={buscar} style={{ padding: "10px 24px", background: "#00369C", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>
          Buscar
        </button>
      </div>

      <p style={{ color: "#666", fontSize: 13, marginBottom: 10 }}>
        {cargando ? "Cargando..." : `Mostrando ${items.length} resultados (máx. 100)`}
      </p>

      <table style={{ width: "100%", borderCollapse: "collapse", background: "white", borderRadius: 8, overflow: "hidden", fontSize: 14 }}>
        <thead>
          <tr style={{ background: "#00369C", color: "white", textAlign: "left" }}>
            <th style={th}>Código</th>
            <th style={th}>Descripción</th>
            <th style={th}>UM</th>
            <th style={th}>Bodega</th>
            <th style={{ ...th, textAlign: "right" }}>Costo base</th>
          </tr>
        </thead>
        <tbody>
          {items.map((m) => (
            <tr key={m.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={td}>{m.codigo}</td>
              <td style={td}>{m.descripcion}</td>
              <td style={td}>{m.ume}</td>
              <td style={td}>{m.bodega}</td>
              <td style={{ ...td, textAlign: "right", fontWeight: 600 }}>{money(m.costo_base)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const th = { padding: "12px 14px" };
const td = { padding: "10px 14px" };