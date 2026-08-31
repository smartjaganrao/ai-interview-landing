import twilio from 'twilio';

let client: ReturnType<typeof twilio> | null = null;

function getClient(): ReturnType<typeof twilio> | null {
  if (client) return client;

  // API Key auth (recommended by Twilio for production): needs the key/secret
  // pair PLUS the main Account SID — the key SID alone can't authenticate.
  const apiKeySid = process.env.TWILIO_API_KEY_SID;
  const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  if (apiKeySid && apiKeySecret && accountSid) {
    client = twilio(apiKeySid, apiKeySecret, { accountSid });
    return client;
  }

  // Account SID + Auth Token (simpler, fine for a single-server setup like this one).
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (accountSid && authToken) {
    client = twilio(accountSid, authToken);
    return client;
  }

  return null;
}

function toWhatsAppAddress(rawNumber: string): string {
  return rawNumber.startsWith('whatsapp:') ? rawNumber : `whatsapp:${rawNumber}`;
}

/**
 * Free-form send — only valid within 24hrs of the recipient's last inbound
 * message (e.g. right after they've joined a Twilio WhatsApp Sandbox). Not
 * used by any production notification path; exists for manual testing via
 * scripts/test-whatsapp.mjs before a Meta-approved template exists.
 */
export async function sendWhatsAppFreeform(params: {
  to: string;
  body: string;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const from = process.env.TWILIO_WHATSAPP_FROM;
  const c = getClient();
  if (!c || !from) return { ok: false, error: 'WhatsApp not configured' };

  try {
    const message = await c.messages.create({
      from: toWhatsAppAddress(from),
      to: toWhatsAppAddress(params.to),
      body: params.body,
    });
    return { ok: true, id: message.sid };
  } catch (error) {
    console.error('[whatsapp] send failed:', error);
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
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
