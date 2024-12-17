"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface PopoverContextValue {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

const PopoverContext = React.createContext<PopoverContextValue>({
  isOpen: false,
  onOpenChange: () => {},
})

interface PopoverProps {
  children: React.ReactNode
  className?: string
}

const Popover = React.forwardRef<HTMLDivElement, PopoverProps>(
  ({ children, className }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const popoverRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setIsOpen(false)
        }
      }

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleEscape)
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('keydown', handleEscape)
      }
    }, [isOpen])

    return (
      <PopoverContext.Provider value={{ isOpen, onOpenChange: setIsOpen }}>
        <div ref={popoverRef} className={cn("relative inline-block", className)}>
          {children}
        </div>
      </PopoverContext.Provider>
    )
  }
)
Popover.displayName = "Popover"

interface PopoverTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean
}

const PopoverTrigger = React.forwardRef<HTMLDivElement, PopoverTriggerProps>(
  ({ children, className, asChild, ...props }, ref) => {
    const { isOpen, onOpenChange } = React.useContext(PopoverContext)

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation()
      onOpenChange(!isOpen)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onOpenChange(!isOpen)
      }
    }

    const triggerProps = {
      onClick: handleClick,
      onKeyDown: handleKeyDown,
      "aria-expanded": isOpen,
      "aria-haspopup": true,
      role: "button",
      tabIndex: 0,
      ...props
    }

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, triggerProps)
    }

    return (
      <div
        ref={ref}
        className={cn("cursor-pointer", className)}
        {...triggerProps}
      >
        {children}
      </div>
    )
  }
)
PopoverTrigger.displayName = "PopoverTrigger"

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end"
  sideOffset?: number
}

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className, align = "center", sideOffset = 4, children, ...props }, ref) => {
    const { isOpen } = React.useContext(PopoverContext)

    if (!isOpen) return null

    return (
      <div
        ref={ref}
        className={cn(
          "absolute z-50 min-w-[8rem] rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
          "animate-in data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
          "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          {
            "left-0": align === "start",
            "left-1/2 -translate-x-1/2": align === "center",
            "right-0": align === "end"
          },
          `top-full mt-${sideOffset}`,
          className
        )}
        role="dialog"
        {...props}
      >
        {children}
      </div>
    )
  }
)
PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent }
