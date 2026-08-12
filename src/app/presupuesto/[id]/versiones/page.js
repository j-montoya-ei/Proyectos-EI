"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabase";
import { Boton, Card } from "../../../../components/ui";

const formato = (n) =>
  Number(n).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const fecha = (s) => new Date(s).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });

export default function VersionesPage() {
  const { id } = useParams();
  const presId = Number(id);
  const [versiones, setVersiones] = useState([]);
  const [abierta, setAbierta] = useState(null);

  useEffect(() => {
    cargar();
  }, [presId]);

  async function cargar() {
    const { data } = await supabase
      .from("presupuesto_versiones")
      .select("*")
      .eq("presupuesto_id", presId)
      .order("version", { ascending: false });
    setVersiones(data || []);
  }

  async function eliminar(vid) {
    if (!confirm("¿Eliminar esta versión guardada?")) return;
    await supabase.from("presupuesto_versiones").delete().eq("id", vid);
    setAbierta(null);
    cargar();
  }

  return (
    <div className="max-w-5xl mx-auto">
      <a href={`/presupuesto/${presId}`} className="inline-flex items-center gap-1.5 text-sm text-azul hover:underline mb-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Volver al presupuesto
      </a>
      <h1 className="text-2xl font-bold text-azul mb-6 animate-fade-in">Versiones guardadas</h1>

      {versiones.length === 0 && (
        <Card className="p-10 text-center text-gray-400 text-sm animate-slide-up">
          Aún no has guardado ninguna versión.
        </Card>
      )}

      {versiones.map((v) => (
        <Card key={v.id} className="mb-4 overflow-hidden animate-slide-up">
          <div className="flex justify-between items-center px-4 py-3 bg-azul gap-3 flex-wrap">
            <div className="text-white font-semibold">V{v.version} · {v.nombre}</div>
            <div className="flex items-center gap-2.5">
              <span className="text-white text-xs opacity-80">{fecha(v.creado_en)}</span>
              <Boton size="sm" variant="warning" onClick={() => setAbierta(abierta === v.id ? null : v.id)}>
                {abierta === v.id ? "Ocultar" : "Ver"}
              </Boton>
              <Boton size="sm" variant="danger" onClick={() => eliminar(v.id)}>Eliminar</Boton>
            </div>
          </div>

          <div className="flex justify-between px-4 py-2.5 text-sm bg-[#f9fafb] border-b border-[#e5e7eb]">
            <span className="text-gray-600">Costo total: {formato(v.total_costo)}</span>
            <span className="font-bold text-azul">Valor total: {formato(v.total_valor)}</span>
          </div>

          {abierta === v.id && (
            <div className="p-4">
              <p className="text-sm text-gray-500 mb-4">
                OT {((v.datos?.ot || 0) * 100).toFixed(1)}% · IVA {((v.datos?.iva || 0) * 100).toFixed(1)}% · UE {((v.datos?.ue || 0) * 100).toFixed(1)}%
              </p>
              <TablaDetalle titulo="APUs" filas={v.datos?.apus || []} />
              <TablaDetalle titulo="Costos generales" filas={v.datos?.generales || []} />
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

function TablaDetalle({ titulo, filas }) {
  if (filas.length === 0) return null;
  return (
    <div className="mb-6 last:mb-0">
      <h3 className="font-semibold mb-2 text-azul text-sm">{titulo}</h3>
      <div className="overflow-x-auto border border-[#e5e7eb] rounded-xl">
        <table className="w-full text-sm bg-white">
          <thead>
            <tr className="bg-azul text-white text-left">
              <th className="px-3 py-2 font-semibold">Concepto</th>
              <th className="px-3 py-2 text-right w-20 font-semibold">Cant.</th>
              <th className="px-3 py-2 text-right font-semibold">Costo unit.</th>
              <th className="px-3 py-2 text-right font-semibold">Costo total</th>
              <th className="px-3 py-2 text-right font-semibold">Valor unit.</th>
              <th className="px-3 py-2 text-right font-semibold">Valor total</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f, idx) => (
              <tr key={idx} className="border-b border-[#f0f1f3] last:border-0">
                <td className="px-3 py-2 font-medium">{f.descripcion}</td>
                <td className="px-3 py-2 text-right">{f.cantidad}</td>
                <td className="px-3 py-2 text-right text-gray-600">{formato(f.costo_unit)}</td>
                <td className="px-3 py-2 text-right font-medium">{formato(f.costo_total)}</td>
                <td className="px-3 py-2 text-right text-gray-600">{formato(f.valor_unit)}</td>
                <td className="px-3 py-2 text-right font-semibold text-azul">{formato(f.valor_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
