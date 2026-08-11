"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Boton, Input, Select, Card, Tabla, Celda, PageHeader } from "../../components/ui";

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("Privado");
  const [editId, setEditId] = useState(null);
  const [cargando, setCargando] = useState(true);

  async function cargar() {
    const { data } = await supabase.from("clientes").select("*").order("id");
    setClientes(data || []);
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function guardar() {
    if (!nombre.trim()) return;
    let error;
    if (editId) {
      ({ error } = await supabase.from("clientes").update({ nombre, tipo }).eq("id", editId));
    } else {
      ({ error } = await supabase.from("clientes").insert({ nombre, tipo }));
    }
    if (error) { alert("Error: " + error.message); return; }
    setNombre("");
    setTipo("Privado");
    setEditId(null);
    cargar();
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
  }

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader titulo="Clientes" subtitulo="Gestión de clientes de Proyectos EI" />

      <Card className="p-4 mb-6 animate-slide-up">
        <div className="flex gap-2.5 flex-wrap items-center">
          <Input
            placeholder="Nombre del cliente"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="flex-1 min-w-[220px]"
          />
          <Select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option>Privado</option>
            <option>Público</option>
          </Select>
          <Boton onClick={guardar}>{editId ? "Actualizar" : "Agregar"}</Boton>
          {editId && (
            <Boton variant="secondary" onClick={() => { setEditId(null); setNombre(""); setTipo("Privado"); }}>
              Cancelar
            </Boton>
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
        <Tabla columnas={["ID", "Nombre", "Tipo", "Acciones"]}>
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
