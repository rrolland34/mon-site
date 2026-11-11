// Le lecteur des démonstrations accepte des coefficients sans unité.
// On garde les décimaux et les opérations sous forme de fractions d'entiers.
function readDecimal(value, acceptPower = true) {
  const power = acceptPower && /^(-?)10\^(-?\d+)$/.exec(value);
  if (power) {
    const exponent = Number(power[2]);
    if (Math.abs(exponent) > 1000) return null;
    const magnitude = 10n ** BigInt(Math.abs(exponent));
    const sign = power[1] ? -1n : 1n;
    return exponent < 0
      ? { numerator: sign, denominator: magnitude }
      : { numerator: sign * magnitude, denominator: 1n };
  }

  if (!/^-?\d+(?:\.\d+)?$/.test(value)) return null;
  const [whole, fraction = ""] = value.split(".");
  return {
    numerator: BigInt(whole + fraction),
    denominator: 10n ** BigInt(fraction.length)
  };
}

export function multiplyProofRationals(left, right) {
  return {
    numerator: left.numerator * right.numerator,
    denominator: left.denominator * right.denominator
  };
}

export function readProofRational(input, { acceptExpression = true } = {}) {
  if (typeof input !== "string" || input.length > 1024) return null;
  if (!acceptExpression) return readDecimal(input.replace(",", "."), false);

  const expression = input
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/\{,\}|,/g, ".")
    .replace(/\\[()[\]]|\\,|~/g, "")
    .replace(/\\(?:d)?frac{(-?\d+(?:\.\d+)?)}{(-?\d+(?:\.\d+)?)}/g, "$1/$2");

  let sum = { numerator: 0n, denominator: 1n };
  for (const term of expression.split("+")) {
    const [left, right = "1", extra] = term.split("/");
    if (extra !== undefined) return null;
    const dividend = readDecimal(left);
    const divisor = readDecimal(right);
    if (!dividend || !divisor || divisor.numerator === 0n) return null;

    const fraction = multiplyProofRationals(dividend, {
      numerator: divisor.denominator,
      denominator: divisor.numerator
    });
    sum = {
      numerator: sum.numerator * fraction.denominator + fraction.numerator * sum.denominator,
      denominator: sum.denominator * fraction.denominator
    };
  }
  return sum;
}

export function sameProofRational(left, right) {
  return Boolean(left && right &&
    left.numerator * right.denominator === right.numerator * left.denominator);
}

// Métadonnées du résultat. Cette conversion ne sert jamais à décider de l'égalité.
export function proofRationalToNumber(value) {
  return value ? Number(value.numerator) / Number(value.denominator) : NaN;
}
