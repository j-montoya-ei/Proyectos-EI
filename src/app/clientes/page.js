"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("Privado");
  const [editId, setEditId] = useState(null);

  async function cargar() {
    const { data } = await supabase.from("clientes").select("*").order("id");
    setClientes(data || []);
  }

  useEffect(() => {
    cargar();
  }, []);

async function guardar() {
    if (!nombre.trim()) return;
    let error;
    if (editId) {
      ({ error } = await supabase.from("clientes").update({ nombre, tipo }).eq("id", editId));
    } else {
      ({ error } = await supabase.from("clientes").insert({ nombre, tipo }));
    }
    if (error) { alert("Error: " + error.message); return; }
    setNombre("");
    setTipo("Privado");
    setEditId(null);
    cargar();
  }

  async function borrar(id) {
    await supabase.from("clientes").delete().eq("id", id);
    cargar();
  }

  function editar(c) {
    setEditId(c.id);
    setNombre(c.nombre);
    setTipo(c.tipo);
  }

  return (
    <div>
      <h1 style={{ color: "#00369C", marginBottom: 24 }}>Clientes</h1>

      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        <input
          placeholder="Nombre del cliente"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          style={inp}
        />
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={inp}>
          <option>Privado</option>
          <option>Público</option>
        </select>
        <button onClick={guardar} style={btnAzul}>
          {editId ? "Actualizar" : "Agregar"}
        </button>
        {editId && (
          <button onClick={() => { setEditId(null); setNombre(""); }} style={btnGris}>
            Cancelar
          </button>
        )}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", background: "white", borderRadius: 8, overflow: "hidden" }}>
        <thead>
          <tr style={{ background: "#00369C", color: "white", textAlign: "left" }}>
            <th style={td}>ID</th>
            <th style={td}>Nombre</th>
            <th style={td}>Tipo</th>
            <th style={td}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((c) => (
            <tr key={c.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={td}>{c.id}</td>
              <td style={td}>{c.nombre}</td>
              <td style={td}>{c.tipo}</td>
              <td style={td}>
                <button onClick={() => editar(c)} style={btnMini}>Editar</button>
                <button onClick={() => borrar(c.id)} style={btnMiniRojo}>Borrar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const inp = { padding: "10px 12px", border: "1px solid #ccc", borderRadius: 8, fontSize: 14 };
const btnAzul = { padding: "10px 20px", background: "#00369C", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 };
const btnGris = { padding: "10px 20px", background: "#A4A8AB", color: "white", border: "none", borderRadius: 8, cursor: "pointer" };
const td = { padding: "12px 14px" };
const btnMini = { padding: "6px 12px", background: "#F6D000", color: "#00369C", border: "none", borderRadius: 6, cursor: "pointer", marginRight: 6, fontWeight: 600 };
const btnMiniRojo = { padding: "6px 12px", background: "#e53e3e", color: "white", border: "none", borderRadius: 6, cursor: "pointer" };