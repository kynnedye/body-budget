export function favoriteIdentity(input: {
  source: string;
  sourceId: string | null;
  name: string;
}) {
  const sourceId = input.sourceId?.trim();
  if (sourceId) return sourceId.slice(0, 120);
  return `custom:${input.name.trim().toLowerCase()}`.slice(0, 200);
}
