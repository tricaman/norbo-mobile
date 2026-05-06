import type { ApiErrorResponse } from "@/hooks/useMutation";
import { AxiosError } from "axios";

export function extractError(e: unknown): string {
  if (e instanceof AxiosError) {
    const data = e.response?.data as ApiErrorResponse | undefined;
    if (typeof data?.message === "string") return data.message;
    return e.message;
  }
  if (e instanceof Error) return e.message;
  return "Something went wrong";
}
