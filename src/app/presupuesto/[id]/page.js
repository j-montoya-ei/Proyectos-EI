"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { Boton, Input, Card } from "../../../components/ui";

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

  async function guardarVersion() {
    if (!confirm("Se guardara una foto (version) del presupuesto actual. Continuar?")) return;

    const { data: prev } = await supabase
      .from("presupuesto_versiones")
      .select("version")
      .eq("presupuesto_id", presId)
      .order("version", { ascending: false })
      .limit(1);
    const nuevaVersion = (prev?.[0]?.version || 0) + 1;

    const o = Number(cfg.ot) / 100 || 0;
    const i = Number(cfg.iva) / 100 || 0;
    const u = Number(cfg.ue) / 100 || 0;
    const calcL = (base, cant) => {
      const cu = base * (1 + o) * (1 + i);
      const vu = u < 1 ? (cu * (1 + o) * (1 + i)) / (1 - u) : 0;
      return { cu, ct: cu * cant, vu, vt: vu * cant };
    };

    const apusSnap = lineas.map((l) => {
      const r = calcL(l.costo_unitario, l.cantidad);
      return {
        descripcion: `${l.apus?.codigo || ""} - ${l.apus?.descripcion || ""}`,
        cantidad: l.cantidad,
        costo_unit: r.cu,
        costo_total: r.ct,
        valor_unit: r.vu,
        valor_total: r.vt,
      };
    });
    const genSnap = gen.map((g) => {
      const r = calcL(g.valor_unitario, g.cantidad);
      return {
        descripcion: g.descripcion,
        origen: g.origen,
        cantidad: g.cantidad,
        costo_unit: r.cu,
        costo_total: r.ct,
        valor_unit: r.vu,
        valor_total: r.vt,
      };
    });

    const tc = [...apusSnap, ...genSnap].reduce((s, x) => s + x.costo_total, 0);
    const tv = [...apusSnap, ...genSnap].reduce((s, x) => s + x.valor_total, 0);

    await supabase.from("presupuesto_versiones").insert({
      presupuesto_id: presId,
      version: nuevaVersion,
      nombre: pres.nombre,
      total_costo: tc,
      total_valor: tv,
      datos: { ot: o, iva: i, ue: u, apus: apusSnap, generales: genSnap, oferta: pres.oferta || null },
    });
    alert(`Version V${nuevaVersion} guardada.`);
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
    if (!confirm("Refrescara el costo congelado de cada APU con sus lineas actuales. Continuar?"))
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

  // ---- Generales (viaticos + transporte) ----
  async function buscarGen(texto) {
    setBusqG(texto);
    if (!texto || texto.length < 2) return setResG([]);
    const [{ data: v }, { data: t }] = await Promise.all([
      supabase.from("viaticos").select("id, descripcion, valor_un, personas").ilike("descripcion", `%${texto}%`).limit(8),
      supabase.from("transporte").select("id, descripcion, valor_un").ilike("descripcion", `%${texto}%`).limit(8),
    ]);
    setResG([
      ...(v || []).map((r) => ({ ...r, origen: "viatico", costo: (r.valor_un || 0) * (r.personas ?? 1) })),
      ...(t || []).map((r) => ({ ...r, origen: "transporte", costo: r.valor_un || 0 })),
    ]);
  }

  async function agregarGen(item) {
    await supabase.from("presupuesto_generales").insert({
      presupuesto_id: presId,
      origen: item.origen,
      descripcion: item.descripcion,
      cantidad: 1,
      valor_unitario: item.costo || 0,
    });
    setBusqG("");
    setResG([]);
    cargarGenerales();
  }

  async function agregarManual() {
    if (!manual.descripcion) return alert("Escribe una descripcion");
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

  if (!pres) return <div className="max-w-6xl mx-auto"><div className="skeleton h-40 rounded-xl" /></div>;

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

  const IconX = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );

  return (
    <div className="max-w-6xl mx-auto pb-24">
      <a href="/presupuesto" className="inline-flex items-center gap-1.5 text-sm text-azul hover:underline mb-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Volver a Presupuestos
      </a>

      <div className="mb-5 animate-fade-in">
        <h1 className="text-2xl font-bold text-azul">{pres.nombre}</h1>
        <p className="text-gray-500 text-sm mt-0.5">Cliente: {pres.clientes?.nombre || "-"}</p>
      </div>

      <div className="flex flex-wrap gap-2.5 mb-6">
        <a href={`/presupuesto/${presId}/oferta`}
          className="inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-semibold bg-azul text-white hover:bg-azul-hover transition-colors">
          Generar oferta técnico-comercial
        </a>
        <Boton variant="warning" onClick={guardarVersion}>Guardar versión</Boton>
        <a href={`/presupuesto/${presId}/versiones`}
          className="inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-semibold bg-white border border-[#d1d5db] text-gray-700 hover:bg-gray-50 transition-colors">
          Ver versiones
        </a>
      </div>

      <Card className="p-4 mb-6 animate-slide-up">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">OT %</label>
            <Input type="number" className="w-24" value={cfg.ot} onChange={(e) => setCfg({ ...cfg, ot: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">IVA %</label>
            <Input type="number" className="w-24" value={cfg.iva} onChange={(e) => setCfg({ ...cfg, iva: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">UE %</label>
            <Input type="number" className="w-24" value={cfg.ue} onChange={(e) => setCfg({ ...cfg, ue: e.target.value })} />
          </div>
          <Boton onClick={guardarPorcentajes}>Guardar %</Boton>
        </div>
      </Card>

      <Card className="overflow-hidden mb-8 animate-slide-up">
        <div className="px-4 py-2.5 font-semibold text-white bg-azul text-sm">APUs</div>
        <div className="p-4">
          <div className="relative mb-4">
            <Input className="w-full" placeholder="Buscar APU por código o descripción..."
              value={busq} onChange={(e) => buscar(e.target.value)} />
            {resultados.length > 0 && (
              <div className="absolute z-10 bg-white border border-[#e5e7eb] rounded-lg w-full mt-1 max-h-60 overflow-y-auto shadow-lg">
                {resultados.map((a) => (
                  <div key={a.id} onClick={() => agregar(a)}
                    className="px-3 py-2 hover:bg-azul-soft cursor-pointer text-sm transition-colors">
                    {a.codigo} - {a.descripcion}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-[#e5e7eb] text-xs uppercase text-right">
                  <th className="px-2 py-2 text-left font-semibold">APU</th>
                  <th className="px-2 py-2 w-24 font-semibold">Cantidad</th>
                  <th className="px-2 py-2 font-semibold">Costo unit.</th>
                  <th className="px-2 py-2 font-semibold">Costo total</th>
                  <th className="px-2 py-2 font-semibold">Valor unit.</th>
                  <th className="px-2 py-2 font-semibold">Valor total</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {lineas.map((l) => {
                  const r = calc(l.costo_unitario, l.cantidad);
                  return (
                    <tr key={l.id} className="border-b border-[#f0f1f3]">
                      <td className="px-2 py-2 font-medium">{l.apus?.codigo} - {l.apus?.descripcion}</td>
                      <td className="px-2 py-2 text-right">
                        <input type="number" defaultValue={l.cantidad}
                          onBlur={(e) => cambiarCantidad(l.id, e.target.value)}
                          className="w-20 text-right px-2 py-1.5 text-sm bg-white border border-[#d1d5db] rounded-lg outline-none focus:border-azul focus:ring-2 focus:ring-azul/25" />
                      </td>
                      <td className="px-2 py-2 text-right text-gray-600 whitespace-nowrap">{formato(r.costoUnit)}</td>
                      <td className="px-2 py-2 text-right font-medium whitespace-nowrap">{formato(r.costoTotal)}</td>
                      <td className="px-2 py-2 text-right text-gray-600 whitespace-nowrap">{formato(r.valorUnit)}</td>
                      <td className="px-2 py-2 text-right font-semibold text-azul whitespace-nowrap">{formato(r.valorTotal)}</td>
                      <td className="px-2 py-2 text-center">
                        <button onClick={() => eliminarLinea(l.id)} className="text-gray-400 hover:text-red-600 transition-colors p-1"><IconX /></button>
                      </td>
                    </tr>
                  );
                })}
                {lineas.length === 0 && (
                  <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-400">Sin APUs aún. Búscalas arriba.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden mb-6 animate-slide-up">
        <div className="px-4 py-2.5 font-semibold text-white bg-azul text-sm">Costos generales (viáticos y transporte)</div>
        <div className="p-4">
          <div className="relative mb-4">
            <Input className="w-full" placeholder="Buscar en viáticos y transporte..."
              value={busqG} onChange={(e) => buscarGen(e.target.value)} />
            {resG.length > 0 && (
              <div className="absolute z-10 bg-white border border-[#e5e7eb] rounded-lg w-full mt-1 max-h-60 overflow-y-auto shadow-lg">
                {resG.map((item) => (
                  <div key={item.origen + item.id} onClick={() => agregarGen(item)}
                    className="px-3 py-2 hover:bg-azul-soft cursor-pointer flex justify-between gap-3 text-sm transition-colors">
                    <span><span className="text-gray-400 mr-2">[{item.origen}]</span>{item.descripcion}</span>
                    <span className="text-gray-500 whitespace-nowrap">{formato(item.costo)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3 items-end mb-4 pb-4 border-b border-[#f0f1f3]">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Descripción (manual)</label>
              <Input className="w-full" value={manual.descripcion}
                onChange={(e) => setManual({ ...manual, descripcion: e.target.value })}
                placeholder="Ej: Combustible obra" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Valor unitario</label>
              <Input type="number" className="w-40" value={manual.valor}
                onChange={(e) => setManual({ ...manual, valor: e.target.value })} placeholder="0" />
            </div>
            <Boton onClick={agregarManual}>Agregar manual</Boton>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-[#e5e7eb] text-xs uppercase text-right">
                  <th className="px-2 py-2 text-left font-semibold">Concepto</th>
                  <th className="px-2 py-2 text-left w-28 font-semibold">Origen</th>
                  <th className="px-2 py-2 w-24 font-semibold">Cantidad</th>
                  <th className="px-2 py-2 font-semibold">Costo unit.</th>
                  <th className="px-2 py-2 font-semibold">Costo total</th>
                  <th className="px-2 py-2 font-semibold">Valor unit.</th>
                  <th className="px-2 py-2 font-semibold">Valor total</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {gen.map((g) => {
                  const r = calc(g.valor_unitario, g.cantidad);
                  return (
                    <tr key={g.id} className="border-b border-[#f0f1f3]">
                      <td className="px-2 py-2 font-medium">{g.descripcion}</td>
                      <td className="px-2 py-2 capitalize text-gray-500">{g.origen}</td>
                      <td className="px-2 py-2 text-right">
                        <input type="number" defaultValue={g.cantidad}
                          onBlur={(e) => cambiarCantidadGen(g.id, e.target.value)}
                          className="w-20 text-right px-2 py-1.5 text-sm bg-white border border-[#d1d5db] rounded-lg outline-none focus:border-azul focus:ring-2 focus:ring-azul/25" />
                      </td>
                      <td className="px-2 py-2 text-right text-gray-600 whitespace-nowrap">{formato(r.costoUnit)}</td>
                      <td className="px-2 py-2 text-right font-medium whitespace-nowrap">{formato(r.costoTotal)}</td>
                      <td className="px-2 py-2 text-right text-gray-600 whitespace-nowrap">{formato(r.valorUnit)}</td>
                      <td className="px-2 py-2 text-right font-semibold text-azul whitespace-nowrap">{formato(r.valorTotal)}</td>
                      <td className="px-2 py-2 text-center">
                        <button onClick={() => eliminarGen(g.id)} className="text-gray-400 hover:text-red-600 transition-colors p-1"><IconX /></button>
                      </td>
                    </tr>
                  );
                })}
                {gen.length === 0 && (
                  <tr><td colSpan={8} className="px-3 py-6 text-center text-gray-400">Sin costos generales aún.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      <div className="fixed bottom-0 left-0 right-0 md:left-[248px] bg-white border-t border-[#e5e7eb] px-6 py-3 flex justify-between items-center gap-4 z-10">
        <Boton variant="warning" onClick={actualizarCostos}>Actualizar costos</Boton>
        <div className="text-right">
          <div className="text-gray-500 text-xs">Costo total: {formato(totalCosto)}</div>
          <div className="text-lg md:text-xl font-bold text-azul">Valor total: {formato(totalValor)}</div>
        </div>
      </div>
    </div>
  );
}
