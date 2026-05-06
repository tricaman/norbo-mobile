const en = {
  // ── Common ────────────────────────────────────────────────────────
  common: {
    notSet: "not set",
    tapToSet: "tap to set",
    save: "save",
    cancel: "cancel",
    back: "back",
    searchFailed: "search failed",
    failedToSave: "failed to save, try again",
    continue: "continue",
  },

  // ── Tabs ──────────────────────────────────────────────────────────
  tabs: {
    dits: "dits",
    contacts: "contacts",
    settings: "settings",
    profile: "profile",
  },

  // ── Auth ──────────────────────────────────────────────────────────
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
    tagline: "say nothing. mean everything.",
    signingIn: "signing in...",
    or: "or",
  },

  // ── Profile ───────────────────────────────────────────────────────
  profile: {
    editInfo: "edit info",
    settings: "settings",
    username: "username",
    name: "name",
    bio: "bio",
  },

  // ── Settings ──────────────────────────────────────────────────────
  settings: {
    title: "settings",
    account: "account",
    accountSubtitle: "username, email",
    language: "language",
    languageSubtitle: "app language",
    privacy: "privacy",
    privacySubtitle: "visibility, blocked users",
    help: "help",
    faq: "norbo faq",
    privacyPolicy: "privacy policy",
    appInfoIos: "norbo for ios",
    appInfoAndroid: "norbo for android",
    version: "version {{version}}",
  },

  // ── Language screen ─────────────────────────────────────────────────
  languageScreen: {
    title: "language",
    label: "select language",
    en: "english",
    it: "italiano",
  },

  // ── Edit info ─────────────────────────────────────────────────────
  editInfo: {
    title: "account",
    yourInfo: "your info",
    email: "email",
    username: "username",
    name: "name",
    bio: "bio",
  },

  // ── Name screen ───────────────────────────────────────────────────
  nameScreen: {
    title: "name",
    label: "your name",
    placeholder: "e.g. Luca",
    description: "this is the name others will see on your profile.",
    minLength: "at least 1 character",
    maxLength: "max 50 characters",
  },

  // ── Username screen ───────────────────────────────────────────────
  usernameScreen: {
    title: "username",
    label: "set username",
    placeholder: "e.g. luca_c",
    description:
      "choose a username so others can find you.\nuse a–z, 0–9 and underscores. min 3 characters.",
    minLength: "at least 3 characters",
    maxLength: "max 24 characters",
    regex: "lowercase letters, numbers, and underscores only",
  },

  // ── Bio screen ────────────────────────────────────────────────────
  bioScreen: {
    title: "bio",
    label: "your bio",
    placeholder: "tell us about yourself…",
    description:
      "a short bio that appears on your profile.\nmax 160 characters.",
    maxLength: "max 160 characters",
  },

  // ── User profile ────────────────────────────────────────────────
  userProfile: {
    title: "profile",
    username: "username",
    name: "name",
    bio: "bio",
    addToContacts: "add to contacts",
    removeContact: "remove contact",
    removeContactConfirm: "remove {{name}} from your contacts?",
    viewProfile: "view profile",
    blockUser: "block user",
    deleteDit: "delete dit",
    deleteDitConfirm:
      "delete this entire conversation with {{name}}? this cannot be undone.",
  },

  // ── Date formatting ────────────────────────────────────────────────
  date: {
    today: "today",
    yesterday: "yesterday",
    at: "at",
  },

  // ── Dits ──────────────────────────────────────────────────────────
  dits: {
    emptyTitle: "no dits yet",
    emptySubtitle: "send a dit to someone from contacts",
    selected: "{{count}} selected",
    deleteDitsTitle: "delete dits",
    deleteDitsConfirm:
      "delete {{count}} conversation(s)? this cannot be undone.",
  },

  // ── Contacts ──────────────────────────────────────────────────────
  contacts: {
    title: "contacts",
    searchPlaceholder: "find by username...",
    noResults: 'no users found for "{{query}}"',
    emptyTitle: "no contacts yet",
    emptySubtitle: "search for someone by their username",
    selected: "{{count}} selected",
    deleteContactsTitle: "remove contacts",
    deleteContactsConfirm:
      "remove {{count}} contact(s)? this cannot be undone.",
  },
  // ── FAQ screen ────────────────────────────────────────────────────
  faqScreen: {
    title: "faq",
    basics: {
      title: "the basics",
      q1: "what is dit?",
      a1: "Dit is a minimal signal app. No messages, no chats, no feeds. You send a \"dit\" — a tiny signal — to let someone know you're thinking of them. They can dah back, ignore it, or let it expire. That's the whole app.",
      q2: "what's the difference between a dit and a message?",
      a2: "A dit is intentionally empty. It carries no text, no image, no reaction — just a signal. Think of it like knocking on someone's door instead of writing them a letter.",
    },
    signals: {
      title: "signals",
      q1: 'what is a "dah"?',
      a1: "A dah is how you respond to a dit. When someone signals you, you can dah to acknowledge it. The terms come from Morse code — dit (·) and dah (—).",
      q2: 'what does "ignore" mean?',
      a2: "Ignoring a dit means you've seen it and chosen not to respond. The sender won't be notified. There's no obligation to dah — it's always your call.",
      q3: "how long does a dit last?",
      a3: "Every dit has a TTL (time to live). It expires automatically when the countdown reaches zero. Once gone, there's no trace — on either side.",
      q4: "what happens if the dit expires before I respond?",
      a4: "The dit disappears from both sides. No notification is sent to the sender. Expired dits leave no history.",
    },
    privacy: {
      title: "privacy & data",
      q1: "are my signals stored?",
      a1: "Dits are stored on our servers while they are in flight — between the moment you send them and when they are dahed, ignored, or expire. We don't keep a long-term history of your signals, and they are never shown to anyone other than you and the recipient.",
      q2: "who can see my dits?",
      a2: "Only you and the recipient. There are no groups, no broadcasts, no shared timelines. Every dit is strictly point-to-point — no other user can ever see them.",
      q3: "how do I control who can see my name and bio?",
      a3: 'Go to Settings → Privacy. From there you can set "name visibility" and "bio visibility" to everyone, contacts only, or nobody. Your username is always visible — that\'s how people find you.',
      q4: "how do I block someone?",
      a4: "Open the person's profile (from contacts or from a dit) and tap the block button. Once blocked, they can't send you dits, see your profile, or reach you in any way. Existing dits and the contact link with that person are removed.",
      q5: "how do I unblock someone?",
      a5: "Go to Settings → Privacy → Blocked Users. Tap the user you want to unblock. After unblocking, they can find you and send you dits again, but you'll need to add them back to your contacts manually if you want them there.",
    },
    account: {
      title: "account & contacts",
      q1: "how do I add a contact?",
      a1: 'Go to the Contacts tab and search by username. Find the person you\'re looking for and tap "add to contacts".',
      q2: "can anyone send me a dit?",
      a2: "Yes. Anyone with your username can send you a dit, even if they're not in your contacts. The only exception is people you've blocked — they can't reach you in any way.",
      q3: "how do I update my username or profile info?",
      a3: "Go to Settings → Account. From there you can update your username, display name, and bio.",
      q4: "how do I delete my account?",
      a4: "Go to Settings → Account → Delete Account. You'll need to type your username to confirm. Once deleted, all your data — dits, contacts, profile — is permanently removed and cannot be recovered.",
    },
  },

  // ── Delete account ───────────────────────────────────────────────
  deleteAccount: {
    title: "delete account",
    warning:
      "this will permanently delete your account, all your dits, contacts, and every trace of your data. this cannot be undone.",
    label: "type your username to confirm",
    placeholder: "your username",
    confirm: "permanently delete account",
    mismatch: "username does not match",
  },

  // ── Privacy screen ──────────────────────────────────────────────
  privacy: {
    title: "privacy",
    nameVisibility: "name visibility",
    nameVisibilityDesc: "who can see your name",
    bioVisibility: "bio visibility",
    bioVisibilityDesc: "who can see your bio",
    options: {
      everyone: "everyone",
      everyoneDesc: "visible to all dit users",
      contacts: "contacts only",
      contactsDesc: "only your contacts can see this",
      nobody: "nobody",
      nobodyDesc: "hidden from everyone",
    },
    blockedUsers: "blocked users",
    blockedEmpty: "no blocked users",
    unblock: "unblock",
    blockTitle: "block @{{username}}?",
    blockMessage:
      "all dits and contacts with this person will be permanently deleted. this cannot be undone.",
    block: "block",
    unavailable: "this conversation is no longer available",
    userNotFound: "user not found",
  },

  // ── Terms of Service (onboarding) ───────────────────────────────
  terms: {
    title: "terms of service",
    intro:
      "before you start using dit, please read and accept our terms of service.",
    readLink: "read the full terms of service",
    zeroTolerance:
      "dit has a zero-tolerance policy toward abusive behavior and inappropriate content. any user who posts offensive material or harasses others will be removed and may be reported to the competent authorities.",
    checkbox:
      "i accept the terms of service and commit to not publish offensive content.",
    continue: "continue",
    error: "couldn't save your acceptance. please try again.",
  },

  // ── Report user ─────────────────────────────────────────────────
  reportUser: {
    title: "report user",
    question: "why are you reporting this user?",
    offensiveContent: "offensive content",
    spam: "spam",
    harassment: "harassment or bullying",
    minorExploitation: "minor exploitation / inappropriate content",
    detailsPlaceholder: "additional details (optional)",
    submit: "submit report",
    successTitle: "thank you",
    successSubtitle: "we received your report and will review it shortly.",
    selectReason: "please select a reason",
  },

  // ── Add contact ─────────────────────────────────────────────────
  addContact: {
    title: "add contact",
    contactInfo: "contact info",
    firstName: "first name",
    lastName: "last name",
    notesPlaceholder: "notes (optional)",
    description: "this info is private — only you can see it.",
    saveFailed: "failed to save contact",
  },
} as const;

export default en;
