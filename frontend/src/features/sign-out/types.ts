export type SignOutState =
  | { status: 'idle' }
  | { status: 'success'; redirectTo: string }
  | { status: 'error'; message: string };

export const initialSignOutState: SignOutState = { status: 'idle' };
