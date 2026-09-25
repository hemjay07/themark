"use client";

import "./landing.css";
import { useEffect } from "react";
import { TOKEN_LIST, displayName } from "@/lib/tokens";
import { useCensus } from "@/lib/useCensus";
import { TICKET_CSS } from "@/components/TradeTicket";
import { SceneHero, SceneCost, SceneMoves, SceneField, SceneStamp, SceneInstead, type Row, type Gap } from "@/components/landing/Scenes";
import { SceneIssuer, SceneWallet, SceneAnswers } from "@/components/landing/Scenes2";
import Rail from "@/components/landing/Rail";

const IDS = ["top", "cost", "how", "field", "line", "instead", "issuer", "wallet", "answers"];

// The story: nine scenes, one statement each, every figure from the live census or dated
// (design/PRD-V4-LANDING.md). The tool itself is /check.
export default function Landing() {
  const census = useCensus();
  const rows: Row[] = TOKEN_LIST.map((t) => {
    const c = census?.cells?.[t.mint]?.["25000"];
    return c && c.ok ? { symbol: t.symbol, name: displayName(t.symbol), pct: c.pct } : null;
  })
    .filter((r): r is Row => r !== null)
    .sort((a, b) => b.pct - a.pct);
  // stocks the reading could not price at this size are shown with the reason, never dropped
  const gaps: Gap[] = census
    ? TOKEN_LIST.flatMap((t) => {
        const c = census.cells?.[t.mint]?.["25000"];
        return c && !c.ok ? [{ symbol: t.symbol, name: displayName(t.symbol), reason: /no route/i.test(c.reason) ? "no exchange can fill $25,000 of it right now" : c.reason }] : [];
      })
    : [];
  const worst = rows[0] ?? null;
  const best = rows.length ? rows[rows.length - 1] : null;
  const worstMint = worst ? TOKEN_LIST.find((t) => t.symbol === worst.symbol)?.mint : undefined;
  const c5 = worstMint ? census?.cells?.[worstMint]?.["5000"] : undefined;
  const worst5k = c5 && c5.ok ? c5.pct : null;

  // scenes snap while this page is open, and only then
  useEffect(() => {
    document.documentElement.classList.add("snap");
    return () => document.documentElement.classList.remove("snap");
  }, []);

  return (
    <main className="stage">
      <style dangerouslySetInnerHTML={{ __html: TICKET_CSS }} />
      <SceneHero worst={worst} best={best} />
      <SceneCost worst={worst} />
      <SceneMoves />
      <SceneField rows={rows} gaps={gaps} readAt={census?.readAt ?? null} />
      <SceneStamp rows={rows} />
      <SceneInstead worst={worst} best={best} worst5k={worst5k} />
      <SceneIssuer />
      <SceneWallet />
      <SceneAnswers />
      <Rail ids={IDS} />
    </main>
  );
}
