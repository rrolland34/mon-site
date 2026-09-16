// core/export/exportScratchBlocks.js

export function loadExportScratchBlocks({
  archiveWindow
}) {
  const scratchBlocksUrl =
    new URL(
      "./scratchblocks.min.js",
      window.location.href
    ).href;

  const scratchTranslationsUrl =
    new URL(
      "./translations-all.js",
      window.location.href
    ).href;

  const scratchBlocksScript =
    archiveWindow.document.createElement(
      "script"
    );

  scratchBlocksScript.src =
    scratchBlocksUrl;

  scratchBlocksScript.onload =
    () => {

      const scratchTranslationsScript =
        archiveWindow.document.createElement(
          "script"
        );

      scratchTranslationsScript.src =
        scratchTranslationsUrl;

      scratchTranslationsScript.onload =
        () => {

          archiveWindow.scratchblocks.renderMatching(
            "pre.blocks",
            {
              style:
                "scratch3",

              languages: [
                "fr"
              ]
            }
          );
        };

      archiveWindow.document.head.appendChild(
        scratchTranslationsScript
      );
    };

  archiveWindow.document.head.appendChild(
    scratchBlocksScript
  );
}