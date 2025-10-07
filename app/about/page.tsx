import Link from "next/link"
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8 text-[#FF6B35]">OMNIA</h1>
          <p className="text-xl text-center mb-16">
            Transforming fitness journeys through personalized coaching and cutting-edge technology.
          </p>

          <div className="grid md:grid-cols-3 gap-12 mb-16">
            {/* Quick Links */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-[#FF6B35]">Quick Links</h2>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="text-gray-300 hover:text-white transition">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/features" className="text-gray-300 hover:text-white transition">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-gray-300 hover:text-white transition">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-gray-300 hover:text-white transition">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-[#FF6B35]">Legal</h2>
              <ul className="space-y-2">
                <li>
                  <Link href="/terms" className="text-gray-300 hover:text-white transition">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-gray-300 hover:text-white transition">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="text-gray-300 hover:text-white transition">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>

            {/* Connect */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-[#FF6B35]">Connect</h2>
              <div className="flex space-x-4">
                <Link href="https://facebook.com" className="text-gray-300 hover:text-white transition">
                  <Facebook className="h-6 w-6" />
                  <span className="sr-only">Facebook</span>
                </Link>
                <Link href="https://twitter.com" className="text-gray-300 hover:text-white transition">
                  <Twitter className="h-6 w-6" />
                  <span className="sr-only">Twitter</span>
                </Link>
                <Link href="https://instagram.com" className="text-gray-300 hover:text-white transition">
                  <Instagram className="h-6 w-6" />
                  <span className="sr-only">Instagram</span>
                </Link>
                <Link href="https://linkedin.com" className="text-gray-300 hover:text-white transition">
                  <Linkedin className="h-6 w-6" />
                  <span className="sr-only">LinkedIn</span>
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-gray-500">
            <p>&copy; {new Date().getFullYear()} OMNIA. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
