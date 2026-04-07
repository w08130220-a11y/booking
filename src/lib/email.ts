const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const STUDIO_NAME = (process.env.STUDIO_NAME || "Bubu Studio").replace(/[\r\n]/g, "").trim();
const STUDIO_EMAIL = (process.env.STUDIO_EMAIL || "onboarding@resend.dev").replace(/[\r\n]/g, "").trim();
const ADMIN_NOTIFICATION_EMAIL = "yangiofficial3@gmail.com";

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${STUDIO_NAME} <${STUDIO_EMAIL}>`,
      to: [to],
      subject,
      html,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Resend API error: ${JSON.stringify(data)}`);
  }
  return data;
}

interface BookingEmailData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  numberOfPeople: number;
  shootType: string;
  totalPrice: number;
  notes?: string | null;
  bookingId: string;
}

export async function sendBookingConfirmation(data: BookingEmailData) {
  let customerSent = false;
  let adminSent = false;

  // 1. Send confirmation to customer
  const customerEmail = String(data.customerEmail).trim();
  console.log("CUSTOMER_EMAIL_RAW:", JSON.stringify(data.customerEmail), "TRIMMED:", JSON.stringify(customerEmail));
  try {
    const confirmHtml = buildConfirmationEmail(data);
    console.log("Template built OK, length:", confirmHtml.length);
    const result = await sendEmail(customerEmail, "預約確認 - " + STUDIO_NAME, confirmHtml);
    customerSent = true;
    console.log("Customer email SENT:", JSON.stringify(result));
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message + " " + error.stack : String(error);
    console.error("CUSTOMER_EMAIL_FAIL:", msg);
  }

  // 2. Send notification to admin
  try {
    const adminHtml = buildAdminNotificationEmail(data);
    await sendEmail(ADMIN_NOTIFICATION_EMAIL, `新預約通知 - ${data.customerName} ${data.date}`, adminHtml);
    adminSent = true;
  } catch (error: unknown) {
    console.error("ADMIN EMAIL FAILED:", error instanceof Error ? error.message : String(error));
  }

  return customerSent || adminSent;
}

function buildConfirmationEmail(data: BookingEmailData) {
  const shootLabel = data.shootType === "dynamic" ? "動態拍攝" : "平面拍攝";
  const priceStr = `NT$ ${String(data.totalPrice)}`;
  const bookingRef = data.bookingId.slice(0, 8).toUpperCase();
  const year = new Date().getFullYear();
  const hasPrice = data.totalPrice > 0;
  const hasNotes = !!data.notes;

  const priceRow = hasPrice ? `<tr><td style="padding:8px 0;color:#71717a;font-size:14px;">金額</td><td style="padding:8px 0;color:#059669;font-size:16px;font-weight:700;">${priceStr}</td></tr>` : "";
  const notesRow = hasNotes ? `<tr><td style="padding:8px 0;color:#71717a;font-size:14px;vertical-align:top;">備註</td><td style="padding:8px 0;color:#18181b;font-size:14px;">${data.notes}</td></tr>` : "";

  const paymentSection = hasPrice ? `
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="color:#92400e;font-size:14px;margin:0;font-weight:600;margin-bottom:12px;">匯款資訊</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:4px 0;color:#92400e;font-size:13px;">銀行</td><td style="padding:4px 0;color:#92400e;font-size:13px;font-weight:600;">國泰世華銀行 013</td></tr>
          <tr><td style="padding:4px 0;color:#92400e;font-size:13px;">帳號</td><td style="padding:4px 0;color:#92400e;font-size:13px;font-weight:600;">131-506-066-112</td></tr>
          <tr><td style="padding:4px 0;color:#92400e;font-size:13px;">金額</td><td style="padding:4px 0;color:#92400e;font-size:13px;font-weight:600;">${priceStr}</td></tr>
        </table>
        <p style="color:#92400e;font-size:12px;margin:12px 0 0;line-height:1.6;">
          轉帳完成後請將末五碼寄至 bubu2026studio@gmail.com<br>
          信件主旨請填寫: 預約編號 ${bookingRef} 末五碼
        </p>
      </div>` : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
    <div style="background:#18181b;padding:32px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:600;">${STUDIO_NAME}</h1>
      <p style="color:#a1a1aa;margin:8px 0 0;font-size:14px;">場地租借預約確認</p>
    </div>
    <div style="padding:32px;">
      <p style="color:#18181b;font-size:16px;margin:0 0 8px;">${data.customerName} 您好，</p>
      <p style="color:#18181b;font-size:15px;margin:0 0 24px;line-height:1.6;">感謝您的預約！以下是您的預約資訊，請確認內容是否正確。</p>
      <div style="background:#f4f4f5;border-radius:8px;padding:20px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#71717a;font-size:14px;width:80px;">預約編號</td><td style="padding:8px 0;color:#18181b;font-size:14px;font-weight:500;font-family:monospace;">${bookingRef}</td></tr>
          <tr><td style="padding:8px 0;color:#71717a;font-size:14px;">日期</td><td style="padding:8px 0;color:#18181b;font-size:14px;font-weight:500;">${data.date}</td></tr>
          <tr><td style="padding:8px 0;color:#71717a;font-size:14px;">時段</td><td style="padding:8px 0;color:#18181b;font-size:14px;font-weight:500;">${data.startTime} - ${data.endTime}</td></tr>
          <tr><td style="padding:8px 0;color:#71717a;font-size:14px;">類型</td><td style="padding:8px 0;color:#18181b;font-size:14px;font-weight:500;">${shootLabel}</td></tr>
          <tr><td style="padding:8px 0;color:#71717a;font-size:14px;">人數</td><td style="padding:8px 0;color:#18181b;font-size:14px;font-weight:500;">${data.numberOfPeople} 人</td></tr>
          ${priceRow}
          ${notesRow}
        </table>
      </div>

      ${paymentSection}

      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="color:#92400e;font-size:13px;margin:0;font-weight:600;margin-bottom:8px;">注意事項</p>
        <ul style="color:#92400e;font-size:13px;margin:0;padding-left:18px;line-height:1.8;">
          <li>請於預約時段前 10 分鐘抵達現場</li>
          <li>如需取消或更改預約，請於 <strong>24 小時前</strong>提前通知我們</li>
          <li>未提前通知而缺席者，可能影響後續預約權益</li>
        </ul>
      </div>

      <div style="border-top:1px solid #e4e4e7;padding-top:20px;">
        <p style="color:#71717a;font-size:13px;margin:0;line-height:1.8;">如有任何問題，請聯繫我們。<br>我們期待您的到來！</p>
      </div>
    </div>
    <div style="background:#f9fafb;border-top:1px solid #e4e4e7;padding:20px 32px;text-align:center;">
      <p style="color:#a1a1aa;font-size:12px;margin:0;">${STUDIO_NAME} ${year}</p>
      <p style="color:#d4d4d8;font-size:11px;margin:6px 0 0;">此為系統自動發送的確認信，請勿直接回覆</p>
    </div>
  </div>
</body>
</html>`;
}

function buildAdminNotificationEmail(data: BookingEmailData) {
  const shootLabel = data.shootType === "dynamic" ? "🎬 動態拍攝" : "📷 平面拍攝";
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
    <div style="background:#2563eb;padding:24px 32px;">
      <h1 style="color:#fff;margin:0;font-size:18px;">📋 新預約通知</h1>
    </div>
    <div style="padding:24px 32px;">
      <p style="color:#18181b;font-size:15px;margin:0 0 16px;">有一筆新的預約：</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#71717a;font-size:14px;width:80px;">預約編號</td><td style="padding:6px 0;color:#18181b;font-size:14px;font-weight:500;font-family:monospace;">${data.bookingId.slice(0, 8).toUpperCase()}</td></tr>
        <tr><td style="padding:6px 0;color:#71717a;font-size:14px;">客戶</td><td style="padding:6px 0;color:#18181b;font-size:14px;font-weight:500;">${data.customerName}</td></tr>
        <tr><td style="padding:6px 0;color:#71717a;font-size:14px;">手機</td><td style="padding:6px 0;color:#18181b;font-size:14px;">${data.customerPhone}</td></tr>
        <tr><td style="padding:6px 0;color:#71717a;font-size:14px;">Email</td><td style="padding:6px 0;color:#18181b;font-size:14px;">${data.customerEmail}</td></tr>
        <tr><td style="padding:6px 0;color:#71717a;font-size:14px;">日期</td><td style="padding:6px 0;color:#18181b;font-size:14px;font-weight:500;">${data.date}</td></tr>
        <tr><td style="padding:6px 0;color:#71717a;font-size:14px;">時段</td><td style="padding:6px 0;color:#18181b;font-size:14px;font-weight:500;">${data.startTime} - ${data.endTime}</td></tr>
        <tr><td style="padding:6px 0;color:#71717a;font-size:14px;">類型</td><td style="padding:6px 0;color:#18181b;font-size:14px;font-weight:500;">${shootLabel}</td></tr>
        <tr><td style="padding:6px 0;color:#71717a;font-size:14px;">人數</td><td style="padding:6px 0;color:#18181b;font-size:14px;">${data.numberOfPeople} 人</td></tr>
        ${data.totalPrice > 0 ? `<tr><td style="padding:6px 0;color:#71717a;font-size:14px;">金額</td><td style="padding:6px 0;color:#059669;font-size:16px;font-weight:700;">NT$ ${data.totalPrice.toLocaleString()}</td></tr>` : ""}
        ${data.notes ? `<tr><td style="padding:6px 0;color:#71717a;font-size:14px;">備註</td><td style="padding:6px 0;color:#18181b;font-size:14px;">${data.notes}</td></tr>` : ""}
      </table>
    </div>
  </div>
</body>
</html>`;
}
