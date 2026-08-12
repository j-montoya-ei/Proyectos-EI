"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import ImportarDatos from "../../components/ImportarDatos";
import { Boton, Input, Card, Tabla, Celda, PageHeader } from "../../components/ui";

export default function RecursosMoPage() {
  const [recursos, setRecursos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [form, setForm] = useState({ codigo: "", cargo: "", salario_base: "", costo_mensual: "" });
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
      salario_base: Number(form.salario_base) || 0,
      costo_mensual: Number(form.costo_mensual) || 0,
    };
    if (editId) {
      await supabase.from("recursos_mo").update(payload).eq("id", editId);
    } else {
      await supabase.from("recursos_mo").insert(payload);
    }
    setForm({ codigo: "", cargo: "", salario_base: "", costo_mensual: "" });
    setEditId(null);
    cargarRecursos();
  }

  function editar(r) {
    setEditId(r.id);
    setForm({
      codigo: r.codigo || "",
      cargo: r.cargo || "",
      salario_base: r.salario_base || "",
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
    setForm({ codigo: "", cargo: "", salario_base: "", costo_mensual: "" });
  }

  const formato = (n) =>
    Number(n).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

  const filtrados = recursos.filter(
    (r) =>
      r.cargo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.codigo?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader titulo="Mano de Obra" subtitulo="Catálogo de recursos de mano de obra" />

      <Card className="p-4 mb-5 animate-slide-up">
        <ImportarDatos
          tabla="recursos_mo"
          onImport={cargarRecursos}
          columnas={[
            { campo: "codigo", tipo: "texto" },
            { campo: "cargo", tipo: "texto" },
            { campo: "salario_base", tipo: "numero" },
            { campo: "costo_mensual", tipo: "numero" },
          ]}
        />
        <div className="flex flex-wrap gap-3 items-end pt-1">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Código</label>
            <Input className="w-32" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} placeholder="Ej: MO-001" />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Cargo *</label>
            <Input className="w-full" value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} placeholder="Ej: Ingeniero" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Base salarial</label>
            <Input type="number" className="w-36" value={form.salario_base} onChange={(e) => setForm({ ...form, salario_base: e.target.value })} placeholder="0" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Costo mensual</label>
            <Input type="number" className="w-36" value={form.costo_mensual} onChange={(e) => setForm({ ...form, costo_mensual: e.target.value })} placeholder="0" />
          </div>
          <Boton onClick={guardar}>{editId ? "Actualizar" : "Agregar"}</Boton>
          {editId && <Boton variant="secondary" onClick={cancelar}>Cancelar</Boton>}
        </div>
      </Card>

      <Input className="w-full mb-4" placeholder="Buscar por cargo o código..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />

      {cargando ? (
        <div className="skeleton h-64 rounded-xl" />
      ) : filtrados.length === 0 ? (
        <Card className="p-10 text-center text-gray-400 text-sm animate-slide-up">Sin recursos aún.</Card>
      ) : (
        <Tabla columnas={["Código", "Cargo", <span key="a" className="block text-right">Base salarial</span>, <span key="b" className="block text-right">Costo mensual</span>, <span key="c" className="block text-right">Costo diario (÷24)</span>, <span key="d" className="block text-center">Acciones</span>]}>
          {filtrados.map((r) => (
            <tr key={r.id} className="border-b border-[#f0f1f3] last:border-0 hover:bg-[#f9fafb] transition-colors">
              <Celda className="text-gray-500 whitespace-nowrap">{r.codigo}</Celda>
              <Celda className="font-medium">{r.cargo}</Celda>
              <Celda className="text-right text-gray-600 whitespace-nowrap">{formato(r.salario_base)}</Celda>
              <Celda className="text-right text-gray-600 whitespace-nowrap">{formato(r.costo_mensual)}</Celda>
              <Celda className="text-right font-semibold text-azul whitespace-nowrap">{formato(r.costo_mensual / 24)}</Celda>
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
