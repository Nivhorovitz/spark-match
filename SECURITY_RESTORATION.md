# Spark Match shared security restoration — 2026-10-17

## Verified production changes (approved by Niv)
- Supabase project: `sparkco-braindates`; migration `secure_shared_spark_match_and_preserve_snapshot_20261017`: before-state schema and data preserved under restricted `nivos_match_security_20261017` (not an off-site disaster-recovery backup), with 19 profiles, 2 invites, 1 saved connection and 4 communities unchanged.
- Public `profiles`, `invites` and `saved_connections`: anonymous and authenticated table privileges temporarily removed; formerly broad RLS policies set to false. Public catalogue SELECT remains for `communities` and `community_taxonomy`; client-side taxonomy mutation blocked.
- Public execution of `rls_auto_enable` revoked. This was confirmed by readback and Supabase advisor.
- Migration `contain_public_profile_photo_writes_20261017`: previously public INSERT/UPDATE/DELETE Storage policies disabled for profile-photos. Existing public images remain available; Storage bucket public visibility not changed.
- No data rows or existing Storage objects deleted. Table row counts matched the restricted in-database backup. This is a temporary service outage in the four matching experiences, intentionally approved.

## Source fix prepared, not deployed
- On branch `security/fix-sales-coaching-community-20261017`, `app.js` now looks up the actual existing community `Spark Match Sales Coaching`, and no longer tries to create a nonexistent `Sparkco Spark Match` community from a public browser.
- Patch parsed and passed exact readback. This alone does not restore Supabase access.

## Restore securely (do not bypass verification)
1. Bind verified human identity to `auth.uid()`. For adults, validated Supabase Auth login such as email OTP is a candidate; for TheZone minors, use signed/verifiable Sparkco-mediated identity, not user_uid from editable URL parameters or browser localStorage.
2. Provide authorization for each community. A member must not self-assign membership to any arbitrary community or gain admin rights through query parameters.
3. Add a server-controlled membership/ownership mapping and RLS (own profile, own invites, own saved connections, authorized peer discovery via restricted non-sensitive fields). Legacy rows use random `user_key`, which is NOT an acceptable proof of ownership. Preserve existing rows and use independently verified migration claims instead of auto-claim.
4. Private `email`, `phone`, `private_note` must never appear in a peer-discovery response. Storage photo writes require a verified owner-bound path.
5. Update and test all four main apps: Sales Coaching (root spark-match), Business Women (matchapp-business-women), Braindates (sparkco-braindates), HLC matchapp (matchapp). Review student-specific paths separately.
6. Use two legitimate member identities and one unauthorized identity to prove cross-user and cross-community isolation; test create/edit/match/invite/photo UI and iframe. Verify old data retained and repeat Supabase security advisors.

## Confirmed blocker
Seven Supabase Auth accounts exist, but the 19 legacy profiles have no verifiable `auth.uid()` binding. They cannot be assigned safely from their editable `user_key` alone. TheZone session identity requires a trusted launch token from the host. Secure restoration cannot be marked DONE until identity and ownership have been linked and each app passes end-to-end testing.

## Rollback safety
Do not reflexively restore permissive MVP RLS policies: that would reopen confirmed anonymous access. If a functional rollback is needed, retain the secure containment and repair clients/membership instead. Never publish secrets or identifiable exports.
