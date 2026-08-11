import "./globals.css";
import { Inter } from "next/font/google";
import Shell from "../components/Shell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "Proyectos EI",
  description: "Gestión de Proyectos - Electroingeniería S.A.S",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={inter.variable}>
      <body style={{ margin: 0 }}>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
