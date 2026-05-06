import { haptics } from "@/utils/haptics";
import { toast } from "@/utils/toast";
import {
  useMutation as useReactQueryMutation,
  type UseMutationOptions,
  type UseMutationResult,
} from "@tanstack/react-query";
import type { AxiosError } from "axios";

export interface ApiErrorResponse {
  statusCode: number;
  errorCode: string;
  message: string;
  errorId: string;
  timestamp: string;
}

export type ApiError = AxiosError<ApiErrorResponse>;

interface UseMutationEnhancedOptions<
  TData,
  TError,
  TVariables,
  TContext,
> extends Omit<
  UseMutationOptions<TData, TError, TVariables, TContext>,
  "onSuccess" | "onError"
> {
  onSuccess?: (
    data: TData,
    variables: TVariables,
    context: TContext | undefined,
  ) => void | Promise<void>;
  onError?: (
    error: TError,
    variables: TVariables,
    context: TContext | undefined,
  ) => void | Promise<void>;
  triggerHaptics?: boolean;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string | ((data: TData) => string);
  errorMessage?: string | ((error: TError) => string);
}

export function useMutation<
  TData = unknown,
  TError = ApiError,
  TVariables = void,
  TContext = unknown,
>(
  options: UseMutationEnhancedOptions<TData, TError, TVariables, TContext>,
): UseMutationResult<TData, TError, TVariables, TContext> {
  const {
    onSuccess: customOnSuccess,
    onError: customOnError,
    triggerHaptics = true,
    showSuccessToast = false,
    showErrorToast = true,
    successMessage,
    errorMessage,
    ...mutationOptions
  } = options;

  return useReactQueryMutation<TData, TError, TVariables, TContext>({
    ...mutationOptions,
    onSuccess: async (data, variables, context) => {
      if (triggerHaptics) haptics.success();
      if (showSuccessToast) {
        const message =
          typeof successMessage === "function"
            ? successMessage(data)
            : (successMessage ?? "Done");
        toast.show({ type: "success", title: message });
      }
      await customOnSuccess?.(data, variables, context);
    },
    onError: async (error, variables, context) => {
      if (triggerHaptics) haptics.error();
      if (showErrorToast) {
        const apiError = (error as ApiError).response?.data;
        const message =
          typeof errorMessage === "function"
            ? errorMessage(error)
            : (errorMessage ?? apiError?.message ?? "Something went wrong");
        toast.show({
          type: "error",
          title: message,
        });
      }
      await customOnError?.(error, variables, context);
    },
  });
}
