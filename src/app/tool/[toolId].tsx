import { PremiumGate } from "@/components/tools/PremiumGate";
import { TOOL_REGISTRY } from "@/components/tools/registry";
import { ToolLoading } from "@/components/tools/ToolLoading";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useAvailableTools } from "@/hooks/useTools";
import { useToolInputs } from "@/hooks/useToolInputs";
import { petsApi } from "@/services/pets.api";
import { analytics, ToolAnalyticsEvents } from "@/services/analytics";
import {
  isServiceToolId,
  type ServiceToolId,
} from "@/shared/services-contract";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import React, { Suspense, useEffect } from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

/**
 * ToolScreen — the generic tool loader.
 *
 * Data-driven on the tool id: it resolves the component from the frontend
 * registry, applies the premium gate, lazy-mounts the component under a
 * loading skeleton, wires offline-first input persistence, and fires
 * telemetry — all WITHOUT any per-tool branching. Adding a tool never touches
 * this file. Cross-cutting concerns live here; tools stay pure and receive
 * only typed props (current pet, initial inputs, an inputs-change callback).
 */
export default function ToolScreen(): React.JSX.Element {
  const { toolId: rawToolId, petId } = useLocalSearchParams<{
    toolId: string;
    petId?: string;
  }>();

  const toolId = rawToolId as ServiceToolId;
  const petParam = petId ?? null;
  const entry = isServiceToolId(rawToolId) ? TOOL_REGISTRY[toolId] : undefined;
  const persistsResult = entry?.persistsResult ?? false;

  const { data: tools } = useAvailableTools();
  const meta = tools?.find((t) => t.id === toolId);

  const petQuery = useQuery({
    queryKey: ["pet", petParam],
    queryFn: () => petsApi.get(petParam as string).then((r) => r.data),
    enabled: Boolean(petParam),
  });
  const pet = petQuery.data ?? null;

  const persistence = useToolInputs(
    toolId,
    petParam,
    persistsResult && Boolean(entry),
  );

  // Telemetry: tool opened — automatic, centralized, fires for every tool.
  useEffect(() => {
    if (entry) {
      analytics.track(ToolAnalyticsEvents.OPENED, { toolId, petId: petParam });
    }
  }, [entry, toolId, petParam]);

  if (!entry) {
    return (
      <Screen>
        <ScreenHeader title={rawToolId ?? ""} />
        <View style={styles.center}>
          <Text style={styles.unavailable}>—</Text>
        </View>
      </Screen>
    );
  }

  const ToolComponent = entry.component;

  return (
    <Screen>
      <ScreenHeader title={meta?.title ?? rawToolId} />
      <PremiumGate locked={meta?.locked ?? false}>
        <Suspense fallback={<ToolLoading />}>
          <ToolComponent
            pet={pet}
            initialInputs={persistence.inputs}
            onInputsChange={(inputs) => {
              if (!persistsResult) return;
              void persistence.save(inputs).then(() => {
                // A successful save is the "tool completed" signal —
                // centralized here so every tool is tracked automatically.
                analytics.track(ToolAnalyticsEvents.COMPLETED, {
                  toolId,
                  petId: petParam,
                });
              });
            }}
          />
        </Suspense>
      </PremiumGate>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.xl,
  },
  unavailable: {
    ...theme.typography.footnote,
    color: theme.colors.textSecondary,
  },
}));
