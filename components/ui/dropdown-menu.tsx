"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface DropdownMenuContextValue {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue>({
  isOpen: false,
  onOpenChange: () => {},
})

interface DropdownMenuProps {
  children: React.ReactNode
  className?: string
}

const DropdownMenu = React.forwardRef<HTMLDivElement, DropdownMenuProps>(
  ({ children, className }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const dropdownRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
      <DropdownMenuContext.Provider value={{ isOpen, onOpenChange: setIsOpen }}>
        <div ref={dropdownRef} className={cn("relative inline-block text-left", className)}>
          {children}
        </div>
      </DropdownMenuContext.Provider>
    )
  }
)
DropdownMenu.displayName = "DropdownMenu"

interface DropdownMenuTriggerProps {
  asChild?: boolean
  children: React.ReactNode
  className?: string
}

const DropdownMenuTrigger = React.forwardRef<HTMLDivElement, DropdownMenuTriggerProps>(
  ({ children, className, asChild = false }, ref) => {
    const { isOpen, onOpenChange } = React.useContext(DropdownMenuContext)

    const handleClick = React.useCallback((e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      onOpenChange(!isOpen)
    }, [isOpen, onOpenChange])

    const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        e.stopPropagation()
        onOpenChange(!isOpen)
      }
    }, [isOpen, onOpenChange])

    const commonProps = {
      ref,
      onClick: handleClick,
      onKeyDown: handleKeyDown,
      "aria-expanded": isOpen,
      "aria-haspopup": true,
      role: "button",
      tabIndex: 0,
    }

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<{ className?: string }>, {
        ...commonProps,
        className: className 
          ? cn((children as React.ReactElement<{ className?: string }>).props.className, className)
          : (children as React.ReactElement<{ className?: string }>).props.className,
      })
    }

    return (
      <div
        {...commonProps}
        className={cn("cursor-pointer", className)}
      >
        {children}
      </div>
    )
  }
)
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "end"
}

const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ className, align = "end", children, ...props }, ref) => {
    const { isOpen } = React.useContext(DropdownMenuContext)
    const contentRef = React.useRef<HTMLDivElement>(null)
    const [focusIndex, setFocusIndex] = React.useState(-1)

    React.useEffect(() => {
      if (isOpen) {
        setFocusIndex(0)
      }
    }, [isOpen])

    const handleKeyDown = (e: React.KeyboardEvent) => {
      const items = contentRef.current?.querySelectorAll('[role="menuitem"]')
      if (!items?.length) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setFocusIndex(prev => (prev + 1) % items.length)
          break
        case 'ArrowUp':
          e.preventDefault()
          setFocusIndex(prev => (prev - 1 + items.length) % items.length)
          break
      }
    }

    React.useEffect(() => {
      const items = contentRef.current?.querySelectorAll('[role="menuitem"]')
      if (items?.[focusIndex]) {
        (items[focusIndex] as HTMLElement).focus()
      }
    }, [focusIndex])

    if (!isOpen) return null

    return (
      <div
        ref={contentRef}
        onKeyDown={handleKeyDown}
        className={cn(
          "absolute z-50 min-w-[8rem] rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          align === "end" ? "right-0" : "left-0",
          "mt-2",
          className
        )}
        role="menu"
        aria-orientation="vertical"
        {...props}
      >
        {children}
      </div>
    )
  }
)
DropdownMenuContent.displayName = "DropdownMenuContent"

interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  inset?: boolean
}

const DropdownMenuItem = React.forwardRef<HTMLDivElement, DropdownMenuItemProps>(
  ({ className, inset, onClick, ...props }, ref) => {
    const { onOpenChange } = React.useContext(DropdownMenuContext)

    const handleClick = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      if (onClick) {
        onClick(e)
      }
      onOpenChange(false)
    }, [onClick, onOpenChange])

    const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        e.stopPropagation()
        if (onClick) {
          onClick(e as any)
        }
        onOpenChange(false)
      }
    }, [onClick, onOpenChange])

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
          inset && "pl-8",
          className
        )}
        role="menuitem"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        {...props}
      />
    )
  }
)
DropdownMenuItem.displayName = "DropdownMenuItem"

interface DropdownMenuLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  inset?: boolean
}

const DropdownMenuLabel = React.forwardRef<HTMLDivElement, DropdownMenuLabelProps>(
  ({ className, inset, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "px-2 py-1.5 text-sm font-semibold",
        inset && "pl-8",
        className
      )}
      {...props}
    />
  )
)
DropdownMenuLabel.displayName = "DropdownMenuLabel"

const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    role="separator"
    {...props}
  />
))
DropdownMenuSeparator.displayName = "DropdownMenuSeparator"

const DropdownMenuGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("p-1", className)}
    role="group"
    {...props}
  />
))
DropdownMenuGroup.displayName = "DropdownMenuGroup"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
}
