# DHAC Coin Portal — Security Architecture, Dirty Dozen & Red Team Audit

## 1. Data Invariants & Relational Integrity Laws

1. **Zero Self-Assigned Privilege Escalation (`/users/{userId}` & `/admins/{adminUid}`)**:
   - No user may create or update their `/users/{userId}` document with `role == 'SUPER_ADMIN'` unless they match the bootstrap Super Admin email (`sidrastudentunion@gmail.com` with `email_verified == true`) or hold a verified `/admins/{uid}` record created by an existing Super Admin.
   - Non-admin users creating `/users/{userId}` for the first time MUST set `role == 'VIEWER'`.
   - Binding `/users/{userId}` from `'VIEWER'` to `'TEACHER_ADMIN'` requires that `/mentors/{mentorDocId}` exists AND `mentorDoc.assignedEmail == request.auth.token.email` AND `request.auth.token.email_verified == true`.
   - Binding `/users/{userId}` from `'VIEWER'` to `'STUDENT'` requires that `/students/{studentDocId}` exists AND `studentDoc.adNo == incoming.adNo` AND `studentDoc.className == incoming.className`.
   - Non-admins can NEVER modify their `role` once bound; subsequent owner updates are restricted strictly to `['displayName', 'photoUrl', 'updatedAt']`.

2. **Split-Collection PII Isolation (`/users/{userId}/private/{privateDocId}`)**:
   - `/users/{userId}` contains ZERO PII (`email`, phone numbers, home addresses are strictly prohibited in `/users/{userId}` via `hasOnly(...)`).
   - User email addresses live strictly in `/users/{userId}/private/info` guarded by a Pillar 1 Master Gate (`exists(/users/{userId}) && get(/users/{userId}).data.uid == userId`) and restricted exclusively to `request.auth.uid == userId || isAdmin()`.

3. **Unverified Token & Email Spoofing Protection**:
   - Every write operation across all collections requires `request.auth != null && request.auth.token.email_verified == true`.
   - Any check against `request.auth.token.email` explicitly mandates `request.auth.token.email_verified == true`.

4. **Claim State Machine & Terminal Locking (`/coin_claims/{claimId}`)**:
   - Every claim must be created with `status == 'PENDING'`, `submittedByUid == request.auth.uid`, an existing target `/students/{studentDocId}`, and zero pre-populated reviewer fields (`reviewedBy`, `reviewedByUid`, `reviewedAt`).
   - Only verified Faculty Mentors (`isMentor()`) or Super Admins (`isAdmin()`) can transition a claim out of `'PENDING'` to `'APPROVED'` or `'REJECTED'`.
   - Once a claim reaches terminal state `'APPROVED'` or `'REJECTED'`, non-admin updates are permanently rejected (`existing().status == 'PENDING'`).

5. **Atomic Relational Sync (`existsAfter` / `getAfter`)**:
   - Creating a claim in `/coin_claims/{claimId}` MUST atomically update `/portal_queues/pending_claims` (`lastClaimId == claimId`) and append `/audit_logs/{auditDocId}` in the same WriteBatch.
   - Approving a claim in `/coin_claims/{claimId}` (`status == 'APPROVED'`) MUST atomically update `/portal_queues/pending_claims`, update `/students/{studentDocId}`, and create `/coin_transactions/{txId}` + `/audit_logs/{auditDocId}` in the same Transaction/WriteBatch.

6. **Path Variable Hardening & Volumetric Bounds**:
   - All single-document `get`, `create`, `update`, and `delete` operations enforce `isValidId(docId)` (`id is string && id.size() > 0 && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$')`).
   - Every string field validates `.size() <= maxLength` matching `firebase-blueprint.json`; every array validates `.size() <= maxItems` and validates element types via size-checked index checks.

---

## 2. The "Dirty Dozen" Adversarial Payloads

| # | Attack Vector | Target Path | Malicious Payload / Context | Result |
|---|---------------|-------------|-----------------------------|--------|
| 1 | **Super Admin Privilege Escalation** | `/users/user-attacker` (`create`) | `{ "uid": "user-attacker", "displayName": "Attacker", "role": "SUPER_ADMIN", "createdAt": "<SERVER_TIME>", "updatedAt": "<SERVER_TIME>" }` (auth: normal Gmail user) | `PERMISSION_DENIED` |
| 2 | **RBAC Self-Promotion via Update** | `/users/user-student` (`update`) | `{ "role": "TEACHER_ADMIN", "teacherId": "DHAC/STAFF/01", "mentorDocId": "STAFF-01", "updatedAt": "<SERVER_TIME>" }` (without pre-authorized `assignedEmail`) | `PERMISSION_DENIED` |
| 3 | **Shadow / Ghost Field Injection** | `/coin_claims/CLM-101` (`create`) | Valid claim payload + `"isVerified": true, "bypassApproval": true` | `PERMISSION_DENIED` |
| 4 | **Email Spoofing Without Verification** | `/admins/spoof-uid` (`create`) | Auth token `{ "email": "sidrastudentunion@gmail.com", "email_verified": false }`, payload `{ "uid": "spoof-uid", "email": "sidrastudentunion@gmail.com", "role": "SUPER_ADMIN" }` | `PERMISSION_DENIED` |
| 5 | **Identity Spoofing on Claim Submission** | `/coin_claims/CLM-102` (`create`) | Authenticated as `uid-A`, payload sets `"submittedByUid": "uid-B"` | `PERMISSION_DENIED` |
| 6 | **State Shortcutting (Pre-Approved Claim)** | `/coin_claims/CLM-103` (`create`) | Student creates claim directly with `"status": "APPROVED", "reviewedBy": "Self", "reviewedByUid": "uid-A"` | `PERMISSION_DENIED` |
| 7 | **Terminal State Replay Mutation** | `/coin_claims/CLM-104` (`update`) | Mentor or claimant attempts to modify an already `'APPROVED'` claim to inflate `coins: 999` | `PERMISSION_DENIED` |
| 8 | **Student Direct Coin Balance Tampering** | `/students/STU-635` (`update`) | Student (`uid-A`) attempts `{ "totalCoins": 5000, "tier": "Diamond", "updatedAt": "<SERVER_TIME>" }` | `PERMISSION_DENIED` |
| 9 | **Orphaned Transaction Injection** | `/coin_transactions/TX-999` (`create`) | Transaction referencing non-existent `studentDocId: "STU-DOES-NOT-EXIST"` | `PERMISSION_DENIED` |
| 10 | **Cross-User PII Snooping** | `/users/uid-victim/private/info` (`get`) | Authenticated user `uid-other` (non-admin) requests `getDoc` on `uid-victim` private PII doc | `PERMISSION_DENIED` |
| 11 | **Path Variable & 1.5KB Payload Poisoning** | `/students/../../evil$id...` (`create`) | Document ID with path traversal chars or `> 128` chars, or `notes` string exceeding `500` chars (100KB payload) | `PERMISSION_DENIED` |
| 12 | **Temporal Forgery (Client Clock Backdating)** | `/coin_claims/CLM-105` (`create`) | Claim payload supplies hardcoded client timestamp `"2020-01-01T00:00:00Z"` instead of `request.time` | `PERMISSION_DENIED` |

---

## 3. Phase 5 Hardened Red Team Audit & Conflict Report

### Findings & Delta Patches Applied

1. **Vulnerability Found in Draft `/portal_queues/{queueId}` (`update`)**:
   - *Logic Leak*: Draft rules allowed any `isVerifiedUser()` to update `items` and `totalCount` on `/portal_queues/pending_claims` without verifying that existing queue entries were preserved or that a matching `/coin_claims/{lastClaimId}` document was atomically created in the same batch. A malicious student could call `updateDoc(doc(db, 'portal_queues', 'pending_claims'), { items: [], totalCount: 0, ... })` to clear the faculty review queue.
   - *Delta Patch Applied*: Split `/portal_queues/{queueId}` `allow update` into two strict action branches:
     - **Faculty/Admin Action (`isMentor()`)**: Allows full queue reconciliation (`APPROVED` / `REJECTED` updates and trimming).
     - **Student Append Action (Non-Mentor)**: Enforces `incoming().items.hasAll(existing().items)`, `incoming().items.size() == existing().items.size() + 1`, `incoming().totalCount == existing().totalCount + 1`, `existsAfter(/databases/$(database)/documents/coin_claims/$(incoming().lastClaimId))`, and `getAfter(...).data.submittedByUid == request.auth.uid && getAfter(...).data.status == 'PENDING'`.

2. **Vulnerability Found in Draft `isValidPublicViewDoc(data)` Schema Coverage**:
   - *Schema Mismatch*: `catalog_config` public view document stores optional `teachers`, `coinCategories`, and `unions` bounded arrays alongside `classAwards` and `topStudents`.
   - *Delta Patch Applied*: Added optional bounded arrays `teachers` (`.size() <= 100`), `coinCategories` (`.size() <= 50`), and `unions` (`.size() <= 30`) with element type validation (`[0] is map`) to `PublicViewDoc` in `firebase-blueprint.json`, `isValidPublicViewDoc`, and `affectedKeys().hasOnly(...)` in `firestore.rules`.

### Per-Collection Red Team Matrix

| Collection | Identity Spoofing | State Shortcutting | Resource Poisoning | Value Poisoning | Shadow Fields | PII & Query Trust |
|------------|-------------------|--------------------|--------------------|-----------------|---------------|-------------------|
| `/admins/{adminUid}` | Blocked (`uid == adminUid` & `isBootstrapAdmin()`) | N/A | Blocked (`isValidId` + size limits) | Blocked (`isValidAdminRecord`) | Blocked (`hasOnly`) | Blocked (`isOwner \|\| isAdmin`, `isAdminList()`) |
| `/users/{userId}` | Blocked (`uid == request.auth.uid`) | Blocked (`VIEWER` on create; verified source for binding) | Blocked (`isValidId` + size limits) | Blocked (`isValidUserProfile`) | Blocked (`hasOnly` — no `email`/`isAdmin`) | Blocked (zero PII; `isOwner \|\| isAdmin`) |
| `/users/{userId}/private/{privateDocId}` | Blocked (`request.auth.uid == userId` + Master Gate) | N/A | Blocked (`isValidId` + maxLength) | Blocked (`isValidUserPrivateInfo`) | Blocked (`hasOnly`) | Isolated PII (`request.auth.uid == userId \|\| isAdmin()`) |
| `/mentors/{mentorDocId}` | Blocked (`isAdmin()`) | N/A | Blocked (`isValidId` + maxLength) | Blocked (`isValidMentorRecord`) | Blocked (`hasOnly`) | Public cohort directory (`isPublicDirectory == true`) |
| `/students/{studentDocId}` | Blocked (`isAdmin()`/`isMentor()`, or Tier 2 `isStudentOwner` photo-only) | Blocked (`totalCoins >= existing().totalCoins` for mentor; locked for student) | Blocked (`isValidId` + 50KB photo cap) | Blocked (`isValidStudentRecord`) | Blocked (`hasOnly`) | Institutional cohort (`isPublicCohort == true`) |
| `/coin_categories/{categoryId}` | Blocked (`isAdmin()`) | N/A | Blocked (`isValidId` + `activities.size() <= 50`) | Blocked (`isValidCoinCategoryDoc`) | Blocked (`hasOnly`) | Public rules (`isActive == true`) |
| `/unions/{unionId}` | Blocked (`isAdmin()`) | N/A | Blocked (`isValidId` + `classes.size() <= 12`) | Blocked (`isValidUnionDoc`) | Blocked (`hasOnly`) | Public unions (`isActive == true`) |
| `/class_awards/{classId}` | Blocked (`isMentor()`/`isAdmin()`) | Blocked (mentor cannot decrement; only admin revoke) | Blocked (`isValidId` + int bounds) | Blocked (`isValidClassAwardDoc`) | Blocked (`hasOnly`) | Public standings (`isPublicStanding == true`) |
| `/coin_claims/{claimId}` | Blocked (`submittedByUid == request.auth.uid`) | Blocked (`status == 'PENDING'` on create; terminal locked on `APPROVED`/`REJECTED`) | Blocked (`isValidId` + 1KB proof cap) | Blocked (`isValidCoinClaimDoc` at start of create & update) | Blocked (`hasOnly`) | Owner-scoped list (`submittedByUid == auth.uid \|\| isAdminList()`) |
| `/coin_transactions/{txId}` | Blocked (`isMentor()` + `awardedByUid == auth.uid`) | Blocked (`existsAfter` on student/class + audit log) | Blocked (`isValidId` + int bounds) | Blocked (`isValidCoinTransactionDoc`) | Blocked (`hasOnly`) | Public ledger (`isPublicLedger == true`) |
| `/audit_logs/{auditId}` | Blocked (`actorUid == auth.uid`) | Immutable (`update, delete: if false`) | Blocked (`isValidId` + 300 char summary) | Blocked (`isValidAuditLogDoc`) | Blocked (`hasOnly`) | Admin-only read (`isAdmin()` / `isAdminList()`) |
| `/portal_queues/{queueId}` | Blocked (`updatedByUid == auth.uid`) | Blocked (append-only `hasAll` + `existsAfter` for non-mentors) | Blocked (`items.size() <= 100`) | Blocked (`isValidPortalQueueDoc`) | Blocked (`hasOnly`) | Mentor-only `get` (`isMentor()`); `list: if false` |
| `/public_views/{viewId}` | Blocked (`isMentor()`) | Blocked (fixed singleton IDs) | Blocked (`topStudents.size() <= 350`) | Blocked (`isValidPublicViewDoc`) | Blocked (`hasOnly`) | Single-doc `get` only; `list: if false` |
