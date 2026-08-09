import { ArrowRightIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Logo } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Keel — a trust layer for data pipelines",
  description:
    "Keel scores every table, dashboard, and model in your pipeline 0–100, inherited from what it's built on — so you know the moment a number on screen stops being true.",
};

type Verdict = "good" | "warning" | "bad";

const verdictStyles: Record<Verdict, string> = {
  good: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  bad: "bg-destructive/10 text-destructive",
};

const verdictDot: Record<Verdict, string> = {
  good: "bg-success",
  warning: "bg-warning",
  bad: "bg-destructive",
};

function VerdictChip({
  score,
  label,
  verdict,
}: {
  score: number;
  label: string;
  verdict: Verdict;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-xs font-medium ${verdictStyles[verdict]}`}
    >
      <span
        className={`size-1.5 rounded-full ${verdictDot[verdict]}`}
        aria-hidden
      />
      {score} — {label}
    </span>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Nav */}
      <header className="border-b border-border">
        <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-6">
          <Logo className="text-2xl" />
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className={buttonVariants({
                variant: "ghost",
                className: "h-10 px-4 text-base",
              })}
            >
              Sign in
            </Link>
            <Link
              href="/join"
              className={buttonVariants({ className: "h-10 px-5 text-base" })}
            >
              Join now
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex flex-col">
        {/* Hero */}
        <section className="mx-auto w-full max-w-6xl px-6 pt-20 pb-16 md:pt-28 md:pb-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-mono text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Keel — a trust layer for data pipelines
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-balance md:text-5xl">
              Good decisions need data you can actually trust right now.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground text-balance">
              Not data that looked fine an hour ago. Keel scores every asset
              in your pipeline live, inherited from whatever it&apos;s built
              on, so you always know whether the number in front of you is
              still safe to act on — and if it isn&apos;t, exactly where the
              problem started.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link
                href="/join"
                className={buttonVariants({
                  className: "h-11 px-6 text-base md:h-12 md:px-7 md:text-lg",
                })}
              >
                Join now
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
              <Link
                href="/login"
                className={buttonVariants({
                  variant: "outline",
                  className: "h-11 px-6 text-base md:h-12 md:px-7 md:text-lg",
                })}
              >
                Sign in
              </Link>
            </div>
          </div>

          <div className="mx-auto mt-16 max-w-4xl overflow-hidden rounded-xl border border-border shadow-sm">
            <Image
              src="/sell.png"
              alt="Keel's live trust index and lineage constellation for a data pipeline"
              width={1730}
              height={1043}
              priority
              className="h-auto w-full"
            />
          </div>
        </section>

        {/* The moment of trust */}
        <section className="border-t border-border bg-secondary/40">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-20 md:grid-cols-2 md:items-center md:py-28">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-balance md:text-3xl">
                Every score is inherited from what it&apos;s built on.
              </h2>
              <p className="mt-4 text-muted-foreground">
                A perfectly healthy dashboard still drops to 61 if the table
                underneath it is broken — not because anything is wrong with the
                dashboard, but because of what it&apos;s made of.
              </p>
              <p className="mt-4 font-mono text-sm text-muted-foreground">
                trust = min( own_hygiene × validity_gate, min(upstream_trust) +
                hop_recovery )
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <p className="mb-4 text-xs font-medium text-muted-foreground uppercase">
                Same dashboard, twenty minutes apart
              </p>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="text-sm font-medium">exec_revenue_daily</p>
                  <p className="text-xs text-muted-foreground">
                    looker · dashboard
                  </p>
                </div>
                <VerdictChip score={90} label="safe to use" verdict="good" />
              </div>
              <div className="my-2 ml-4 h-6 w-px bg-border" aria-hidden />
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="text-sm font-medium">exec_revenue_daily</p>
                  <p className="text-xs text-muted-foreground">
                    looker · dashboard — unchanged
                  </p>
                </div>
                <VerdictChip
                  score={61}
                  label="use with care"
                  verdict="warning"
                />
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-border">
          <div className="mx-auto w-full max-w-6xl px-6 py-20 md:py-28">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                Damage travels downstream. Keel shows you exactly how.
              </h2>
              <p className="mt-4 text-muted-foreground">
                A real lineage graph, not a health-check dashboard. You
                can&apos;t compute what an asset is built from without one —
                Keel only exists because that graph already exists.
              </p>
            </div>

            <div className="mt-10 overflow-x-auto">
              <div className="flex min-w-max items-center gap-3">
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-sm font-medium">trips_raw</p>
                  <p className="text-xs text-muted-foreground">s3 · table</p>
                  <VerdictChip score={12} label="don't trust" verdict="bad" />
                </div>
                <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-sm font-medium">driver_surge_features</p>
                  <p className="text-xs text-muted-foreground">
                    snowflake · table
                  </p>
                  <VerdictChip score={26} label="don't trust" verdict="bad" />
                </div>
                <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-sm font-medium">
                    dynamic_pricing_decisions
                  </p>
                  <p className="text-xs text-muted-foreground">
                    snowflake · table
                  </p>
                  <VerdictChip
                    score={40}
                    label="use with care"
                    verdict="warning"
                  />
                </div>
                <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-sm font-medium">exec_revenue_daily</p>
                  <p className="text-xs text-muted-foreground">
                    looker · dashboard
                  </p>
                  <VerdictChip
                    score={54}
                    label="use with care"
                    verdict="warning"
                  />
                </div>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Damage fades ~14 points per hop, so one bad source produces a real
              gradient — not a wall of red.
            </p>
          </div>
        </section>

        {/* Feature highlights */}
        <section className="border-t border-border bg-secondary/40">
          <div className="mx-auto w-full max-w-6xl px-6 py-20 md:py-28">
            <h2 className="max-w-xl text-2xl font-bold tracking-tight md:text-3xl">
              Everything you need to answer &ldquo;can I trust this
              number.&rdquo;
            </h2>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              <div className="rounded-xl border border-border bg-card p-6">
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Root-cause drill-down
                </p>
                <p className="mt-2 text-sm text-foreground">
                  Click any low score to see exactly which upstream asset capped
                  it, how many hops away, and the literal bad row that caused
                  it.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-6">
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Blast radius &amp; ownership
                </p>
                <p className="mt-2 text-sm text-foreground">
                  See every team and asset affected by a break, and alert the
                  right owner — pulled from your metadata graph, never
                  hardcoded.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-6">
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Plain-language verdicts
                </p>
                <p className="mt-2 text-sm text-foreground">
                  Every score comes with a verdict, never a bare number: safe to
                  use, use with care, or don&apos;t trust today.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Built on DataHub */}
        <section className="border-t border-border">
          <div className="mx-auto w-full max-w-3xl px-6 py-20 text-center md:py-28">
            <p className="font-mono text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Built on DataHub
            </p>
            <p className="mt-4 text-lg text-balance">
              Keel isn&apos;t a new catalog — it&apos;s the trust layer on top
              of the lineage graph you already have, or are adopting.
            </p>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="border-t border-border">
          <div className="mx-auto w-full max-w-3xl px-6 py-20 text-center md:py-28">
            <h2 className="text-2xl font-bold tracking-tight text-balance md:text-3xl">
              Know the moment a number stops being true — before anyone acts on
              it.
            </h2>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link
                href="/join"
                className={buttonVariants({
                  className: "h-11 px-6 text-base md:h-12 md:px-7 md:text-lg",
                })}
              >
                Join now
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
              <Link
                href="/login"
                className={buttonVariants({
                  variant: "outline",
                  className: "h-11 px-6 text-base md:h-12 md:px-7 md:text-lg",
                })}
              >
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8">
          <Logo className="text-lg opacity-70" />
          <p className="text-xs text-muted-foreground">
            A trust layer for data pipelines, built on DataHub.
          </p>
        </div>
      </footer>
    </div>
  );
}
