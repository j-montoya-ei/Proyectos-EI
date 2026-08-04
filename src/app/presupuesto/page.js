"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function PresupuestosPage() {
  const [presupuesto, setPresupuesto] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [form, setForm] = useState({ cliente_id: "", nombre: "" });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargar();
    cargarClientes();
  }, []);

  async function cargar() {
    setCargando(true);
    const { data, error } = await supabase
      .from("presupuesto")
      .select("*, clientes(nombre)")
      .order("created_at", { ascending: false });
    if (!error) setPresupuesto(data);
    setCargando(false);
  }

  async function cargarClientes() {
    const { data } = await supabase.from("clientes").select("id, nombre").order("nombre");
    setClientes(data || []);
  }

  async function crear() {
    if (!form.cliente_id) return alert("Elige un cliente");
    if (!form.nombre) return alert("El nombre del presupuesto es obligatorio");
    await supabase.from("presupuesto").insert({
      cliente_id: Number(form.cliente_id),
      nombre: form.nombre,
    });
    setForm({ cliente_id: "", nombre: "" });
    cargar();
  }

  async function eliminar(id) {
    if (!confirm("¿Eliminar este presupuesto y todas sus líneas?")) return;
    await supabase.from("presupuesto").delete().eq("id", id);
    cargar();
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "#00369C" }}>
        Presupuesto
      </h1>

      {/* Formulario */}
      <div className="bg-white border rounded-lg p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Cliente *</label>
          <select
            className="border rounded px-3 py-2"
            value={form.cliente_id}
            onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}
          >
            <option value="">Selecciona...</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Nombre del presupuesto *</label>
          <input
            className="border rounded px-3 py-2"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            placeholder="Ej: Presupuesto obra Torre 1"
          />
        </div>
        <button
          onClick={crear}
          className="px-5 py-2 rounded font-semibold text-white"
          style={{ backgroundColor: "#00369C" }}
        >
          Crear
        </button>
      </div>

      {/* Tabla */}
      {cargando ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: "#00369C" }} className="text-white">
              <tr>
                <th className="px-4 py-2 text-left">Nombre</th>
                <th className="px-4 py-2 text-left">Cliente</th>
                <th className="px-4 py-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {presupuesto.map((p) => (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{p.nombre}</td>
                  <td className="px-4 py-2">{p.clientes?.nombre || "—"}</td>
                  <td className="px-4 py-2 text-center whitespace-nowrap">
                    <a
                      href={`/presupuesto/${p.id}`}
                      className="px-3 py-1 rounded mr-2 font-semibold inline-block text-white"
                      style={{ backgroundColor: "#00369C" }}
                    >
                      Armar
                    </a>
                    <button
                      onClick={() => eliminar(p.id)}
                      className="px-3 py-1 rounded font-semibold text-white bg-red-600"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {presupuesto.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                    Sin presupuesto aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
