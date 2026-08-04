"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

const formato = (n) =>
  Number(n).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

export default function ArmarPresupuestoPage() {
  const { id } = useParams();
  const presId = Number(id);
  const [pres, setPres] = useState(null);
  const [lineas, setLineas] = useState([]);
  const [gen, setGen] = useState([]);
  const [cfg, setCfg] = useState({ ot: "0", iva: "0", ue: "15" });
  const [busq, setBusq] = useState("");
  const [resultados, setResultados] = useState([]);
  const [busqG, setBusqG] = useState("");
  const [resG, setResG] = useState([]);
  const [manual, setManual] = useState({ descripcion: "", valor: "" });

  useEffect(() => {
    cargarPres();
    cargarLineas();
    cargarGenerales();
  }, [presId]);

  async function cargarPres() {
    const { data } = await supabase
      .from("presupuestos")
      .select("*, clientes(nombre)")
      .eq("id", presId)
      .single();
    if (data) {
      setPres(data);
      setCfg({
        ot: String((data.ot || 0) * 100),
        iva: String((data.iva || 0) * 100),
        ue: String((data.ue || 0) * 100),
      });
    }
  }

  async function cargarLineas() {
    const { data } = await supabase
      .from("presupuesto_apus")
      .select("*, apus(codigo, descripcion, unidad)")
      .eq("presupuesto_id", presId)
      .order("id", { ascending: true });
    setLineas(data || []);
  }

  async function cargarGenerales() {
    const { data } = await supabase
      .from("presupuesto_generales")
      .select("*")
      .eq("presupuesto_id", presId)
      .order("id", { ascending: true });
    setGen(data || []);
  }

  async function guardarPorcentajes() {
    await supabase
      .from("presupuestos")
      .update({
        ot: Number(cfg.ot) / 100 || 0,
        iva: Number(cfg.iva) / 100 || 0,
        ue: Number(cfg.ue) / 100 || 0,
      })
      .eq("id", presId);
    cargarPres();
    alert("Porcentajes guardados.");
  }

  // ---- APUs ----
  async function buscar(texto) {
    setBusq(texto);
    if (!texto || texto.length < 2) return setResultados([]);
    const { data } = await supabase
      .from("apus")
      .select("id, codigo, descripcion")
      .or(`descripcion.ilike.%${texto}%,codigo.ilike.%${texto}%`)
      .limit(15);
    setResultados(data || []);
  }

  async function agregar(apu) {
    const { data: lins } = await supabase
      .from("apu_lineas")
      .select("cantidad, valor_unitario")
      .eq("apu_id", apu.id);
    const costo = (lins || []).reduce((s, l) => s + l.cantidad * l.valor_unitario, 0);
    await supabase.from("presupuesto_apus").insert({
      presupuesto_id: presId,
      apu_id: apu.id,
      cantidad: 1,
      costo_unitario: costo,
    });
    setBusq("");
    setResultados([]);
    cargarLineas();
  }

  async function cambiarCantidad(lineaId, valor) {
    await supabase
      .from("presupuesto_apus")
      .update({ cantidad: Number(valor) || 0 })
      .eq("id", lineaId);
    cargarLineas();
  }

  async function eliminarLinea(lineaId) {
    await supabase.from("presupuesto_apus").delete().eq("id", lineaId);
    cargarLineas();
  }

  async function actualizarCostos() {
    if (!confirm("Refrescará el costo congelado de cada APU con sus líneas actuales. ¿Continuar?"))
      return;
    for (const l of lineas) {
      const { data: lins } = await supabase
        .from("apu_lineas")
        .select("cantidad, valor_unitario")
        .eq("apu_id", l.apu_id);
      const costo = (lins || []).reduce((s, x) => s + x.cantidad * x.valor_unitario, 0);
      await supabase.from("presupuesto_apus").update({ costo_unitario: costo }).eq("id", l.id);
    }
    cargarLineas();
    alert("Costos actualizados.");
  }

  // ---- Generales (viáticos + transporte) ----
  async function buscarGen(texto) {
    setBusqG(texto);
    if (!texto || texto.length < 2) return setResG([]);
    const [{ data: v }, { data: t }] = await Promise.all([
      supabase.from("viaticos").select("id, descripcion, valor_un").ilike("descripcion", `%${texto}%`).limit(8),
      supabase.from("transporte").select("id, descripcion, valor_un").ilike("descripcion", `%${texto}%`).limit(8),
    ]);
    setResG([
      ...(v || []).map((r) => ({ ...r, origen: "viatico" })),
      ...(t || []).map((r) => ({ ...r, origen: "transporte" })),
    ]);
  }

  async function agregarGen(item) {
    await supabase.from("presupuesto_generales").insert({
      presupuesto_id: presId,
      origen: item.origen,
      descripcion: item.descripcion,
      cantidad: 1,
      valor_unitario: item.valor_un || 0,
    });
    setBusqG("");
    setResG([]);
    cargarGenerales();
  }

  async function agregarManual() {
    if (!manual.descripcion) return alert("Escribe una descripción");
    await supabase.from("presupuesto_generales").insert({
      presupuesto_id: presId,
      origen: "manual",
      descripcion: manual.descripcion,
      cantidad: 1,
      valor_unitario: Number(manual.valor) || 0,
    });
    setManual({ descripcion: "", valor: "" });
    cargarGenerales();
  }

  async function cambiarCantidadGen(genId, valor) {
    await supabase.from("presupuesto_generales").update({ cantidad: Number(valor) || 0 }).eq("id", genId);
    cargarGenerales();
  }

  async function eliminarGen(genId) {
    await supabase.from("presupuesto_generales").delete().eq("id", genId);
    cargarGenerales();
  }

  if (!pres) return <div className="p-8 text-gray-500">Cargando...</div>;

  const ot = Number(cfg.ot) / 100 || 0;
  const iva = Number(cfg.iva) / 100 || 0;
  const ue = Number(cfg.ue) / 100 || 0;

  const calc = (base, cant) => {
    const costoUnit = base * (1 + ot) * (1 + iva);
    const valorUnit = ue < 1 ? (costoUnit * (1 + ot) * (1 + iva)) / (1 - ue) : 0;
    return { costoUnit, costoTotal: costoUnit * cant, valorUnit, valorTotal: valorUnit * cant };
  };

  const totalCosto =
    lineas.reduce((s, l) => s + calc(l.costo_unitario, l.cantidad).costoTotal, 0) +
    gen.reduce((s, g) => s + calc(g.valor_unitario, g.cantidad).costoTotal, 0);
  const totalValor =
    lineas.reduce((s, l) => s + calc(l.costo_unitario, l.cantidad).valorTotal, 0) +
    gen.reduce((s, g) => s + calc(g.valor_unitario, g.cantidad).valorTotal, 0);

  return (
    <div className="p-8">
      <a href="/presupuesto" className="text-sm" style={{ color: "#00369C" }}>
        ← Volver a Presupuestos
      </a>
      <h1 className="text-2xl font-bold mt-2 mb-1" style={{ color: "#00369C" }}>
        {pres.nombre}
      </h1>
      <p className="text-gray-500 mb-6">Cliente: {pres.clientes?.nombre || "—"}</p>

      {/* Porcentajes globales */}
      <div className="bg-white border rounded-lg p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm text-gray-600 mb-1">OT %</label>
          <input type="number" className="border rounded px-3 py-2 w-24" value={cfg.ot}
            onChange={(e) => setCfg({ ...cfg, ot: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">IVA %</label>
          <input type="number" className="border rounded px-3 py-2 w-24" value={cfg.iva}
            onChange={(e) => setCfg({ ...cfg, iva: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">UE %</label>
          <input type="number" className="border rounded px-3 py-2 w-24" value={cfg.ue}
            onChange={(e) => setCfg({ ...cfg, ue: e.target.value })} />
        </div>
        <button onClick={guardarPorcentajes} className="px-5 py-2 rounded font-semibold text-white"
          style={{ backgroundColor: "#00369C" }}>
          Guardar %
        </button>
      </div>

      {/* Buscador de APUs */}
      <div className="relative mb-4">
        <input className="border rounded px-3 py-2 w-full" placeholder="Buscar APU por código o descripción..."
          value={busq} onChange={(e) => buscar(e.target.value)} />
        {resultados.length > 0 && (
          <div className="absolute z-10 bg-white border rounded w-full mt-1 max-h-60 overflow-y-auto shadow">
            {resultados.map((a) => (
              <div key={a.id} onClick={() => agregar(a)}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm">
                {a.codigo} · {a.descripcion}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabla APUs */}
      <div className="overflow-x-auto border rounded-lg mb-8">
        <table className="w-full text-sm">
          <thead style={{ backgroundColor: "#00369C" }} className="text-white">
            <tr>
              <th className="px-3 py-2 text-left">APU</th>
              <th className="px-3 py-2 text-right w-24">Cantidad</th>
              <th className="px-3 py-2 text-right">Costo unit.</th>
              <th className="px-3 py-2 text-right">Costo total</th>
              <th className="px-3 py-2 text-right">Valor unit.</th>
              <th className="px-3 py-2 text-right">Valor total</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {lineas.map((l) => {
              const r = calc(l.costo_unitario, l.cantidad);
              return (
                <tr key={l.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium">{l.apus?.codigo} · {l.apus?.descripcion}</td>
                  <td className="px-3 py-2 text-right">
                    <input type="number" defaultValue={l.cantidad}
                      onBlur={(e) => cambiarCantidad(l.id, e.target.value)}
                      className="border rounded px-2 py-1 w-20 text-right" />
                  </td>
                  <td className="px-3 py-2 text-right">{formato(r.costoUnit)}</td>
                  <td className="px-3 py-2 text-right font-medium">{formato(r.costoTotal)}</td>
                  <td className="px-3 py-2 text-right">{formato(r.valorUnit)}</td>
                  <td className="px-3 py-2 text-right font-medium" style={{ color: "#00369C" }}>{formato(r.valorTotal)}</td>
                  <td className="px-3 py-2 text-center">
                    <button onClick={() => eliminarLinea(l.id)} className="text-red-600 font-bold px-2">✕</button>
                  </td>
                </tr>
              );
            })}
            {lineas.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-500">Sin APUs aún. Búscalas arriba.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Costos generales */}
      <h2 className="text-lg font-bold mb-3" style={{ color: "#00369C" }}>
        Costos generales (viáticos y transporte)
      </h2>

      <div className="relative mb-3">
        <input className="border rounded px-3 py-2 w-full" placeholder="Buscar en viáticos y transporte..."
          value={busqG} onChange={(e) => buscarGen(e.target.value)} />
        {resG.length > 0 && (
          <div className="absolute z-10 bg-white border rounded w-full mt-1 max-h-60 overflow-y-auto shadow">
            {resG.map((item) => (
              <div key={item.origen + item.id} onClick={() => agregarGen(item)}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex justify-between text-sm">
                <span><span className="text-gray-400 mr-2">[{item.origen}]</span>{item.descripcion}</span>
                <span className="text-gray-500">{formato(item.valor_un)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Entrada manual */}
      <div className="bg-white border rounded-lg p-3 mb-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm text-gray-600 mb-1">Descripción (manual)</label>
          <input className="border rounded px-3 py-2 w-full" value={manual.descripcion}
            onChange={(e) => setManual({ ...manual, descripcion: e.target.value })}
            placeholder="Ej: Combustible obra" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Valor unitario</label>
          <input type="number" className="border rounded px-3 py-2 w-40" value={manual.valor}
            onChange={(e) => setManual({ ...manual, valor: e.target.value })} placeholder="0" />
        </div>
        <button onClick={agregarManual} className="px-4 py-2 rounded font-semibold text-white"
          style={{ backgroundColor: "#00369C" }}>
          Agregar manual
        </button>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm">
          <thead style={{ backgroundColor: "#00369C" }} className="text-white">
            <tr>
              <th className="px-3 py-2 text-left">Concepto</th>
              <th className="px-3 py-2 text-left w-28">Origen</th>
              <th className="px-3 py-2 text-right w-24">Cantidad</th>
              <th className="px-3 py-2 text-right">Costo unit.</th>
              <th className="px-3 py-2 text-right">Costo total</th>
              <th className="px-3 py-2 text-right">Valor unit.</th>
              <th className="px-3 py-2 text-right">Valor total</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {gen.map((g) => {
              const r = calc(g.valor_unitario, g.cantidad);
              return (
                <tr key={g.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium">{g.descripcion}</td>
                  <td className="px-3 py-2 capitalize text-gray-500">{g.origen}</td>
                  <td className="px-3 py-2 text-right">
                    <input type="number" defaultValue={g.cantidad}
                      onBlur={(e) => cambiarCantidadGen(g.id, e.target.value)}
                      className="border rounded px-2 py-1 w-20 text-right" />
                  </td>
                  <td className="px-3 py-2 text-right">{formato(r.costoUnit)}</td>
                  <td className="px-3 py-2 text-right font-medium">{formato(r.costoTotal)}</td>
                  <td className="px-3 py-2 text-right">{formato(r.valorUnit)}</td>
                  <td className="px-3 py-2 text-right font-medium" style={{ color: "#00369C" }}>{formato(r.valorTotal)}</td>
                  <td className="px-3 py-2 text-center">
                    <button onClick={() => eliminarGen(g.id)} className="text-red-600 font-bold px-2">✕</button>
                  </td>
                </tr>
              );
            })}
            {gen.length === 0 && (
              <tr><td colSpan={8} className="px-3 py-6 text-center text-gray-500">Sin costos generales aún.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Totales */}
      <div className="flex justify-between items-center border-t mt-4 pt-4">
        <button onClick={actualizarCostos} className="px-4 py-2 rounded font-semibold"
          style={{ backgroundColor: "#F6D000" }}>
          Actualizar costos
        </button>
        <div className="text-right">
          <div className="text-gray-600">Costo total: {formato(totalCosto)}</div>
          <div className="text-xl font-bold" style={{ color: "#00369C" }}>
            Valor total: {formato(totalValor)}
          </div>
        </div>
      </div>
    </div>
  );
}
