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
  // El destino lo decide el action, que es donde vive esa lógica; navega el componente
  // (ADR-0046). Ver `lib/navigate-after-mutation.ts` por qué no alcanza `router.push`.
  | { status: 'success'; redirectTo: string }
  | {
      status: 'error';
      message: string;
      field?: 'email' | 'password' | 'confirm' | 'careerPlanId';
    };

export const initialSignUpState: SignUpFormState = { status: 'idle' };
