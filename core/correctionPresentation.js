import { createProofHtml } from "./proofDisplay.js";

/**
 * Assembleur facultatif de données, sans DOM, MathJax ni état de navigation.
 *
 * blocks : [{ id, html, from?, until?, at?, before? }]
 * - L'ordre du tableau fixe l'ordre des fragments, indépendamment de leur id.
 * - from/until sont des ids d'étapes, bornes incluses ; par défaut toutes les
 *   étapes. until masque le fragment aux étapes suivantes.
 * - at: [ids] remplace l'intervalle pour une visibilité ponctuelle/discontinue.
 * - Deux variantes placées côte à côte, sur des plages disjointes, permettent
 *   un remplacement. before: " " complète une phrase au lieu de créer une ligne.
 * - html contient le HTML/MathJax de confiance, couleurs et encadrements inclus.
 *
 * stages : [{ id, figure?, sideContent?, ...donnéesDeScène }]
 * Les figures et contenus latéraux sont explicites à chaque étape, sans fusion
 * ni héritage. Les configurations restent construites par chaque exercice.
 * Les données d'étapes doivent être clonables par structuredClone.
 *
 * separator vaut "<br>" ; wrap est une fonction pure, par défaut createProofHtml.
 * Un contenu vide reste "" (étape de figure seule), sans appel à wrap.
 *
 * Renvoie { scenes, completeScene }, compatibles avec renderStepCorrection.
 * completeScene est une copie indépendante du dernier état, pas une somme des
 * étapes : aucun fragment déjà masqué n'y est réintroduit. Pour showAll du
 * contrôleur existant, afficher directement completeScene. Ne pas concaténer
 * ces scènes cumulatives avec le lecteur de steps textuels non cumulatifs.
 */
export function createCorrectionPresentation({
  blocks = [],
  stages,
  separator = "<br>",
  wrap = createProofHtml
}) {
  if (!Array.isArray(blocks) || !Array.isArray(stages) || stages.length === 0) {
    throw new TypeError("blocks et stages doivent être des tableaux ; stages ne peut pas être vide.");
  }
  if (typeof separator !== "string" || typeof wrap !== "function") {
    throw new TypeError("separator doit être une chaîne et wrap une fonction pure.");
  }
  const stageIndex = indexIds(stages, "étape");
  indexIds(blocks, "fragment");
  const resolveStage = (id, blockId) => {
    if (!stageIndex.has(id)) {
      throw new ReferenceError(`Étape inconnue ${String(id)} dans le fragment ${blockId}.`);
    }
    return stageIndex.get(id);
  };
  const fragments = blocks.map(block => {
    if (typeof block.html !== "string" ||
        (block.before !== undefined && typeof block.before !== "string")) {
      throw new TypeError(`html et before doivent être des chaînes : ${block.id}.`);
    }
    if (block.at !== undefined) {
      if (!Array.isArray(block.at) || block.from !== undefined || block.until !== undefined) {
        throw new TypeError(`at doit être un tableau, sans from/until : ${block.id}.`);
      }
      const indices = new Set(Array.from(block.at, id => resolveStage(id, block.id)));
      return { ...block, visible: index => indices.has(index) };
    }
    const from = block.from === undefined ? 0 : resolveStage(block.from, block.id);
    const until = block.until === undefined ? stages.length - 1 : resolveStage(block.until, block.id);
    if (until < from) {
      throw new RangeError(`until précède from dans le fragment ${block.id}.`);
    }
    return { ...block, visible: index => index >= from && index <= until };
  });

  const scenes = stages.map((stage, index) => {
    const visible = fragments.filter(block => block.visible(index) && block.html !== "");
    const content = visible.map((block, position) =>
      (position === 0 ? "" : block.before ?? separator) + block.html
    ).join("");
    const html = content === "" ? "" : wrap(content);
    if (typeof html !== "string") throw new TypeError("wrap doit renvoyer une chaîne HTML.");
    return { ...structuredClone(stage), html };
  });
  return { scenes, completeScene: structuredClone(scenes[scenes.length - 1]) };
}

function indexIds(items, kind) {
  const index = new Map();
  for (const [position, item] of items.entries()) {
    if (!item || typeof item.id !== "string" || item.id.trim() === "") {
      throw new TypeError(`Identifiant de ${kind} non vide requis à la position ${position}.`);
    }
    if (index.has(item.id)) throw new TypeError(`Identifiant de ${kind} dupliqué : ${item.id}.`);
    index.set(item.id, position);
  }
  return index;
}
