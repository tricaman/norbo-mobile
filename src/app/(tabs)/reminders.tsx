import { RemindersList } from "@/components/reminders/RemindersList";
import { TabScreen } from "@/components/ui/TabScreen";
import React from "react";
import { useTranslation } from "react-i18next";

export default function RemindersTab(): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <TabScreen title={t("reminders.title")} edges={["top"]}>
      <RemindersList />
    </TabScreen>
  );
}
