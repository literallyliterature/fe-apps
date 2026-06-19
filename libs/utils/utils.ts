export function checkIfStringsMatch(first: string, second: string) {
  return normalise(first) === normalise(second);
}

function normalise(s: string) {
  return s.toLowerCase().trim();
}
