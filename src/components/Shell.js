"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

const PUNTOS = [
  [195, 67, "g"], [295, 92, "g"], [102, 113, "g"], [177, 163, "y"],
  [357, 178, "g"], [266, 180, "y"], [61, 207, "g"], [160, 253, "w"],
  [251, 268, "y"], [348, 281, "g"], [87, 304, "w"], [276, 354, "g"],
  [175, 360, "g"],
];
const COLOR = { g: "#A4A8AB", y: "#F6D000", w: "#FFFFFF" };
const COLOR_LIGHT = { g: "#00369C", y: "#F6D000", w: "#00369C" };

const NAV = [
  { href: "/construccion", label: "Inicio", icon: "home" },
  { href: "/clientes", label: "Clientes", icon: "users" },
  { href: "/presupuesto", label: "Presupuestos", icon: "doc" },
  { href: "/apus", label: "APUs", icon: "layers" },
  { href: "/materiales", label: "Materiales", icon: "box" },
  { href: "/recursos-mo", label: "Mano de Obra", icon: "helmet" },
  { href: "/transporte", label: "Transporte", icon: "truck" },
  { href: "/viaticos", label: "Viáticos", icon: "wallet" },
  { href: "/equipo-herramienta", label: "Equipo y herramienta", icon: "wrench" },
  { href: "/diseno", label: "Diseño y trámites", icon: "pencil" },
];

const PATHS = {
  home: "M3 10.5 12 3l9 7.5M5 9.5V20h5v-6h4v6h5V9.5",
  users: "M16 19v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V19M9 9.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM22 19v-1.5a4 4 0 0 0-3-3.87M16 2.63a4 4 0 0 1 0 7.24",
  doc: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5ZM14 3v5h5M9 13h6M9 17h6",
  layers: "m12 2 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 17l9 5 9-5",
  box: "M21 8 12 3 3 8v8l9 5 9-5V8ZM3 8l9 5 9-5M12 13v9",
  helmet: "M4 15a8 8 0 0 1 16 0M2 15h20v3H2v-3ZM9 7V4h6v3M12 7v-3",
  truck: "M1 3h13v11H1V3ZM14 7h4l3 3v4h-7V7ZM6 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  wallet: "M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2ZM2 9V6a2 2 0 0 1 2-2h12M18 13.5h.01",
  wrench: "M14.5 5.5a4 4 0 0 1-5 5L4 16l4 4 5.5-5.5a4 4 0 0 1 5-5l-2.5-2.5 2-2-2-2-2 2-2.5-2.5Z",
  pencil: "M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z",
};

function Icon({ name }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={PATHS[name]} />
    </svg>
  );
}

function DotLogo({ mapa }) {
  return (
    <svg viewBox="20 30 380 370" width="30" height="30" className="shrink-0">
      {PUNTOS.map(([x, y, c], i) => (
        <circle key={i} cx={x} cy={y} r="34" fill={mapa[c]}
          className="animate-scale-in origin-center"
          style={{ animationDelay: `${i * 0.05}s`, transformBox: "fill-box", transformOrigin: "center" }} />
      ))}
    </svg>
  );
}

function iniciales(txt) {
  if (!txt) return "EI";
  const p = txt.trim().split(/\s+/);
  return ((p[0]?.[0] || "") + (p[1]?.[0] || "")).toUpperCase() || "EI";
}

export default function Shell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sesion, setSesion] = useState(undefined);
  const [perfil, setPerfil] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSesion(data.session);
      if (data.session) cargarPerfil(data.session.user.id);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSesion(s);
      if (s) cargarPerfil(s.user.id);
      else setPerfil(null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function cargarPerfil(id) {
    const { data } = await supabase.from("perfiles").select("nombre, rol").eq("id", id).single();
    setPerfil(data);
  }

  useEffect(() => {
    if (sesion === undefined) return;
    if (!sesion && pathname !== "/login") router.replace("/login");
    if (sesion && pathname === "/login") router.replace("/");
  }, [sesion, pathname]);

  useEffect(() => { setMenuAbierto(false); }, [pathname]);

  async function salir() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (pathname === "/login") return <>{children}</>;
  if (sesion === undefined)
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f4f5f7]">
        <div className="h-9 w-9 rounded-full border-[3px] border-[#e5e7eb] border-t-azul animate-spin" />
      </div>
    );
  if (!sesion) return null;

  const activo = (href) => pathname.startsWith(href);
  const conSidebar = !(pathname === "/" || pathname.startsWith("/planeacion"));

  return (
    <div className="flex min-h-screen">
      {conSidebar && menuAbierto && (
        <div onClick={() => setMenuAbierto(false)}
          className="fixed inset-0 bg-black/40 z-30 md:hidden" />
      )}

      {conSidebar && (
        <aside
          style={{ background: "linear-gradient(180deg,#00369C 0%,#002c82 100%)" }}
          className={`w-[248px] shrink-0 text-white flex flex-col fixed md:static inset-y-0 left-0 z-40
            transition-transform duration-300 md:translate-x-0
            ${menuAbierto ? "translate-x-0" : "-translate-x-full"}`}
        >
          <a href="/" className="flex items-center gap-2.5 px-6 pt-7 pb-8 group">
            <DotLogo mapa={COLOR} />
            <span className="text-[19px] font-extrabold tracking-tight leading-none">
              electro<span className="text-amarillo">ingeniería</span>
            </span>
          </a>

          <nav className="flex flex-col gap-1 px-3 overflow-y-auto pb-6">
            {NAV.map((n) => {
              const on = activo(n.href);
              return (
                <a key={n.href} href={n.href}
                  className={`group relative flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium
                    transition-all duration-200
                    ${on ? "bg-white/15 text-white" : "text-white/75 hover:bg-white/10 hover:text-white"}`}
                >
                  {on && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-amarillo" />}
                  <span className={`transition-transform duration-200 ${on ? "" : "group-hover:translate-x-0.5"}`}>
                    <Icon name={n.icon} />
                  </span>
                  {n.label}
                </a>
              );
            })}
          </nav>
        </aside>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-[#e5e7eb] flex items-center px-4 md:px-6 gap-3 sticky top-0 z-20">
          {conSidebar ? (
            <button onClick={() => setMenuAbierto(true)}
              className="md:hidden p-2 -ml-1 rounded-lg hover:bg-gray-100 text-gray-600" aria-label="Menú">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </button>
          ) : (
            <a href="/" className="flex items-center gap-2.5 group">
              <DotLogo mapa={COLOR_LIGHT} />
              <span className="text-[17px] font-extrabold tracking-tight leading-none text-[#00369C]">
                electro<span className="text-[#1a1a1a]">ingeniería</span>
              </span>
            </a>
          )}

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <div className="text-right leading-tight hidden sm:block">
              <div className="text-sm font-semibold text-[#1a1a1a]">{perfil?.nombre || sesion.user.email}</div>
              <div className="text-xs text-gray-500 capitalize">{perfil?.rol}</div>
            </div>
            <div className="h-9 w-9 rounded-full bg-azul text-white grid place-items-center text-xs font-bold shrink-0">
              {iniciales(perfil?.nombre || sesion.user.email)}
            </div>
            <button onClick={salir}
              className="p-2 rounded-lg border border-[#d1d5db] text-gray-600 hover:bg-gray-50 hover:text-azul transition-colors"
              title="Cerrar sesión">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            </button>
          </div>
        </header>

        <main className="flex-1 bg-[#f4f5f7] p-5 md:p-10 text-[#1a1a1a]">
          {children}
        </main>
      </div>
    </div>
  );
}
