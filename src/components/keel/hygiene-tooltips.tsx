import type { ReactNode } from "react";

/** Plain-language explanations of each hygiene factor — customers
 * shouldn't have to already know the trust model to understand a score. */
export const HYGIENE_EXPLANATIONS: Record<string, string> = {
  freshness: "How recently this data was actually updated. Even a perfectly correct table is unsafe to trust if it stopped refreshing.",
  stability: "How often this asset's structure (columns, types) has changed recently. Frequent changes are what silently break the things built on top of it.",
  ownership: "Whether a specific person or team is on record as accountable for this asset. If nobody owns it, nobody gets paged when it breaks.",
  docs: "Whether this asset has a description and defined terms, so people can tell what it actually means before they build on it.",
};

export function hygieneExplanation(key: string): ReactNode {
  return HYGIENE_EXPLANATIONS[key] ?? "Part of this asset's own health score.";
}
