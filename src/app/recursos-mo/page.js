"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import ImportarDatos from "../../components/ImportarDatos";

export default function RecursosMoPage() {
  const [recursos, setRecursos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [form, setForm] = useState({ codigo: "", cargo: "", costo_mensual: "" });
  const [editId, setEditId] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarRecursos();
  }, []);

  async function cargarRecursos() {
    setCargando(true);
    const { data, error } = await supabase
      .from("recursos_mo")
      .select("*")
      .order("cargo", { ascending: true });
    if (!error) setRecursos(data);
    setCargando(false);
  }

  async function guardar() {
    if (!form.cargo) return alert("El cargo es obligatorio");
    const payload = {
      codigo: form.codigo,
      cargo: form.cargo,
      costo_mensual: Number(form.costo_mensual) || 0,
    };
    if (editId) {
      await supabase.from("recursos_mo").update(payload).eq("id", editId);
    } else {
      await supabase.from("recursos_mo").insert(payload);
    }
    setForm({ codigo: "", cargo: "", costo_mensual: "" });
    setEditId(null);
    cargarRecursos();
  }

  function editar(r) {
    setEditId(r.id);
    setForm({
      codigo: r.codigo || "",
      cargo: r.cargo || "",
      costo_mensual: r.costo_mensual || "",
    });
  }

  async function eliminar(id) {
    if (!confirm("¿Eliminar este recurso?")) return;
    await supabase.from("recursos_mo").delete().eq("id", id);
    cargarRecursos();
  }

  function cancelar() {
    setEditId(null);
    setForm({ codigo: "", cargo: "", costo_mensual: "" });
  }

  const formato = (n) =>
    Number(n).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

  const filtrados = recursos.filter(
    (r) =>
      r.cargo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.codigo?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "#00369C" }}>
        Mano de Obra
      </h1>

      {/* Formulario */}
      <div className="bg-white border rounded-lg p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Código</label>
          <input
            className="border rounded px-3 py-2"
            value={form.codigo}
            onChange={(e) => setForm({ ...form, codigo: e.target.value })}
            placeholder="Ej: MO-001"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Cargo *</label>
          <input
            className="border rounded px-3 py-2"
            value={form.cargo}
            onChange={(e) => setForm({ ...form, cargo: e.target.value })}
            placeholder="Ej: Ingeniero"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Costo mensual</label>
          <input
            type="number"
            className="border rounded px-3 py-2"
            value={form.costo_mensual}
            onChange={(e) => setForm({ ...form, costo_mensual: e.target.value })}
            placeholder="0"
          />
        </div>
        <button
          onClick={guardar}
          className="px-5 py-2 rounded font-semibold text-white"
          style={{ backgroundColor: "#00369C" }}
        >
          {editId ? "Actualizar" : "Agregar"}
        </button>
        {editId && (
          <button
            onClick={cancelar}
            className="px-5 py-2 rounded font-semibold"
            style={{ backgroundColor: "#A4A8AB", color: "white" }}
          >
            Cancelar
          </button>
        )}
      </div>

      {/* Buscador */}
      <input
        className="border rounded px-3 py-2 w-full mb-4"
        placeholder="Buscar por cargo o código..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      {/* Tabla */}
      {cargando ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: "#00369C" }} className="text-white">
              <tr>
                <th className="px-4 py-2 text-left">Código</th>
                <th className="px-4 py-2 text-left">Cargo</th>
                <th className="px-4 py-2 text-right">Costo mensual</th>
                <th className="px-4 py-2 text-right">Costo diario (÷24)</th>
                <th className="px-4 py-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((r) => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{r.codigo}</td>
                  <td className="px-4 py-2 font-medium">{r.cargo}</td>
                  <td className="px-4 py-2 text-right">{formato(r.costo_mensual)}</td>
                  <td className="px-4 py-2 text-right" style={{ color: "#00369C", fontWeight: 600 }}>
                    {formato(r.costo_mensual / 24)}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => editar(r)}
                      className="px-3 py-1 rounded mr-2 font-semibold"
                      style={{ backgroundColor: "#F6D000" }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => eliminar(r.id)}
                      className="px-3 py-1 rounded font-semibold text-white bg-red-600"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                    Sin recursos aún.
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
