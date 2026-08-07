import type { Metadata } from "next";
import Image from "next/image";

import { JoinForm } from "@/components/join-form";

export const metadata: Metadata = {
  title: "Create your organization",
  description: "Set up your workspace and admin account.",
};

export default function JoinPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 md:p-10">
        <JoinForm />
      </div>

      <div className="relative hidden bg-sky-500 lg:flex lg:flex-col lg:items-center lg:justify-center lg:overflow-hidden lg:p-10">
        <div className="relative z-10 mb-8 max-w-md text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-white text-balance">
            Give your team a single source of truth
          </h2>
          <p className="mt-2 text-sm text-sky-100 text-balance">
            Track trust, lineage, and quality across every asset your organization owns.
          </p>
        </div>
        <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/20">
          <Image
            src="/image.png"
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
