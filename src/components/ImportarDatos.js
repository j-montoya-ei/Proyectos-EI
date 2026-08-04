"use client";

import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "../lib/supabase";

function limpiarNumero(v) {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return v;
  let s = String(v).trim().replace(/[^\d.,-]/g, "");
  const coma = s.includes(",");
  const punto = s.includes(".");
  if (coma && punto) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (coma) {
    s = s.replace(",", ".");
  } else {
    const partes = s.split(".");
    if (partes.length > 2) s = partes.join("");
    else if (partes.length === 2 && partes[1].length === 3) s = partes.join("");
  }
  const n = Number(s);
  return isNaN(n) ? 0 : n;
}

export default function ImportarDatos({ tabla, columnas, onImport }) {
  const inputRef = useRef(null);
  const [cargando, setCargando] = useState(false);

  async function manejarArchivo(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCargando(true);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const filasRaw = XLSX.utils.sheet_to_json(ws, { defval: "" });

      const camposTexto = columnas.filter((c) => c.tipo === "texto").map((c) => c.campo);

      const filas = filasRaw
        .map((r) => {
          const obj = {};
          for (const c of columnas) {
            obj[c.campo] =
              c.tipo === "numero" ? limpiarNumero(r[c.campo]) : String(r[c.campo] ?? "").trim();
          }
          return obj;
        })
        .filter((r) => camposTexto.length === 0 || camposTexto.some((c) => r[c]));

      if (filas.length === 0) {
        alert(
          "No se encontraron filas válidas. Revisa que los encabezados sean EXACTOS: " +
            columnas.map((c) => c.campo).join(", ")
        );
        return;
      }

      if (
        !confirm(
          `Esto BORRARÁ todo lo que hay en "${tabla}" y cargará ${filas.length} filas nuevas. ¿Continuar?`
        )
      )
        return;

      const { error: errDel } = await supabase.from(tabla).delete().gte("id", 0);
      if (errDel) throw errDel;

      for (let i = 0; i < filas.length; i += 500) {
        const lote = filas.slice(i, i + 500);
        const { error } = await supabase.from(tabla).insert(lote);
        if (error) throw error;
      }

      alert(`Listo. Se cargaron ${filas.length} filas en "${tabla}".`);
      if (onImport) onImport();
    } catch (err) {
      alert("Error al importar: " + (err.message || err));
    } finally {
      setCargando(false);
      e.target.value = "";
    }
  }

  return (
    <div className="inline-flex items-center gap-2 mb-4">
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={manejarArchivo}
        style={{ display: "none" }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={cargando}
        className="px-4 py-2 rounded font-semibold"
        style={{ backgroundColor: "#F6D000", color: "#00369C", opacity: cargando ? 0.6 : 1 }}
      >
        {cargando ? "Importando..." : "⬆ Importar CSV/Excel"}
      </button>
      <span className="text-xs text-gray-500">
        Encabezados exactos: {columnas.map((c) => c.campo).join(", ")}
      </span>
    </div>
  );
}
