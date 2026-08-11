"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import ImportarDatos from "../../components/ImportarDatos";
import { Boton, Input, Card, Tabla, Celda, PageHeader } from "../../components/ui";

export default function Materiales() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [cargando, setCargando] = useState(false);

  async function buscar() {
    setCargando(true);
    let query = supabase.from("materiales").select("*").order("descripcion").limit(100);
    if (q.trim()) {
      query = supabase
        .from("materiales")
        .select("*")
        .or(`descripcion.ilike.%${q}%,codigo.ilike.%${q}%`)
        .order("descripcion")
        .limit(100);
    }
    const { data } = await query;
    setItems(data || []);
    setCargando(false);
  }

  useEffect(() => { buscar(); }, []);

  const money = (n) => "$" + Number(n || 0).toLocaleString("es-CO");

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader titulo="Materiales (SIESA)" subtitulo="Catálogo de materiales con búsqueda en tiempo real" />

      <Card className="p-4 mb-5 animate-slide-up">
        <ImportarDatos
          tabla="materiales"
          onImport={buscar}
          columnas={[
            { campo: "codigo", tipo: "texto" },
            { campo: "descripcion", tipo: "texto" },
            { campo: "ume", tipo: "texto" },
            { campo: "bodega", tipo: "texto" },
            { campo: "costo_base", tipo: "numero" },
          ]}
        />
        <div className="flex gap-2.5 flex-wrap pt-1">
          <Input
            placeholder="Buscar por descripción o código..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && buscar()}
            className="flex-1 min-w-[240px]"
          />
          <Boton onClick={buscar}>Buscar</Boton>
        </div>
      </Card>

      <p className="text-gray-500 text-xs mb-3">
        {cargando ? "Cargando..." : `Mostrando ${items.length} resultados (máx. 100)`}
      </p>

      {cargando ? (
        <div className="skeleton h-64 rounded-xl" />
      ) : items.length === 0 ? (
        <Card className="p-10 text-center text-gray-400 text-sm animate-slide-up">
          Sin resultados para esta búsqueda.
        </Card>
      ) : (
        <Tabla columnas={["Código", "Descripción", "UM", "Bodega", <span key="cb" className="block text-right">Costo base</span>]}>
          {items.map((m) => (
            <tr key={m.id} className="border-b border-[#f0f1f3] last:border-0 hover:bg-[#f9fafb] transition-colors">
              <Celda className="text-gray-500 whitespace-nowrap">{m.codigo}</Celda>
              <Celda className="font-medium">{m.descripcion}</Celda>
              <Celda className="text-gray-600">{m.ume}</Celda>
              <Celda className="text-gray-600">{m.bodega}</Celda>
              <Celda className="text-right font-semibold text-azul whitespace-nowrap">{money(m.costo_base)}</Celda>
            </tr>
          ))}
        </Tabla>
      )}
    </div>
  );
}
