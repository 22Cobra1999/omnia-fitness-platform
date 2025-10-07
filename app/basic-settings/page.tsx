import Link from "next/link"

export default function BasicSettingsPage() {
  return (
    <div className="min-h-screen pt-20 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        <div className="space-y-6">
          <section>
            <h2 className="text-lg font-semibold mb-3">🔐 Account</h2>
            <div className="space-y-2">
              <p>Change email or password</p>
              <p>Connected accounts (Instagram, WhatsApp, etc.)</p>
              <p>Notification preferences</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">🧾 Subscriptions</h2>
            <div className="space-y-2">
              <p>View & manage active subscriptions</p>
              <p>Payment history</p>
              <p>Payment method</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">🌗 Personalization</h2>
            <div className="space-y-2">
              <p>Dark / Light mode</p>
              <p>Language preferences</p>
              <p>Default content filters</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">☎️ Support</h2>
            <div className="space-y-2">
              <p>Send feedback</p>
              <p>Report a bug</p>
              <p>Help Center / FAQ</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">🚪 Session</h2>
            <div className="space-y-2">
              <button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Log out</button>
            </div>
          </section>
        </div>

        <div className="mt-8">
          <Link href="/" className="text-blue-500 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
