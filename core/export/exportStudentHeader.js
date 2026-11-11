import { createStudentIdentity } from './exportStudentWriting.js';

// Reference evaluation header. Keep these dimensions shared by Exercises and
// Automatismes; no question, figure or response-area styles belong here.
export function getStudentHeaderStyles() {
  return `
    .student-evaluation-heading { width:174mm; max-width:100%; margin:0 auto; display:flow-root; break-inside:avoid; }
    .student-header-model .evaluation-header { margin:0 0 4mm; padding:0 0 3mm; font-family:Arial,sans-serif; font-size:12pt; line-height:1.4; }
    .student-header-model .evaluation-header h1 { font-size:17pt; margin:0 0 1mm; }
    .student-header-model .evaluation-date { font-size:10pt; }
    .student-header-model .evaluation-student-identity { margin:0 0 4mm; gap:10mm; font-family:Arial,sans-serif; font-size:12pt; line-height:1.4; }
  `;
}

export function prepareStudentHeader({ archiveWindow, container }) {
  const doc = archiveWindow.document;
  const heading = doc.querySelector('.evaluation-header');
  let identity = doc.querySelector('.evaluation-student-identity');
  if (!identity) {
    const fragment = doc.createElement('div');
    fragment.innerHTML = createStudentIdentity();
    identity = fragment.firstElementChild;
  }
  if (!container) {
    container = doc.createElement('div');
    container.className = 'student-evaluation-heading';
    doc.body.prepend(container);
  }
  container.classList.add('student-header-model');
  container.prepend(identity, heading);
  const style = doc.createElement('style');
  style.textContent = getStudentHeaderStyles();
  doc.head.append(style);
}
