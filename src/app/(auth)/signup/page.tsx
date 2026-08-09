import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SignupForm } from "@/components/signup-form";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Join your team's organization on Keel.",
};

export default async function SignupPage() {
  const existingOrg = await prisma.organization.findFirst();
  if (!existingOrg) {
    redirect("/join");
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative flex items-center justify-center p-6 md:p-10">
        <Link
          href="/"
          className="absolute top-6 left-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground md:top-10 md:left-10"
        >
          <ArrowLeftIcon className="size-4" />
          Back
        </Link>
        <SignupForm />
      </div>

      <div className="relative hidden bg-sky-500 lg:flex lg:flex-col lg:items-center lg:justify-center lg:overflow-hidden lg:p-10">
        <div className="relative z-10 mb-8 max-w-md text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-white text-balance">
            See trust and lineage across your pipeline
          </h2>
          <p className="mt-2 text-sm text-sky-100 text-balance">
            Set up your organization and start scoring the data your team
            depends on.
          </p>
        </div>
        <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/20">
          <Image
            src="/sell.png"
            alt="Keel dashboard overview"
            width={1730}
            height={1043}
            priority
            className="h-auto w-full"
          />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),_transparent_60%)]"
        />
      </div>
    </div>
  );
}
