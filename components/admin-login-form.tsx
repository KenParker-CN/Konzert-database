
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {HoleBackground} from "@/components/animate-ui/components/backgrounds/hole";

const ADMIN_SECRET = 'parker-admin-2026'

export function AdminLoginForm({
                                 className,
                                 ...props
                               }: React.ComponentProps<"div">) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (code.trim() === ADMIN_SECRET) {
      document.cookie = 'admin_auth=true; path=/; max-age=86400'
      router.push('/admin/database')
    } else {
      setError('Invalid code')
    }
  }

  return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="overflow-hidden p-0">
          <CardContent className="grid p-0 md:grid-cols-2">
            <form onSubmit={handleSubmit} className="p-6 md:p-8">
              <FieldGroup>
                <div className="flex flex-col items-center gap-2 text-center">
                  <h1 className="text-2xl font-bold">Admin Access</h1>
                  <p className="text-balance text-muted-foreground">
                    Enter the secret code to continue
                  </p>
                </div>
                <Field>
                  <FieldLabel htmlFor="code">Secret Code</FieldLabel>
                  <Input
                      id="code"
                      type="password"
                      placeholder="Enter code…"
                      value={code}
                      onChange={e => { setCode(e.target.value); setError('') }}
                      required
                      autoFocus
                  />
                  {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
                </Field>
                <Field>
                  <Button type="submit" className="w-full">Enter</Button>
                </Field>
              </FieldGroup>
            </form>
            <div className="relative hidden bg-muted md:block">
              <HoleBackground className="absolute inset-0 flex items-center justify-center rounded-xl" />
            </div>
          </CardContent>
        </Card>
      </div>
  )
}