// exercices/generators/powerOfTenHelpers.js

export function randomInteger(min, max) {
  return Math.floor(
    Math.random() * (max - min + 1)
  ) + min;
}

export function generatePowerOfTen() {
  const exponent = randomInteger(1, 3);
  const multiplier = 10 ** exponent;

  return {
    exponent,
    powerOfTen: 10 ** exponent
  };
}