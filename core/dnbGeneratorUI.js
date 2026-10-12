import { createDnbBank, getDnbDomains, getDnbPools, generateDnbSeries } from "./dnbGenerator.js";
import { getDnbSources } from "./exerciseLoader.js";

export function initializeDnbGenerator({ onGenerate, onCountChange = () => {} }) {
  const bank = createDnbBank(getDnbSources());
  const panel = document.getElementById("dnb-generator");
  const list = panel.querySelector(".dnb-domains");
  const slider = document.getElementById("dnb-count");
  const output = document.getElementById("dnb-count-value");
  const total = panel.querySelector(".dnb-total");
  const generate = panel.querySelector(".dnb-generate");
  const error = panel.querySelector(".dnb-error");
  const criteria = { sources: new Set(["Générale"]), domains: new Map(), count: 10 };
  const expanded = new Set();
  let available;

  function updateCounts() {
    const pools = getDnbPools(bank, criteria);
    const maximum = [...pools.values()].reduce((sum, pool) => sum + pool.length, 0);
    const minimum = criteria.domains.size;
    criteria.count = maximum ? Math.max(minimum, Math.min(criteria.count, maximum)) : 0;
    slider.min = String(minimum);
    slider.max = String(maximum);
    slider.value = String(criteria.count);
    slider.disabled = !maximum;
    output.textContent = String(criteria.count);
    onCountChange(criteria.count);
    total.textContent = `${maximum} questions disponibles pour cette sélection.`;
    generate.disabled = !maximum;
    for (const row of list.children) {
      const title = row.dataset.domain;
      const size = available.get(title).entries.length;
      const restricted = criteria.domains.get(title)?.size > 0;
      row.querySelector(".dnb-domain-count").textContent = restricted ? ` (${pools.get(title).length} / ${size})` : ` (${size})`;
      row.querySelector(".dnb-domain-check").checked = criteria.domains.has(title);
      for (const input of row.querySelectorAll(".dnb-subdomains input")) {
        input.checked = criteria.domains.get(title)?.has(input.value) ?? false;
      }
    }
  }

  function render() {
    available = getDnbDomains(bank, criteria.sources);
    for (const [title, subtitles] of criteria.domains) {
      if (!available.has(title)) criteria.domains.delete(title);
      else for (const subtitle of subtitles) {
        if (!available.get(title).subtitles.has(subtitle)) subtitles.delete(subtitle);
      }
    }
    list.replaceChildren();
    for (const [title, domain] of [...available].sort(([a], [b]) => a.localeCompare(b, "fr"))) {
      const row = document.createElement("div");
      row.className = "dnb-domain";
      row.dataset.domain = title;
      const label = document.createElement("label");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "dnb-domain-check";
      const count = document.createElement("span");
      count.className = "dnb-domain-count";
      label.append(checkbox, document.createTextNode(` ${title}`), count);
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) criteria.domains.set(title, new Set());
        else criteria.domains.delete(title);
        updateCounts();
      });
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "dnb-toggle";
      toggle.setAttribute("aria-label", `Sous-domaines : ${title}`);
      const children = document.createElement("div");
      children.className = "dnb-subdomains";
      children.id = `dnb-subdomains-${list.children.length}`;
      toggle.setAttribute("aria-controls", children.id);
      const updateExpanded = () => {
        children.hidden = !expanded.has(title);
        toggle.textContent = children.hidden ? "▸" : "▾";
        toggle.setAttribute("aria-expanded", String(!children.hidden));
      };
      toggle.addEventListener("click", () => {
        if (expanded.has(title)) expanded.delete(title); else expanded.add(title);
        updateExpanded();
      });
      updateExpanded();
      for (const [subtitle, size] of [...domain.subtitles].sort(([a], [b]) => a.localeCompare(b, "fr"))) {
        const subLabel = document.createElement("label");
        const input = document.createElement("input");
        input.type = "checkbox";
        input.value = subtitle;
        subLabel.append(input, document.createTextNode(` ${subtitle} (${size})`));
        children.append(subLabel);
        input.addEventListener("change", () => {
          if (!criteria.domains.has(title)) criteria.domains.set(title, new Set());
          const selected = criteria.domains.get(title);
          if (input.checked) selected.add(subtitle); else selected.delete(subtitle);
          updateCounts();
        });
      }
      row.append(label, toggle, children);
      list.append(row);
    }
    panel.querySelector(".dnb-empty").hidden = available.size > 0;
    updateCounts();
  }

  for (const input of panel.querySelectorAll("[name=dnb-source]")) {
    input.addEventListener("change", () => {
      if (input.checked) criteria.sources.add(input.value); else criteria.sources.delete(input.value);
      if (!criteria.sources.size) { criteria.sources.add(input.value); input.checked = true; }
      render();
    });
  }
  panel.querySelector(".dnb-select-all").addEventListener("click", () => {
    criteria.domains = new Map([...available.keys()].map(title => [title, new Set()]));
    updateCounts();
  });
  panel.querySelector(".dnb-select-none").addEventListener("click", () => {
    criteria.domains.clear();
    updateCounts();
  });
  slider.addEventListener("input", () => { criteria.count = Number(slider.value); updateCounts(); });
  function draw() {
    error.textContent = "";
    try { onGenerate(generateDnbSeries(bank, criteria)); }
    catch (failure) { error.textContent = failure.message; panel.hidden = false; }
  }
  generate.addEventListener("click", draw);
  render();
  panel.hidden = false;
  return { draw, show() { panel.hidden = false; render(); generate.focus(); } };
}
