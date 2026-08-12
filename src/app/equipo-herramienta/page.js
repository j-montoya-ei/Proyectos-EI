"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import ImportarDatos from "../../components/ImportarDatos";
import { Boton, Input, Card, Tabla, Celda, PageHeader } from "../../components/ui";

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
    <div className="max-w-6xl mx-auto">
      <PageHeader titulo="Equipo y herramienta" subtitulo="Catálogo de equipo y herramienta" />

      <Card className="p-4 mb-5 animate-slide-up">
        <ImportarDatos
          tabla="equipo"
          onImport={cargar}
          columnas={[
            { campo: "descripcion", tipo: "texto" },
            { campo: "ume", tipo: "texto" },
            { campo: "valor_dia", tipo: "numero" },
            { campo: "valor_mensual", tipo: "numero" },
          ]}
        />
        <div className="flex flex-wrap gap-3 items-end pt-1">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Descripción *</label>
            <Input className="w-full" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Ej: Saltarín" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">UME</label>
            <Input className="w-28" value={form.ume} onChange={(e) => setForm({ ...form, ume: e.target.value })} placeholder="Día, Mes" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Valor x día</label>
            <Input type="number" className="w-36" value={form.valor_dia} onChange={(e) => setForm({ ...form, valor_dia: e.target.value })} placeholder="0" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Valor mensual</label>
            <Input type="number" className="w-36" value={form.valor_mensual} onChange={(e) => setForm({ ...form, valor_mensual: e.target.value })} placeholder="0" />
          </div>
          <Boton onClick={guardar}>{editId ? "Actualizar" : "Agregar"}</Boton>
          {editId && <Boton variant="secondary" onClick={cancelar}>Cancelar</Boton>}
        </div>
      </Card>

      <Input className="w-full mb-4" placeholder="Buscar por descripción o UME..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />

      {cargando ? (
        <div className="skeleton h-64 rounded-xl" />
      ) : filtrados.length === 0 ? (
        <Card className="p-10 text-center text-gray-400 text-sm animate-slide-up">Sin registros aún.</Card>
      ) : (
        <Tabla columnas={["Descripción", "UME", <span key="d" className="block text-right">Valor x día</span>, <span key="m" className="block text-right">Valor mensual</span>, <span key="a" className="block text-center">Acciones</span>]}>
          {filtrados.map((r) => (
            <tr key={r.id} className="border-b border-[#f0f1f3] last:border-0 hover:bg-[#f9fafb] transition-colors">
              <Celda className="font-medium">{r.descripcion}</Celda>
              <Celda className="text-gray-600">{r.ume}</Celda>
              <Celda className="text-right font-semibold text-azul whitespace-nowrap">{formato(r.valor_dia)}</Celda>
              <Celda className="text-right text-gray-600 whitespace-nowrap">{formato(r.valor_mensual)}</Celda>
              <Celda>
                <div className="flex gap-2 justify-center">
                  <Boton size="sm" variant="warning" onClick={() => editar(r)}>Editar</Boton>
                  <Boton size="sm" variant="danger" onClick={() => eliminar(r.id)}>Eliminar</Boton>
                </div>
              </Celda>
            </tr>
          ))}
        </Tabla>
      )}
    </div>
  );
}
