"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Boton, Input, Select, Card, Tabla, Celda, PageHeader } from "../../components/ui";

export default function PresupuestosPage() {
  const [presupuestos, setPresupuestos] = useState([]);
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
      .from("presupuestos")
      .select("*, clientes(nombre)")
      .order("created_at", { ascending: false });
    if (!error) setPresupuestos(data);
    setCargando(false);
  }

  async function cargarClientes() {
    const { data } = await supabase.from("clientes").select("id, nombre").order("nombre");
    setClientes(data || []);
  }

  async function crear() {
    if (!form.cliente_id) return alert("Elige un cliente");
    if (!form.nombre) return alert("El nombre del presupuesto es obligatorio");
    await supabase.from("presupuestos").insert({
      cliente_id: Number(form.cliente_id),
      nombre: form.nombre,
    });
    setForm({ cliente_id: "", nombre: "" });
    cargar();
  }

  async function eliminar(id) {
    if (!confirm("¿Eliminar este presupuesto y todas sus líneas?")) return;
    await supabase.from("presupuestos").delete().eq("id", id);
    cargar();
  }

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader titulo="Presupuestos" subtitulo="Gestión de presupuestos por cliente" />

      <Card className="p-4 mb-5 animate-slide-up">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Cliente *</label>
            <Select value={form.cliente_id} onChange={(e) => setForm({ ...form, cliente_id: e.target.value })} className="min-w-[200px]">
              <option value="">Selecciona...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </Select>
          </div>
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Nombre del presupuesto *</label>
            <Input className="w-full" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Presupuesto obra Torre 1" />
          </div>
          <Boton onClick={crear}>Crear</Boton>
        </div>
      </Card>

      {cargando ? (
        <div className="skeleton h-56 rounded-xl" />
      ) : presupuestos.length === 0 ? (
        <Card className="p-10 text-center text-gray-400 text-sm animate-slide-up">Sin presupuestos aún.</Card>
      ) : (
        <Tabla columnas={["Nombre", "Cliente", <span key="a" className="block text-center">Acciones</span>]}>
          {presupuestos.map((p) => (
            <tr key={p.id} className="border-b border-[#f0f1f3] last:border-0 hover:bg-[#f9fafb] transition-colors">
              <Celda className="font-medium">{p.nombre}</Celda>
              <Celda className="text-gray-600">{p.clientes?.nombre || "\u2014"}</Celda>
              <Celda>
                <div className="flex gap-2 justify-center">
                  <a
                    href={`/presupuesto/${p.id}`}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-azul text-white hover:bg-azul-hover transition-colors"
                  >
                    Armar
                  </a>
                  <Boton size="sm" variant="danger" onClick={() => eliminar(p.id)}>Eliminar</Boton>
                </div>
              </Celda>
            </tr>
          ))}
        </Tabla>
      )}
    </div>
  );
}
