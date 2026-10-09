/**
 * Valida os três layouts da sala 3D em todas as combinações de áreas ligadas
 * (o visitante liga e desliga áreas na interface). Uso: `npm run validar`.
 */
import { AREAS, type AreaId } from "@/data/itens";
import { LAYOUTS, TAMANHOS } from "@/data/layouts";
import { validarLayout } from "@/lib/sala/validarLayout";

let falhas = 0;
for (const t of TAMANHOS) {
  const layout = LAYOUTS[t];
  const areas = AREAS.map((a) => a.id).filter((id) => layout.instancias.some((i) => i.area === id));
  const problemas = new Map<string, string>();
  const avisos = new Set<string>();
  for (let mask = 0; mask < 1 << areas.length; mask++) {
    const ligadas: AreaId[] = areas.filter((_, k) => mask & (1 << k));
    const r = validarLayout(layout, ligadas);
    const rotulo = ligadas.length === areas.length ? "todas as áreas" : `só ${ligadas.join(", ") || "nenhuma área"}`;
    for (const p of r.problemas) if (!problemas.has(p)) problemas.set(p, rotulo);
    r.avisos.forEach((a) => avisos.add(a));
  }
  console.log(`\n${layout.rotulo} (${layout.area} m², ${areas.length} áreas, ${1 << areas.length} combinações)`);
  if (!problemas.size) console.log("  ok");
  for (const [p, quando] of problemas) console.log(`  PROBLEMA: ${p} [${quando}]`);
  for (const a of avisos) console.log(`  aviso: ${a}`);
  falhas += problemas.size;
}
process.exitCode = falhas ? 1 : 0;
