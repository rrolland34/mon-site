const GROUPS = ["SOH", "CAH", "TOA"];
const RATIOS = { SOH: "sin", CAH: "cos", TOA: "tan" };
const REASONS = ["known-side", "source-convention"];

/** Positions indexées à partir de zéro. Les ids sont locaux au modèle, pas
 * des identifiants DOM : plusieurs mémos peuvent coexister sans collision. */
export const SOH_CAH_TOA_OCCURRENCES = Object.freeze(GROUPS.flatMap(group =>
  [...group].map((character, position) => Object.freeze({ id: `${group}:${position}`, group, position, character }))
));

function selectOccurrences(selector) {
  if (typeof selector === "string") {
    const found = SOH_CAH_TOA_OCCURRENCES.filter(item => item.id === selector || item.character === selector);
    if (found.length) return found;
  } else if (selector && typeof selector === "object") {
    const found = SOH_CAH_TOA_OCCURRENCES.find(item => item.group === selector.group && item.position === selector.position);
    if (found && (selector.character === undefined || found.character === selector.character)) return [found];
  }
  throw new RangeError("Occurrence SOH–CAH–TOA inconnue.");
}

/**
 * État complet, autonome et clonable, sans DOM ni état précédent.
 *
 * circled : sélecteurs ("H", "SOH:2", ou {group:"SOH", position:2}).
 * underlined : [{selector, reason:"known-side"|"source-convention"}].
 * boxedRatio : null, "sin", "cos" ou "tan" ; aucune déduction automatique.
 *
 * Chaque occurrence expose marks.circled et marks.underlineReasons. Le motif
 * source-convention préserve notamment les soulignements S/C/T du PythonTeX,
 * dont le programme n'explicite pas la signification pédagogique.
 * Un même trait peut conserver plusieurs raisons, mais n'est dessiné qu'une
 * fois. Une lettre ne peut pas être à la fois entourée et soulignée.
 * Pour une progression, fournir explicitement toutes les marques déjà acquises.
 */
export function createSohCahToaState({ circled = [], underlined = [], boxedRatio = null } = {}) {
  if (!Array.isArray(circled) || !Array.isArray(underlined)) throw new TypeError("Les marques doivent être des tableaux.");
  if (boxedRatio !== null && !Object.values(RATIOS).includes(boxedRatio)) throw new RangeError("Rapport SOH–CAH–TOA inconnu.");
  const circleIds = new Set(circled.flatMap(selector => selectOccurrences(selector).map(item => item.id)));
  const underlineReasons = new Map();
  for (const mark of underlined) {
    if (!mark || !REASONS.includes(mark.reason)) throw new RangeError("Raison du soulignement requise et explicite.");
    for (const item of selectOccurrences(mark.selector)) {
      if (mark.reason === "known-side" && !"OAH".includes(item.character)) {
        throw new RangeError("Un côté connu est représenté uniquement par O, A ou H.");
      }
      if (mark.reason === "known-side" && SOH_CAH_TOA_OCCURRENCES.some(other =>
        other.character === item.character && circleIds.has(other.id))) {
        throw new RangeError("Un même rôle de côté ne peut pas être connu et recherché simultanément.");
      }
      if (circleIds.has(item.id)) throw new RangeError("Une occurrence ne peut pas être entourée et soulignée simultanément.");
      if (!underlineReasons.has(item.id)) underlineReasons.set(item.id, new Set());
      underlineReasons.get(item.id).add(mark.reason);
    }
  }
  return {
    occurrences: SOH_CAH_TOA_OCCURRENCES.map(item => ({ ...item,
      marks: { circled: circleIds.has(item.id), underlineReasons: REASONS.filter(reason => underlineReasons.get(item.id)?.has(reason)) }
    })),
    boxedRatio
  };
}

function validateState(state) {
  if (!Array.isArray(state?.occurrences) || state.occurrences.length !== 9) throw new TypeError("Neuf occurrences sont requises.");
  const circled = [], underlined = [];
  state.occurrences.forEach((item, index) => {
    const reference = SOH_CAH_TOA_OCCURRENCES[index];
    if (!item || ["id", "group", "position", "character"].some(key => item[key] !== reference[key]) ||
        typeof item.marks?.circled !== "boolean" || !Array.isArray(item.marks.underlineReasons)) {
      throw new TypeError("Modèle d'occurrences SOH–CAH–TOA invalide.");
    }
    if (item.marks.circled) circled.push(item.id);
    for (const reason of item.marks.underlineReasons) underlined.push({ selector: item.id, reason });
  });
  // Valide les mêmes invariants pour un état chargé depuis des données JSON.
  return createSohCahToaState({ circled, underlined, boxedRatio: state.boxedRatio });
}

const escapeXml = value => String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[character]);

/** SVG autonome, sans identifiant global, dépendance, temporisation ni MathJax.
 * Le dessin est fixe : ajouter une marque ne déplace aucune lettre.
 * Compatible avec un fragment html ou sideContent.html du renderer existant.
 */
export function createSohCahToaSVG(state = createSohCahToaState(), { color = "red", markColor = color } = {}) {
  const model = validateState(state);
  if (typeof color !== "string" || !color.trim() || typeof markColor !== "string" || !markColor.trim()) {
    throw new TypeError("Couleurs du mémo invalides.");
  }
  const description = model.occurrences.filter(item => item.marks.circled || item.marks.underlineReasons.length).map(item => {
    const marks = [item.marks.circled ? "entouré" : "",
      ...item.marks.underlineReasons.map(reason => reason === "known-side" ? "souligné (côté connu)" : "souligné (convention de la source)")].filter(Boolean);
    return `${item.group}, position ${item.position + 1}, ${item.character} ${marks.join(", ")}`;
  });
  if (model.boxedRatio) description.push(`${model.boxedRatio} encadré`);
  const label = escapeXml(["SOH – CAH – TOA", ...description].join(". "));
  const stroke = escapeXml(markColor), fill = escapeXml(color);
  const groups = GROUPS.map((group, groupIndex) => {
    const origin = groupIndex * 264;
    const box = model.boxedRatio === RATIOS[group]
      ? `<rect data-mark="box" data-ratio="${RATIOS[group]}" x="${origin + 8}" y="22" width="208" height="100" rx="3" fill="none" stroke="${stroke}" stroke-width="3.5"/>` : "";
    const letters = model.occurrences.filter(item => item.group === group).map(item => {
      const x = origin + 48 + item.position * 64;
      return `<g data-occurrence="${item.id}" data-group="${group}" data-position="${item.position}" data-character="${item.character}" data-underline-reasons="${item.marks.underlineReasons.join(" ")}">
        ${item.marks.circled ? `<circle data-mark="circle" cx="${x}" cy="66" r="28" fill="none" stroke="${stroke}" stroke-width="3.5"/>` : ""}
        <text x="${x}" y="66" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif" font-size="48" font-weight="700" fill="${fill}">${item.character}</text>
        ${item.marks.underlineReasons.length ? `<line data-mark="underline" x1="${x - 18}" y1="106" x2="${x + 18}" y2="106" stroke="${stroke}" stroke-width="3.5" stroke-linecap="round"/>` : ""}
      </g>`;
    }).join("");
    return `<g data-mnemonic-group="${group}" data-ratio="${RATIOS[group]}">${box}${letters}</g>`;
  }).join("");
  const separators = [244, 508].map(x => `<text data-separator="true" x="${x}" y="66" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif" font-size="40" fill="${fill}">–</text>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 752 144" role="img" aria-label="${label}" style="display:block;width:100%;max-width:752px;height:auto"><title>${label}</title>${groups}${separators}</svg>`;
}
