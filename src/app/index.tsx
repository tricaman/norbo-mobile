import { useAuthStore } from "@/stores/auth.store";
import { Redirect } from "expo-router";

export default function Index() {
  const isAuthed = useAuthStore((s) => s.isAuthed);
  return <Redirect href={isAuthed ? "/(tabs)" : "/(auth)"} />;
}
