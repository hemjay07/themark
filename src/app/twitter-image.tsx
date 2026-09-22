// The X card is the same live render as the Open Graph card. Route config has to be a literal in
// each file for Next to read it, so it is restated here rather than re-exported.
export { default, alt, size, contentType } from "./opengraph-image";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
