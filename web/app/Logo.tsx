// Logotipo de Pulso según el tablero de marca: símbolo rojo con la línea del pulso y el punto dorado + "pulso"
export function Simbolo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="#D9341A" />
      <path d="M9 35h11l7-17 9 29 7-20 4 8h9" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="48" cy="16" r="5" fill="#FFB81F" />
    </svg>
  );
}

export default function Logo() {
  return (
    <span className="logo">
      <Simbolo className="logo-simbolo" />
      <span className="logo-texto">pulso</span>
    </span>
  );
}
