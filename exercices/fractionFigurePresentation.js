import { formatAnswer } from "../core/answerFormatting.js";

// Présentation seulement : les valeurs canoniques et les SVG restent natifs.
export function fractionFigureText(text) {
  return text.split(/\s+/).reduce((groups, word) => {
    if (groups.length && /^[;:!?]$/.test(word)) groups[groups.length - 1] += " " + word;
    else groups.push(word);
    return groups;
  }, []).map(word => String.raw`\(\text{${word}}\)`).join(" ");
}

export function formatFractionFigureAnswer(value) {
  const fraction = /^(-?\d+)\/(-?\d+)$/.exec(String(value));
  return fraction
    ? String.raw`\(\dfrac{${formatAnswer(fraction[1], "math")}}{${formatAnswer(fraction[2], "math")}}\)`
    : String.raw`\(${formatAnswer(value, "math")}\)`;
}
