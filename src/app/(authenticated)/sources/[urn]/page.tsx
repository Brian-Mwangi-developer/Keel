import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getAsset, getRows, KeelApiError } from "@/lib/keel/client";
import { VerdictBadge } from "@/components/keel/verdict-badge";
import { RowEditor } from "@/components/keel/row-editor";

export default async function SourceRowsPage(props: PageProps<"/sources/[urn]">) {
  const { urn: encodedUrn } = await props.params;
  const urn = decodeURIComponent(encodedUrn);

  let asset;
  try {
    asset = await getAsset(urn);
  } catch (e) {
    if (e instanceof KeelApiError && e.status === 404) notFound();
    throw e;
  }

  let rows;
  try {
    rows = await getRows(urn);
  } catch {
    rows = null;
  }

  const columns = rows && rows.length > 0 ? Object.keys(rows[0]).filter((k) => k !== "_row_id") : [];

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <Link href="/sources" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" />
        All sources
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold">{asset.name}</h1>
          <VerdictBadge score={asset.score} band={asset.band} verdict={asset.verdict} />
        </div>
        <Link
          href={`/assets/${encodeURIComponent(urn)}`}
          className="text-sm text-primary underline underline-offset-2"
        >
          view full breakdown →
        </Link>
      </div>

      {rows === null ? (
        <p className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
          No local row data for this asset — it wasn&apos;t uploaded via Keel&apos;s CSV/Parquet upload, so there&apos;s
          nothing here to edit directly. (This works for any dataset uploaded through Sources → Upload.)
        </p>
      ) : (
        <RowEditor urn={urn} rows={rows} columns={columns} />
      )}
    </div>
  );
}
