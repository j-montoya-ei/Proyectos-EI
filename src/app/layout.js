import "./globals.css";
import Shell from "../components/Shell";

export const metadata = {
  title: "Proyectos EI",
  description: "Gestión de Proyectos - Electroingeniería",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ margin: 0 }}>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
