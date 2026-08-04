"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import ImportarDatos from "../../components/ImportarDatos";

export default function ViaticosPage() {
  const [items, setItems] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [form, setForm] = useState({ descripcion: "", valor_un: "", personas: "" });
  const [editId, setEditId] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    setCargando(true);
    const { data, error } = await supabase
      .from("viaticos")
      .select("*")
      .order("descripcion", { ascending: true });
    if (!error) setItems(data);
    setCargando(false);
  }

  async function guardar() {
    if (!form.descripcion) return alert("La descripción es obligatoria");
    const payload = {
      descripcion: form.descripcion,
      valor_un: Number(form.valor_un) || 0,
      personas: Number(form.personas) || 1,
    };
    if (editId) {
      await supabase.from("viaticos").update(payload).eq("id", editId);
    } else {
      await supabase.from("viaticos").insert(payload);
    }
    setForm({ descripcion: "", valor_un: "", personas: "" });
    setEditId(null);
    cargar();
  }

  function editar(r) {
    setEditId(r.id);
    setForm({
      descripcion: r.descripcion || "",
      valor_un: r.valor_un || "",
      personas: r.personas ?? 1,
    });
  }

  async function eliminar(id) {
    if (!confirm("¿Eliminar este item?")) return;
    await supabase.from("viaticos").delete().eq("id", id);
    cargar();
  }

  function cancelar() {
    setEditId(null);
    setForm({ descripcion: "", valor_un: "", personas: "" });
  }

  const formato = (n) =>
    Number(n).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

  const filtrados = items.filter((r) =>
    r.descripcion?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "#00369C" }}>
        Viáticos
      </h1>
      <ImportarDatos
        tabla="viaticos"
        onImport={cargar}
        columnas={[
          { campo: "descripcion", tipo: "texto" },
          { campo: "valor_un", tipo: "numero" },
          { campo: "personas", tipo: "numero" },
        ]}
      />

      <div className="bg-white border rounded-lg p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Descripción *</label>
          <input
            className="border rounded px-3 py-2"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            placeholder="Ej: Almuerzo x persona"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Valor unitario x día</label>
          <input
            type="number"
            className="border rounded px-3 py-2"
            value={form.valor_un}
            onChange={(e) => setForm({ ...form, valor_un: e.target.value })}
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Personas</label>
          <input
            type="number"
            className="border rounded px-3 py-2 w-28"
            value={form.personas}
            onChange={(e) => setForm({ ...form, personas: e.target.value })}
            placeholder="1"
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
        placeholder="Buscar por descripción..."
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
                <th className="px-4 py-2 text-right">Valor unitario x día</th>
                <th className="px-4 py-2 text-right">Personas</th>
                <th className="px-4 py-2 text-right">Costo total</th>
                <th className="px-4 py-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((r) => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{r.descripcion}</td>
                  <td className="px-4 py-2 text-right">{formato(r.valor_un)}</td>
                  <td className="px-4 py-2 text-right">{r.personas ?? 1}</td>
                  <td className="px-4 py-2 text-right font-semibold" style={{ color: "#00369C" }}>
                    {formato((r.valor_un || 0) * (r.personas ?? 1))}
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
