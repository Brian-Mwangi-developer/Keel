"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Database, Plus, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { connectSourceAction, uploadSourceAction } from "@/lib/keel/actions";

export function ConnectSourceDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [platform, setPlatform] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Plus className="size-3.5" />
        Connect source
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect a source</DialogTitle>
          <DialogDescription>
            IDEA.md: &quot;one action demonstrates the entire ingestion path.&quot; Registers a dataset in DataHub —
            it appears, scored, immediately.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Platform</Label>
            <Input placeholder="postgres, s3, snowflake…" value={platform} onChange={(e) => setPlatform(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Dataset name</Label>
            <Input placeholder="mydb.public.orders" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={pending || !platform.trim() || !name.trim()}
            onClick={() =>
              startTransition(async () => {
                try {
                  const result = await connectSourceAction({ platform, name, description: description || null });
                  toast.success("Source connected.");
                  setOpen(false);
                  router.push(`/assets/${encodeURIComponent(result.urn)}`);
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Failed to connect source.");
                }
              })
            }
          >
            {pending ? "Connecting…" : "Connect"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function UploadSourceDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Upload className="size-3.5" />
        Upload CSV / Parquet
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload a file</DialogTitle>
          <DialogDescription>
            Keel infers a real schema from your file&apos;s actual columns and registers it in DataHub — this is the
            demo&apos;s onboarding path, not a fixture.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-3"
          action={(formData) =>
            startTransition(async () => {
              try {
                const result = await uploadSourceAction(formData);
                toast.success(`Uploaded ${result.row_count} rows, ${result.columns.length} columns.`);
                setOpen(false);
                router.push(`/sources/${encodeURIComponent(result.urn)}`);
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Upload failed.");
              }
            })
          }
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="upload-file">File (.csv or .parquet)</Label>
            <div className="flex items-center gap-2">
              <Database className="size-4 shrink-0 text-muted-foreground" />
              <input
                ref={fileInputRef}
                id="upload-file"
                name="file"
                type="file"
                accept=".csv,.parquet"
                required
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
                className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium"
              />
            </div>
            {fileName && <span className="text-xs text-muted-foreground">Selected: {fileName}</span>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="upload-platform">Platform label</Label>
            <Input id="upload-platform" name="platform" defaultValue="file" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="upload-name">Dataset name</Label>
            <Input id="upload-name" name="name" placeholder="defaults to the filename" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="upload-description">Description</Label>
            <Textarea id="upload-description" name="description" rows={2} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Uploading…" : "Upload"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
