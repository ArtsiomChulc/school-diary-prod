import { useState } from "react";
import { userStore } from "../store/UserStore.tsx";

export const useTermSelection = () => {
  const [selection, setSelection] = useState<{
    yearId: string | null;
    termId: string;
  } | null>(null);

  const { currentYearId, currentTerms } = userStore;
  const [now] = useState(() => Date.now());

  // 1. Вычисляем четверть по умолчанию (на основе текущей даты или флага)
  const defaultTerm =
    currentTerms.find(
      (term) =>
        term.startDate.toMillis() <= now &&
        term.endDate.toMillis() >= now,
    ) ??
    currentTerms.find((term) => !term.isCompleted) ??
    currentTerms[0];

  // 2. Получаем ID текущей выбранной четверти
  const selectedTerm =
    selection?.yearId === currentYearId &&
    currentTerms.some(
      (term) => term.id === selection.termId,
    )
      ? selection.termId
      : (defaultTerm?.id ?? "");

  // 3. НОВОЕ: Находим сам объект выбранной четверти, чтобы узнать её параметры
  const activeTermObject = currentTerms.find(
    (term) => term.id === selectedTerm,
  );

  return {
    // Массив вкладок с флагом completes для рендера табов
    terms: currentTerms.map((term) => ({
      key: term.id,
      label: term.name,
      tableLabel: term.name,
      isCompleted: term.isCompleted,
    })),
    selectedTerm,
    // НОВОЕ: Флаг для блокировки кнопки выставления оценок на страницах журнала
    isSelectionCompleted:
      activeTermObject?.isCompleted ?? false,
    onSelectTerm: (termId: string) =>
      setSelection({ yearId: currentYearId, termId }),
  };
};
