"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Boton, Input, Select, Card, Tabla, Celda, PageHeader } from "../../components/ui";

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
    <div className="max-w-6xl mx-auto">
      <PageHeader titulo="APUs" subtitulo="Análisis de Precios Unitarios" />

      <Card className="p-4 mb-5 animate-slide-up">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Código</label>
            <Input
              className="w-32"
              value={form.codigo}
              onChange={(e) => setForm({ ...form, codigo: e.target.value })}
              placeholder="APU-001"
            />
          </div>
          <div className="flex-1 min-w-[240px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Descripción *</label>
            <Input
              className="w-full"
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Ej: Instalación de tomacorriente"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Unidad</label>
            <Input
              className="w-24"
              value={form.unidad}
              onChange={(e) => setForm({ ...form, unidad: e.target.value })}
              placeholder="punto, m"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
            <Select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
              <option value="obra">Obra</option>
              <option value="diseno">Diseño</option>
            </Select>
          </div>
          <Boton onClick={crear}>Crear APU</Boton>
        </div>
      </Card>

      <Input
        className="w-full mb-4"
        placeholder="Buscar por código o descripción..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      {cargando ? (
        <div className="skeleton h-64 rounded-xl" />
      ) : filtrados.length === 0 ? (
        <Card className="p-10 text-center text-gray-400 text-sm animate-slide-up">
          Sin APUs aún.
        </Card>
      ) : (
        <Tabla columnas={["Código", "Descripción", "Unidad", "Tipo", <span key="ac" className="block text-center">Acciones</span>]}>
          {filtrados.map((a) => (
            <tr key={a.id} className="border-b border-[#f0f1f3] last:border-0 hover:bg-[#f9fafb] transition-colors">
              <Celda className="text-gray-500 whitespace-nowrap">{a.codigo}</Celda>
              <Celda className="font-medium">{a.descripcion}</Celda>
              <Celda className="text-gray-600">{a.unidad}</Celda>
              <Celda>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                  a.tipo === "diseno" ? "bg-[#fef7d6] text-[#8a7400]" : "bg-azul-soft text-azul"
                }`}>
                  {a.tipo}
                </span>
              </Celda>
              <Celda>
                <div className="flex gap-2 justify-center">
                  <a
                    href={`/apus/${a.id}`}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-azul text-white hover:bg-azul-hover transition-colors"
                  >
                    Armar
                  </a>
                  <Boton size="sm" variant="danger" onClick={() => eliminar(a.id)}>Eliminar</Boton>
                </div>
              </Celda>
            </tr>
          ))}
        </Tabla>
      )}
    </div>
  );
}
