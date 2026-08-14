export default function Landing() {
  return (
    <div className="max-w-4xl mx-auto py-6 md:py-12">
      <div className="mb-10 animate-fade-in">
        <h1 className="text-2xl md:text-[28px] font-extrabold tracking-tight text-[#1a1a1a]">
          Proyectos EI
        </h1>
        <p className="text-gray-500 mt-1.5 text-[15px]">
          Selecciona un módulo para empezar.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <a href="/planeacion"
          className="group animate-slide-up bg-white rounded-2xl border border-[#e5e7eb] p-7
            hover:border-azul hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
          style={{ animationDelay: "0.05s" }}>
          <div className="flex items-center justify-between mb-6">
            <div className="h-12 w-12 rounded-xl bg-azul/10 text-azul grid place-items-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18M8 17V9M13 17V5M18 17v-6" />
              </svg>
            </div>
            <span className="text-[11px] font-semibold text-[#0f6e56] bg-[#eaf3ee] px-2.5 py-1 rounded-full">Activo</span>
          </div>
          <h2 className="text-lg font-bold text-[#1a1a1a]">Planeación</h2>
          <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
            Sube los Excel de cada presupuesto y controla su estado en la línea del tiempo.
          </p>
          <div className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-azul">
            Entrar
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="group-hover:translate-x-1 transition-transform duration-200">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </div>
        </a>

        <a href="/construccion"
          className="group animate-slide-up bg-white rounded-2xl border border-[#e5e7eb] p-7
            hover:border-[#A4A8AB] hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
          style={{ animationDelay: "0.12s" }}>
          <div className="flex items-center justify-between mb-6">
            <div className="h-12 w-12 rounded-xl bg-[#A4A8AB]/15 text-[#6b7075] grid place-items-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 5.5a4 4 0 0 1-5 5L4 16l4 4 5.5-5.5a4 4 0 0 1 5-5l-2.5-2.5 2-2-2-2-2 2-2.5-2.5Z" />
              </svg>
            </div>
            <span className="text-[11px] font-semibold text-[#8a6d00] bg-amarillo/25 px-2.5 py-1 rounded-full">En pausa</span>
          </div>
          <h2 className="text-lg font-bold text-[#1a1a1a]">Módulo en construcción</h2>
          <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
            Presupuestos, APUs y catálogos. Congelado por ahora, disponible para consulta.
          </p>
          <div className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-[#6b7075]">
            Entrar
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="group-hover:translate-x-1 transition-transform duration-200">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </div>
        </a>
      </div>
    </div>
  );
}
