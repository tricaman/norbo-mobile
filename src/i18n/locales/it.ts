const it = {
  common: {
    tapToSet: "tocca per impostare",
    failedToSave: "salvataggio non riuscito, riprova",
    continue: "continua",
  },

  tabs: {
    settings: "impostazioni",
  },

  auth: {
    signOut: "esci",
    otpTitle: "inserisci codice",
    otpSubtitle: "abbiamo inviato un codice a 6 cifre a {{email}}",
    otpVerify: "verifica",
    otpResend: "rinvia codice",
    otpResendCooldown: "rinvia tra {{seconds}}s",
    otpSuccess: "verificato",
    emailTitle: "inserisci la tua email",
    emailSubtitle:
      "ti invieremo un codice per accedere o creare il tuo account",
    emailPlaceholder: "email",
    emailError: "inserisci un'email valida",
    continueWith: "continua con {{provider}}",
    continueWithEmail: "continua con l'email",
    tagline: "la nuova esperienza norbo",
    signingIn: "accesso in corso...",
    or: "oppure",
  },

  settings: {
    title: "impostazioni",
    account: "account",
    accountSubtitle: "nome, email",
    language: "lingua",
    languageSubtitle: "lingua dell'app",
    help: "aiuto",
    privacyPolicy: "informativa privacy",
    appInfoIos: "norbo per ios",
    appInfoAndroid: "norbo per android",
    version: "versione {{version}}",
  },

  languageScreen: {
    title: "lingua",
    en: "inglese",
    it: "italiano",
  },

  editInfo: {
    title: "account",
    yourInfo: "le tue informazioni",
    email: "email",
    name: "nome",
  },

  nameScreen: {
    title: "nome",
    label: "il tuo nome",
    placeholder: "es. Luca",
    description: "questo è il nome che gli altri vedranno sul tuo profilo.",
    minLength: "almeno 1 carattere",
    maxLength: "massimo 50 caratteri",
  },

  deleteAccount: {
    title: "elimina account",
    warning:
      "questa azione eliminerà definitivamente il tuo account e tutti i dati correlati. non può essere annullata.",
    label: "digita la tua email per confermare",
    placeholder: "la tua email",
    confirm: "elimina account",
    mismatch: "l'email non corrisponde",
  },

  terms: {
    title: "termini di servizio",
    intro:
      "prima di iniziare a usare norbo, leggi e accetta i nostri termini di servizio.",
    readLink: "leggi i termini di servizio completi",
    zeroTolerance:
      "norbo applica una politica di tolleranza zero verso comportamenti abusivi e contenuti inappropriati. ogni utente che pubblica materiale offensivo o molesta altri verrà rimosso e potrà essere segnalato alle autorità competenti.",
    checkbox:
      "accetto i termini di servizio e mi impegno a non pubblicare contenuti offensivi.",
    continue: "continua",
    error: "non è stato possibile salvare l'accettazione. riprova.",
  },
} as const;

export default it;
