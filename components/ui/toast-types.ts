import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { VariantProps } from "class-variance-authority"
import { toastVariants } from "./toast-variants"

export type ToastViewportElement = HTMLOListElement
export type ToastRootElement = HTMLLIElement
export type ToastActionElement = HTMLButtonElement
export type ToastCloseElement = HTMLButtonElement
export type ToastTitleElement = HTMLDivElement
export type ToastDescriptionElement = HTMLDivElement
export type ToastTitleProps = ToastPrimitives.ToastTitleProps

export type ToastViewportProps = ToastPrimitives.ToastViewportProps
export type ToastProps = ToastPrimitives.ToastProps & 
  VariantProps<typeof toastVariants> & {
    variant?: "default" | "destructive";
    title?: React.ReactNode;
    description?: React.ReactNode;
    action?: React.ReactNode;
}
export type ToastActionProps = ToastPrimitives.ToastActionProps
export type ToastCloseProps = ToastPrimitives.ToastCloseProps
export type ToastDescriptionProps = ToastPrimitives.ToastDescriptionProps