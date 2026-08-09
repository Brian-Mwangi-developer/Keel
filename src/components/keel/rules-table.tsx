"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Sparkles, Trash2, CircleCheck, CircleX, CircleDashed } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createRuleAction, deleteRuleAction, draftRuleAction } from "@/lib/keel/actions";
import type { Operator, RuleDraftOut, RuleOut, Severity } from "@/lib/keel/types";

const OPERATORS: { value: Operator; label: string }[] = [
  { value: "between", label: "between" },
  { value: "greater_than", label: "greater than" },
  { value: "greater_than_or_equal_to", label: "greater than or equal to" },
  { value: "less_than", label: "less than" },
  { value: "less_than_or_equal_to", label: "less than or equal to" },
  { value: "equal_to", label: "equal to" },
  { value: "not_equal_to", label: "not equal to" },
  { value: "not_null", label: "is not null" },
];

export function RulesTable({ assetUrn, rules }: { assetUrn: string; rules: RuleOut[] }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            DataHub assertions Keel manages for this asset — a failing critical rule zeroes validity entirely.
          </p>
          <NewRuleDialog assetUrn={assetUrn} />
        </div>

        <div className="flex flex-col gap-2">
          {rules.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No rules yet — this asset&apos;s validity is assumed, not verified. Add one above.
            </p>
          )}
          {rules.map((rule) => (
            <RuleRow key={rule.id} rule={rule} assetUrn={assetUrn} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RuleRow({ rule, assetUrn }: { rule: RuleOut; assetUrn: string }) {
  const [pending, startTransition] = useTransition();

  const StatusIcon = !rule.has_run ? CircleDashed : rule.passing ? CircleCheck : CircleX;
  const statusClass = !rule.has_run ? "text-muted-foreground" : rule.passing ? "text-success" : "text-destructive";

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
      <div className="flex items-center gap-3">
        <StatusIcon className={`size-4 shrink-0 ${statusClass}`} />
        <div className="flex flex-col">
          <span className="font-medium">{rule.description || rule.column || rule.id}</span>
          <span className="font-mono text-xs text-muted-foreground">
            {rule.column && `${rule.column} · `}
            {rule.has_run
              ? `${rule.passing ? "passing" : "failing"}${rule.row_count != null ? ` · ${rule.unexpected_count}/${rule.row_count} unexpected` : ""}`
              : "never run"}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={rule.severity === "critical" ? "destructive" : "outline"} className="capitalize">
          {rule.severity}
        </Badge>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              try {
                await deleteRuleAction(rule.id, assetUrn);
                toast.success("Rule deleted.");
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to delete rule.");
              }
            })
          }
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

function NewRuleDialog({ assetUrn }: { assetUrn: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [drafting, startDrafting] = useTransition();

  const [description, setDescription] = useState("");
  const [column, setColumn] = useState("");
  const [operator, setOperator] = useState<Operator>("not_null");
  const [value, setValue] = useState("");
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [severity, setSeverity] = useState<Severity>("warning");
  const [availableFields, setAvailableFields] = useState<string[] | null>(null);

  function applyDraft(draft: RuleDraftOut) {
    setColumn(draft.column ?? "");
    if (draft.operator) setOperator(draft.operator);
    setValue(draft.value ?? "");
    setMinValue(draft.min_value ?? "");
    setMaxValue(draft.max_value ?? "");
    setSeverity(draft.severity);
    setAvailableFields(draft.available_fields);
  }

  function reset() {
    setDescription("");
    setColumn("");
    setOperator("not_null");
    setValue("");
    setMinValue("");
    setMaxValue("");
    setSeverity("warning");
    setAvailableFields(null);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="size-3.5" />
        New rule
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New quality rule</DialogTitle>
          <DialogDescription>Registers a DataHub assertion — IDEA.md&apos;s &quot;create a quality rule and watch the pipeline re-score.&quot;</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="describe">
          <TabsList>
            <TabsTrigger value="describe">
              <Sparkles className="size-3.5" />
              Describe it
            </TabsTrigger>
            <TabsTrigger value="manual">Manual</TabsTrigger>
          </TabsList>

          <TabsContent value="describe" className="flex flex-col gap-3 pt-3">
            <Textarea
              placeholder="e.g. demand_index should never go above 1, this is critical"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={drafting || !description.trim()}
              onClick={() =>
                startDrafting(async () => {
                  try {
                    const draft = await draftRuleAction(assetUrn, description);
                    applyDraft(draft);
                    toast.info("Draft ready — review below, then create.");
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Could not draft a rule from that description.");
                  }
                })
              }
            >
              <Sparkles className="size-3.5" />
              {drafting ? "Drafting…" : "Draft with AI"}
            </Button>
            {availableFields && <RuleFieldsPreview column={column} operator={operator} value={value} minValue={minValue} maxValue={maxValue} severity={severity} />}
          </TabsContent>

          <TabsContent value="manual" className="pt-3">
            <RuleForm
              availableFields={availableFields}
              column={column}
              setColumn={setColumn}
              operator={operator}
              setOperator={setOperator}
              value={value}
              setValue={setValue}
              minValue={minValue}
              setMinValue={setMinValue}
              maxValue={maxValue}
              setMaxValue={setMaxValue}
              severity={severity}
              setSeverity={setSeverity}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            disabled={pending || (operator !== "not_null" && !value && !minValue)}
            onClick={() =>
              startTransition(async () => {
                try {
                  await createRuleAction({
                    asset_urn: assetUrn,
                    column: column || null,
                    operator,
                    value: value || null,
                    min_value: minValue || null,
                    max_value: maxValue || null,
                    severity,
                    description: description || null,
                  });
                  toast.success("Rule created.");
                  setOpen(false);
                  reset();
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Failed to create rule.");
                }
              })
            }
          >
            {pending ? "Creating…" : "Create rule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RuleFieldsPreview(props: {
  column: string;
  operator: Operator;
  value: string;
  minValue: string;
  maxValue: string;
  severity: Severity;
}) {
  if (!props.column && !props.value && !props.minValue) return null;
  return (
    <div className="rounded-md border bg-muted/40 p-2 font-mono text-xs">
      {props.column || "(table-level)"} {props.operator.replace(/_/g, " ")}{" "}
      {props.operator === "between" ? `${props.minValue} and ${props.maxValue}` : props.value}
      {" · "}
      {props.severity}
    </div>
  );
}

function RuleForm(props: {
  availableFields: string[] | null;
  column: string;
  setColumn: (v: string) => void;
  operator: Operator;
  setOperator: (v: Operator) => void;
  value: string;
  setValue: (v: string) => void;
  minValue: string;
  setMinValue: (v: string) => void;
  maxValue: string;
  setMaxValue: (v: string) => void;
  severity: Severity;
  setSeverity: (v: Severity) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label>Column</Label>
        <Input
          placeholder="column name (leave blank for table-level)"
          value={props.column}
          onChange={(e) => props.setColumn(e.target.value)}
          list="rule-available-fields"
        />
        {props.availableFields && (
          <datalist id="rule-available-fields">
            {props.availableFields.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Operator</Label>
        <Select value={props.operator} onValueChange={(v) => props.setOperator(v as Operator)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OPERATORS.map((op) => (
              <SelectItem key={op.value} value={op.value}>
                {op.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {props.operator === "between" ? (
        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label>Min</Label>
            <Input value={props.minValue} onChange={(e) => props.setMinValue(e.target.value)} />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <Label>Max</Label>
            <Input value={props.maxValue} onChange={(e) => props.setMaxValue(e.target.value)} />
          </div>
        </div>
      ) : props.operator !== "not_null" ? (
        <div className="flex flex-col gap-1.5">
          <Label>Value</Label>
          <Input value={props.value} onChange={(e) => props.setValue(e.target.value)} />
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label>Severity</Label>
        <Select value={props.severity} onValueChange={(v) => props.setSeverity(v as Severity)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
