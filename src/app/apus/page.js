"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import ImportarDatos from "../../components/ImportarDatos";

export default function ApusPage() {
  const [apus, setApus] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [form, setForm] = useState({ codigo: "", descripcion: "", unidad: "", tipo: "obra" });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    setCargando(true);
    const { data, error } = await supabase
      .from("apus")
      .select("*")
      .order("codigo", { ascending: true });
    if (!error) setApus(data);
    setCargando(false);
  }

  async function crear() {
    if (!form.descripcion) return alert("La descripción es obligatoria");
    await supabase.from("apus").insert({
      codigo: form.codigo,
      descripcion: form.descripcion,
      unidad: form.unidad,
      tipo: form.tipo,
    });
    setForm({ codigo: "", descripcion: "", unidad: "", tipo: "obra" });
    cargar();
  }

  async function eliminar(id) {
    if (!confirm("¿Eliminar esta APU y todas sus líneas?")) return;
    await supabase.from("apus").delete().eq("id", id);
    cargar();
  }

  const filtrados = apus.filter(
    (a) =>
      a.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) ||
      a.codigo?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "#00369C" }}>
        APUs
      </h1>

      <div className="bg-white border rounded-lg p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Código</label>
          <input
            className="border rounded px-3 py-2 w-32"
            value={form.codigo}
            onChange={(e) => setForm({ ...form, codigo: e.target.value })}
            placeholder="APU-001"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Descripción *</label>
          <input
            className="border rounded px-3 py-2 w-80"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            placeholder="Ej: Instalación de tomacorriente"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Unidad</label>
          <input
            className="border rounded px-3 py-2 w-24"
            value={form.unidad}
            onChange={(e) => setForm({ ...form, unidad: e.target.value })}
            placeholder="punto, m"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Tipo</label>
          <select
            className="border rounded px-3 py-2"
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
          >
            <option value="obra">Obra</option>
            <option value="diseno">Diseño</option>
          </select>
        </div>
        <button
          onClick={crear}
          className="px-5 py-2 rounded font-semibold text-white"
          style={{ backgroundColor: "#00369C" }}
        >
          Crear APU
        </button>
      </div>

      <input
        className="border rounded px-3 py-2 w-full mb-4"
        placeholder="Buscar por código o descripción..."
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
                <th className="px-4 py-2 text-left">Código</th>
                <th className="px-4 py-2 text-left">Descripción</th>
                <th className="px-4 py-2 text-left">Unidad</th>
                <th className="px-4 py-2 text-left">Tipo</th>
                <th className="px-4 py-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((a) => (
                <tr key={a.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{a.codigo}</td>
                  <td className="px-4 py-2 font-medium">{a.descripcion}</td>
                  <td className="px-4 py-2">{a.unidad}</td>
                  <td className="px-4 py-2 capitalize">{a.tipo}</td>
                  <td className="px-4 py-2 text-center whitespace-nowrap">
                    <a
                      href={`/apus/${a.id}`}
                      className="px-3 py-1 rounded mr-2 font-semibold inline-block text-white"
                      style={{ backgroundColor: "#00369C" }}
                    >
                      Armar
                    </a>
                    <button
                      onClick={() => eliminar(a.id)}
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
                    Sin APUs aún.
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
