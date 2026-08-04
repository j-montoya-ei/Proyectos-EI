"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import ImportarDatos from "../../components/ImportarDatos";

export default function TransportePage() {
  const [items, setItems] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [form, setForm] = useState({ descripcion: "", ume: "", valor_un: "" });
  const [editId, setEditId] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    setCargando(true);
    const { data, error } = await supabase
      .from("transporte")
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
      valor_un: Number(form.valor_un) || 0,
    };
    if (editId) {
      await supabase.from("transporte").update(payload).eq("id", editId);
    } else {
      await supabase.from("transporte").insert(payload);
    }
    setForm({ descripcion: "", ume: "", valor_un: "" });
    setEditId(null);
    cargar();
  }

  function editar(r) {
    setEditId(r.id);
    setForm({
      descripcion: r.descripcion || "",
      ume: r.ume || "",
      valor_un: r.valor_un || "",
    });
  }

  async function eliminar(id) {
    if (!confirm("¿Eliminar este item?")) return;
    await supabase.from("transporte").delete().eq("id", id);
    cargar();
  }

  function cancelar() {
    setEditId(null);
    setForm({ descripcion: "", ume: "", valor_un: "" });
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
        Transporte
      </h1>

<ImportarDatos tabla="transporte" onImport={cargar}
  columnas={[{ campo: "descripcion", tipo: "texto" }, { campo: "ume", tipo: "texto" }, { campo: "valor_un", tipo: "numero" }]} />
          
      <div className="bg-white border rounded-lg p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Descripción *</label>
          <input
            className="border rounded px-3 py-2"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            placeholder="Ej: Camioneta"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">UME</label>
          <input
            className="border rounded px-3 py-2 w-24"
            value={form.ume}
            onChange={(e) => setForm({ ...form, ume: e.target.value })}
            placeholder="un, km"
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
                <th className="px-4 py-2 text-right">Valor unitario x día</th>
                <th className="px-4 py-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((r) => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{r.descripcion}</td>
                  <td className="px-4 py-2">{r.ume}</td>
                  <td className="px-4 py-2 text-right">{formato(r.valor_un)}</td>
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
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
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
