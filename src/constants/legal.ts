/**
 * Public URLs of the legal documents, hosted on the marketing site.
 *
 * The site ships `it` and `en` only — anything else falls back to English.
 * Pages live at https://www.norbo.app/{locale}/{doc}.
 */
export type LegalDoc = "privacy" | "terms" | "tools-disclaimer";

export function legalUrl(doc: LegalDoc, language: string): string {
  const lang = language.toLowerCase().startsWith("it") ? "it" : "en";
  return `https://www.norbo.app/${lang}/${doc}`;
}
