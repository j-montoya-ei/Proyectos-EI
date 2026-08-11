"use client";

export function Boton({ children, onClick, variant = "primary", size = "md", type = "button", disabled, className = "" }) {
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
  };
  const variants = {
    primary: "bg-azul text-white hover:bg-azul-hover shadow-sm",
    secondary: "bg-white text-gray-700 border border-[#d1d5db] hover:bg-gray-50",
    warning: "bg-amarillo text-azul hover:brightness-95",
    danger: "bg-red-500 text-white hover:bg-red-600",
    ghost: "text-gray-600 hover:bg-gray-100",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

export function Input({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`px-3 py-2.5 text-sm bg-white border border-[#d1d5db] rounded-lg outline-none transition
        focus:border-azul focus:ring-2 focus:ring-azul/25 placeholder:text-gray-400 ${className}`}
    />
  );
}

export function Select({ children, className = "", ...props }) {
  return (
    <select
      {...props}
      className={`px-3 py-2.5 text-sm bg-white border border-[#d1d5db] rounded-lg outline-none transition cursor-pointer
        focus:border-azul focus:ring-2 focus:ring-azul/25 ${className}`}
    >
      {children}
    </select>
  );
}

export function Card({ children, className = "" }) {
  return (
    <div className={`bg-white border border-[#e5e7eb] rounded-xl ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({ titulo, subtitulo, acciones }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-6 animate-fade-in flex-wrap">
      <div>
        <h1 className="text-2xl font-bold text-azul">{titulo}</h1>
        {subtitulo && <p className="text-gray-500 text-sm mt-0.5">{subtitulo}</p>}
      </div>
      {acciones && <div className="flex gap-2">{acciones}</div>}
    </div>
  );
}

export function Tabla({ columnas = [], children }) {
  return (
    <div className="overflow-x-auto border border-[#e5e7eb] rounded-xl animate-slide-up">
      <table className="w-full text-sm border-collapse bg-white">
        <thead>
          <tr className="bg-azul text-white text-left">
            {columnas.map((c, i) => (
              <th key={i} className="px-4 py-3 font-semibold whitespace-nowrap">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Celda({ children, className = "" }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
