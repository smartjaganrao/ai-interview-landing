import twilio from 'twilio';

let client: ReturnType<typeof twilio> | null = null;

function getClient(): ReturnType<typeof twilio> | null {
  if (client) return client;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  client = twilio(sid, token);
  return client;
}

function toWhatsAppAddress(rawNumber: string): string {
  return rawNumber.startsWith('whatsapp:') ? rawNumber : `whatsapp:${rawNumber}`;
}

/**
 * Sends a Meta-approved WhatsApp Content Template (required outside the
 * 24hr session window — see twilio-whatsapp-send-message skill). Free-form
 * `body` messages silently fail to unopened conversations, so template
 * sends are the only reliable option for business-initiated messages
 * like a registration welcome.
 */
export async function sendWhatsAppTemplate(params: {
  to: string;
  contentSid: string;
  contentVariables?: Record<string, string>;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const from = process.env.TWILIO_WHATSAPP_FROM;
  const c = getClient();
  if (!c || !from) return { ok: false, error: 'WhatsApp not configured' };
  if (!params.contentSid) return { ok: false, error: 'Missing contentSid' };

  try {
    const message = await c.messages.create({
      from: toWhatsAppAddress(from),
      to: toWhatsAppAddress(params.to),
      contentSid: params.contentSid,
      ...(params.contentVariables ? { contentVariables: JSON.stringify(params.contentVariables) } : {}),
    });
    return { ok: true, id: message.sid };
  } catch (error) {
    console.error('[whatsapp] send failed:', error);
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
