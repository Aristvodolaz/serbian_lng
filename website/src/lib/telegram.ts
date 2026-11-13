// Sends a waitlist sign-up to a Telegram chat. Token and chat id come only from
// environment variables (set in the hosting settings, never in code).

const TIMEOUT_MS = 5000;

// Returns true when the message was accepted. In development without
// configuration the sign-up is only logged, so the form can be tested locally.
export async function notifyWaitlist(email: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    if (process.env.NODE_ENV !== 'production') {
      console.info('[waitlist] Telegram не настроен: заявка принята только для проверки');
      return true;
    }
    console.error('[waitlist] не заданы TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID');
    return false;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `Новая заявка на ранний доступ REČ:\n${email}`,
        disable_web_page_preview: true,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    // Log the status only: the error body and the URL (which holds the token) stay out of logs.
    if (!res.ok) console.error(`[waitlist] Telegram ответил ${res.status}`);
    return res.ok;
  } catch {
    console.error('[waitlist] Telegram недоступен');
    return false;
  }
}
