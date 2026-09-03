// core/stepCorrectionRenderer.js

export function renderStepCorrection({
  container,
  scene,
  renderFigure
}) {
  if (!container || !scene) {
    return;
  }

  container.innerHTML = "";

  const sceneLayout =
    document.createElement(
      "div"
    );

  sceneLayout.className =
    "step-correction-layout";

  if (
    scene.figure &&
    typeof renderFigure === "function"
  ) {
    const figureContainer =
      document.createElement(
        "div"
      );

    figureContainer.className =
      "step-correction-figure";

    figureContainer.innerHTML =
      renderFigure(
        scene.figure
      );

    sceneLayout.appendChild(
      figureContainer
    );
  }

  if (scene.sideContent) {
    const sideContainer =
      document.createElement(
        "div"
      );

    sideContainer.className =
      "step-correction-side";

    sideContainer.innerHTML =
      scene.sideContent.html ?? "";

    if (scene.sideContent.color) {
      sideContainer.style.color =
        scene.sideContent.color;
    }

    sceneLayout.appendChild(
      sideContainer
    );
  }

  container.appendChild(
    sceneLayout
  );

  if (scene.html) {
    const contentContainer =
      document.createElement(
        "div"
      );

    contentContainer.className =
      "step-correction-content";

    contentContainer.innerHTML =
      scene.html;

    container.appendChild(
      contentContainer
    );
  }

  if (
    window.MathJax &&
    typeof MathJax.typesetPromise ===
      "function"
  ) {
    MathJax.typesetPromise([
      container
    ]);
  }
}