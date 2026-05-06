import Constants from "expo-constants";
import * as Linking from "expo-linking";

const scheme = Constants.expoConfig?.scheme || "dit";

export const AUTH_CALLBACK_URL = `${scheme}://auth/callback`;
export const AUTH_REDIRECT_URL = Linking.createURL("auth/callback");
