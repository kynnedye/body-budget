export function recordedMetric(
  value: {
    severity: number | null;
    numValue: number | null;
    boolValue: boolean | null;
  } | undefined,
) {
  if (!value) return null;
  if (value.severity != null) return value.severity;
  if (value.numValue != null) return value.numValue;
  if (value.boolValue != null) return value.boolValue ? 1 : 0;
  return null;
}
