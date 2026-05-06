import { registerBackgroundHandler } from "./services/notifications";
import "./theme/unistyles";

// Must be registered at module scope before the app component renders
registerBackgroundHandler();

import "expo-router/entry";
