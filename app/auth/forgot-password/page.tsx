"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from '@/components/shared/ui/icons'
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isResetComplete, setIsResetComplete] = useState(false)
  const router = useRouter()

  async function handleEmailSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Simple validation
      if (!email) {
        throw new Error("Please enter your email address")
      }

      if (!email.includes("@")) {
        throw new Error("Please enter a valid email address")
      }

      // Simulate sending recovery email
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Generate a mock recovery code (in a real app, this would be sent via email)
      const mockCode = Math.floor(100000 + Math.random() * 900000).toString()
      setRecoveryCode(mockCode)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  async function handlePasswordReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Simple validation
      if (!newPassword) {
        throw new Error("Please enter a new password")
      }

      if (newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters")
      }

      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match")
      }

      // Simulate password reset
      await new Promise((resolve) => setTimeout(resolve, 800))

      setIsResetComplete(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px] p-6 bg-card rounded-lg shadow-lg border border-border/30">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Reset Password</h1>
        {!recoveryCode && !isResetComplete && (
          <p className="text-sm text-muted-foreground">Enter your email address and we'll send you a recovery code</p>
        )}
        {recoveryCode && !isResetComplete && <p className="text-sm text-muted-foreground">Enter your new password</p>}
      </div>

      {isResetComplete ? (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative" role="alert">
          <p className="font-medium">Password reset successful!</p>
          <p className="text-sm">Your password has been updated. You can now log in with your new password.</p>
          <div className="mt-4">
            <Button onClick={() => router.push("/auth/login")} className="w-full">
              Go to Login
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {!recoveryCode ? (
            <form onSubmit={handleEmailSubmit}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    placeholder="name@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
                    disabled={isLoading}
                    required
                  />
                </div>
                <Button disabled={isLoading} type="submit" className="w-full">
                  {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                  Send Recovery Code
                </Button>
              </div>
            </form>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded relative" role="alert">
                <p className="font-medium">Recovery code sent!</p>
                <p className="text-sm">We've sent a recovery code to {email}</p>
                <div className="mt-2 p-2 bg-blue-100 rounded font-mono text-center">
                  <span className="tracking-wider text-lg">{recoveryCode}</span>
                </div>
                <p className="text-xs mt-2">
                  In a real application, this code would be sent via email. For this demo, you can use the code shown
                  above.
                </p>
              </div>

              <form onSubmit={handlePasswordReset}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="verification-code">Recovery Code</Label>
                    <Input
                      id="verification-code"
                      name="verification-code"
                      placeholder="Enter the 6-digit code"
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      name="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      name="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <Button disabled={isLoading} type="submit" className="w-full">
                    {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                    Reset Password
                  </Button>
                </div>
              </form>
            </>
          )}

          <div className="text-center text-sm">
            <Link href="/" className="font-medium text-primary underline-offset-4 hover:underline">
              Back to login
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
