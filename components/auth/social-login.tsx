"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"

interface SocialLoginProps {
  userType?: "client" | "coach"
}

export function SocialLogin({ userType = "client" }: SocialLoginProps) {
  const router = useRouter()
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isGithubLoading, setIsGithubLoading] = useState(false)

  async function onGoogleLogin() {
    setIsGoogleLoading(true)

    try {
      // Simulate Google login
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Redirect based on user type
      if (userType === "coach") {
        router.push("/coach")
      } else {
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Google login error:", error)
    } finally {
      setIsGoogleLoading(false)
    }
  }

  async function onGithubLogin() {
    setIsGithubLoading(true)

    try {
      // Simulate GitHub login
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Redirect based on user type
      if (userType === "coach") {
        router.push("/coach")
      } else {
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("GitHub login error:", error)
    } finally {
      setIsGithubLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <Button variant="outline" type="button" disabled={isGoogleLoading} onClick={onGoogleLogin} className="w-full">
        {isGoogleLoading ? (
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <svg
            className="mr-2 h-4 w-4"
            aria-hidden="true"
            focusable="false"
            data-prefix="fab"
            data-icon="google"
            role="img"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 488 512"
          >
            <path
              fill="currentColor"
              d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
            ></path>
          </svg>
        )}
        Google
      </Button>
      <Button variant="outline" type="button" disabled={isGithubLoading} onClick={onGithubLogin} className="w-full">
        {isGithubLoading ? (
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Icons.gitHub className="mr-2 h-4 w-4" />
        )}
        GitHub
      </Button>
    </div>
  )
}
