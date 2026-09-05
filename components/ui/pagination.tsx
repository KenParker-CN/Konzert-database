import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const Pagination = React.forwardRef<
  HTMLElement,
  React.ComponentProps<"nav">
>(({ className, ...props }, ref) => (
  <nav
    ref={ref}
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
))
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex items-center gap-1", className)}
    {...props}
  />
))
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

type PaginationButtonProps = {
  isActive?: boolean
  disabled?: boolean
  onClick?: () => void
  "aria-label"?: string
  children: React.ReactNode
  className?: string
}

const PaginationButton = React.forwardRef<HTMLButtonElement, PaginationButtonProps>(
  ({ className, isActive, disabled, onClick, children, ...props }, ref) => (
    <Button
      ref={ref}
      variant="outline"
      size="icon"
      disabled={disabled}
      onClick={onClick}
      className={cn("h-9 w-9", isActive && "font-semibold text-slate-900", className)}
      {...props}
    >
      {children}
    </Button>
  )
)
PaginationButton.displayName = "PaginationButton"

const PaginationPrevious = React.forwardRef<
  HTMLButtonElement,
  { disabled?: boolean; onClick?: () => void; className?: string }
>(({ className, disabled, onClick, ...props }, ref) => (
  <Button
    ref={ref}
    variant="outline"
    size="icon"
    disabled={disabled}
    onClick={onClick}
    aria-label="Go to previous page"
    className={cn("h-9 w-9", className)}
    {...props}
  >
    <ChevronLeft size={16} />
  </Button>
))
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = React.forwardRef<
  HTMLButtonElement,
  { disabled?: boolean; onClick?: () => void; className?: string }
>(({ className, disabled, onClick, ...props }, ref) => (
  <Button
    ref={ref}
    variant="outline"
    size="icon"
    disabled={disabled}
    onClick={onClick}
    aria-label="Go to next page"
    className={cn("h-9 w-9", className)}
    {...props}
  >
    <ChevronRight size={16} />
  </Button>
))
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = ({ className, ...props }: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn("flex h-9 w-9 items-center justify-center text-slate-400", className)}
    {...props}
  >
    <MoreHorizontal size={16} />
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationButton,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
}
