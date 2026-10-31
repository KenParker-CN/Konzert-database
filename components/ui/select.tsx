import * as React from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"
import { cn } from "cn"

function SelectComponent({
    children,
    ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
    return (
        <SelectPrimitive.Root data-slot="select" {...props}>
            {children}
        </SelectPrimitive.Root>
    )
}

SelectComponent.displayName = "Select"

function SelectTriggerComponent({
    className,
    children,
    ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
    return (
        <SelectPrimitive.Trigger
            data-slot="select-trigger"
            className={cn(
                "flex h-8 shrink-0 items-center justify-between rounded-lg border border-input bg-white px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
                className
            )}
            {...props}
        >
            {children}
        </SelectPrimitive.Trigger>
    )
}

SelectTriggerComponent.displayName = "SelectTrigger"

function SelectPositionerComponent({
    className,
    children,
    align = "start",
    ...props
}: React.ComponentProps<typeof SelectPrimitive.Positioner> & {
    align?: "start" | "end"
}) {
    return (
        <SelectPrimitive.Positioner
            data-slot="select-positioner"
            className={cn(className)}
            align={align}
            {...props}
        >
            {children}
        </SelectPrimitive.Positioner>
    )
}

SelectPositionerComponent.displayName = "SelectPositioner"

function SelectContentComponent({
    className,
    children,
    ...props
}: React.ComponentProps<typeof SelectPrimitive.Popup>) {
    return (
        <SelectPrimitive.Popup
            data-slot="select-content"
            className={cn(
                "z-50 min-w-[8rem] overflow-hidden rounded-md border border-input bg-white p-1 text-sm shadow-lg outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
                className
            )}
            {...props}
        >
            <div className="p-1">{children}</div>
        </SelectPrimitive.Popup>
    )
}

SelectContentComponent.displayName = "SelectContent"

function SelectGroupComponent({
    className,
    children,
    ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
    return (
        <SelectPrimitive.Group
            data-slot="select-group"
            className={cn("select-group", className)}
            {...props}
        >
            {children}
        </SelectPrimitive.Group>
    )
}

SelectGroupComponent.displayName = "SelectGroup"

function SelectLabelComponent({
    className,
    children,
    ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
    return (
        <SelectPrimitive.Label
            data-slot="select-label"
            className={cn(
                "mb-0.5 mt-1 px-2 py-0.5 text-[0.7rem] uppercase tracking-[0.05em] text-muted-foreground",
                className
            )}
            {...props}
        >
            {children}
        </SelectPrimitive.Label>
    )
}

SelectLabelComponent.displayName = "SelectLabel"

function SelectItemComponent({
    className,
    children,
    ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
    return (
        <SelectPrimitive.Item
            data-slot="select-item"
            className={cn(
                "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                className
            )}
            {...props}
        >
            {children}
        </SelectPrimitive.Item>
    )
}

SelectItemComponent.displayName = "SelectItem"

function SelectSeparatorComponent({
    className,
    ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
    return (
        <SelectPrimitive.Separator
            data-slot="select-separator"
            className={cn("-mx-1 my-1 h-px bg-muted", className)}
            {...props}
        />
    )
}

SelectSeparatorComponent.displayName = "SelectSeparator"

function SelectValueComponent({
    className,
    children,
    ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
    return (
        <SelectPrimitive.Value
            data-slot="select-value"
            className={cn(
                "flex w-full items-center justify-between overflow-hidden text-foreground sm:text-sm",
                className
            )}
            {...props}
        >
            {children}
        </SelectPrimitive.Value>
    )
}

SelectValueComponent.displayName = "SelectValue"

export {
    SelectComponent as Select,
    SelectGroupComponent as SelectGroup,
    SelectLabelComponent as SelectLabel,
    SelectItemComponent as SelectItem,
    SelectSeparatorComponent as SelectSeparator,
    SelectPositionerComponent as SelectPositioner,
    SelectTriggerComponent as SelectTrigger,
    SelectContentComponent as SelectContent,
    SelectValueComponent as SelectValue,
}
