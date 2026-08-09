import Image from "next/image";
import { Database } from "lucide-react";

// Logos live in /public, exactly as pulled from the running DataHub
// instance's own platform icons. Keyed by DataHub's platform urn segment
// (urn:li:dataPlatform:<key>) -- lowercase, no guessing. Exported (not
// just consumed by <PlatformIcon>) so the SVG lineage graph -- which can't
// render next/image inside <svg> -- can look up the same src for a plain
// <image href> tag.
export const PLATFORM_LOGOS: Record<string, string> = {
  kafka: "/kafkalogo.png",
  snowflake: "/snowflakelogo.png",
  s3: "/s3logo.png",
  looker: "/lookerlogo.png",
  postgres: "/postgresslogo.png",
  postgresql: "/postgresslogo.png",
};

export function platformLogoSrc(platform: string): string | null {
  return PLATFORM_LOGOS[platform.toLowerCase()] ?? null;
}

/**
 * A platform's real logo wherever "snowflake" or "kafka" would otherwise
 * just be text -- source cards, asset rows, lineage nodes, drawer headers.
 * Falls back to a plain database glyph for any platform DataHub returns
 * that doesn't have a logo checked in yet, so a new/unknown source never
 * renders as a broken image. Every logo sits in the same rounded chip --
 * S3's icon ships on a solid green square while the others are
 * transparent, so a shared frame is what makes them read as one
 * consistent icon set instead of one looking out of place.
 *
 * object-contain, not object-cover: the source PNGs aren't uniformly
 * square (Looker's is 637x1024), and cover center-crops a tall image
 * against a square frame, chopping its top/bottom off. Contain fits the
 * whole mark inside the chip regardless of its native aspect ratio.
 */
export function PlatformIcon({ platform, className = "size-4" }: { platform: string; className?: string }) {
  const src = PLATFORM_LOGOS[platform.toLowerCase()];
  if (!src) {
    return (
      <span className={`${className} flex shrink-0 items-center justify-center rounded-md border bg-muted`}>
        <Database className="size-[65%] text-muted-foreground" aria-hidden />
      </span>
    );
  }
  return (
    <span className={`${className} relative inline-block shrink-0 overflow-hidden rounded-md bg-white ring-1 ring-border`}>
      <Image src={src} alt="" fill sizes="32px" className="object-contain p-0.5" />
    </span>
  );
}
