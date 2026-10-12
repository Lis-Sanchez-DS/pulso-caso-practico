import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import Link from "next/link";
import Logo from "./Logo";
import Nav from "./Nav";
import "./globals.css";

// Tipografía de la marca: Bricolage Grotesque (titulares y logotipo) + DM Sans (texto de interfaz)
const titulos = Bricolage_Grotesque({ variable: "--font-titulos", subsets: ["latin"], weight: ["600", "700", "800"] });
const texto = DM_Sans({ variable: "--font-texto", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pulso: ¿por qué se van los clientes?",
  description: "Caso práctico de Keyrus: exploración de los clientes de Pulso.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${titulos.variable} ${texto.variable}`}>
      <body>
        <header className="cabecera">
          <div className="cabecera-in">
            <Link href="/" className="marca" aria-label="Pulso, inicio">
              <Logo />
              <small>Caso práctico · Keyrus</small>
            </Link>
            <Nav />
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
