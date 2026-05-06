import type { ApiError } from "@/hooks/useMutation";
import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";
import React from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface QueryBoundaryMeta {
  refetch: () => void;
  isFetching: boolean;
}

interface QueryBoundaryProps<TData, TError = ApiError> {
  query: UseQueryResult<TData, TError>;
  children: (data: TData, meta: QueryBoundaryMeta) => ReactNode;
  LoadingComponent?: React.ComponentType;
  ErrorComponent?: React.ComponentType<{ error: TError }>;
  EmptyComponent?: React.ComponentType;
  isEmpty?: (data: TData) => boolean;
  showEmptyComponent?: boolean;
}

const defaultIsEmpty = <T,>(data: T): boolean => {
  if (data == null) return true;
  if (Array.isArray(data)) return data.length === 0;
  if (typeof data === "object") return Object.keys(data as object).length === 0;
  return false;
};

function DefaultLoader() {
  const { theme } = useUnistyles();
  return (
    <View style={styles.center}>
      <ActivityIndicator color={theme.colors.primary} />
    </View>
  );
}

function DefaultError<TError>({ error }: { error: TError }) {
  const apiError = (error as ApiError).response?.data;
  return (
    <View style={styles.center}>
      <Text style={styles.errorText}>
        {apiError?.message ?? "Something went wrong"}
      </Text>
    </View>
  );
}

function DefaultEmpty() {
  return (
    <View style={styles.center}>
      <Text style={styles.emptyText}>No data available</Text>
    </View>
  );
}

export function QueryBoundary<TData, TError = ApiError>({
  query,
  children,
  LoadingComponent = DefaultLoader,
  ErrorComponent,
  EmptyComponent = DefaultEmpty,
  isEmpty = defaultIsEmpty,
  showEmptyComponent = true,
}: QueryBoundaryProps<TData, TError>) {
  const { theme } = useUnistyles();
  const { data, status, error, fetchStatus, refetch } = query;

  if (status === "pending" && fetchStatus === "idle") {
    return null;
  }

  if (status === "pending" || status === "error") {
    return (
      <ScrollView
        contentContainerStyle={styles.nonSuccessContent}
        refreshControl={
          <RefreshControl
            refreshing={status === "error" && fetchStatus === "fetching"}
            onRefresh={refetch}
            tintColor={theme.colors.primary}
          />
        }
      >
        {status === "pending" ? (
          <LoadingComponent />
        ) : ErrorComponent ? (
          <ErrorComponent error={error as TError} />
        ) : (
          <DefaultError error={error} />
        )}
      </ScrollView>
    );
  }

  if (isEmpty(data)) {
    if (!showEmptyComponent) return null;
    return EmptyComponent ? <EmptyComponent /> : null;
  }

  return (
    <>{children(data, { refetch, isFetching: fetchStatus === "fetching" })}</>
  );
}

const styles = StyleSheet.create((theme) => ({
  center: {
    alignItems: "center",
    paddingTop: theme.spacing["3xl"],
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  errorText: {
    ...theme.typography.footnote,
    color: theme.colors.error,
    textAlign: "center",
  },
  errorCode: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    textAlign: "center",
  },
  emptyText: {
    ...theme.typography.footnote,
    color: theme.colors.textTertiary,
    textAlign: "center",
  },
  nonSuccessContent: {
    flexGrow: 1,
  },
}));
