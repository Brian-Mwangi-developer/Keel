"use client";

import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, Users } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { searchOwners } from "@/lib/keel/client-fetch";
import type { OwnerOut } from "@/lib/keel/types";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Avatar-style owner combobox -- always fetches the CURRENT set of real
 * DataHub users/groups (see keel-backend's GET /owners, backed by
 * app/datahub/directory.py), never a free-text URN field. Assigning an
 * owner should be picking someone who actually exists in the catalog, not
 * hand-typing a urn and hoping it resolves.
 */
export function OwnerPicker({
  value,
  onChange,
}: {
  value: OwnerOut | null;
  onChange: (owner: OwnerOut) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [owners, setOwners] = useState<OwnerOut[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const handle = setTimeout(() => {
      if (cancelled) return;
      setLoading(true);
      searchOwners(query, 30)
        .then((result) => !cancelled && setOwners(result))
        .catch(() => !cancelled && setOwners([]))
        .finally(() => !cancelled && setLoading(false));
    }, 200); // debounce -- avoid a request per keystroke against live DataHub search
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [open, query]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal">
            {value ? (
              <span className="flex items-center gap-2">
                <Avatar className="size-5">
                  {value.avatar_url && <AvatarImage src={value.avatar_url} alt="" />}
                  <AvatarFallback className="text-[10px]">
                    {value.type === "group" ? <Users className="size-3" /> : initials(value.display_name)}
                  </AvatarFallback>
                </Avatar>
                {value.display_name}
              </span>
            ) : (
              <span className="text-muted-foreground">Select an owner…</span>
            )}
            <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
          </Button>
        }
      />
      <PopoverContent className="w-80 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search people or teams…" value={query} onValueChange={setQuery} />
          <CommandList>
            {!loading && owners.length === 0 && <CommandEmpty>No matching owner in DataHub.</CommandEmpty>}
            {loading && <p className="py-6 text-center text-sm text-muted-foreground">Searching…</p>}
            <CommandGroup>
              {owners.map((owner) => (
                <CommandItem
                  key={owner.urn}
                  value={owner.urn}
                  onSelect={() => {
                    onChange(owner);
                    setOpen(false);
                  }}
                  className="gap-2"
                >
                  <Avatar className="size-6">
                    {owner.avatar_url && <AvatarImage src={owner.avatar_url} alt="" />}
                    <AvatarFallback className="text-[10px]">
                      {owner.type === "group" ? <Users className="size-3" /> : initials(owner.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{owner.display_name}</span>
                    {owner.description && (
                      <span className="truncate text-xs text-muted-foreground">{owner.description}</span>
                    )}
                  </span>
                  <Check className={cn("size-3.5", value?.urn === owner.urn ? "opacity-100" : "opacity-0")} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
