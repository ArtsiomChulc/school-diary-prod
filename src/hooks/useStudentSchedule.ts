import { userStore } from "../store/UserStore.tsx";
import { useState, useEffect } from "react";
import { scheduleStore } from "../store/ScheduleStore.ts";
import type { DayOfWeek } from "../services/ScheduleService.ts";

const DAYS_TRANSLATIONS: Record<DayOfWeek, string> = {
  monday: "ПН",
  tuesday: "ВТ",
  wednesday: "СР",
  thursday: "ЧТ",
  friday: "ПТ",
  saturday: "СБ",
};

export const useStudentSchedule = () => {
  const classId = userStore.profile?.classId;
  const [selectedDay, setSelectedDay] =
    useState<DayOfWeek>("monday");

  useEffect(() => {
    if (classId)
      void scheduleStore.fetchSchedule(
        classId,
        selectedDay,
      );
    else scheduleStore.reset();
    return () => scheduleStore.reset();
  }, [classId, selectedDay]);
  const matchesSelection =
    scheduleStore.classId === classId &&
    scheduleStore.dayId === selectedDay;

  const termSelectorProps = {
    terms: (
      Object.keys(DAYS_TRANSLATIONS) as DayOfWeek[]
    ).map((day) => ({
      key: day,
      label: DAYS_TRANSLATIONS[day],
    })),
    selectedTerm: selectedDay,
    onSelectTerm: (dayId: DayOfWeek) =>
      setSelectedDay(dayId),
  };

  return {
    termSelectorProps,
    schedule: matchesSelection
      ? scheduleStore.currentSchedule
      : null,
    isLoading:
      !!classId &&
      (!matchesSelection || scheduleStore.isLoading),
    error: matchesSelection ? scheduleStore.error : null,
    classId,
    retry: () => {
      if (classId)
        void scheduleStore.fetchSchedule(
          classId,
          selectedDay,
        );
    },
  };
};
