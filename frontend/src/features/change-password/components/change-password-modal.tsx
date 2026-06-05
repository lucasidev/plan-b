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
 * Modal de cambio de contraseña (US-079-i, slice frontend del integrated). Triggereado desde
 * la sección Seguridad de /settings (US-072). Tres campos: contraseña actual + nueva +
 * confirmación. Pre-validación cliente con Zod (mismatch, longitud, mismo valor); errores
 * específicos del backend (wrong current, same as current, too weak, too long) se ruteán a
 * inline errors en el campo correspondiente.
 *
 * <para>
 * Success no devuelve un estado al modal: el server action limpia las cookies de sesión y
 * redirige a <c>/sign-in?password-changed=1</c> (el backend revocó los refresh tokens, por
 * lo que el user tiene que re-loguearse en cada device).
 * </para>
 */
export function ChangePasswordModal({ open, onOpenChange }: Props) {
  const formId = useId();
  const [state, formAction] = useActionState(changePasswordAction, initialChangePasswordState);

  // Cuando el modal cierra (cancel o overlay click), resetear errores del próximo open.
  // useActionState no expone un reset así que el state vive en el componente; al re-open
  // queda el último error visible hasta que el user toque algo. Aceptable trade-off.

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
