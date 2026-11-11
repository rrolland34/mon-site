// core/export/exportDocument.js
import { prepareStudentSheet, fillStudentSheet } from './exportStudentSheet.js';
import { prepareStudentHeader } from './exportStudentHeader.js';

import {
  createExportWindow
} from "./exportWindow.js";

import {
  initializeExportPrint
} from "./exportPrint.js";

import {
  loadExportMathJax
} from "./exportMathJax.js";

import {
  loadExportScratchBlocks
} from "./exportScratchBlocks.js";

function reserveEvaluationTitleSpace(document, originalTitle) {
  const title = document.querySelector(".evaluation-header h1");
  const measurement = title.cloneNode(false);
  // Mesurer l'ancien titre à la largeur imprimable de l'A4, sans le publier.
  measurement.style.cssText = "position:absolute; visibility:hidden; width:174mm;";
  measurement.textContent = originalTitle;
  title.after(measurement);
  const originalHeight = measurement.getBoundingClientRect().height;
  measurement.remove();
  if (originalHeight > title.getBoundingClientRect().height) {
    title.style.minHeight = `${originalHeight}px`;
  }
}

export async function exportDocument({
  title,
  content,
  afterRender,
  beforeReady,
  singlePageStudentSheet = false,
  studentHeader = 'auto',
  isEvaluation = false
}) {
  const currentDate =
    new Intl.DateTimeFormat(
      "fr-FR",
      {
        day:
          "2-digit",

        month:
          "2-digit",

        year:
          "numeric"
      }
    ).format(
      new Date()
    );

  async function prepare(existingWindow = null) {
    let archiveWindow = existingWindow;
    try {
      archiveWindow = await createExportWindow({
        title: isEvaluation ? "Évaluation" : title,
        currentDate, evaluationContent: content, existingWindow
      });
      if (!archiveWindow) return null;
      const printButton = initializeExportPrint({ archiveWindow });
      if (typeof afterRender === "function") await afterRender({ archiveWindow });
      if (singlePageStudentSheet) prepareStudentSheet({ archiveWindow });
      // Legacy callers pass a subject's content without an explicit header
      // option. Its identity block identifies the student subject; corrections
      // and archives do not have one. Keep explicit opt-out available.
      else if (studentHeader === true || (studentHeader === 'auto' &&
        archiveWindow.document.querySelector('.evaluation-student-identity'))) {
        prepareStudentHeader({ archiveWindow });
      }
      if (isEvaluation && title) reserveEvaluationTitleSpace(archiveWindow.document, title);
      await loadExportScratchBlocks({ archiveWindow });
      await loadExportMathJax({ archiveWindow, printButton, beforeReady: singlePageStudentSheet
        ? async context => { if (beforeReady) await beforeReady(context); fillStudentSheet(context); }
        : beforeReady, onRetry: () => prepare(archiveWindow) });
      return archiveWindow;
    } catch (error) {
      archiveWindow ||= error.exportWindow;
      console.error("Création de l'export :", error);
      if (archiveWindow && !archiveWindow.closed) {
        archiveWindow.document.documentElement.removeAttribute("data-export-ready");
        const button = archiveWindow.document.getElementById("print-evaluation");
        if (button) button.disabled = true;
        const notice = archiveWindow.document.getElementById("export-status") || archiveWindow.document.createElement("p");
        notice.id = "export-status";
        notice.setAttribute("role", "alert");
        notice.textContent = "Impossible de préparer l'export. Vérifiez l'accès aux ressources du site puis réessayez.";
        archiveWindow.document.body.appendChild(notice);
        const retry = archiveWindow.document.createElement("button");
        retry.id = "export-retry";
        retry.textContent = "Réessayer la préparation";
        retry.addEventListener("click", () => {
          retry.disabled = true;
          prepare(archiveWindow);
        }, { once: true });
        archiveWindow.document.body.appendChild(retry);
      }
      return null;
    }
  }
  return prepare();
}
