"use client"

import Link from "next/link"
import { ArrowLeft, Inbox, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatDate, isOverdue } from "@/lib/domain"
import type { PaymentPeriod, TenantPayment } from "@/lib/types"

export function PageHeader({ title, description, actionHref, actionLabel }: { title: string; description?: React.ReactNode; actionHref?: string; actionLabel?: string }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>{description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}</div>
      {actionHref && actionLabel && <Link href={actionHref}><Button className="w-full sm:w-auto"><Plus className="size-4" />{actionLabel}</Button></Link>}
    </div>
  )
}

export function BackLink({ href, children = "Back" }: { href: string; children?: React.ReactNode }) {
  return <Link href={href} className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />{children}</Link>
}

export function EmptyState({ title, description, actionHref, actionLabel }: { title: string; description: string; actionHref?: string; actionLabel?: string }) {
  return <Card><CardContent className="flex min-h-56 flex-col items-center justify-center text-center"><div className="mb-3 rounded-full bg-muted p-3"><Inbox className="size-5 text-muted-foreground" /></div><h2 className="font-semibold text-foreground">{title}</h2><p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>{actionHref && actionLabel && <Link href={actionHref} className="mt-4"><Button>{actionLabel}</Button></Link>}</CardContent></Card>
}

export function StatCard({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return <Card><CardContent><p className="text-sm font-medium text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{value}</p>{detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}</CardContent></Card>
}

export function PaymentBadge({ payment, period }: { payment: TenantPayment; period?: PaymentPeriod }) {
  const overdue = isOverdue(payment, period)
  return <Badge tone={overdue ? "overdue" : payment.status}>{overdue ? "Overdue" : payment.status === "pending" ? "Pending confirmation" : payment.status}</Badge>
}

export function DateRange({ start, end }: { start: string; end: string }) {
  return <span>{formatDate(start)} – {formatDate(end)}</span>
}

export function DetailItem({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><dt className="text-xs font-medium uppercase tracking-wide text-subtle-foreground">{label}</dt><dd className="mt-1 text-sm font-medium text-foreground">{children}</dd></div>
}

export function NotFoundState({ noun, href }: { noun: string; href: string }) {
  return <div><BackLink href={href} /><EmptyState title={`${noun} not found`} description={`This ${noun.toLowerCase()} is not available.`} /></div>
}
