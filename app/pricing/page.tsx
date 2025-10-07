import { SubscriptionTiers } from "@/components/subscription-tiers"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#1E1E1E] text-white">
      <Header />
      <main>
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-6">Pricing Plans</h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Choose the perfect plan for your fitness journey with OMNIA. From essential tools to unlimited
              possibilities, we have a tier designed for you.
            </p>
          </div>
        </div>
        <SubscriptionTiers />

        <section className="py-20 bg-[#252525]">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-[#1E1E1E] p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-3 text-[#FF7939]">Can I change my plan later?</h3>
                <p className="text-gray-300">
                  Yes, you can upgrade or downgrade your plan at any time. Changes will be applied at the start of your
                  next billing cycle.
                </p>
              </div>
              <div className="bg-[#1E1E1E] p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-3 text-[#FF7939]">Is there a free trial?</h3>
                <p className="text-gray-300">
                  We offer a 7-day free trial for all new users to experience the Omnia Essentia tier before committing.
                </p>
              </div>
              <div className="bg-[#1E1E1E] p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-3 text-[#FF7939]">What payment methods do you accept?</h3>
                <p className="text-gray-300">
                  We accept all major credit cards, PayPal, and Apple Pay. All transactions are secure and encrypted.
                </p>
              </div>
              <div className="bg-[#1E1E1E] p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-3 text-[#FF7939]">Can I cancel my subscription?</h3>
                <p className="text-gray-300">
                  You can cancel your subscription at any time. You'll continue to have access until the end of your
                  current billing period.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
