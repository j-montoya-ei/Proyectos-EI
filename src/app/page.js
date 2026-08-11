"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Inicio() {
  const [cargando, setCargando] = useState(true);
  const [nombre, setNombre] = useState("");
  const [k, setK] = useState({
    clientes: 0, presupuestos: 0, apus: 0,
    costoTotal: 0, valorTotal: 0, utilidad: 0, margen: 0,
    publico: 0, privado: 0, conVersion: 0,
  });
  const [ultimos, setUltimos] = useState([]);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    const { data: s } = await supabase.auth.getSession();
    if (s.session) {
      const { data: p } = await supabase.from("perfiles").select("nombre").eq("id", s.session.user.id).single();
      setNombre(p?.nombre || s.session.user.email);
    }

    const { data: clientes } = await supabase.from("clientes").select("id, tipo");
    const { data: presus } = await supabase
      .from("presupuestos")
      .select("id, nombre, created_at, clientes(nombre)")
      .order("created_at", { ascending: false });
    const { count: apusCount } = await supabase.from("apus").select("*", { count: "exact", head: true });

    const ids = (presus || []).map((p) => p.id);
    let versiones = [];
    if (ids.length) {
      const { data: v } = await supabase
        .from("presupuesto_versiones")
        .select("presupuesto_id, version, total_costo, total_valor")
        .in("presupuesto_id", ids);
      versiones = v || [];
    }

    const ultima = {};
    versiones.forEach((v) => {
      const cur = ultima[v.presupuesto_id];
      if (!cur || v.version > cur.version) ultima[v.presupuesto_id] = v;
    });

    let costoTotal = 0, valorTotal = 0, conVersion = 0;
    Object.values(ultima).forEach((v) => {
      costoTotal += Number(v.total_costo) || 0;
      valorTotal += Number(v.total_valor) || 0;
      conVersion++;
    });
    const utilidad = valorTotal - costoTotal;
    const margen = valorTotal > 0 ? (utilidad / valorTotal) * 100 : 0;

    const publico = (clientes || []).filter((c) => (c.tipo || "").toLowerCase().includes("pb") || (c.tipo || "").toLowerCase().includes("úb") || (c.tipo || "").toLowerCase().includes("ub")).length;
    const privado = (clientes || []).filter((c) => (c.tipo || "").toLowerCase().includes("priv")).length;

    setK({
      clientes: (clientes || []).length,
      presupuestos: (presus || []).length,
      apus: apusCount || 0,
      costoTotal, valorTotal, utilidad, margen, publico, privado, conVersion,
    });
    setUltimos((presus || []).slice(0, 5));
    setCargando(false);
  }

  const cop = (n) => Number(n || 0).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
  const fecha = (d) => new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-7 animate-fade-in">
        <h1 className="text-2xl font-bold text-azul">Hola, {nombre || "..."}</h1>
        <p className="text-gray-500 text-sm mt-0.5">Resumen general de Proyectos EI</p>
      </div>

      {cargando ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card i={1} icon="users" label="Clientes" valor={k.clientes} />
            <Card i={2} icon="doc" label="Presupuestos" valor={k.presupuestos} />
            <Card i={3} icon="layers" label="APUs (catálogo)" valor={k.apus.toLocaleString("es-CO")} />
            <Card i={4} icon="cash" label="Valor ofertado" valor={cop(k.valorTotal)} acento />
          </div>

          <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 mb-6 animate-slide-up">
            <h2 className="text-xs font-semibold text-gray-500 mb-4 uppercase tracking-wide">Resumen financiero (presupuestos versionados)</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Fin label="Costo total" valor={cop(k.costoTotal)} color="#1a1a1a" />
              <Fin label="Valor total" valor={cop(k.valorTotal)} color="#00369C" />
              <Fin label="Utilidad estimada" valor={cop(k.utilidad)} color="#16a34a" />
              <Fin label="Margen" valor={k.margen.toFixed(1) + "%"} color="#16a34a" />
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Calculado sobre {k.conVersion} de {k.presupuestos} presupuestos (los que tienen versión guardada).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 animate-slide-up delay-1">
              <h2 className="text-xs font-semibold text-gray-500 mb-4 uppercase tracking-wide">Clientes por tipo</h2>
              <Barra label="Privado" valor={k.privado} total={k.clientes} color="#00369C" />
              <Barra label="Público" valor={k.publico} total={k.clientes} color="#F6D000" />
            </div>

            <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 animate-slide-up delay-2">
              <h2 className="text-xs font-semibold text-gray-500 mb-4 uppercase tracking-wide">Últimos presupuestos</h2>
              {ultimos.length === 0 ? (
                <p className="text-gray-400 text-sm">Aún no hay presupuestos.</p>
              ) : (
                <div className="divide-y divide-[#f0f1f3]">
                  {ultimos.map((p) => (
                    <div key={p.id} className="flex justify-between items-center py-2.5 px-1 rounded-lg hover:bg-[#f4f5f7] transition-colors">
                      <div>
                        <div className="text-sm font-medium">{p.nombre}</div>
                        <div className="text-xs text-gray-400">{p.clientes?.nombre || "Sin cliente"}</div>
                      </div>
                      <div className="text-xs text-gray-500">{fecha(p.created_at)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const ICONOS = {
  users: "M16 19v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V19M9 9.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z",
  doc: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5ZM14 3v5h5M9 13h6M9 17h6",
  layers: "m12 2 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 17l9 5 9-5",
  cash: "M2 7h20v10H2zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 10v4M18 10v4",
};

function Card({ label, valor, acento, icon, i }) {
  return (
    <div
      className={`bg-white rounded-xl p-5 card-hover animate-slide-up delay-${i} border ${acento ? "border-amarillo" : "border-[#e5e7eb]"}`}
    >
      <div className={`h-9 w-9 rounded-lg grid place-items-center mb-3 ${acento ? "bg-[#fef7d6] text-[#b89b00]" : "bg-azul-soft text-azul"}`}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d={ICONOS[icon]} />
        </svg>
      </div>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-2xl font-bold text-azul">{valor}</div>
    </div>
  );
}

function Fin({ label, valor, color }) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-lg font-bold" style={{ color }}>{valor}</div>
    </div>
  );
}

function Barra({ label, valor, total, color }) {
  const pct = total > 0 ? (valor / total) * 100 : 0;
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(pct), 120);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="font-semibold">{valor}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <div className="h-2 rounded-full transition-[width] duration-700 ease-out" style={{ width: w + "%", background: color }} />
      </div>
    </div>
  );
}
