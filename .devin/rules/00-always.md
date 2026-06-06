---
trigger: always_on
---

> LIVING DOCUMENT — update this file whenever you:
> introduce a new pattern, convention, or architectural decision;
> discover a library behaviour that differs from what is written here;
> add a new dependency that has rules worth capturing;
> fix a bug caused by violating a rule that is not yet documented.

# Dit Mobile — Context

Dit mobile: minimal presence app, **NOT** chat. Confidential by design.

- Two backends: norbo-api (REST, auth/contacts) and dit-ping (WebSocket, real-time ping/dah).
- Notification flow: FCM/APNs → Notifee → background handler → dah/ignore via REST to norbo-api.
- Read `architecture.md` before changes to WebSocket service or notification handling.
- Read `decisions.md` before proposing an alternative to an existing choice.
