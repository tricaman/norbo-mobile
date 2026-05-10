import type { defaultNS, resources } from "./i18n";

// Italian is the primary locale (single-locale MVP). TypeScript type
// inference for `t()` is anchored to `it` so all visible UI text must
// have a key in `locales/it.ts`. English is kept around as a future
// fallback but its shape is not enforced.
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS;
    resources: (typeof resources)["it"];
  }
}
