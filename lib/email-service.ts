// This is a mock email service for demonstration purposes
// In a real application, you would integrate with a real email service provider

export interface EmailOptions {
  to: string
  subject: string
  body: string
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // Log the email details for demonstration
  console.log("Sending email:", {
    to: options.to,
    subject: options.subject,
    body: options.body.substring(0, 100) + (options.body.length > 100 ? "..." : ""),
  })

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  // Simulate success (with a small chance of failure to test error handling)
  const success = Math.random() > 0.05

  if (!success) {
    console.error("Email sending failed (simulated failure)")
    return false
  }

  console.log("Email sent successfully (simulated)")
  return true
}

export function generatePasswordResetEmail(to: string, resetCode: string): EmailOptions {
  return {
    to,
    subject: "Reset Your OMNIA Password",
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Reset Your OMNIA Password</h2>
        <p>We received a request to reset your password. Use the code below to complete the process:</p>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; margin: 20px 0; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
          ${resetCode}
        </div>
        <p>If you didn't request a password reset, you can ignore this email.</p>
        <p>The code will expire in 30 minutes.</p>
        <p>Thank you,<br>The OMNIA Team</p>
      </div>
    `,
  }
}

export function generateWelcomeEmail(to: string, name: string): EmailOptions {
  return {
    to,
    subject: "Welcome to OMNIA!",
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to OMNIA, ${name}!</h2>
        <p>Thank you for joining our community! We're excited to have you onboard.</p>
        <p>Here are some things you can do to get started:</p>
        <ul>
          <li>Complete your profile</li>
          <li>Explore training programs</li>
          <li>Connect with coaches</li>
          <li>Set your fitness goals</li>
        </ul>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <p>Best regards,<br>The OMNIA Team</p>
      </div>
    `,
  }
}
