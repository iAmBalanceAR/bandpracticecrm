"use client"

import * as React from "react"
import { type DialogProps } from "@radix-ui/react-dialog"
import { Command as CommandPrimitive } from "cmdk"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

type CommandComponent = React.ForwardRefExoticComponent<
  React.PropsWithoutRef<React.ComponentProps<typeof CommandPrimitive>> & 
  React.RefAttributes<HTMLDivElement>
>

const Command = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof CommandPrimitive>>(
  ({ className, ...props }, ref) => (
    <CommandPrimitive
      ref={ref}
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
        className
      )}
      {...props}
    />
  )
) as CommandComponent

type CommandInputComponent = React.ForwardRefExoticComponent<
  React.PropsWithoutRef<React.ComponentProps<typeof CommandPrimitive.Input>> & 
  React.RefAttributes<HTMLInputElement>
>

const CommandInput = React.forwardRef<HTMLInputElement, React.ComponentProps<typeof CommandPrimitive.Input>>(
  ({ className, ...props }, ref) => (
    <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
      <CommandPrimitive.Input
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none",
          className
        )}
        {...props}
      />
    </div>
  )
) as CommandInputComponent

type CommandListComponent = React.ForwardRefExoticComponent<
  React.PropsWithoutRef<React.ComponentProps<typeof CommandPrimitive.List>> & 
  React.RefAttributes<HTMLDivElement>
>

const CommandList = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof CommandPrimitive.List>>(
  ({ className, ...props }, ref) => (
    <CommandPrimitive.List
      ref={ref}
      className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
      {...props}
    />
  )
) as CommandListComponent

type CommandEmptyComponent = React.ForwardRefExoticComponent<
  React.PropsWithoutRef<React.ComponentProps<typeof CommandPrimitive.Empty>> & 
  React.RefAttributes<HTMLDivElement>
>

const CommandEmpty = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof CommandPrimitive.Empty>>(
  (props, ref) => (
    <CommandPrimitive.Empty
      ref={ref}
      className="py-6 text-center text-sm"
      {...props}
    />
  )
) as CommandEmptyComponent

type CommandGroupComponent = React.ForwardRefExoticComponent<
  React.PropsWithoutRef<React.ComponentProps<typeof CommandPrimitive.Group>> & 
  React.RefAttributes<HTMLDivElement>
>

const CommandGroup = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof CommandPrimitive.Group>>(
  ({ className, ...props }, ref) => (
    <CommandPrimitive.Group
      ref={ref}
      className={cn(
        "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
        className
      )}
      {...props}
    />
  )
) as CommandGroupComponent

type CommandItemComponent = React.ForwardRefExoticComponent<
  React.PropsWithoutRef<React.ComponentProps<typeof CommandPrimitive.Item>> & 
  React.RefAttributes<HTMLDivElement>
>

const CommandItem = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof CommandPrimitive.Item>>(
  ({ className, ...props }, ref) => (
    <CommandPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    />
  )
) as CommandItemComponent

export {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} 