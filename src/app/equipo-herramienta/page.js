"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function EquipoPage() {
  const [items, setItems] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [form, setForm] = useState({ descripcion: "", ume: "", valor_dia: "", valor_mensual: "" });
  const [editId, setEditId] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    setCargando(true);
    const { data, error } = await supabase
      .from("equipo")
      .select("*")
      .order("descripcion", { ascending: true });
    if (!error) setItems(data);
    setCargando(false);
  }

  async function guardar() {
    if (!form.descripcion) return alert("La descripción es obligatoria");
    const payload = {
      descripcion: form.descripcion,
      ume: form.ume,
      valor_dia: Number(form.valor_dia) || 0,
      valor_mensual: Number(form.valor_mensual) || 0,
    };
    if (editId) {
      await supabase.from("equipo").update(payload).eq("id", editId);
    } else {
      await supabase.from("equipo").insert(payload);
    }
    setForm({ descripcion: "", ume: "", valor_dia: "", valor_mensual: "" });
    setEditId(null);
    cargar();
  }

  function editar(r) {
    setEditId(r.id);
    setForm({
      descripcion: r.descripcion || "",
      ume: r.ume || "",
      valor_dia: r.valor_dia || "",
      valor_mensual: r.valor_mensual || "",
    });
  }

  async function eliminar(id) {
    if (!confirm("¿Eliminar este item?")) return;
    await supabase.from("equipo").delete().eq("id", id);
    cargar();
  }

  function cancelar() {
    setEditId(null);
    setForm({ descripcion: "", ume: "", valor_dia: "", valor_mensual: "" });
  }

  const formato = (n) =>
    Number(n).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

  const filtrados = items.filter(
    (r) =>
      r.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.ume?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "#00369C" }}>
        Equipo y herramienta
      </h1>

      <div className="bg-white border rounded-lg p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Descripción *</label>
          <input
            className="border rounded px-3 py-2"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            placeholder="Ej: Saltarín"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">UME</label>
          <input
            className="border rounded px-3 py-2 w-24"
            value={form.ume}
            onChange={(e) => setForm({ ...form, ume: e.target.value })}
            placeholder="Día, Mes"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Valor x día</label>
          <input
            type="number"
            className="border rounded px-3 py-2"
            value={form.valor_dia}
            onChange={(e) => setForm({ ...form, valor_dia: e.target.value })}
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Valor mensual</label>
          <input
            type="number"
            className="border rounded px-3 py-2"
            value={form.valor_mensual}
            onChange={(e) => setForm({ ...form, valor_mensual: e.target.value })}
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

      <input
        className="border rounded px-3 py-2 w-full mb-4"
        placeholder="Buscar por descripción o UME..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      {cargando ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: "#00369C" }} className="text-white">
              <tr>
                <th className="px-4 py-2 text-left">Descripción</th>
                <th className="px-4 py-2 text-left">UME</th>
                <th className="px-4 py-2 text-right">Valor x día</th>
                <th className="px-4 py-2 text-right">Valor mensual</th>
                <th className="px-4 py-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((r) => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{r.descripcion}</td>
                  <td className="px-4 py-2">{r.ume}</td>
                  <td className="px-4 py-2 text-right">{formato(r.valor_dia)}</td>
                  <td className="px-4 py-2 text-right">{formato(r.valor_mensual)}</td>
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
                    Sin registros aún.
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
