import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import { Select as SelectPrimitive } from "@base-ui/react/select"
import { cn } from "@/lib/utils"

const Select = SelectPrimitive.Root

const SelectTrigger = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Trigger>,
  React.ComponentProps<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition-colors hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:truncate",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon className="flex shrink-0 text-slate-400">
      <ChevronDown size={16} />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = SelectPrimitive.Value

const SelectPortal = SelectPrimitive.Portal

const SelectPositioner = SelectPrimitive.Positioner

const SelectPopup = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Popup>,
  React.ComponentProps<typeof SelectPrimitive.Popup>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Popup
    ref={ref}
    className={cn(
      "z-[9999] w-[var(--select-trigger-width)] overflow-hidden rounded-xl border border-slate-200 bg-white p-1 text-slate-700 shadow-lg",
      "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
      "animate-in fade-in-0 zoom-in-95",
      className
    )}
    {...props}
  />
))
SelectPopup.displayName = "SelectPopup"

const SelectGroup = SelectPrimitive.Group

const SelectItem = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Item>,
  React.ComponentProps<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 pl-3 pr-8 text-sm outline-none transition-colors focus:bg-blue-50 focus:text-blue-700 data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-700",
      className
    )}
    {...props}
  >
    <SelectPrimitive.ItemText className="min-w-0 truncate">{children}</SelectPrimitive.ItemText>
    <span className="absolute right-2 flex h-3.5 w-3.5 shrink-0 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check size={14} />
      </SelectPrimitive.ItemIndicator>
    </span>
  </SelectPrimitive.Item>
))
SelectItem.displayName = "SelectItem"

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectPortal,
  SelectPositioner,
  SelectPopup,
  SelectGroup,
  SelectItem,
}
