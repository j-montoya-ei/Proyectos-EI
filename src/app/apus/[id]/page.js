"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

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

  if (!apu) return <div className="p-8 text-gray-500">Cargando...</div>;

  return (
    <div className="p-8">
      <a href="/apus" className="text-sm" style={{ color: "#00369C" }}>
        ← Volver a APUs
      </a>
      <h1 className="text-2xl font-bold mt-2 mb-1" style={{ color: "#00369C" }}>
        {apu.codigo} · {apu.descripcion}
      </h1>
      <p className="text-gray-500 mb-6">
        Unidad: {apu.unidad || "-"} · Tipo: {apu.tipo}
      </p>

      {secciones.map((familia) => {
        const cfg = FAMILIAS[familia];
        const lineasFam = lineas.filter((l) => l.familia === familia);
        const subtotal = lineasFam.reduce((s, l) => s + l.cantidad * l.valor_unitario, 0);
        const res = resultados[familia] || [];
        return (
          <div key={familia} className="mb-8 border rounded-lg overflow-hidden">
            <div className="px-4 py-2 font-semibold text-white" style={{ backgroundColor: "#00369C" }}>
              {cfg.label}
            </div>

            <div className="p-4">
              <div className="relative mb-3">
                <input
                  className="border rounded px-3 py-2 w-full"
                  placeholder={`Buscar en ${cfg.label.toLowerCase()}...`}
                  value={busq[familia] || ""}
                  onChange={(e) => buscar(familia, e.target.value)}
                />
                {res.length > 0 && (
                  <div className="absolute z-10 bg-white border rounded w-full mt-1 max-h-60 overflow-y-auto shadow">
                    {res.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => agregar(familia, item)}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex justify-between text-sm"
                      >
                        <span>{item[cfg.desc]}</span>
                        <span className="text-gray-500">{formato(cfg.precio(item))}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b">
                    <th className="text-left py-1">Descripción</th>
                    <th className="text-right py-1 w-28">Cantidad</th>
                    <th className="text-right py-1 w-36">Vr. unitario</th>
                    <th className="text-right py-1 w-36">Subtotal</th>
                    <th className="w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {lineasFam.map((l) => (
                    <tr key={l.id} className="border-b">
                      <td className="py-1">{l.descripcion}</td>
                      <td className="text-right py-1">
                        <input
                          type="number"
                          defaultValue={l.cantidad}
                          onBlur={(e) => cambiarCantidad(l.id, e.target.value)}
                          className="border rounded px-2 py-1 w-24 text-right"
                        />
                      </td>
                      <td className="text-right py-1">{formato(l.valor_unitario)}</td>
                      <td className="text-right py-1 font-medium">
                        {formato(l.cantidad * l.valor_unitario)}
                      </td>
                      <td className="text-center py-1">
                        <button
                          onClick={() => eliminarLinea(l.id)}
                          className="text-red-600 font-bold px-2"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                  {lineasFam.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-3 text-center text-gray-400">
                        Sin líneas en esta sección.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="text-right mt-2 font-semibold">
                Subtotal {cfg.label}: {formato(subtotal)}
              </div>
            </div>
          </div>
        );
      })}

      <div className="flex justify-between items-center border-t pt-4">
        <button
          onClick={actualizarPrecios}
          className="px-4 py-2 rounded font-semibold"
          style={{ backgroundColor: "#F6D000" }}
        >
          Actualizar precios
        </button>
        <div className="text-xl font-bold" style={{ color: "#00369C" }}>
          COSTO APU: {formato(total)}
        </div>
      </div>
    </div>
  );
}
