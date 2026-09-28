# Contrat observé avant implémentation

Inspection : README principal, `src/api/*`, AuthContext, pages et mocks existants.

- `POST /api/auth/login` reçoit email/password et retourne `{ token }` ; `/auth/me` retourne un utilisateur direct. L’UI lit `name` et accepte les rôles sans distinction de casse. Le backend fournira `fullName` et l’alias `name`.
- Événements : GET/POST `/events`, GET/PUT `/events/:id`, PATCH `/events/:id/status`. Corps camelCase : title, description, location, eventDate ISO, maxParticipants. Filtres : status/date/search/page/limit. Réponses directes avec createdBy objet et registeredParticipants numérique.
- Participants : GET/POST `/participants`, PUT `/participants/:id`. Corps fullName/email/phone ; recherche et pagination. Ajout backend de GET et DELETE par id.
- Inscriptions : GET/POST `/registrations`, PATCH `/registrations/:id/status`. Corps eventId/participantId ou status ; filtres eventId/status/page/limit. Résultats enrichis avec participant et event.
- Dashboard : objet direct totalEvents, publishedEvents, todayRegistrations, totalParticipants, topEvents, upcomingEvents. Capacité = pending + confirmed.
- Listes paginées : l’UI lit `{ data, total }`. Le backend conservera total et ajoutera pagination. Les services de sélection récupéreront les pages de 100 pour ne pas tronquer silencieusement les résultats. L’API sera toujours paginée.
- L’UI lit actuellement `error.response.data.code`. Elle acceptera aussi l’enveloppe `{ success: false, error: { code, message } }` avec une liste de messages sûrs.
- Le formulaire exige description ; le modèle demandé permet NULL. Correction minimale : description optionnelle et conversion NULL vers chaîne vide à l’édition.
- L’UI ne propose pas l’annulation d’événement. Ajout dans les détails avec confirmation, sans changement de layout.
- Les mocks refusent une réinscription annulée ; ils seront alignés sur la réactivation de la même ligne, sans servir de preuve de validation du backend.

Le backend reste seul responsable des autorisations, transitions, contraintes et contrôles de capacité. Aucun changement de modèle User/Participant.
