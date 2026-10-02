export const RIGHTS_VERSION = "2026-10-03.v1";
export const RIGHTS_OWNER = "Vadym Partasyuk";
export const CANONICAL_SCREENING = "https://gotocalmaidp.github.io/doctrine-site-box/";

export function termsUrl(language = "en") {
  return `${CANONICAL_SCREENING}${language === "ua" ? "ua" : "en"}/terms/`;
}

export function acceptTerms(now = new Date()) {
  return { version: RIGHTS_VERSION, acceptedAt: now.toISOString() };
}

export function hasCurrentTermsConsent(consent, now = new Date()) {
  if (consent?.version !== RIGHTS_VERSION || typeof consent.acceptedAt !== "string") return false;
  const acceptedAt = Date.parse(consent.acceptedAt);
  return Number.isFinite(acceptedAt) && acceptedAt <= now.getTime();
}

export function buildRightsMetadata(language = "en") {
  return {
    noticeVersion: RIGHTS_VERSION,
    frameworkOwner: RIGHTS_OWNER,
    framework: "GotoCalm · Applicability Boundary Doctrine",
    copyright: "Framework/template © 2026 Vadym Partasyuk. GotoCalm.",
    termsUrl: termsUrl(language),
    canonicalSource: CANONICAL_SCREENING,
    permittedUse: "Free self-directed evaluation, including by organisations; attributed sharing of this case's self-reported output with internal reviewers, advisers or authorities.",
    licensedUse: "Embedding, deployment, derivative tooling, commercial training and paid third-party services using covered authored materials require written permission, subject to applicable prior and third-party licences.",
    userInformation: "The framework notice does not claim ownership of user inputs, facts or documents.",
    limitations: "Self-reported preparation aid; not an audit, evidence verification, compliance or safety finding, certification or authorisation."
  };
}
