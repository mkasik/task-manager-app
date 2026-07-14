/**
 * Mock mail transport — logs a formatted "email" to the console instead of
 * sending through real SMTP. No credentials required to run this project.
 *
 * Swapping in a real provider later is a one-function change: replace the body
 * of sendMail() with a Nodemailer transporter call (SMTP, SendGrid, etc.) —
 * every call site in the app already passes the {to, subject, body} shape
 * a real transport needs.
 */
function sendMail({ to, subject, body }) {
    console.log(
        `\n📧 [MOCK EMAIL]\n  To:      ${to}\n  Subject: ${subject}\n  Body:    ${body}\n`
    );
    return Promise.resolve({ mocked: true });
}

module.exports = { sendMail };
