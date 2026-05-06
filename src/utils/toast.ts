import React from "react";

export type ToastType = "success" | "warning" | "error";

export interface ToastOptions {
  type: ToastType;
  title: string;
  subtitle?: string;
  /** Auto-dismiss delay in ms. Defaults to 3500. */
  duration?: number;
}

export interface ToastHandle {
  show: (options: ToastOptions) => void;
  hide: () => void;
}

/** Global ref set by ToastProvider. Do not use directly — call `toast.show()`. */
export const toastRef = React.createRef<ToastHandle>();

export const toast = {
  show: (options: ToastOptions) => toastRef.current?.show(options),
  hide: () => toastRef.current?.hide(),
};
