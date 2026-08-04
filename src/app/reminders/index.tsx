import { RemindersList } from "@/components/reminders/RemindersList";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import React from "react";
import { useTranslation } from "react-i18next";

/**
 * Full reminders screen, reached from the "see all" CTA of the home section.
 * Lives outside the tab group: the tab slot it used to occupy now hosts the
 * notifications inbox.
 *
 * `edges={["top"]}` on purpose — `RemindersList` already pads its list with
 * SCREEN_BOTTOM_PADDING, so also applying the bottom safe-area inset here
 * would double-count it.
 */
export default function RemindersScreen(): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <Screen edges={["top"]}>
      <ScreenHeader title={t("reminders.title")} variant="simple" />
      <RemindersList />
    </Screen>
  );
}
