// Gọi Telegram Bot API trực tiếp từ web (gửi tin thử, lấy tên bot). Worker dùng grammY.
// Token không bao giờ được log hay trả về trình duyệt.

const API = "https://api.telegram.org";

export async function telegramGetMe(token: string): Promise<{ username: string } | null> {
  try {
    const res = await fetch(`${API}/bot${token}/getMe`, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    const json = (await res.json()) as { ok: boolean; result?: { username: string } };
    return json.ok && json.result ? { username: json.result.username } : null;
  } catch {
    return null;
  }
}

export async function telegramSendMessage(token: string, chatId: string, html: string): Promise<boolean> {
  try {
    const res = await fetch(`${API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: html, parse_mode: "HTML", link_preview_options: { is_disabled: true } }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    return ((await res.json()) as { ok: boolean }).ok;
  } catch {
    return false;
  }
}

export function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Telegram từ chối nút URL trỏ tới localhost / IP nội bộ. */
export function isPublicUrl(url: string): boolean {
  try {
    const { hostname, protocol } = new URL(url);
    if (protocol !== "https:" && protocol !== "http:") return false;
    if (hostname === "localhost" || hostname.endsWith(".local")) return false;
    return !/^(\d+\.){3}\d+$/.test(hostname) && !hostname.includes(":");
  } catch {
    return false;
  }
}
