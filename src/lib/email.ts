import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const STUDIO_NAME = process.env.STUDIO_NAME || "PhotoCheck Studio";
const STUDIO_EMAIL = process.env.STUDIO_EMAIL || "onboarding@resend.dev";

interface BookingEmailData {
  customerName: string;
  customerEmail: string;
  date: string;
  startTime: string;
  endTime: string;
  numberOfPeople: number;
  notes?: string | null;
  bookingId: string;
}

export async function sendBookingConfirmation(data: BookingEmailData) {
  try {
    await resend.emails.send({
      from: `${STUDIO_NAME} <${STUDIO_EMAIL}>`,
      to: data.customerEmail,
      subject: `預約確認 - ${STUDIO_NAME}`,
      html: buildConfirmationEmail(data),
    });
    return true;
  } catch (error) {
    console.error("Failed to send confirmation email:", error);
    return false;
  }
}

function buildConfirmationEmail(data: BookingEmailData) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">

    <!-- Header -->
    <div style="background:#18181b;padding:32px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:600;">${STUDIO_NAME}</h1>
      <p style="color:#a1a1aa;margin:8px 0 0;font-size:14px;">場地租借預約確認</p>
    </div>

    <!-- Body -->
    <div style="padding:32px;">

      <!-- Greeting -->
      <p style="color:#18181b;font-size:16px;margin:0 0 8px;">
        ${data.customerName} 您好，
      </p>
      <p style="color:#18181b;font-size:15px;margin:0 0 24px;line-height:1.6;">
        感謝您的預約！以下是您的預約資訊，請確認內容是否正確。
      </p>

      <!-- Booking details -->
      <div style="background:#f4f4f5;border-radius:8px;padding:20px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;color:#71717a;font-size:14px;width:80px;">預約編號</td>
            <td style="padding:8px 0;color:#18181b;font-size:14px;font-weight:500;font-family:monospace;">${data.bookingId.slice(0, 8).toUpperCase()}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#71717a;font-size:14px;">日期</td>
            <td style="padding:8px 0;color:#18181b;font-size:14px;font-weight:500;">${data.date}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#71717a;font-size:14px;">時段</td>
            <td style="padding:8px 0;color:#18181b;font-size:14px;font-weight:500;">${data.startTime} - ${data.endTime}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#71717a;font-size:14px;">人數</td>
            <td style="padding:8px 0;color:#18181b;font-size:14px;font-weight:500;">${data.numberOfPeople} 人</td>
          </tr>
          ${data.notes ? `
          <tr>
            <td style="padding:8px 0;color:#71717a;font-size:14px;vertical-align:top;">備註</td>
            <td style="padding:8px 0;color:#18181b;font-size:14px;">${data.notes}</td>
          </tr>
          ` : ""}
        </table>
      </div>

      <!-- Notice -->
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="color:#92400e;font-size:13px;margin:0;font-weight:600;margin-bottom:8px;">注意事項</p>
        <ul style="color:#92400e;font-size:13px;margin:0;padding-left:18px;line-height:1.8;">
          <li>請於預約時段前 10 分鐘抵達現場</li>
          <li>如需取消或更改預約，請於 <strong>24 小時前</strong>提前通知我們</li>
          <li>未提前通知而缺席者，可能影響後續預約權益</li>
        </ul>
      </div>

      <!-- Contact -->
      <div style="border-top:1px solid #e4e4e7;padding-top:20px;">
        <p style="color:#71717a;font-size:13px;margin:0;line-height:1.8;">
          如有任何問題，請透過預約系統聯繫我們。<br>
          我們期待您的到來！
        </p>
      </div>

    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;border-top:1px solid #e4e4e7;padding:20px 32px;text-align:center;">
      <p style="color:#a1a1aa;font-size:12px;margin:0;">${STUDIO_NAME} &copy; ${new Date().getFullYear()}</p>
      <p style="color:#d4d4d8;font-size:11px;margin:6px 0 0;">此為系統自動發送的確認信，請勿直接回覆</p>
    </div>

  </div>
</body>
</html>`;
}
