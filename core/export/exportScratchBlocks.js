// Ce rendu peut modifier la mise en page : il doit précéder l'autorisation d'imprimer.
export async function loadExportScratchBlocks({ archiveWindow }) {
  const document = archiveWindow.document;
  if (!document.querySelector("pre.blocks")) return;
  function load(relative) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      const cleanup = () => {
        archiveWindow.clearTimeout(timeout);
        script.onload = script.onerror = null;
      };
      const timeout = archiveWindow.setTimeout(() => {
        cleanup(); reject(new Error("Chargement Scratch trop long."));
      }, 15000);
      script.src = new URL(relative, import.meta.url).href;
      script.onload = () => { cleanup(); resolve(); };
      script.onerror = () => { cleanup(); reject(new Error("Ressource Scratch indisponible.")); };
      document.head.appendChild(script);
    });
  }
  await load("../../scratchblocks.min.js");
  await load("../../translations-all.js");
  archiveWindow.scratchblocks.renderMatching("pre.blocks", { style: "scratch3", languages: ["fr"] });
}
