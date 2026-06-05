'use client';

import { useActionState, useId } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PasswordField } from '@/components/ui/password-field';
import { changePasswordAction } from '../actions';
import { initialChangePasswordState } from '../types';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Change-password modal (US-079-i, frontend slice of the integrated US). Triggered from
 * the Security section of /settings (US-072). Three fields: current password + new +
 * confirmation. Client pre-validation with Zod (mismatch, length, same value);
 * backend-specific errors (wrong current, same as current, too weak, too long) are
 * routed to inline errors on the matching field.
 *
 * Success returns no state to the modal: the server action clears the session cookies
 * and redirects to `/sign-in?password-changed=1` (the backend revoked the refresh
 * tokens, so the user has to re-login on every device).
 */
export function ChangePasswordModal({ open, onOpenChange }: Props) {
  const formId = useId();
  const [state, formAction] = useActionState(changePasswordAction, initialChangePasswordState);

  // When the modal closes (cancel or overlay click) we would reset the errors of the
  // next open. useActionState does not expose a reset, so the state lives in the
  // component; on re-open the last error stays visible until the user touches
  // anything. Acceptable trade-off.

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cambiar contraseña</DialogTitle>
          <DialogDescription>
            Después de confirmar vas a tener que iniciar sesión de nuevo en este dispositivo y en
            cualquier otro.
          </DialogDescription>
        </DialogHeader>

        <form id={formId} action={formAction} className="space-y-4">
          <PasswordField
            label="Contraseña actual"
            name="currentPassword"
            autoComplete="current-password"
            required
            error={
              state.status === 'error' && state.kind === 'wrong_current' ? state.message : undefined
            }
          />
          <PasswordField
            label="Nueva contraseña"
            name="newPassword"
            autoComplete="new-password"
            required
            hint="Mínimo 12 caracteres."
            error={
              state.status === 'error' &&
              (state.kind === 'too_weak' ||
                state.kind === 'same_as_current' ||
                state.kind === 'too_long')
                ? state.message
                : undefined
            }
          />
          <PasswordField
            label="Confirmar nueva contraseña"
            name="confirmPassword"
            autoComplete="new-password"
            required
            error={
              state.status === 'error' && state.kind === 'validation' ? state.message : undefined
            }
          />

          {state.status === 'error' && state.kind === 'unknown' && (
            <p className="text-sm text-danger" role="alert">
              {state.message}
            </p>
          )}
        </form>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <SubmitButton formId={formId} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SubmitButton({ formId }: { formId: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" form={formId} disabled={pending}>
      {pending ? 'Cambiando…' : 'Cambiar contraseña'}
    </Button>
  );
}
