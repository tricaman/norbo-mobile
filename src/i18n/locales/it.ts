import type en from "./en";

type DeepStringify<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepStringify<T[K]>;
};

const it: DeepStringify<typeof en> = {
  // ── Common ────────────────────────────────────────────────────────
  common: {
    notSet: "non impostato",
    tapToSet: "tocca per impostare",
    save: "salva",
    cancel: "annulla",
    back: "indietro",
    searchFailed: "ricerca fallita",
    failedToSave: "salvataggio fallito, riprova",
    continue: "continua",
  },

  // ── Tabs ──────────────────────────────────────────────────────────
  tabs: {
    dits: "dit",
    contacts: "contatti",
    settings: "impostazioni",
    profile: "profilo",
  },

  // ── Auth ──────────────────────────────────────────────────────────
  auth: {
    signOut: "esci",
    otpTitle: "inserisci il codice",
    otpSubtitle: "abbiamo inviato un codice a 6 cifre a {{email}}",
    otpVerify: "verifica",
    otpResend: "reinvia codice",
    otpResendCooldown: "reinvia tra {{seconds}}s",
    otpSuccess: "verificato",
    emailTitle: "inserisci la tua email",
    emailSubtitle:
      "ti invieremo un codice per accedere o creare il tuo account",
    emailPlaceholder: "email",
    emailError: "inserisci un'email valida",
    continueWith: "continua con {{provider}}",
    continueWithEmail: "continua con email",
    tagline: "non dire nulla. dit tutto.",
    signingIn: "accesso in corso...",
    or: "oppure",
  },

  // ── Profile ───────────────────────────────────────────────────────
  profile: {
    editInfo: "modifica info",
    settings: "impostazioni",
    username: "username",
    name: "nome",
    bio: "bio",
  },

  // ── Settings ──────────────────────────────────────────────────────
  settings: {
    title: "impostazioni",
    account: "account",
    accountSubtitle: "username, email",
    language: "lingua",
    languageSubtitle: "lingua dell'app",
    privacy: "privacy",
    privacySubtitle: "visibilità, utenti bloccati",
    help: "aiuto",
    faq: "faq dit",
    privacyPolicy: "informativa sulla privacy",
    appInfoIos: "dit per ios",
    appInfoAndroid: "dit per android",
    version: "versione {{version}}",
  },

  // ── Language screen ─────────────────────────────────────────────────
  languageScreen: {
    title: "lingua",
    label: "seleziona lingua",
    en: "english",
    it: "italiano",
  },

  // ── Edit info ─────────────────────────────────────────────────────
  editInfo: {
    title: "account",
    yourInfo: "le tue info",
    email: "email",
    username: "username",
    name: "nome",
    bio: "bio",
  },

  // ── Name screen ───────────────────────────────────────────────────
  nameScreen: {
    title: "nome",
    label: "il tuo nome",
    placeholder: "es. Luca",
    description: "questo è il nome che vedranno gli altri sul tuo profilo.",
    minLength: "almeno 1 carattere",
    maxLength: "massimo 50 caratteri",
  },

  // ── Username screen ───────────────────────────────────────────────
  usernameScreen: {
    title: "username",
    label: "imposta username",
    placeholder: "es. luca_c",
    description:
      "scegli un username così gli altri possono trovarti.\nusa a–z, 0–9 e trattini bassi. minimo 3 caratteri.",
    minLength: "almeno 3 caratteri",
    maxLength: "massimo 24 caratteri",
    regex: "solo lettere minuscole, numeri e trattini bassi",
  },

  // ── Bio screen ────────────────────────────────────────────────────
  bioScreen: {
    title: "bio",
    label: "la tua bio",
    placeholder: "parlaci di te…",
    description:
      "una breve bio che appare sul tuo profilo.\nmassimo 160 caratteri.",
    maxLength: "massimo 160 caratteri",
  },

  // ── User profile ────────────────────────────────────────────────
  userProfile: {
    title: "profilo",
    username: "username",
    name: "nome",
    bio: "bio",
    addToContacts: "aggiungi ai contatti",
    removeContact: "rimuovi contatto",
    removeContactConfirm: "rimuovere {{name}} dai tuoi contatti?",
    viewProfile: "vedi profilo",
    blockUser: "blocca utente",
    deleteDit: "elimina dit",
    deleteDitConfirm:
      "eliminare tutta la conversazione con {{name}}? questa azione è irreversibile.",
  },

  // ── Date formatting ────────────────────────────────────────────────
  date: {
    today: "oggi",
    yesterday: "ieri",
    at: "alle",
  },

  // ── Dits ──────────────────────────────────────────────────────────
  dits: {
    emptyTitle: "nessun dit",
    emptySubtitle: "invia un dit a qualcuno dai contatti",
    selected: "{{count}} selezionati",
    deleteDitsTitle: "elimina dit",
    deleteDitsConfirm:
      "eliminare {{count}} conversazione/i? non è possibile annullare.",
  },

  // ── Contacts ──────────────────────────────────────────────────────
  contacts: {
    title: "contatti",
    searchPlaceholder: "cerca per username...",
    noResults: 'nessun utente trovato per "{{query}}"',
    emptyTitle: "nessun contatto",
    emptySubtitle: "cerca qualcuno per username",
    selected: "{{count}} selezionati",
    deleteContactsTitle: "rimuovi contatti",
    deleteContactsConfirm:
      "rimuovere {{count}} contatto/i? non è possibile annullare.",
  },
  // ── FAQ screen ────────────────────────────────────────────────────
  faqScreen: {
    title: "faq",
    basics: {
      title: "le basi",
      q1: "cos'è dit?",
      a1: 'Dit è un\'app di segnali minimale. Niente messaggi, niente chat, niente feed. Mandi un "dit" — un piccolo segnale — per far sapere a qualcuno che stai pensando a lui. Può rispondere con un dah, ignorarlo o lasciarlo scadere. Tutto qui.',
      q2: "qual è la differenza tra un dit e un messaggio?",
      a2: "Un dit è intenzionalmente vuoto. Non contiene testo, immagini né reazioni — solo un segnale. Pensa a bussare alla porta di qualcuno invece di scrivergli una lettera.",
    },
    signals: {
      title: "segnali",
      q1: 'cos\'è un "dah"?',
      a1: "Un dah è il modo in cui rispondi a un dit. Quando qualcuno ti segnala, puoi dare un dah per riconoscerlo. I termini vengono dal codice Morse — dit (·) e dah (—).",
      q2: 'cosa significa "ignora"?',
      a2: "Ignorare un dit significa che l'hai visto ma hai scelto di non rispondere. Il mittente non verrà notificato. Non c'è nessun obbligo di dare un dah — decidi sempre tu.",
      q3: "quanto dura un dit?",
      a3: "Ogni dit ha un TTL (time to live). Scade automaticamente quando il conto alla rovescia arriva a zero. Una volta sparito, non rimane nessuna traccia — da nessuna delle due parti.",
      q4: "cosa succede se il dit scade prima che risponda?",
      a4: "Il dit scompare da entrambe le parti. Nessuna notifica viene inviata al mittente. I dit scaduti non lasciano nessuno storico.",
    },
    privacy: {
      title: "privacy e dati",
      q1: "i miei segnali vengono salvati?",
      a1: "I dit vengono salvati sui nostri server mentre sono in transito — dal momento in cui li mandi fino a quando ricevono un dah, vengono ignorati o scadono. Non conserviamo uno storico a lungo termine dei tuoi segnali e non vengono mostrati a nessuno tranne te e il destinatario.",
      q2: "chi può vedere i miei dit?",
      a2: "Solo tu e il destinatario. Non esistono gruppi, broadcast né timeline condivise. Ogni dit è strettamente punto a punto — nessun altro utente può mai vederli.",
      q3: "come controllo chi può vedere il mio nome e la mia bio?",
      a3: 'Vai su Impostazioni → Privacy. Da lì puoi impostare "visibilità nome" e "visibilità bio" su tutti, solo contatti, o nessuno. Lo username è sempre visibile — è così che le persone ti trovano.',
      q4: "come blocco qualcuno?",
      a4: "Apri il profilo della persona (dai contatti o da un dit) e tocca il pulsante blocca. Una volta bloccata, non può più mandarti dit, vedere il tuo profilo o raggiungerti in nessun modo. I dit esistenti e il contatto con quella persona vengono rimossi.",
      q5: "come sblocco qualcuno?",
      a5: "Vai su Impostazioni → Privacy → Utenti Bloccati. Tocca l'utente che vuoi sbloccare. Dopo lo sblocco potrà di nuovo trovarti e mandarti dit, ma dovrai aggiungerlo manualmente ai contatti se vuoi che ci sia.",
    },
    account: {
      title: "account e contatti",
      q1: "come aggiungo un contatto?",
      a1: 'Vai nella tab Contatti e cerca per username. Trova la persona che cerchi e tocca "aggiungi ai contatti".',
      q2: "chiunque può mandarmi un dit?",
      a2: "Sì. Chiunque conosca il tuo username può mandarti un dit, anche se non è nei tuoi contatti. L'unica eccezione sono le persone che hai bloccato — loro non possono raggiungerti in nessun modo.",
      q3: "come aggiorno il mio username o le info del profilo?",
      a3: "Vai su Impostazioni → Account. Da lì puoi aggiornare username, nome visualizzato e bio.",
      q4: "come elimino il mio account?",
      a4: "Vai su Impostazioni → Account → Elimina Account. Dovrai digitare il tuo username per confermare. Una volta eliminato, tutti i tuoi dati — dit, contatti, profilo — vengono rimossi permanentemente e non possono essere recuperati.",
    },
  },

  // ── Delete account ───────────────────────────────────────────────
  deleteAccount: {
    title: "elimina account",
    warning:
      "questa azione eliminerà permanentemente il tuo account, tutti i tuoi dit, i contatti e ogni traccia dei tuoi dati. non può essere annullata.",
    label: "digita il tuo username per confermare",
    placeholder: "il tuo username",
    confirm: "elimina account definitivamente",
    mismatch: "username non corrispondente",
  },

  // ── Privacy screen ──────────────────────────────────────────────
  privacy: {
    title: "privacy",
    nameVisibility: "visibilità nome",
    nameVisibilityDesc: "chi può vedere il tuo nome",
    bioVisibility: "visibilità bio",
    bioVisibilityDesc: "chi può vedere la tua bio",
    options: {
      everyone: "tutti",
      everyoneDesc: "visibile a tutti gli utenti dit",
      contacts: "solo contatti",
      contactsDesc: "solo i tuoi contatti possono vederlo",
      nobody: "nessuno",
      nobodyDesc: "nascosto a tutti",
    },
    blockedUsers: "utenti bloccati",
    blockedEmpty: "nessun utente bloccato",
    unblock: "sblocca",
    blockTitle: "blocca @{{username}}?",
    blockMessage:
      "tutti i dit e i contatti con questa persona saranno eliminati definitivamente. questa azione è irreversibile.",
    block: "blocca",
    unavailable: "questa conversazione non è più disponibile",
    userNotFound: "utente non trovato",
  },

  // ── Terms of Service (onboarding) ───────────────────────────────
  terms: {
    title: "termini di servizio",
    intro:
      "prima di iniziare a usare dit, leggi e accetta i nostri termini di servizio.",
    readLink: "leggi i termini di servizio completi",
    zeroTolerance:
      "dit applica una tolleranza zero verso comportamenti abusivi e contenuti inappropriati. chi pubblica contenuti offensivi o molesta altri utenti verrà rimosso e potrà essere segnalato alle autorità competenti.",
    checkbox:
      "accetto i termini di servizio e mi impegno a non pubblicare contenuti offensivi.",
    continue: "continua",
    error: "non è stato possibile salvare l'accettazione. riprova.",
  },

  // ── Report user ─────────────────────────────────────────────────
  reportUser: {
    title: "segnala utente",
    question: "perché stai segnalando questo utente?",
    offensiveContent: "contenuto offensivo",
    spam: "spam",
    harassment: "molestie o bullismo",
    minorExploitation: "sfruttamento dei minori / contenuto inappropriato",
    detailsPlaceholder: "dettagli aggiuntivi (opzionale)",
    submit: "invia segnalazione",
    successTitle: "grazie",
    successSubtitle:
      "abbiamo ricevuto la tua segnalazione e la esamineremo a breve.",
    selectReason: "seleziona un motivo",
  },

  // ── Add contact ─────────────────────────────────────────────────
  addContact: {
    title: "aggiungi contatto",
    contactInfo: "info contatto",
    firstName: "nome",
    lastName: "cognome",
    notesPlaceholder: "note (opzionale)",
    description: "queste info sono private — solo tu puoi vederle.",
    saveFailed: "salvataggio contatto fallito",
  },
} as const;

export default it;
