/**
 * Types for the sign-up feature: the response shape the backend returns on
 * 201, plus the action state for useActionState. State and initial value
 * live here (and not in actions.ts) because actions.ts is `'use server'`
 * and Next.js only allows async function exports from such files.
 */

export type RegisterUserResponse = {
  id: string;
  email: string;
};

export type SignUpFormState =
  | { status: 'idle' }
  | {
      status: 'error';
      message: string;
      field?: 'email' | 'password' | 'confirm';
    };

export const initialSignUpState: SignUpFormState = { status: 'idle' };
