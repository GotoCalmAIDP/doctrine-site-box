export const PUBLIC_AGGREGATE_ENDPOINT = "https://goto-calm-screening-data.partasyukvadym.chatgpt.site/api/v1";
export const PUBLIC_AGGREGATE_SCHEMA = "goto-calm:screening-public-aggregate:0.1";
export const PUBLIC_SUBMISSION_SCHEMA = "goto-calm:screening-aggregate-submission:0.1";
export const PUBLIC_CLASS_ORDER = ["informational", "limited", "enterprise", "high", "critical", "unknown"];

export function normalizePublicAggregate(payload) {
  if (!payload || payload.schema !== PUBLIC_AGGREGATE_SCHEMA) throw new Error("Invalid aggregate schema");
  const windowDays = Number(payload.windowDays);
  const privacyThreshold = Number(payload.privacyThreshold);
  if (!Number.isInteger(windowDays) || windowDays < 1 || !Number.isInteger(privacyThreshold) || privacyThreshold < 1) {
    throw new Error("Invalid aggregate policy");
  }
  const generatedAt = new Date(payload.generatedAt);
  if (Number.isNaN(generatedAt.getTime())) throw new Error("Invalid aggregate date");
  const base = { reportable: payload.reportable === true, windowDays, privacyThreshold, generatedAt };
  if (!base.reportable) return base;

  const total = Number(payload.total);
  const scopedTier2PlusPercent = Number(payload.scopedTier2PlusPercent);
  if (!Number.isInteger(total) || total < privacyThreshold) throw new Error("Invalid aggregate total");
  if (!Number.isInteger(scopedTier2PlusPercent) || scopedTier2PlusPercent < 0 || scopedTier2PlusPercent > 100) {
    throw new Error("Invalid aggregate route share");
  }
  if (!Array.isArray(payload.classes)) throw new Error("Invalid aggregate classes");
  const input = new Map(payload.classes.map((item) => [item?.key, item]));
  const classes = PUBLIC_CLASS_ORDER.map((key) => {
    const item = input.get(key) || {};
    const count = Number(item.count || 0);
    const percent = Number(item.percent || 0);
    if (!Number.isInteger(count) || count < 0 || !Number.isInteger(percent) || percent < 0 || percent > 100) {
      throw new Error("Invalid aggregate class value");
    }
    return { key, count, percent };
  });
  if (classes.reduce((sum, item) => sum + item.count, 0) !== total) throw new Error("Inconsistent aggregate total");
  return { ...base, total, scopedTier2PlusPercent, classes };
}

export function buildPublicSubmission(result, receiptToken) {
  if (!result || result.responseBasis === "exploratory") throw new Error("Exploratory runs are not eligible");
  if (typeof receiptToken !== "string" || receiptToken.length < 20) throw new Error("Receipt token is required");
  return {
    schema: PUBLIC_SUBMISSION_SCHEMA,
    consequenceClass: result.consequenceClass,
    sectorContext: result.sectorContext,
    outcome: result.outcome,
    responseBasis: result.responseBasis,
    screeningVersion: result.version,
    receiptToken
  };
}
