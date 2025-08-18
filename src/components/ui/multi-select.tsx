
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, X, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

export type OptionType = {
  label: string;
  value: string;
};

interface MultiSelectProps {
  options: OptionType[];
  selected: string[];
  onChange: (selected: string[]) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

function MultiSelect({
  options,
  selected,
  onChange,
  className,
  placeholder = "Selecione...",
  disabled = false,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (value: string) => {
    onChange([...selected, value]);
  };

  const handleDeselect = (value: string) => {
    onChange(selected.filter((s) => s !== value));
  };
  
  const handleToggle = (value: string) => {
    if (selected.includes(value)) {
      handleDeselect(value);
    } else {
      handleSelect(value);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          onClick={() => setOpen(!open)}
        >
          <div className="flex gap-1 flex-wrap">
            {selected.length > 0 ? (
              options
                .filter(option => selected.includes(option.value))
                .map(option => (
                  <Badge
                    variant="secondary"
                    key={option.value}
                    className="mr-1 mb-1"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDeselect(option.value);
                    }}
                  >
                    {option.label}
                    <X className="ml-1 h-3 w-3" />
                  </Badge>
                ))
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Procurar..." />
          <CommandList>
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => handleToggle(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selected.includes(option.value)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export { MultiSelect };
