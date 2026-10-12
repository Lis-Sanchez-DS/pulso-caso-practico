"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const PESTAÑAS = [
  { href: "/", texto: "Clientes" },
  { href: "/comentarios", texto: "Comentarios" },
  { href: "/recorrido", texto: "Recorrido del cliente" },
  { href: "/plan-de-accion", texto: "Plan de acción" },
  { href: "/uso-de-ia", texto: "Uso de IA" },
];

export default function Nav() {
  const ruta = usePathname();
  return (
    <nav className="pestañas" aria-label="Secciones">
      {PESTAÑAS.map((p) => (
        <Link key={p.href} href={p.href} aria-current={ruta === p.href ? "page" : undefined}>
          {p.texto}
        </Link>
      ))}
    </nav>
  );
}
