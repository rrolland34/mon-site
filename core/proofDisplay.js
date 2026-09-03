// core/proofDisplay.js

export function boldText(
  text,
  textToBold
) {
  return text.replace(
    textToBold,
    `<strong>${textToBold}</strong>`
  );
}

export function displayProofStep(
  proof,
  index,
  {
    boxed = false
  } = {}
) {
  const content =
    proof[index].correct;

  if (!boxed) {
    return content;
  }

  return (
    `<span class="proof-box">` +
    `${content}` +
    `</span>`
  );
}

export function createProofHtml(
  content
) {
  return (
    `<div class="proof-display">` +
    `${content}` +
    `</div>`
  );
}

export function colorText(
  text,
  textToColor,
  color
) {
  return text.replace(
    textToColor,
    `<span style="color:${color};">` +
    `${textToColor}` +
    `</span>`
  );
}

export function colorMathText(
  text,
  textToColor,
  color
) {
  return text.replace(
    textToColor,
    `\\textcolor{${color}}{${textToColor}}`
  );
}