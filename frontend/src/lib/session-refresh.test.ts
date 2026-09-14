// @vitest-environment node
//
// jose hace `instanceof Uint8Array` sobre la key al firmar y verificar; en jsdom (el
// entorno default del proyecto) ese chequeo cruza de realm y siempre da falso, aunque el
// valor sea estructuralmente un Uint8Array. Este modulo no toca el DOM, asi que corre en
// node sin perder nada.
import { SignJWT } from 'jose';
import { describe, expect, it, vi } from 'vitest';
import {
  decideRefresh,
  mergeCookieHeader,
  nameAndValueOf,
  refreshSessionOnce,
} from './session-refresh';

const SECRET = 'a-test-secret-that-is-at-least-32-bytes-long';
const OTHER_SECRET = 'a-different-test-secret-also-32-bytes-long';
const ISSUER = 'planb-test';
const AUDIENCE = 'planb-test';

// Fecha fija: si el token firma su `iat` con el reloj real, un `now` de test en el pasado
// haria que jose rechace el token por "emitido en el futuro" cuando corra en una fecha real
// posterior. Firmando `iat` relativo a este mismo `now` el test queda independiente del
// reloj de la maquina que lo corre.
const NOW = new Date('2026-01-01T00:00:00.000Z');
const NOW_SECONDS = Math.floor(NOW.getTime() / 1000);

async function signToken(expiresInSeconds: number, secret = SECRET) {
  return new SignJWT({ sub: 'user-1' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(NOW_SECONDS - 3600)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(NOW_SECONDS + expiresInSeconds)
    .sign(new TextEncoder().encode(secret));
}

describe('decideRefresh', () => {
  it('sin cookie de refresh: skip, aunque falte el access token', async () => {
    const result = await decideRefresh({
      accessToken: undefined,
      hasRefresh: false,
      now: NOW,
      secret: SECRET,
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    expect(result).toBe('skip');
  });

  it('token vigente, lejos del vencimiento: skip', async () => {
    const accessToken = await signToken(15 * 60);
    const result = await decideRefresh({
      accessToken,
      hasRefresh: true,
      now: NOW,
      secret: SECRET,
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    expect(result).toBe('skip');
  });

  it('token que vence en 60 segundos, bajo el umbral de 120: refresh', async () => {
    const accessToken = await signToken(60);
    const result = await decideRefresh({
      accessToken,
      hasRefresh: true,
      now: NOW,
      secret: SECRET,
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    expect(result).toBe('refresh');
  });

  it('token ya vencido: refresh', async () => {
    const accessToken = await signToken(-60);
    const result = await decideRefresh({
      accessToken,
      hasRefresh: true,
      now: NOW,
      secret: SECRET,
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    expect(result).toBe('refresh');
  });

  it('sin access token, con refresh: refresh', async () => {
    const result = await decideRefresh({
      accessToken: undefined,
      hasRefresh: true,
      now: NOW,
      secret: SECRET,
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    expect(result).toBe('refresh');
  });

  it('token firmado con otra clave: refresh', async () => {
    const accessToken = await signToken(15 * 60, OTHER_SECRET);
    const result = await decideRefresh({
      accessToken,
      hasRefresh: true,
      now: NOW,
      secret: SECRET,
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    expect(result).toBe('refresh');
  });
});

describe('mergeCookieHeader', () => {
  it('reemplaza el valor de un nombre existente, en su misma posicion', () => {
    const result = mergeCookieHeader('a=1; b=2; c=3', { b: 'nuevo' });
    expect(result).toBe('a=1; b=nuevo; c=3');
  });

  it('agrega un nombre que no estaba, al final', () => {
    const result = mergeCookieHeader('a=1', { z: '9' });
    expect(result).toBe('a=1; z=9');
  });

  it('nunca duplica un nombre', () => {
    const result = mergeCookieHeader('planb_session=viejo; other=x', {
      planb_session: 'nuevo',
      planb_refresh: 'r1',
    });
    expect(result.match(/planb_session=/g)).toHaveLength(1);
    expect(result).toBe('planb_session=nuevo; other=x; planb_refresh=r1');
  });

  it('sin header existente, arranca de las updates', () => {
    const result = mergeCookieHeader(null, { a: '1' });
    expect(result).toBe('a=1');
  });
});

describe('nameAndValueOf', () => {
  it('extrae el par de un Set-Cookie con atributos', () => {
    expect(nameAndValueOf('planb_session=abc123; Path=/; HttpOnly; Secure; SameSite=Lax')).toEqual({
      name: 'planb_session',
      value: 'abc123',
    });
  });

  it('extrae el par sin atributos', () => {
    expect(nameAndValueOf('a=1')).toEqual({ name: 'a', value: '1' });
  });

  it('null si no tiene forma name=value', () => {
    expect(nameAndValueOf('sin-igual')).toBeNull();
  });
});

describe('refreshSessionOnce', () => {
  it('dos pedidos simultáneos con el mismo token comparten una sola llamada', async () => {
    let release: ((response: Response) => void) | undefined;
    let calls = 0;
    const request = () => {
      calls += 1;
      return new Promise<Response>((resolve) => {
        release = resolve;
      });
    };

    const first = refreshSessionOnce('same-token', request);
    const second = refreshSessionOnce('same-token', request);

    expect(calls).toBe(1);
    const response = new Response(null, { status: 200 });
    release?.(response);
    await expect(Promise.all([first, second])).resolves.toEqual([response, response]);
  });

  it('al terminar permite un refresh posterior del mismo token', async () => {
    const request = vi.fn(async () => new Response(null, { status: 200 }));

    await refreshSessionOnce('reusable-key', request);
    await refreshSessionOnce('reusable-key', request);

    expect(request).toHaveBeenCalledTimes(2);
  });

  it('una falla libera el token para volver a intentar', async () => {
    const request = vi
      .fn<() => Promise<Response>>()
      .mockRejectedValueOnce(new Error('backend unavailable'))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));

    await expect(refreshSessionOnce('failed-token', request)).rejects.toThrow(
      'backend unavailable',
    );
    await expect(refreshSessionOnce('failed-token', request)).resolves.toHaveProperty(
      'status',
      200,
    );
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('tokens distintos no se bloquean entre sí', async () => {
    const request = vi.fn(async () => new Response(null, { status: 200 }));

    await Promise.all([
      refreshSessionOnce('token-a', request),
      refreshSessionOnce('token-b', request),
    ]);

    expect(request).toHaveBeenCalledTimes(2);
  });
});
