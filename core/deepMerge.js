// core/deepMerge.js

export function deepMerge(
  base,
  overrides
) {
  const result = {
    ...base
  };

  for (
    const key in overrides
  ) {
    const baseValue =
      base?.[key];

    const overrideValue =
      overrides[key];

    const bothAreObjects =
      baseValue &&
      overrideValue &&
      typeof baseValue === "object" &&
      typeof overrideValue === "object" &&
      !Array.isArray(baseValue) &&
      !Array.isArray(overrideValue);

    result[key] =
      bothAreObjects
        ? deepMerge(
            baseValue,
            overrideValue
          )
        : overrideValue;
  }

  return result;
}