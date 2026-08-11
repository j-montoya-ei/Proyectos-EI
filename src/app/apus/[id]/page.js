"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { Boton, Input, Card } from "../../../components/ui";

const FAMILIAS = {
  materiales: {
    tabla: "materiales",
    label: "Materiales",
    desc: "descripcion",
    buscar: "descripcion,codigo",
    precio: (r) => Number(r.costo_base) || 0,
  },
  mano_obra: {
    tabla: "recursos_mo",
    label: "Mano de obra",
    desc: "cargo",
    buscar: "cargo,codigo",
    precio: (r) => (Number(r.costo_mensual) || 0) / 24,
  },
  equipo: {
    tabla: "equipo",
    label: "Equipo y herramienta",
    desc: "descripcion",
    buscar: "descripcion",
    precio: (r) => Number(r.valor_dia) || 0,
  },
  diseno: {
    tabla: "diseno",
    label: "Diseño y trámites",
    desc: "descripcion",
    buscar: "descripcion",
    precio: (r) => Number(r.costo) || 0,
  },
};

const SECCIONES = {
  obra: ["materiales", "mano_obra", "equipo"],
  diseno: ["diseno"],
};

const formato = (n) =>
  Number(n).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

export default function ArmarApuPage() {
  const { id } = useParams();
  const apuId = Number(id);
  const [apu, setApu] = useState(null);
  const [lineas, setLineas] = useState([]);
  const [busq, setBusq] = useState({});
  const [resultados, setResultados] = useState({});

  useEffect(() => {
    cargarApu();
    cargarLineas();
  }, [apuId]);

  async function cargarApu() {
    const { data } = await supabase.from("apus").select("*").eq("id", apuId).single();
    setApu(data);
  }

  async function cargarLineas() {
    const { data } = await supabase
      .from("apu_lineas")
      .select("*")
      .eq("apu_id", apuId)
      .order("id", { ascending: true });
    setLineas(data || []);
  }

  async function buscar(familia, texto) {
    setBusq({ ...busq, [familia]: texto });
    if (!texto || texto.length < 2) {
      setResultados({ ...resultados, [familia]: [] });
      return;
    }
    const cfg = FAMILIAS[familia];
    const filtro = cfg.buscar
      .split(",")
      .map((c) => `${c}.ilike.%${texto}%`)
      .join(",");
    const { data } = await supabase.from(cfg.tabla).select("*").or(filtro).limit(15);
    setResultados({ ...resultados, [familia]: data || [] });
  }

  async function agregar(familia, item) {
    const cfg = FAMILIAS[familia];
    await supabase.from("apu_lineas").insert({
      apu_id: apuId,
      familia,
      item_id: item.id,
      descripcion: item[cfg.desc],
      cantidad: 1,
      valor_unitario: cfg.precio(item),
    });
    setBusq({ ...busq, [familia]: "" });
    setResultados({ ...resultados, [familia]: [] });
    cargarLineas();
  }

  async function cambiarCantidad(lineaId, valor) {
    await supabase.from("apu_lineas").update({ cantidad: Number(valor) || 0 }).eq("id", lineaId);
    cargarLineas();
  }

  async function eliminarLinea(lineaId) {
    await supabase.from("apu_lineas").delete().eq("id", lineaId);
    cargarLineas();
  }

  async function actualizarPrecios() {
    if (!confirm("Esto refrescará los precios de todas las líneas con los del catálogo actual. ¿Continuar?"))
      return;
    for (const l of lineas) {
      const cfg = FAMILIAS[l.familia];
      const { data } = await supabase.from(cfg.tabla).select("*").eq("id", l.item_id).single();
      if (data) {
        await supabase
          .from("apu_lineas")
          .update({ valor_unitario: cfg.precio(data) })
          .eq("id", l.id);
      }
    }
    cargarLineas();
    alert("Precios actualizados.");
  }

  const secciones = apu ? SECCIONES[apu.tipo] || SECCIONES.obra : [];
  const total = lineas.reduce((s, l) => s + l.cantidad * l.valor_unitario, 0);

  if (!apu) return <div className="max-w-5xl mx-auto"><div className="skeleton h-40 rounded-xl" /></div>;

  return (
    <div className="max-w-5xl mx-auto pb-24">
      <a href="/apus" className="inline-flex items-center gap-1.5 text-sm text-azul hover:underline mb-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Volver a APUs
      </a>

      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-azul">{apu.descripcion}</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Código {apu.codigo || "-"} · Unidad {apu.unidad || "-"} · <span className="capitalize">{apu.tipo}</span>
        </p>
      </div>

      {secciones.map((familia) => {
        const cfg = FAMILIAS[familia];
        const lineasFam = lineas.filter((l) => l.familia === familia);
        const subtotal = lineasFam.reduce((s, l) => s + l.cantidad * l.valor_unitario, 0);
        const res = resultados[familia] || [];
        return (
          <Card key={familia} className="mb-6 overflow-hidden animate-slide-up">
            <div className="px-4 py-2.5 font-semibold text-white bg-azul text-sm">
              {cfg.label}
            </div>

            <div className="p-4">
              <div className="relative mb-4">
                <Input
                  className="w-full"
                  placeholder={`Buscar en ${cfg.label.toLowerCase()}...`}
                  value={busq[familia] || ""}
                  onChange={(e) => buscar(familia, e.target.value)}
                />
                {res.length > 0 && (
                  <div className="absolute z-10 bg-white border border-[#e5e7eb] rounded-lg w-full mt-1 max-h-60 overflow-y-auto shadow-lg">
                    {res.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => agregar(familia, item)}
                        className="px-3 py-2 hover:bg-azul-soft cursor-pointer flex justify-between gap-3 text-sm transition-colors"
                      >
                        <span>{item[cfg.desc]}</span>
                        <span className="text-gray-500 whitespace-nowrap">{formato(cfg.precio(item))}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-[#e5e7eb] text-xs uppercase">
                    <th className="text-left py-2 font-semibold">Descripción</th>
                    <th className="text-right py-2 w-28 font-semibold">Cantidad</th>
                    <th className="text-right py-2 w-36 font-semibold">Vr. unitario</th>
                    <th className="text-right py-2 w-36 font-semibold">Subtotal</th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {lineasFam.map((l) => (
                    <tr key={l.id} className="border-b border-[#f0f1f3]">
                      <td className="py-2">{l.descripcion}</td>
                      <td className="text-right py-2">
                        <input
                          type="number"
                          defaultValue={l.cantidad}
                          onBlur={(e) => cambiarCantidad(l.id, e.target.value)}
                          className="w-24 text-right px-2 py-1.5 text-sm bg-white border border-[#d1d5db] rounded-lg outline-none focus:border-azul focus:ring-2 focus:ring-azul/25"
                        />
                      </td>
                      <td className="text-right py-2 text-gray-600">{formato(l.valor_unitario)}</td>
                      <td className="text-right py-2 font-semibold text-azul">
                        {formato(l.cantidad * l.valor_unitario)}
                      </td>
                      <td className="text-center py-2">
                        <button
                          onClick={() => eliminarLinea(l.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors p-1"
                          title="Eliminar línea"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6 6 18M6 6l12 12" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {lineasFam.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-gray-400">
                        Sin líneas en esta sección.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="text-right mt-3 text-sm font-semibold text-gray-700">
                Subtotal {cfg.label}: <span className="text-azul">{formato(subtotal)}</span>
              </div>
            </div>
          </Card>
        );
      })}

      <div className="fixed bottom-0 left-0 right-0 md:left-[248px] bg-white border-t border-[#e5e7eb] px-6 py-3 flex justify-between items-center z-10">
        <Boton variant="warning" onClick={actualizarPrecios}>Actualizar precios</Boton>
        <div className="text-lg md:text-xl font-bold text-azul">
          COSTO APU: {formato(total)}
        </div>
      </div>
    </div>
  );
}
