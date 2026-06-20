export function checkIfStringsMatch(first: string, second: string) {
  return normaliseStringForComparison(first) === normaliseStringForComparison(second);
}

export function normaliseStringForComparison(s: string) {
  return s.toLowerCase().trim();
}
