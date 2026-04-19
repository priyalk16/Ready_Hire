# Firebase Security Specification

## Data Invariants
1. A user profile document ID must match the authenticated `request.auth.uid`.
2. Career discovery results must belong to the user who created them (`userId == request.auth.uid`).
3. Assessments must belong to the user who created them.
4. Timestamps (`createdAt`, `updatedAt`) must be server-validated.

## Dirty Dozen Payloads (Targeting Rejection)
1. **Identity Spoofing**: Attempting to create a `/users/victim-uid` document while authenticated as `attacker-uid`.
2. **Data Poisoning**: Injecting 1MB of junk data into the `displayName` field.
3. **Relational Sync Bypass**: Updating a `PrepAssessment` without a valid `userId` matching the auth token.
4. **Timestamp Forgery**: Manually setting `createdAt` to a date in 2020.
5. **Schema Violation**: Adding `admin: true` to a user profile where it's not allowed.
6. **Cross-User Leak**: Authenticated user 'A' attempting to read `users/B/careerDiscovery/latest`.
7. **Orphaned Writes**: Creating a sub-collection assessment without having a parent user profile.
8. **Field Modification**: Attempting to change the `userId` of an existing assessment.
9. **Invalid ID**: Using `../../junk` as a document ID in a restricted path.
10. **Global Write**: Attempting to write to a random collection like `/config`.
11. **Type Mismatch**: Sending a string for the `score` field (expected number).
12. **Unverified Read**: Attempting to list all users as a standard authenticated user.
