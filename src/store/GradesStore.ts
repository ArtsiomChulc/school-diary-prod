import {
  makeAutoObservable,
  reaction,
  runInAction,
} from "mobx";
import {
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "../../firebase.ts";
import { type IGrade, userStore } from "./UserStore.tsx";
import { firestoreRequest as readFirestore } from "../utils/firestoreRequest";

export interface Grade {
  id: string;
  comment: string;
  createdAt: Timestamp;
  isFinal: boolean;
  studentId: string;
  subjectId: string;
  termId: string;
  value: number;
  yearId: string;
}

class GradesStore {
  monthGrades: IGrade[] = [];
  selectedDate: Date | null = new Date();
  currentMonth: Date = new Date(); // Месяц, который сейчас открыт в календаре
  isLoading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);

    // Автоматически перезагружаем оценки за месяц, если авторизовался ученик или родитель переключил ребёнка
    reaction(
      () => this.studentId,
      (studentId) => {
        if (studentId) {
          void this.fetchGradesForMonth(this.currentMonth);
        } else {
          this.monthGrades = [];
        }
      },
      { fireImmediately: true },
    );
  }

  get studentId(): string | null {
    return userStore.profile?.uid ?? null;
  }

  // Computed: оценки только за выбранный день (фильтруются локально без запросов в БД)
  get gradesForSelectedDate(): IGrade[] {
    // Если дата в новом месяце ещё не выбрана, возвращаем пустой список
    if (!this.selectedDate) return [];

    return this.monthGrades.filter((grade) => {
      if (grade.isFinal) return false;

      const d = grade.createdAt.toDate();
      return (
        d.getFullYear() ===
          this.selectedDate!.getFullYear() &&
        d.getMonth() === this.selectedDate!.getMonth() &&
        d.getDate() === this.selectedDate!.getDate()
      );
    });
  }

  // Computed: множество дат (в формате "YYYY-MM-DD"), в которые есть оценки, для быстрой подсветки
  get daysWithGrades(): Set<string> {
    const days = new Set<string>();
    for (const grade of this.monthGrades) {
      if (grade.isFinal) continue; // Не ставим точку в календаре для итоговых оценок

      const d = grade.createdAt.toDate();
      days.add(
        `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`,
      );
    }
    return days;
  }

  // Проверка для ячейки календаря
  hasGradesOnDate(date: Date): boolean {
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return this.daysWithGrades.has(key);
  }

  // Клик по конкретному дню (работает мгновенно, без запроса в Firestore)
  selectDate = (date: Date) => {
    this.selectedDate = date;
  };

  // Переключение месяца в календаре (загружает оценки за новый месяц)
  changeMonth = (newMonthDate: Date) => {
    this.currentMonth = newMonthDate;
    this.selectedDate = null;
    void this.fetchGradesForMonth(newMonthDate);
  };

  // Запрос оценок за весь месяц (с 1-го по последнее число)
  async fetchGradesForMonth(monthDate: Date) {
    if (!this.studentId) return;

    this.isLoading = true;
    this.error = null;

    try {
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();

      // 1-е число месяца, 00:00:00.000
      const startOfMonth = new Date(
        year,
        month,
        1,
        0,
        0,
        0,
        0,
      );
      // Последнее число месяца (день 0 следующего месяца), 23:59:59.999
      const endOfMonth = new Date(
        year,
        month + 1,
        0,
        23,
        59,
        59,
        999,
      );

      const q = query(
        collection(db, "grades"),
        where("studentId", "==", this.studentId),
        where(
          "createdAt",
          ">=",
          Timestamp.fromDate(startOfMonth),
        ),
        where(
          "createdAt",
          "<=",
          Timestamp.fromDate(endOfMonth),
        ),
        orderBy("createdAt", "desc"),
      );

      const snapshot = await readFirestore(getDocs(q));

      const loadedGrades: IGrade[] = snapshot.docs.map(
        (doc) => ({
          ...(doc.data() as Omit<IGrade, "id">),
          id: doc.id,
        }),
      );

      runInAction(() => {
        this.monthGrades = loadedGrades;
        this.isLoading = false;
      });
    } catch (e) {
      runInAction(() => {
        this.error =
          e instanceof Error
            ? e.message
            : "Ошибка загрузки оценок за месяц";
        this.isLoading = false;
      });
    }
  }
}

export const gradesStore = new GradesStore();