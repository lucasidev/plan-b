/**
 * Helpers para interactuar con Mailpit desde los specs E2E.
 *
 * Mailpit es nuestro SMTP catcher local + en CI (ADR-0024). El backend
 * envía emails reales (verification, password reset, etc.); los specs
 * los leen vía la API HTTP de Mailpit en :8025.
 *
 * Convención: cada test que dispare un mail llama `clearAllMessages()`
 * al inicio para no leer mails de tests anteriores.
 */

const MAILPIT_BASE = process.env.MAILPIT_URL ?? 'http://localhost:8025';

interface MessageSummary {
  ID: string;
  From: { Address: string; Name: string };
  To: Array<{ Address: string; Name: string }>;
  Subject: string;
  Created: string;
}

interface MessageDetail extends MessageSummary {
  HTML: string;
  Text: string;
}

interface MessagesResponse {
  messages: MessageSummary[];
  total: number;
}

/**
 * Lista los mensajes en Mailpit. Por default los más recientes primero.
 */
export async function listMessages(limit = 50): Promise<MessageSummary[]> {
  const r = await fetch(`${MAILPIT_BASE}/api/v1/messages?limit=${limit}`);
  if (!r.ok) throw new Error(`Mailpit list failed: ${r.status}`);
  const data = (await r.json()) as MessagesResponse;
  return data.messages;
}

/**
 * Devuelve el mensaje más reciente cuyo destinatario matchee `recipient`.
 * Polea cada 200ms hasta encontrar uno (o timeout). Útil para esperar
 * que el backend mande el mail después de un POST.
 */
export async function waitForMail(recipient: string, timeoutMs = 5000): Promise<MessageDetail> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const list = await listMessages(20);
    const match = list.find((m) => m.To.some((t) => t.Address === recipient));
    if (match) return getMessage(match.ID);
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Mailpit: no message to ${recipient} within ${timeoutMs}ms`);
}

/**
 * Lee el cuerpo completo (HTML + Text) de un mensaje por ID.
 */
export async function getMessage(id: string): Promise<MessageDetail> {
  const r = await fetch(`${MAILPIT_BASE}/api/v1/message/${id}`);
  if (!r.ok) throw new Error(`Mailpit get ${id} failed: ${r.status}`);
  return (await r.json()) as MessageDetail;
}

/**
 * Extrae el primer ?token=... del HTML del último mail enviado a `recipient`.
 * Conveniencia para los flows verify-email + password-reset.
 */
export async function extractTokenFromLatestMail(recipient: string): Promise<string> {
  const msg = await waitForMail(recipient);
  const match = msg.HTML.match(/[?&]token=([A-Za-z0-9_-]+)/);
  if (!match) {
    throw new Error(`No ?token= found in mail "${msg.Subject}" for ${recipient}`);
  }
  return match[1];
}

/**
 * Borra todos los mensajes en Mailpit. Llamar al setup de cada test que
 * dispare un mail, para no leer residuos de tests previos.
 */
export async function clearAllMessages(): Promise<void> {
  const r = await fetch(`${MAILPIT_BASE}/api/v1/messages`, { method: 'DELETE' });
  if (!r.ok) throw new Error(`Mailpit clear failed: ${r.status}`);
}
