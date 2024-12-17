"use client"

import * as React from "react"
import { User } from "lucide-react"
import { cn } from "@/lib/utils"

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={alt || "Avatar"}
          className="aspect-square h-full w-full"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-muted">
          <User className="h-6 w-6" />
        </div>
      )}
    </div>
  )
)
Avatar.displayName = "Avatar"

export { Avatar }
