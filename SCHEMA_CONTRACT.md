# Canonical System Schema Contract

This document defines the single source of truth for field names, types, and entity relationships across the database models, API endpoints, and frontend services. All code MUST adhere strictly to these field names — no local variations, no ad-hoc aliases.

---

## Entity Relationship Matrix

| Entity / Collection | Field Name | Type | References / Description |
|---|---|---|---|
| **User** | `_id` | `ObjectId` | Primary Key for user accounts |
| **User** | `role` | `String` | Enum: `'student'` \| `'counselor'` \| `'admin'` |
| **User** | `counselorId` | `ObjectId` | ONLY on student-role users, references `User._id` of their assigned counselor. This is the **ONE** canonical field name for this relationship on the User model. |
| **StudentProfile** | `userId` | `ObjectId` | References `User._id` (student) |
| **StudentProfile** | `assignedCounselorId` | `ObjectId` | References `User._id` (counselor) |
| **StudentProfile** | `invitedBy` | `ObjectId` | References `User._id` (counselor or admin) |
| **CounselorProfile** | `userId` | `ObjectId` | References `User._id` (counselor) |
| **InviteCode** | `ownerId` | `ObjectId` | References `User._id` (the counselor owning the invite code) |
| **AssessmentSession** | `studentId` / `clientId` | `ObjectId` | References `User._id` (student) |
| **AssessmentSession** | `assessmentKey` | `String` | Instrument key identifier (e.g. `'ipip-neo-120'`) |
| **AssessmentScore** | `sessionId` | `ObjectId` | References `AssessmentSession._id` |
| **AssessmentScore** | `studentId` / `clientId` | `ObjectId` | References `User._id` (student) |
| **AssessmentAssignment** | `studentId` | `ObjectId` | References `User._id` (student) |
| **AssessmentAssignment** | `counselorId` | `ObjectId` | References `User._id` (counselor) |

---

## Implementation Rules & Safeguards

1. **Single Relationship Field on User**:
   - On the `User` model, student-to-counselor assignment is stored **ONLY** under `counselorId`. Never use `counselor`, `assignedCounselor`, or other alternate field names.

2. **ObjectId Equality Standard**:
   - Never compare Mongoose ObjectIds using strict `===` without casting. Always use `isSameId(a, b)` from `@/shared/utils/ownership.utils` or explicit `.toString()` conversions.

3. **Invite Code Signup Sync**:
   - When a student registers using a counselor invite code, both `User.counselorId` AND `StudentProfile.assignedCounselorId` MUST be populated with the counselor's `User._id`.

4. **Population Projection Inclusion**:
   - When calling `.populate("userId")` or `.populate("studentId")` in service methods, always include `counselorId` in the field selection string (e.g., `.populate("userId", "firstName lastName email role counselorId")`) to prevent authorization checks from receiving `undefined`.

5. **`_id` → `id` Serialization Rename**:
   - The shared `defaultSchemaOptions` (`server/src/shared/utils/schema.utils.js`) rewrites every serialized document so `_id` is **deleted** and exposed as `id`. This applies to `toJSON` AND `toObject`, so anything that reaches the API response or `res.json()` carries `id`, NOT `_id` — while `.lean()` results (e.g. `assessmentDefinition.routes.js`) still carry `_id`. Never compare a raw `_id` against a serialized `id` in the frontend (this has caused ObjectId mismatch bugs where scoped lists render empty); resolve either shape with a helper such as `resolveId()` in `client/src/features/assessments/components/AssignmentRow.jsx` before comparing.
