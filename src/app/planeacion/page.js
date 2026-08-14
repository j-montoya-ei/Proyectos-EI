"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Boton, Input, Select, Card, PageHeader } from "../../components/ui";

const ESTADOS = [
  { code: "cotizacion_enviada", label: "Cotización enviada", badge: "bg-[#f0f1f2] text-[#5c6066]", dot: "#A4A8AB" },
  { code: "pendiente_oc", label: "Pendiente por OC o facturar", badge: "bg-[#fdf6dd] text-[#7a5c00]", dot: "#F6D000" },
  { code: "en_ejecucion", label: "Aprobada y en ejecución", badge: "bg-[#e6eefb] text-[#0c447c]", dot: "#00369C" },
  { code: "finalizado", label: "Finalizado y facturado", badge: "bg-[#eaf3ee] text-[#0f6e56]", dot: "#1D9E75" },
];
const estadoDe = (code) => ESTADOS.find((e) => e.code === code) || ESTADOS[0];

const fmtCOP = (n) => (n == null || n === "" ? "\u2014" : "$ " + Number(n).toLocaleString("es-CO"));
const fmtFecha = (s) =>
  new Date(s).toLocaleString("es-CO", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

export default function Planeacion() {
  const [presupuestos, setPresupuestos] = useState([]);
  const [archivos, setArchivos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [perfiles, setPerfiles] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [f, setF] = useState({ nombre: "", cliente_id: "", valor_estimado: "", responsable_id: "" });

  const [abierto, setAbierto] = useState(null);
  const [subiendo, setSubiendo] = useState(null);

  async function cargar() {
    const { data: pres } = await supabase
      .from("planeacion_presupuestos")
      .select("*, cliente:cliente_id(nombre), responsable:responsable_id(nombre)")
      .order("updated_at", { ascending: false });
    const lista = pres || [];
    setPresupuestos(lista);

    const ids = lista.map((p) => p.id);
    if (ids.length) {
      const { data: arch } = await supabase
        .from("planeacion_archivos")
        .select("*")
        .in("presupuesto_id", ids)
        .order("created_at", { ascending: false });
      setArchivos(arch || []);
    } else {
      setArchivos([]);
    }
    setCargando(false);
  }

  async function cargarSelects() {
    const { data: c } = await supabase.from("clientes").select("id, nombre").order("nombre");
    setClientes(c || []);
    const { data: p } = await supabase.from("perfiles").select("id, nombre").order("nombre");
    setPerfiles(p || []);
  }

  useEffect(() => {
    cargar();
    cargarSelects();
  }, []);

  async function crear() {
    if (!f.nombre.trim()) { alert("Escribe un nombre."); return; }
    const payload = {
      nombre: f.nombre.trim(),
      cliente_id: f.cliente_id ? Number(f.cliente_id) : null,
      valor_estimado: f.valor_estimado ? Number(f.valor_estimado) : null,
      responsable_id: f.responsable_id || null,
    };
    const { error } = await supabase.from("planeacion_presupuestos").insert(payload);
    if (error) { alert("Error: " + error.message); return; }
    setF({ nombre: "", cliente_id: "", valor_estimado: "", responsable_id: "" });
    setMostrarForm(false);
    cargar();
  }

  async function cambiarEstado(p, code) {
    await supabase
      .from("planeacion_presupuestos")
      .update({ estado: code, updated_at: new Date().toISOString() })
      .eq("id", p.id);
    cargar();
  }

  async function subirArchivo(p, file) {
    setSubiendo(p.id);
    const path = `${p.id}/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const { error: upErr } = await supabase.storage.from("planeacion").upload(path, file);
    if (upErr) { setSubiendo(null); alert("Error al subir: " + upErr.message); return; }
    await supabase.from("planeacion_archivos").insert({
      presupuesto_id: p.id,
      estado: p.estado,
      nombre_archivo: file.name,
      storage_path: path,
    });
    await supabase
      .from("planeacion_presupuestos")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", p.id);
    setSubiendo(null);
    cargar();
  }

  async function descargar(path) {
    const { data, error } = await supabase.storage.from("planeacion").createSignedUrl(path, 60);
    if (error || !data?.signedUrl) { alert("No se pudo generar el enlace."); return; }
    window.open(data.signedUrl, "_blank");
  }

  async function eliminar(p) {
    if (!confirm(`¿Eliminar "${p.nombre}" y todos sus archivos?`)) return;
    const paths = archivos.filter((a) => a.presupuesto_id === p.id).map((a) => a.storage_path);
    if (paths.length) await supabase.storage.from("planeacion").remove(paths);
    await supabase.from("planeacion_presupuestos").delete().eq("id", p.id);
    cargar();
  }

  const conteo = (code) => presupuestos.filter((p) => p.estado === code).length;
  const archivosDe = (id) => archivos.filter((a) => a.presupuesto_id === id);

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        titulo="Planeación"
        subtitulo="Sube los Excel y controla el estado de cada presupuesto."
        acciones={
          <Boton onClick={() => setMostrarForm((v) => !v)}>
            {mostrarForm ? "Cerrar" : "+ Nuevo presupuesto"}
          </Boton>
        }
      />

      {mostrarForm && (
        <Card className="p-5 mb-6 animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500">Nombre</label>
              <Input value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })}
                placeholder="PR-2451 · Subestación Norte" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500">Cliente</label>
              <Select value={f.cliente_id} onChange={(e) => setF({ ...f, cliente_id: e.target.value })}>
                <option value="">Sin cliente</option>
                {clientes.map((c) => (<option key={c.id} value={c.id}>{c.nombre}</option>))}
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500">Valor estimado (opcional)</label>
              <Input type="number" value={f.valor_estimado}
                onChange={(e) => setF({ ...f, valor_estimado: e.target.value })} placeholder="148500000" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500">Analista responsable</label>
              <Select value={f.responsable_id} onChange={(e) => setF({ ...f, responsable_id: e.target.value })}>
                <option value="">Sin responsable</option>
                {perfiles.map((p) => (<option key={p.id} value={p.id}>{p.nombre}</option>))}
              </Select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Boton onClick={crear}>Guardar</Boton>
            <Boton variant="secondary" onClick={() => setMostrarForm(false)}>Cancelar</Boton>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 border border-[#e5e7eb]">
          <div className="text-xs text-gray-500">Total</div>
          <div className="text-2xl font-bold text-azul mt-0.5">{presupuestos.length}</div>
        </div>
        {ESTADOS.map((e) => (
          <div key={e.code} className="bg-white rounded-xl p-4 border border-[#e5e7eb]"
            style={{ borderTop: `3px solid ${e.dot}` }}>
            <div className="text-xs text-gray-500 leading-tight">{e.label}</div>
            <div className="text-2xl font-bold text-[#1a1a1a] mt-0.5">{conteo(e.code)}</div>
          </div>
        ))}
      </div>

      {cargando ? (
        <p className="text-gray-400 text-sm">Cargando…</p>
      ) : presupuestos.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-gray-500 text-sm">Aún no hay presupuestos. Crea el primero con “+ Nuevo presupuesto”.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {presupuestos.map((p) => {
            const est = estadoDe(p.estado);
            const files = archivosDe(p.id);
            const open = abierto === p.id;
            return (
              <Card key={p.id} className="p-5 animate-slide-up">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[15px] text-[#1a1a1a] truncate">{p.nombre}</div>
                    <div className="text-[13px] text-gray-500 mt-0.5">
                      Cliente: {p.cliente?.nombre || "—"} · Analista: {p.responsable?.nombre || "—"}
                    </div>
                  </div>
                  <span className={`text-[12px] font-semibold px-3 py-1 rounded-full whitespace-nowrap ${est.badge}`}>
                    {est.label}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-3 text-[13px]">
                  <span className="text-gray-500">Valor estimado</span>
                  <span className="font-semibold">{fmtCOP(p.valor_estimado)}</span>
                </div>

                <div className="border-t border-[#eef0f2] mt-4 pt-3">
                  <button onClick={() => setAbierto(open ? null : p.id)}
                    className="text-[13px] font-semibold text-azul hover:underline">
                    {open ? "Ocultar historial" : `Ver historial (${files.length})`}
                  </button>
                </div>

                {open && (
                  <div className="mt-3 animate-fade-in">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="text-[13px] text-gray-500">Estado:</span>
                      <Select value={p.estado} onChange={(e) => cambiarEstado(p, e.target.value)} className="py-1.5">
                        {ESTADOS.map((e) => (<option key={e.code} value={e.code}>{e.label}</option>))}
                      </Select>
                      <div className="flex-1" />
                      <label className={`inline-flex items-center gap-2 font-semibold rounded-lg px-4 py-2 text-sm cursor-pointer
                        bg-amarillo text-azul hover:brightness-95 transition ${subiendo === p.id ? "opacity-60 pointer-events-none" : ""}`}>
                        {subiendo === p.id ? "Subiendo…" : "↑ Subir archivo"}
                        <input type="file" accept=".xlsx,.xls,.csv" className="hidden"
                          onChange={(e) => { const file = e.target.files?.[0]; if (file) subirArchivo(p, file); e.target.value = ""; }} />
                      </label>
                      <Boton variant="ghost" size="sm" onClick={() => eliminar(p)}>Eliminar</Boton>
                    </div>

                    {files.length === 0 ? (
                      <p className="text-[13px] text-gray-400 py-2">Sin archivos aún.</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {files.map((a) => (
                          <div key={a.id} className="flex items-center gap-3 bg-[#f8fafc] rounded-lg px-3 py-2.5">
                            <div className="h-8 w-8 rounded-lg bg-[#e6eefb] text-azul grid place-items-center shrink-0 text-sm font-bold">XLS</div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[13px] font-semibold truncate">{a.nombre_archivo}</div>
                              <div className="text-[11px] text-gray-400">{estadoDe(a.estado).label} · {fmtFecha(a.created_at)}</div>
                            </div>
                            <Boton variant="secondary" size="sm" onClick={() => descargar(a.storage_path)}>Descargar</Boton>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
