## Auth endpoints (norbo-api BetterAuth)

### Email OTP (unified passwordless flow)

The primary email auth flow is passwordless OTP via BetterAuth's `emailOTP` plugin.
If the user doesn't exist, they are auto-created on OTP verification (`disableSignUp` is false).
OTP is sent via Brevo API (BrevoClient in `betterauth.ts`).

POST /auth/otp/send (custom — sends email synchronously, returns 500 on API failure)
Body: { email, type: "sign-in" | "email-verification" | "forget-password" }
Response: { success: true }

POST /auth/sign-in/email-otp
Body: { email, otp: "123456" }
Response: { user, session } + sets session cookie

Mobile flow: Landing → EmailInputView → OtpVerifyView → authenticated.

### Social login (initiated from mobile via expo-web-browser)

GET /auth/social-redirect?provider=google&callbackURL=dit://auth/callback
→ backend POSTs to BetterAuth internally, sets state cookie, 302-redirects to provider
→ after consent, provider callback arrives at GET /auth/callback/:provider
→ BetterAuth creates/finds user, sets session cookie, redirects to callbackURL
→ backend appends session_token to the dit:// deep-link URL

Supported providers: google, facebook, microsoft

### Session

GET /auth/me → current user (requires session cookie)
POST /auth/sign-out → clears session cookie
POST /auth/ws-token → returns { wsToken } for dit-ping WebSocket auth
