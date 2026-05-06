import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Toast } from "./Toast";
import { toastRef } from "@/utils/toast";

interface ToastProviderProps {
  children: React.ReactNode;
}

/**
 * ToastProvider — add once at the app root, inside GestureHandlerRootView
 * and SafeAreaProvider. The overlay sits above all content but passes
 * touches through when no toast is visible (pointerEvents="box-none").
 *
 * Usage:
 *   <ToastProvider>
 *     <YourApp />
 *   </ToastProvider>
 *
 * Then from anywhere:
 *   import { toast } from "@/utils/toast";
 *   toast.show({ type: "success", title: "Saved!", subtitle: "Changes persisted." });
 */
export function ToastProvider({ children }: ToastProviderProps) {
  return (
    <View style={styles.root}>
      {children}
      {/* Overlay: box-none so touches pass through when toast is hidden */}
      <View style={styles.overlay} pointerEvents="box-none">
        <Toast ref={toastRef} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create((_theme) => ({
  root: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
}));
