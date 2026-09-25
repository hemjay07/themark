"use client";

import { useCallback, useState, type ReactNode, type RefObject } from "react";

// The cut. When a blocked order is cut down to the size that fits, the ticket tears in two along a
// jagged line and the pieces fall away, revealing the smaller ticket underneath. The old figures ride
// on the torn pieces (a copy of the ticket's own markup, clipped), the new ones are already printed
// beneath. The pieces are opaque paper the whole way: the reveal happens because they leave, never
// because they fade over the new figures (that read as a double exposure, 2026-09-25). Movement and
// clip only; with reduced motion there is no tear, just the new ticket.
export function useTicketCut(ref: RefObject<HTMLElement | null>) {
  const [piece, setPiece] = useState<{ html: string; id: number } | null>(null);
  const cut = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = Date.now();
    setPiece({ html: el.innerHTML, id });
    setTimeout(() => setPiece((p) => (p && p.id === id ? null : p)), 1100);
  }, [ref]);
  const overlay: ReactNode = piece ? (
    <div className="tk-tear" key={piece.id} aria-hidden>
      <div className="ticket tk-piece tk-piece-a" dangerouslySetInnerHTML={{ __html: piece.html }} />
      <div className="ticket tk-piece tk-piece-b" dangerouslySetInnerHTML={{ __html: piece.html }} />
    </div>
  ) : null;
  return { cut, overlay };
}

// the jagged line runs from the left edge at 56% to the right edge at 52%
const TEAR_A = "polygon(0 0,100% 0,100% 52%,92% 49%,84% 55%,76% 50%,68% 56%,60% 51%,52% 57%,44% 52%,36% 58%,28% 53%,20% 59%,12% 54%,4% 60%,0 56%)";
const TEAR_B = "polygon(0 56%,4% 60%,12% 54%,20% 59%,28% 53%,36% 58%,44% 52%,52% 57%,60% 51%,68% 56%,76% 50%,84% 55%,92% 49%,100% 52%,100% 100%,0 100%)";

export const TEAR_CSS = `
.tk-wrap{position:relative}
.tk-tear{position:absolute;inset:-16px;padding:16px;z-index:7;pointer-events:none;overflow:clip}
.tk-tear .tk-piece{inset:16px}
.tk-piece{position:absolute;inset:0;animation:none!important;will-change:transform;box-shadow:0 18px 30px -18px rgba(0,0,0,.7);opacity:1}
.tk-piece::before,.tk-piece::after{display:none}
.tk-piece-a{clip-path:${TEAR_A};animation:tk-tear-a .95s cubic-bezier(.3,.6,.35,1) forwards!important}
.tk-piece-b{clip-path:${TEAR_B};animation:tk-tear-b 1.05s cubic-bezier(.55,0,.8,.25) forwards!important}
@keyframes tk-tear-a{0%{transform:rotate(var(--tilt,0deg))}14%{transform:translate(-1.5%,-2%) rotate(calc(var(--tilt,0deg) - 2deg))}
  88%{opacity:1}100%{transform:translate(-14%,-118%) rotate(-16deg);opacity:0}}
@keyframes tk-tear-b{0%{transform:rotate(var(--tilt,0deg))}14%{transform:translate(1.5%,2%) rotate(calc(var(--tilt,0deg) + 1.5deg))}
  88%{opacity:1}100%{transform:translate(12%,124%) rotate(11deg);opacity:0}}
@media (prefers-reduced-motion:reduce){.tk-tear{display:none}}
`;
