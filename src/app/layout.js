import "./globals.css";

export const metadata = {
  title: "Proyectos EI",
  description: "Gestión de Proyectos - Electroingeniería",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ margin: 0 }}>
        <div style={{ display: "flex", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
          <aside style={{ width: 230, background: "#00369C", color: "white", padding: "28px 20px" }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 40, letterSpacing: -0.5 }}>
              electro<span style={{ color: "#F6D000" }}>ingeniería</span>
            </h2>
            <nav style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <a href="/" style={linkStyle}>🏠 Inicio</a>
              <a href="/clientes" style={linkStyle}>👥 Clientes</a>
              <a href="/materiales" style={linkStyle}>📦 Materiales</a>
              <a href="/recursos-mo" style={linkStyle}>🔧 Mano de Obra</a>
              <a href="/transporte" style={linkStyle}>🚚 Transporte</a>
              <a href="/viaticos" style={linkStyle}>🍽️ Viáticos</a>
              <a href="/equipo-herramienta" style={linkStyle}>🛠️ Equipo y herramienta</a>
              <a href="/diseno" style={linkStyle}>📐 Diseño y trámites</a>
            </nav>
          </aside>
          <main style={{ flex: 1, background: "#f4f5f7", padding: 40, color: "#1a1a1a" }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

const linkStyle = {
  color: "white",
  textDecoration: "none",
  padding: "10px 14px",
  borderRadius: 8,
  fontSize: 15,
};
