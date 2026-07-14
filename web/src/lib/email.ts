export async function sendEmail({ to, subject, html }: { to: string, subject: string, html: string }) {
  // SIMULATED EMAIL LOGGER
  // Since we don't have active Resend/SendGrid credentials yet, we will just log the email to the console.
  // When ready for production, you can swap this out with nodemailer or the Resend SDK.

  console.log("\n========================================================");
  console.log(`📧 SIMULATED EMAIL SENT TO: ${to}`);
  console.log(`📝 SUBJECT: ${subject}`);
  console.log("----------------------- CONTENT ------------------------");
  console.log(html.replace(/<[^>]*>?/gm, '')); // Strip HTML tags for cleaner console output
  console.log("========================================================\n");

  return { success: true };
}
