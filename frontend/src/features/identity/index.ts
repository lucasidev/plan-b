// Identity feature — mirrors backend modules/identity.
// Owns: auth (sign-in, sign-up, verify-email, sign-out), user profiles,
//       StudentProfile creation, TeacherProfile claim and verification.
// See ADR-0020 for 1:1 alignment rationale; frontend/CLAUDE.md for the
// vertical-slice layout this directory follows (actions.ts, api.ts,
// schemas/, components/, types.ts).

export * from './actions';
export * from './api';
export * from './schemas';
export * from './types';
