"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

const formato = (n) =>
  Number(n).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

const CAMPOS = [
  { k: "ciudad_fecha", label: "Ciudad, fecha", ph: "Tuluá, Agosto 4 de 2026" },
  { k: "empresa", label: "Empresa (destinatario)", ph: "EMPRESA S.A." },
  { k: "atn", label: "Atn", ph: "Área de compras" },
  { k: "contacto", label: "Contacto", ph: "Ing(a). Nombre" },
  { k: "direccion", label: "Dirección – Departamento", ph: "Dirección – Valle del Cauca" },
  { k: "referencia", label: "Referencia", ph: "" },
  { k: "alcance", label: "Alcance", ph: "", area: true },
  { k: "valor", label: "Valor", ph: "" },
  { k: "forma_pago", label: "Forma de pago", ph: "" },
  { k: "tiempo_entrega", label: "Tiempo de entrega", ph: "" },
  { k: "validez", label: "Validez de la oferta", ph: "" },
  { k: "observaciones", label: "Observaciones", ph: "", area: true },
  { k: "garantia", label: "Política de garantía", ph: "", area: true },
  { k: "personal", label: "Personal estimado para la ejecución", ph: "", area: true },
  { k: "elaborada_por", label: "Elaborada por", ph: "" },
  { k: "aprobada_por", label: "Aprobada por", ph: "" },
];

export default function OfertaPage() {
  const { id } = useParams();
  const presId = Number(id);
  const [pres, setPres] = useState(null);
  const [filas, setFilas] = useState([]);
  const [of, setOf] = useState({});
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargar();
  }, [presId]);

  async function cargar() {
    const { data: p } = await supabase
      .from("presupuestos")
      .select("*, clientes(nombre)")
      .eq("id", presId)
      .single();
    if (!p) return;
    setPres(p);
    setOf({ empresa: p.clientes?.nombre || "", ...(p.oferta || {}) });

    const ot = p.ot || 0;
    const iva = p.iva || 0;
    const ue = p.ue || 0;
    const calc = (base, cant) => {
      const cu = base * (1 + ot) * (1 + iva);
      const vu = ue < 1 ? (cu * (1 + ot) * (1 + iva)) / (1 - ue) : 0;
      return { cu, ct: cu * cant, vu, vt: vu * cant };
    };

    const { data: apus } = await supabase
      .from("presupuesto_apus")
      .select("*, apus(codigo, descripcion, unidad)")
      .eq("presupuesto_id", presId)
      .order("id");
    const { data: gen } = await supabase
      .from("presupuesto_generales")
      .select("*")
      .eq("presupuesto_id", presId)
      .order("id");

    const fApus = (apus || []).map((l) => {
      const r = calc(l.costo_unitario, l.cantidad);
      return {
        codigo: l.apus?.codigo || "",
        descripcion: l.apus?.descripcion || "",
        unidad: l.apus?.unidad || "",
        cantidad: l.cantidad,
        ...r,
      };
    });
    const fGen = (gen || []).map((g) => {
      const r = calc(g.valor_unitario, g.cantidad);
      return { codigo: "", descripcion: g.descripcion, unidad: g.origen, cantidad: g.cantidad, ...r };
    });
    setFilas([...fApus, ...fGen]);
  }

  async function guardar() {
    setGuardando(true);
    await supabase.from("presupuestos").update({ oferta: of }).eq("id", presId);
    setGuardando(false);
    alert("Datos guardados.");
  }

  if (!pres) return <div className="p-8 text-gray-500">Cargando...</div>;

  const totCosto = filas.reduce((s, f) => s + f.ct, 0);
  const totValor = filas.reduce((s, f) => s + f.vt, 0);

  return (
    <div className="p-8">
      {/* ===== ZONA EDITABLE (no se imprime) ===== */}
      <div className="no-print">
        <a href={`/presupuesto/${presId}`} className="text-sm" style={{ color: "#00369C" }}>
          ← Volver al armado
        </a>
        <h1 className="text-2xl font-bold mt-2 mb-4" style={{ color: "#00369C" }}>
          Oferta técnico-comercial
        </h1>

        <div className="bg-white border rounded-lg p-4 mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {CAMPOS.map((c) => (
            <div key={c.k} className={c.area ? "md:col-span-2" : ""}>
              <label className="block text-sm text-gray-600 mb-1">{c.label}</label>
              {c.area ? (
                <textarea
                  rows={2}
                  className="border rounded px-3 py-2 w-full"
                  value={of[c.k] || ""}
                  placeholder={c.ph}
                  onChange={(e) => setOf({ ...of, [c.k]: e.target.value })}
                />
              ) : (
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={of[c.k] || ""}
                  placeholder={c.ph}
                  onChange={(e) => setOf({ ...of, [c.k]: e.target.value })}
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3 mb-8">
          <button
            onClick={guardar}
            disabled={guardando}
            className="px-5 py-2 rounded font-semibold text-white"
            style={{ backgroundColor: "#00369C" }}
          >
            {guardando ? "Guardando..." : "Guardar datos"}
          </button>
          <button
            onClick={() => window.print()}
            className="px-5 py-2 rounded font-semibold"
            style={{ backgroundColor: "#F6D000", color: "#00369C" }}
          >
            🖨 Imprimir / Guardar PDF
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Al imprimir aparece el membrete completo. Activa &quot;Gráficos de fondo&quot; no es necesario (el membrete es imagen).
        </p>
      </div>

      {/* ===== CARTA (área imprimible) ===== */}
      <img src="/membrete.png" alt="" className="membrete" />
      <div className="hoja">
        <p style={{ textAlign: "right", marginBottom: 18 }}>{of.ciudad_fecha}</p>
        <p style={{ margin: 0 }}>Señores:</p>
        <p style={{ margin: 0, fontWeight: 700 }}>{of.empresa}</p>
        <p style={{ margin: 0 }}>Atn: {of.atn}</p>
        <p style={{ margin: 0 }}>Contacto: {of.contacto}</p>
        <p style={{ margin: "0 0 12px" }}>{of.direccion}</p>

        <p style={{ margin: "0 0 10px" }}>
          <b>Referencia:</b> {of.referencia}
        </p>
        <p style={{ margin: "0 0 10px" }}>
          En atención a su amable solicitud, presentamos bajo su consideración la siguiente Oferta
          Técnico/Comercial bajo los requerimientos entregados:
        </p>

        {[
          ["ALCANCE", of.alcance],
          ["VALOR", of.valor],
          ["FORMA DE PAGO", of.forma_pago],
          ["TIEMPO DE ENTREGA", of.tiempo_entrega],
          ["VALIDEZ DE LA OFERTA", of.validez],
          ["OBSERVACIONES", of.observaciones],
          ["POLÍTICA DE GARANTÍA", of.garantia],
          ["PERSONAL ESTIMADO PARA LA EJECUCIÓN DE LA OBRA", of.personal],
        ].map(([lbl, val]) => (
          <p key={lbl} style={{ margin: "0 0 8px", whiteSpace: "pre-wrap" }}>
            <b>{lbl}:</b> {val}
          </p>
        ))}

        <p style={{ margin: "16px 0 0" }}>Agradeciendo su atención y dispuestos a resolver inquietud.</p>
        <p style={{ margin: "12px 0 24px" }}>Atentamente,</p>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ borderTop: "1px solid #000", padding: "4px 8px", width: "45%" }}>
                Elaborada Por: {of.elaborada_por}
              </td>
              <td style={{ width: "10%" }}></td>
              <td style={{ borderTop: "1px solid #000", padding: "4px 8px", width: "45%" }}>
                Aprobada Por: {of.aprobada_por}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Página 2 */}
        <div className="salto"></div>
        <h2 style={{ textAlign: "center", margin: "0 0 14px", color: "#00369C" }}>PROPUESTA ECONÓMICA</h2>
        <table className="economica">
          <thead>
            <tr>
              <th>Código</th>
              <th>Descripción</th>
              <th>Und</th>
              <th>Cant.</th>
              <th>Costo unit.</th>
              <th>Costo total</th>
              <th>Valor unit.</th>
              <th>Valor total</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f, i) => (
              <tr key={i}>
                <td>{f.codigo}</td>
                <td style={{ textAlign: "left" }}>{f.descripcion}</td>
                <td>{f.unidad}</td>
                <td>{f.cantidad}</td>
                <td className="num">{formato(f.cu)}</td>
                <td className="num">{formato(f.ct)}</td>
                <td className="num">{formato(f.vu)}</td>
                <td className="num">{formato(f.vt)}</td>
              </tr>
            ))}
            <tr className="tot">
              <td colSpan={5}></td>
              <td className="num">{formato(totCosto)}</td>
              <td></td>
              <td className="num">{formato(totValor)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <style jsx global>{`
        .membrete { display: none; }
        .hoja { max-width: 800px; }
        .economica { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 6px; }
        .economica th, .economica td { border: 1px solid #999; padding: 3px 5px; text-align: center; }
        .economica thead th { background: #00369C; color: #fff; }
        .economica td.num { text-align: right; white-space: nowrap; }
        .economica tr.tot td { font-weight: 700; background: #f0f0f0; }
        .salto { height: 20px; }

        @media print {
          @page { size: letter; margin: 3.1cm 2cm 2cm 2.4cm; }
          body { margin: 0; }
          .no-print { display: none !important; }
          .membrete {
            display: block;
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            z-index: 0;
          }
          .hoja { position: relative; z-index: 1; max-width: none; font-size: 12px; }
          .salto { page-break-before: always; height: 0; }
          .economica { font-size: 10px; }
        }
      `}</style>
    </div>
  );
}
