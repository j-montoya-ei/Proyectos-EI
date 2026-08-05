"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

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
    <div className="p-8">
      <a href={`/presupuesto/${presId}`} className="text-sm" style={{ color: "#00369C" }}>
        ← Volver al presupuesto
      </a>
      <h1 className="text-2xl font-bold mt-2 mb-6" style={{ color: "#00369C" }}>
        Versiones guardadas
      </h1>

      {versiones.length === 0 && (
        <p className="text-gray-500">Aún no has guardado ninguna versión.</p>
      )}

      {versiones.map((v) => (
        <div key={v.id} className="border rounded-lg mb-4 overflow-hidden">
          <div className="flex justify-between items-center px-4 py-3" style={{ backgroundColor: "#00369C" }}>
            <div className="text-white font-semibold">V{v.version} · {v.nombre}</div>
            <div className="flex items-center gap-3">
              <span className="text-white text-sm opacity-80">{fecha(v.creado_en)}</span>
              <button
                onClick={() => setAbierta(abierta === v.id ? null : v.id)}
                className="px-3 py-1 rounded font-semibold text-sm"
                style={{ backgroundColor: "#F6D000" }}
              >
                {abierta === v.id ? "Ocultar" : "Ver"}
              </button>
              <button
                onClick={() => eliminar(v.id)}
                className="px-3 py-1 rounded font-semibold text-white text-sm bg-red-600"
              >
                Eliminar
              </button>
            </div>
          </div>

          <div className="flex justify-between px-4 py-2 text-sm bg-gray-50 border-b">
            <span className="text-gray-600">Costo total: {formato(v.total_costo)}</span>
            <span className="font-bold" style={{ color: "#00369C" }}>
              Valor total: {formato(v.total_valor)}
            </span>
          </div>

          {abierta === v.id && (
            <div className="p-4">
              <p className="text-sm text-gray-500 mb-3">
                OT {((v.datos?.ot || 0) * 100).toFixed(1)}% · IVA {((v.datos?.iva || 0) * 100).toFixed(1)}% · UE {((v.datos?.ue || 0) * 100).toFixed(1)}%
              </p>
              <Tabla titulo="APUs" filas={v.datos?.apus || []} />
              <Tabla titulo="Costos generales" filas={v.datos?.generales || []} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Tabla({ titulo, filas }) {
  const formato = (n) =>
    Number(n).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
  if (filas.length === 0) return null;
  return (
    <div className="mb-6">
      <h3 className="font-semibold mb-2" style={{ color: "#00369C" }}>{titulo}</h3>
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm">
          <thead style={{ backgroundColor: "#00369C" }} className="text-white">
            <tr>
              <th className="px-3 py-2 text-left">Concepto</th>
              <th className="px-3 py-2 text-right w-20">Cant.</th>
              <th className="px-3 py-2 text-right">Costo unit.</th>
              <th className="px-3 py-2 text-right">Costo total</th>
              <th className="px-3 py-2 text-right">Valor unit.</th>
              <th className="px-3 py-2 text-right">Valor total</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f, idx) => (
              <tr key={idx} className="border-t">
                <td className="px-3 py-2 font-medium">{f.descripcion}</td>
                <td className="px-3 py-2 text-right">{f.cantidad}</td>
                <td className="px-3 py-2 text-right">{formato(f.costo_unit)}</td>
                <td className="px-3 py-2 text-right font-medium">{formato(f.costo_total)}</td>
                <td className="px-3 py-2 text-right">{formato(f.valor_unit)}</td>
                <td className="px-3 py-2 text-right font-medium" style={{ color: "#00369C" }}>{formato(f.valor_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
