"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Boton, Input, Select, Card, Tabla, Celda, PageHeader } from "../../components/ui";

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [perfiles, setPerfiles] = useState([]);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("Privado");
  const [responsableId, setResponsableId] = useState("");
  const [editId, setEditId] = useState(null);
  const [cargando, setCargando] = useState(true);

  async function cargar() {
    const { data } = await supabase
      .from("clientes")
      .select("*, responsable:responsable_id(nombre)")
      .order("id");
    setClientes(data || []);
    setCargando(false);
  }

  async function cargarPerfiles() {
    const { data } = await supabase.from("perfiles").select("id, nombre").order("nombre");
    setPerfiles(data || []);
  }

  useEffect(() => {
    cargar();
    cargarPerfiles();
  }, []);

  async function guardar() {
    if (!nombre.trim()) return;
    const payload = { nombre, tipo, responsable_id: responsableId || null };
    let error;
    if (editId) {
      ({ error } = await supabase.from("clientes").update(payload).eq("id", editId));
    } else {
      ({ error } = await supabase.from("clientes").insert(payload));
    }
    if (error) { alert("Error: " + error.message); return; }
    limpiar();
    cargar();
  }

  function limpiar() {
    setNombre("");
    setTipo("Privado");
    setResponsableId("");
    setEditId(null);
  }

  async function borrar(id) {
    if (!window.confirm("¿Seguro que quieres borrar este cliente?")) return;
    await supabase.from("clientes").delete().eq("id", id);
    cargar();
  }

  function editar(c) {
    setEditId(c.id);
    setNombre(c.nombre);
    setTipo(c.tipo);
    setResponsableId(c.responsable_id || "");
  }

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader titulo="Clientes" subtitulo="Gestión de clientes de Proyectos EI" />

      <Card className="p-4 mb-6 animate-slide-up">
        <div className="flex gap-2.5 flex-wrap items-center">
          <Input
            placeholder="Nombre del cliente"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="flex-1 min-w-[200px]"
          />
          <Select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option>Privado</option>
            <option>Público</option>
          </Select>
          <Select value={responsableId} onChange={(e) => setResponsableId(e.target.value)} className="min-w-[180px]">
            <option value="">Sin responsable</option>
            {perfiles.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </Select>
          <Boton onClick={guardar}>{editId ? "Actualizar" : "Agregar"}</Boton>
          {editId && (
            <Boton variant="secondary" onClick={limpiar}>Cancelar</Boton>
          )}
        </div>
      </Card>

      {cargando ? (
        <div className="skeleton h-40 rounded-xl" />
      ) : clientes.length === 0 ? (
        <Card className="p-10 text-center text-gray-400 text-sm animate-slide-up">
          Aún no hay clientes registrados.
        </Card>
      ) : (
        <Tabla columnas={["ID", "Nombre", "Tipo", "Responsable", "Acciones"]}>
          {clientes.map((c) => (
            <tr key={c.id} className="border-b border-[#f0f1f3] last:border-0 hover:bg-[#f9fafb] transition-colors">
              <Celda className="text-gray-500">{c.id}</Celda>
              <Celda className="font-medium">{c.nombre}</Celda>
              <Celda>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  c.tipo === "Público" ? "bg-[#fef7d6] text-[#8a7400]" : "bg-azul-soft text-azul"
                }`}>
                  {c.tipo}
                </span>
              </Celda>
              <Celda className="text-gray-600">{c.responsable?.nombre || "\u2014"}</Celda>
              <Celda>
                <div className="flex gap-2">
                  <Boton size="sm" variant="warning" onClick={() => editar(c)}>Editar</Boton>
                  <Boton size="sm" variant="danger" onClick={() => borrar(c.id)}>Borrar</Boton>
                </div>
              </Celda>
            </tr>
          ))}
        </Tabla>
      )}
    </div>
  );
}
