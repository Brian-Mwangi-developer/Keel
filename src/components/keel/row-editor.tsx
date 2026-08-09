"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CircleCheck, CircleX, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { editAndCheckRowAction } from "@/lib/keel/actions";
import type { CheckResultOut, LocalRow } from "@/lib/keel/types";

/**
 * The editable-injection mechanism itself: pick a row, pick a field, type
 * whatever value you want, trigger a real check. Not a button that
 * magically breaks something behind the scenes -- every value here is
 * something a person typed, and the pipeline reacts to it for real.
 */
export function RowEditor({ urn, rows, columns }: { urn: string; rows: LocalRow[]; columns: string[] }) {
  const [liveRows, setLiveRows] = useState(rows);
  const [editing, setEditing] = useState<LocalRow | null>(null);
  const [lastChecks, setLastChecks] = useState<{ rowId: number; checks: CheckResultOut[] } | null>(null);

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground uppercase">
                <th className="w-10 pb-2" />
                {columns.map((c) => (
                  <th key={c} className="pb-2 pr-4 font-medium">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {liveRows.map((row) => (
                <tr key={row._row_id} className="border-b last:border-0">
                  <td className="py-2">
                    <Button variant="ghost" size="icon-sm" onClick={() => setEditing(row)}>
                      <Pencil className="size-3.5" />
                    </Button>
                  </td>
                  {columns.map((c) => (
                    <td key={c} className="py-2 pr-4 font-mono text-xs">
                      {String(row[c] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {lastChecks && (
          <div className="flex flex-col gap-2 rounded-lg border p-3">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Checks triggered for row {lastChecks.rowId}
            </span>
            {lastChecks.checks.length === 0 && (
              <span className="text-sm text-muted-foreground">No rules attached to the edited column.</span>
            )}
            {lastChecks.checks.map((c) => (
              <div key={c.rule_id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  {c.passed ? (
                    <CircleCheck className="size-4 text-success" />
                  ) : (
                    <CircleX className="size-4 text-destructive" />
                  )}
                  {c.column} {c.operator.toLowerCase().replace(/_/g, " ")} — checked {c.value_checked}
                </span>
                <span className="text-xs text-muted-foreground capitalize">{c.severity}</span>
              </div>
            ))}
            <Link href={`/assets/${encodeURIComponent(urn)}`} className="text-xs text-primary underline underline-offset-2">
              view updated trust score →
            </Link>
          </div>
        )}
      </CardContent>

      {editing && (
        <EditRowDialog
          urn={urn}
          row={editing}
          columns={columns}
          onClose={() => setEditing(null)}
          onSaved={(updatedRow, checks) => {
            setLiveRows((prev) => prev.map((r) => (r._row_id === updatedRow._row_id ? updatedRow : r)));
            setLastChecks({ rowId: updatedRow._row_id, checks });
            setEditing(null);
          }}
        />
      )}
    </Card>
  );
}

function EditRowDialog({
  urn,
  row,
  columns,
  onClose,
  onSaved,
}: {
  urn: string;
  row: LocalRow;
  columns: string[];
  onClose: () => void;
  onSaved: (row: LocalRow, checks: CheckResultOut[]) => void;
}) {
  const [column, setColumn] = useState(columns[0] ?? "");
  const [value, setValue] = useState(String(row[columns[0]] ?? ""));
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit row {row._row_id}</DialogTitle>
          <DialogDescription>
            Set any field to any value, then trigger — Keel evaluates it against this asset&apos;s real rules and
            self-reports the result to DataHub.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Column</Label>
            <Select
              value={column}
              onValueChange={(v) => {
                if (typeof v !== "string") return;
                setColumn(v);
                setValue(String(row[v] ?? ""));
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {columns.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>New value</Label>
            <Input value={value} onChange={(e) => setValue(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                try {
                  const result = await editAndCheckRowAction(urn, row._row_id, column, value);
                  toast.success(
                    result.checks.every((c) => c.passed)
                      ? "Edit applied — all checks passed."
                      : "Edit applied — a check failed. Trust score updated.",
                  );
                  onSaved(result.row, result.checks);
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Failed to apply edit.");
                }
              })
            }
          >
            {pending ? "Checking…" : "Save & trigger check"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
