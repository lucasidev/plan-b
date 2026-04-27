'use server';

import { redirect } from 'next/navigation';
import { registerUser } from '../api';
import { signUpSchema } from '../schemas';
import type { ValidationProblemDetails } from '../types';

/**
 * Form state surfaced to the React 19 useActionState hook in the sign-up
 * form. `field` lets the form scope the error message under a specific
 * input; absent means a generic error.
 */
export type SignUpFormState =
  | { status: 'idle' }
  | {
      status: 'error';
      message: string;
      field?: 'email' | 'password' | 'confirm';
    };

export const initialSignUpState: SignUpFormState = { status: 'idle' };

export async function signUpAction(
  _prev: SignUpFormState,
  formData: FormData,
): Promise<SignUpFormState> {
  const raw = {
    email: formData.get('email')?.toString() ?? '',
    password: formData.get('password')?.toString() ?? '',
    confirm: formData.get('confirm')?.toString() ?? '',
  };

  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue.path[0];
    return {
      status: 'error',
      message: issue.message,
      field: path === 'email' || path === 'password' || path === 'confirm' ? path : undefined,
    };
  }

  const response = await registerUser({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (response.status === 201) {
    // Throws NEXT_REDIRECT, which Next.js catches to issue a 303 redirect.
    redirect(`/sign-up/check-inbox?email=${encodeURIComponent(parsed.data.email)}`);
  }

  if (response.status === 409) {
    return {
      status: 'error',
      message: 'Ya existe una cuenta con ese email',
      field: 'email',
    };
  }

  if (response.status === 400) {
    const body = (await response.json().catch(() => null)) as ValidationProblemDetails | null;
    const fieldName = body?.errors ? Object.keys(body.errors)[0] : undefined;
    const message =
      (fieldName && body?.errors?.[fieldName]?.[0]) ||
      body?.detail ||
      'Los datos no son válidos. Revisalos y probá de nuevo.';
    return {
      status: 'error',
      message,
      field: mapBackendFieldToForm(fieldName),
    };
  }

  return {
    status: 'error',
    message: 'No pudimos completar el registro. Probá de nuevo en un rato.',
  };
}

function mapBackendFieldToForm(field: string | undefined): 'email' | 'password' | undefined {
  if (!field) return undefined;
  const lower = field.toLowerCase();
  if (lower.includes('email')) return 'email';
  if (lower.includes('password')) return 'password';
  return undefined;
}
