const en = {
  common: {
    tapToSet: "tap to set",
    failedToSave: "failed to save, try again",
    continue: "continue",
  },

  tabs: {
    settings: "settings",
  },

  auth: {
    signOut: "sign out",
    otpTitle: "enter code",
    otpSubtitle: "we sent a 6-digit code to {{email}}",
    otpVerify: "verify",
    otpResend: "resend code",
    otpResendCooldown: "resend in {{seconds}}s",
    otpSuccess: "verified",
    emailTitle: "enter your email",
    emailSubtitle: "we'll send you a code to sign in or create your account",
    emailPlaceholder: "email",
    emailError: "enter a valid email",
    continueWith: "continue with {{provider}}",
    continueWithEmail: "continue with email",
    tagline: "the new norbo experience",
    signingIn: "signing in...",
    or: "or",
  },

  settings: {
    title: "settings",
    account: "account",
    accountSubtitle: "name, email",
    language: "language",
    languageSubtitle: "app language",
    help: "help",
    privacyPolicy: "privacy policy",
    appInfoIos: "norbo for ios",
    appInfoAndroid: "norbo for android",
    version: "version {{version}}",
  },

  languageScreen: {
    title: "language",
    en: "english",
    it: "italiano",
  },

  editInfo: {
    title: "account",
    yourInfo: "your info",
    email: "email",
    name: "name",
  },

  nameScreen: {
    title: "name",
    label: "your name",
    placeholder: "e.g. Luca",
    description: "this is the name others will see on your profile.",
    minLength: "at least 1 character",
    maxLength: "max 50 characters",
  },

  deleteAccount: {
    title: "delete account",
    warning:
      "this will permanently delete your account and all related data. this cannot be undone.",
    label: "type your email to confirm",
    placeholder: "your email",
    confirm: "delete account",
    mismatch: "email does not match",
  },

  terms: {
    title: "terms of service",
    intro:
      "before you start using norbo, please read and accept our terms of service.",
    readLink: "read the full terms of service",
    zeroTolerance:
      "norbo has a zero-tolerance policy toward abusive behavior and inappropriate content. any user who posts offensive material or harasses others will be removed and may be reported to the competent authorities.",
    checkbox:
      "i accept the terms of service and commit to not publish offensive content.",
    continue: "continue",
    error: "couldn't save your acceptance. please try again.",
  },
} as const;

export default en;
