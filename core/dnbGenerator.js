import { melangerTableau } from "./tableaux.js";

export function createDnbBank(sources) {
  const bank = new Map();
  for (const { sourceId, exercise } of sources) {
    for (const question of exercise.questions) {
      if (![question.id, question.title, question.subtitle].every(value => typeof value === "string" && value.trim())) {
        throw new Error(`Indexation DNB incomplète : ${sourceId}/${question.id ?? "sans id"}`);
      }
      const generatorId = JSON.stringify([sourceId, question.id]);
      if (bank.has(generatorId)) throw new Error(`Identité DNB répétée : ${generatorId}`);
      bank.set(generatorId, { generatorId, source: exercise.series, question });
    }
  }
  return [...bank.values()];
}

export function getDnbDomains(bank, sources) {
  const domains = new Map();
  for (const entry of bank) {
    if (!sources.has(entry.source)) continue;
    const { title, subtitle } = entry.question;
    if (!domains.has(title)) domains.set(title, { entries: [], subtitles: new Map() });
    const domain = domains.get(title);
    domain.entries.push(entry);
    domain.subtitles.set(subtitle, (domain.subtitles.get(subtitle) ?? 0) + 1);
  }
  return domains;
}

export function getDnbPools(bank, criteria) {
  const available = getDnbDomains(bank, criteria.sources);
  return new Map([...criteria.domains].map(([title, subtitles]) => [title,
    (available.get(title)?.entries ?? []).filter(({ question }) =>
      subtitles.size === 0 || subtitles.has(question.subtitle))
  ]));
}

export function generateDnbSeries(bank, criteria, random = Math.random) {
  const pools = getDnbPools(bank, criteria);
  const count = criteria.count;
  const capacity = [...pools.values()].reduce((sum, pool) => sum + pool.length, 0);
  if (!criteria.sources.size || !pools.size || !Number.isInteger(count) ||
      count < pools.size || count > capacity || [...pools.values()].some(pool => !pool.length)) {
    throw new Error("Sélectionnez des domaines disponibles et un nombre de questions valide.");
  }
  const quotas = new Map([...pools.keys()].map(title => [title, 0]));
  // Remplissage par niveaux : équilibre maximal sous contrainte de capacité.
  // À chaque niveau, les places restantes vont à des domaines distincts au hasard.
  let remaining = count;
  while (remaining > 0) {
    const candidates = [...pools.keys()].filter(title => quotas.get(title) < pools.get(title).length);
    const minimum = Math.min(...candidates.map(title => quotas.get(title)));
    for (const title of melangerTableau(candidates.filter(title => quotas.get(title) === minimum), random)) {
      quotas.set(title, quotas.get(title) + 1);
      if (--remaining === 0) break;
    }
  }
  const selected = [];
  for (const [title, pool] of pools) {
    const quota = quotas.get(title);
    const chosen = new Set();
    const requested = criteria.domains.get(title);
    for (const subtitle of melangerTableau([...requested], random)) {
      if (chosen.size === quota) break;
      const candidates = pool.filter(entry => entry.question.subtitle === subtitle);
      if (candidates.length) chosen.add(melangerTableau(candidates, random)[0]);
    }
    for (const entry of melangerTableau(pool, random)) {
      if (chosen.size === quota) break;
      chosen.add(entry);
    }
    selected.push(...chosen);
  }
  return {
    title: "Automatismes DNB — Série personnalisée",
    series: "Personnalisée",
    shuffle: false,
    questions: melangerTableau(selected, random).map(entry => entry.question)
  };
}
