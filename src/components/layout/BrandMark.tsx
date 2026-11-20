import { cn } from '@/utils/helpers';

/**
 * The StellarPOS "Scan Star": a four-point star inside QR-scanner brackets.
 * Brackets use currentColor so the mark follows the theme; the star keeps
 * Stellar indigo.
 */
export default function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={cn('h-8 w-8 text-ink', className)} aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="44"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M76 172V116a40 40 0 0 1 40-40h56M340 76h56a40 40 0 0 1 40 40v56M436 340v56a40 40 0 0 1-40 40h-56M172 436h-56a40 40 0 0 1-40-40v-56"
      />
      <path
        className="fill-lumen [:root[data-theme='dark']_&]:fill-[#6E72F0]"
        d="M256 128C266 214 298 246 384 256C298 266 266 298 256 384C246 298 214 266 128 256C214 246 246 214 256 128Z"
      />
    </svg>
  );
}
