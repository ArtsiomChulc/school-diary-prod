import { makeAutoObservable, runInAction } from "mobx";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth, db } from "../../firebase.ts";
import toast from "react-hot-toast";

import { firestoreRequest as readFirestore } from "../utils/firestoreRequest.ts";

export interface IAcademicYear {
  id: string; // Например, "year_2026_2027"
  name: string; // "2026/2027 учебный год"
  startDate: Timestamp; // Дата начала учебного года
  endDate: Timestamp; // Дата окончания учебного года
  isCompleted: boolean; // Флаг завершения учебного года
}

// Учебная четверть (Подколлекция "academic_years/[yearId]/terms")
export interface ITerm {
  id: string; // "term_1", "term_2", "term_3", "term_4"
  name: string; // "1 четверть"
  startDate: Timestamp; // Дата начала четверти
  endDate: Timestamp; // Дата окончания каникул/четверти
  isCompleted: boolean; // Флаг завершения/блокировки четверти
}

// Предмет (Коллекция "subjects")
export interface ISubject {
  id: string; // "sub_math", "sub_rus"
  name: string; // "Математика", "Русский язык"
}

// ==========================================
// 2. ПОЛЬЗОВАТЕЛИ И ПРОФИЛИ
// ==========================================

// Профиль ученика (Коллекция "students")
export interface IStudentProfile {
  uid: string; // Идентификатор, равный Auth UID
  name: string; // "Иванов Алексей Иванович"
  classId: string; // "4_A"
  parents: string[]; // Массив ID родителей: ["parent_id_1", "parent_id_2"]
  telegramChatIds: string | string[];
  BOT_TOKEN: string;
}

// Профиль родителя (Коллекция "users_parents")
export interface IParentProfile {
  uid: string; // Идентификатор, равный Auth UID
  name: string; // "Иванов Иван Иванович"
  email: string; // "parent1@example.com"
  role: string; // Фиксированная роль
  children: string[]; // Массив ID детей учеников: ["student_id_1", "student_id_2"]
}

// ==========================================
// 3. ЖУРНАЛ ОЦЕНОК (Коллекция "grades")
// ==========================================

// Одиночная оценка (Документ в коллекции "grades")
export interface IGrade {
  id: string; // Уникальный ID документа оценки
  studentId: string; // ID ученика
  yearId: string; // ID учебного года
  termId: string; // ID четверти
  subjectId: string; // ID предмета
  value: number; // Оценка от 1 до 10
  comment?: string; // Комментарий ("Ответ у доски", "Контрольная")
  createdAt: Timestamp; // Дата постановки оценки
  isFinal: boolean; // true — если это итоговая четвертная оценка, false — текущая
}

// ==========================================
// 4. ДЛЯ ИНТЕРФЕЙСА (Интегрированные данные для рендера табеля)
// ==========================================

// Структурированные оценки по одному предмету для вывода в строку
export interface ISubjectMarksUI {
  subjectId: string;
  subjectName: string;
  currentMarks: IGrade[]; // Только текущие оценки (isFinal: false)
  finalMark: IGrade | null; // Четвертная оценка (isFinal: true)
}

export type TermKey =
  "term_1" | "term_2" | "term_3" | "term_4";

export class UserStore {
  user: FirebaseUser | null = null;
  public currentUserProfile:
    IStudentProfile | IParentProfile | null = null;
  private studentProfile: IStudentProfile | null = null;
  public academicYears: IAcademicYear[] = [];
  public currentYearId: string | null = null;
  public currentTerms: ITerm[] = [];

  getSubjectMarks(termId: string): ISubjectMarksUI[] {
    return Object.values(
      this.currentStudentSubjects ?? {},
    ).map((subject) => {
      const grades = this.currentGrades.filter(
        (grade) =>
          grade.studentId === this.studentProfile?.uid &&
          grade.subjectId === subject.id &&
          grade.termId === termId &&
          grade.yearId === this.currentYearId,
      );
      return {
        subjectId: subject.id,
        subjectName: subject.name,
        currentMarks: grades.filter(
          (grade) => !grade.isFinal,
        ),
        finalMark:
          grades.find((grade) => grade.isFinal) ?? null,
      };
    });
  }

  get profile(): IStudentProfile | null {
    return this.studentProfile;
  }

  private clearStudentData() {
    this.studentProfile = null;
    this.currentGrades = [];
    this.currentStudentSubjects = null;
    this.academicYears = [];
    this.currentYearId = null;
    this.currentTerms = [];
  }
  public isLoading: boolean = true;
  public isAuthReady = false;
  public isSigningIn = false;
  public isSavingGrade = false;
  private studentRequestId = 0;
  public profileError: string | null = null;
  public currentGrades: IGrade[] = [];
  public currentStudentSubjects: Record<
    string,
    ISubject
  > | null = null;
  authError: string | null = null;

  constructor() {
    makeAutoObservable(this);
    this.initAuthListener();
  }

  private initAuthListener() {
    onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        runInAction(() => {
          this.isAuthReady = true;
          this.profileError = null;
          this.clearStudentData();
          this.currentUserProfile = null;
          this.user = currentUser;
          this.isLoading = true;
        });

        void this.fetchUserProfile(currentUser.uid);
      } else {
        runInAction(() => {
          this.isAuthReady = true;
          this.profileError = null;
          this.user = null;
          this.currentUserProfile = null;
          this.clearStudentData();
          this.isLoading = false;
        });
      }
    });
  }

  retryProfile = async () => {
    if (this.user)
      await this.fetchUserProfile(this.user.uid);
  };

  private async fetchUserProfile(
    uid: string,
  ): Promise<void> {
    try {
      // Включаем индикатор загрузки перед началом асинхронных операций
      runInAction(() => {
        this.isLoading = true;
        this.profileError = null;
      });

      // 1. Ищем пользователя в коллекции учеников (students)
      const studentDocRef = doc(db, "students", uid);
      const studentDocSnap = await readFirestore(
        getDoc(studentDocRef),
      );
      if (this.user?.uid !== uid) return;

      if (studentDocSnap.exists()) {
        // Извлекаем данные через .data() и приводим к типу
        const studentData = {
          ...studentDocSnap.data(),
          uid: studentDocSnap.id,
        } as IStudentProfile;

        runInAction(() => {
          this.currentUserProfile = studentData;
        });
        await this.loadStudentProfile(uid);
        return;
      }

      // 2. Если не нашли среди учеников, ищем в коллекции родителей (users_parents)
      const parentDocRef = doc(db, "users_parents", uid);
      const parentDocSnap = await readFirestore(
        getDoc(parentDocRef),
      );
      if (this.user?.uid !== uid) return;

      if (parentDocSnap.exists()) {
        const parentData = {
          ...parentDocSnap.data(),
          uid: parentDocSnap.id,
        } as IParentProfile;

        runInAction(() => {
          this.currentUserProfile = parentData;
        });

        // В Firestore роли связаны через обычный массив строк ["student_id_1", "student_id_2"]
        if (
          parentData.children &&
          parentData.children.length > 0
        ) {
          // Автоматически загружаем профиль первого ребенка (индекс 0) из массива
          await this.loadStudentProfile(
            parentData.children[0],
          );
        } else {
          runInAction(() => {
            this.isLoading = false;
          });
        }
        return;
      }

      // 3. Если uid авторизован, но записей в базах данных нет
      toast.error(
        "Документ пользователя не найден в базе данных",
      );
      runInAction(() => {
        this.currentUserProfile = null;
        this.clearStudentData();
        this.profileError =
          "Документ пользователя не найден в базе данных";
        this.isLoading = false;
      });
    } catch (error) {
      if (this.user?.uid !== uid) return;
      toast.error("Ошибка при получении профиля");
      console.error("Ошибка при получении профиля:", error);
      runInAction(() => {
        this.profileError =
          error instanceof Error
            ? error.message
            : "Ошибка при получении профиля";
        this.isLoading = false;
      });
    } finally {
      // ОБЯЗАТЕЛЬНЫЙ БЛОК: Выполняется ВСЕГДА, даже при ошибках и return.
      // Гарантирует избавление от вечной загрузки.
      if (this.user?.uid === uid)
        runInAction(() => {
          this.isLoading = false;
        });
    }
  }

  private async fetchStudentSubjects(): Promise<
    Record<string, ISubject>
  > {
    try {
      // 1. Загружаем глобальный справочник предметов из коллекции "subjects"
      const subjectsCollRef = collection(db, "subjects");
      const subjectsSnap = await readFirestore(
        getDocs(subjectsCollRef),
      );

      const subjectsMap: Record<string, ISubject> = {};

      subjectsSnap.forEach((subjectDoc) => {
        subjectsMap[subjectDoc.id] = {
          ...subjectDoc.data(),
          id: subjectDoc.id,
        } as ISubject;
      });

      // 2. Возвращаем карту предметов { "sub_math": { id: "sub_math", name: "Математика" }, ... }
      return subjectsMap;
    } catch (error) {
      console.error(
        "Ошибка при получении предметов:",
        error,
      );
      throw error;
    }
  }

  loadStudentProfile = async (studentUid: string) => {
    const authUid = this.user?.uid;
    const requestId = ++this.studentRequestId;
    runInAction(() => {
      this.isLoading = true;
      this.profileError = null;
      this.clearStudentData();
    });
    try {
      const [studentDoc, subjects, yearsSnapshot] =
        await Promise.all([
          readFirestore(
            getDoc(doc(db, "students", studentUid)),
          ),
          this.fetchStudentSubjects(),
          readFirestore(
            getDocs(collection(db, "academic_years")),
          ),
        ]);
      if (!studentDoc.exists())
        throw new Error("Документ ребенка не найден");
      const years = yearsSnapshot.docs
        .map(
          (item) =>
            ({
              ...item.data(),
              id: item.id,
            }) as IAcademicYear,
        )
        .sort(
          (a, b) =>
            b.startDate.toMillis() - a.startDate.toMillis(),
        );
      const year =
        years.find((item) => !item.isCompleted) ?? years[0];
      const [gradesSnapshot, termsSnapshot] = year
        ? await Promise.all([
            readFirestore(
              getDocs(
                query(
                  collection(db, "grades"),
                  where("studentId", "==", studentUid),
                  where("yearId", "==", year.id),
                ),
              ),
            ),
            readFirestore(
              getDocs(
                collection(
                  db,
                  "academic_years",
                  year.id,
                  "terms",
                ),
              ),
            ),
          ])
        : [null, null];
      if (
        this.user?.uid !== authUid ||
        requestId !== this.studentRequestId
      )
        return;
      runInAction(() => {
        this.studentProfile = {
          ...studentDoc.data(),
          uid: studentDoc.id,
        } as IStudentProfile;
        this.currentStudentSubjects = subjects;
        this.academicYears = years;
        this.currentYearId = year?.id ?? null;
        this.currentTerms = (
          termsSnapshot?.docs.map(
            (item) =>
              ({ ...item.data(), id: item.id }) as ITerm,
          ) ?? []
        ).sort(
          (a, b) =>
            a.startDate.toMillis() - b.startDate.toMillis(),
        );
        this.currentGrades = (
          gradesSnapshot?.docs.map(
            (item) =>
              ({ ...item.data(), id: item.id }) as IGrade,
          ) ?? []
        ).sort(
          (a, b) =>
            a.createdAt.toMillis() -
              b.createdAt.toMillis() ||
            a.id.localeCompare(b.id),
        );
      });
    } catch (error) {
      if (
        this.user?.uid !== authUid ||
        requestId !== this.studentRequestId
      )
        return;
      runInAction(() => {
        this.profileError =
          error instanceof Error
            ? error.message
            : "Ошибка при загрузке профиля ребенка";
      });
      toast.error("Ошибка при загрузке профиля ребенка");
      console.error(
        "Ошибка при загрузке профиля ребенка:",
        error,
      );
    } finally {
      if (
        this.user?.uid === authUid &&
        requestId === this.studentRequestId
      )
        runInAction(() => {
          this.isLoading = false;
        });
    }
  };

  get currentAcademicYearName(): string {
    // Находим объект года в массиве academicYears по текущему ID
    const activeYear = this.academicYears.find(
      (year) => year.id === this.currentYearId,
    );

    // Если нашли — возвращаем его имя, иначе — заглушку
    return activeYear
      ? activeYear.name
      : "Учебный год не выбран";
  }

  private sendTelegramNotification = async (
    chatId: string | string[],
    text: string,
    bot_token: string,
  ) => {
    const base = "https://api.telegram.org";

    if (!bot_token) {
      toast.error(
        "Критическая ошибка: Токен Telegram не найден в .env!",
      );
      return;
    }

    const action = "/bot" + bot_token + "/sendMessage";
    const rawChatIds = Array.isArray(chatId)
      ? chatId
      : [chatId];
    const chatIds = rawChatIds
      .filter(Boolean)
      .map((id) => String(id).trim());

    try {
      const requests = chatIds.map(async (trimmedId) => {
        if (!trimmedId) return;

        const url = new URL(base + action);
        url.searchParams.append("chat_id", trimmedId);
        url.searchParams.append("text", text);
        url.searchParams.append("parse_mode", "HTML");

        return fetch(url.toString(), { mode: "no-cors" });
      });

      await Promise.all(requests);
      toast.success(`Уведомления отправлены в Telegram`);
    } catch (error) {
      console.error(
        "Не удалось отправить сообщения в Telegram:",
        error,
      );
    }
  };

  addMarkAndSave = async (
    studentUid: string,
    subjectId: string,
    termId: string,
    value: number,
    comment = "",
  ): Promise<boolean> => {
    if (
      !this.currentYearId ||
      !this.currentStudentSubjects?.[subjectId] ||
      !this.currentTerms.some(
        (term) => term.id === termId,
      ) ||
      !Number.isInteger(value) ||
      value < 1 ||
      value > 10
    )
      return false;
    const gradeRef = doc(collection(db, "grades"));
    const grade: IGrade = {
      id: gradeRef.id,
      studentId: studentUid,
      subjectId,
      yearId: this.currentYearId,
      termId,
      value,
      createdAt: Timestamp.now(),
      isFinal: false,
      ...(comment.trim()
        ? { comment: comment.trim() }
        : {}),
    };
    return this.saveGrade(grade);
  };

  restoreGrade = async (grade: IGrade): Promise<boolean> =>
    this.saveGrade(grade);

  // Persist the regular grade and its rounded term average atomically.
  private async saveGradeWithTermFinal(
    grade: IGrade,
    deleted = false,
  ): Promise<IGrade[]> {
    const batch = writeBatch(db);
    const gradeRef = doc(db, "grades", grade.id);
    if (deleted) batch.delete(gradeRef);
    else batch.set(gradeRef, grade);

    let nextGrades = this.currentGrades.filter(
      (item) => item.id !== grade.id,
    );
    if (!deleted) nextGrades.push(grade);

    if (!grade.isFinal) {
      const matchesTerm = (item: IGrade) =>
        item.studentId === grade.studentId &&
        item.yearId === grade.yearId &&
        item.termId === grade.termId &&
        item.subjectId === grade.subjectId;
      const termGrades = nextGrades.filter(matchesTerm);
      const marks = termGrades.filter(
        (item) => !item.isFinal,
      );
      const finals = termGrades.filter(
        (item) => item.isFinal,
      );
      nextGrades = nextGrades.filter(
        (item) => !matchesTerm(item) || !item.isFinal,
      );
      const existingFinal = finals[0];
      if (marks.length) {
        const finalRef = existingFinal
          ? doc(db, "grades", existingFinal.id)
          : doc(collection(db, "grades"));
        const finalGrade: IGrade = {
          id: finalRef.id,
          studentId: grade.studentId,
          yearId: grade.yearId,
          termId: grade.termId,
          subjectId: grade.subjectId,
          value: Math.round(
            marks.reduce(
              (sum, item) => sum + item.value,
              0,
            ) / marks.length,
          ),
          createdAt:
            existingFinal?.createdAt ?? Timestamp.now(),
          isFinal: true,
        };
        batch.set(finalRef, finalGrade);
        nextGrades.push(finalGrade);
      }
      for (const final of finals) {
        if (!marks.length || final.id !== existingFinal?.id)
          batch.delete(doc(db, "grades", final.id));
      }
    }

    await batch.commit();
    return nextGrades.sort(
      (a, b) =>
        a.createdAt.toMillis() - b.createdAt.toMillis() ||
        a.id.localeCompare(b.id),
    );
  }

  private async saveGrade(grade: IGrade): Promise<boolean> {
    if (
      !this.user ||
      !this.currentUserProfile ||
      this.profile?.uid !== grade.studentId ||
      this.currentYearId !== grade.yearId ||
      this.isSavingGrade
    )
      return false;
    const student = this.profile;
    const user = this.currentUserProfile;
    this.isSavingGrade = true;
    try {
      const nextGrades =
        await this.saveGradeWithTermFinal(grade);
      runInAction(() => {
        if (
          this.profile?.uid === grade.studentId &&
          this.currentYearId === grade.yearId
        ) {
          this.currentGrades = nextGrades;
        }
      });
      toast.success(`Оценка ${grade.value} сохранена.`);
      void this.notifyGradeChange(
        student,
        user,
        grade,
        false,
      );
      return true;
    } catch (error) {
      toast.error("Ошибка при сохранении оценки");
      console.error(error);
      return false;
    } finally {
      runInAction(() => {
        this.isSavingGrade = false;
      });
    }
  }

  deleteMarkAndSave = async (
    studentUid: string,
    gradeId: string,
  ): Promise<boolean> => {
    if (
      !this.user ||
      !this.currentUserProfile ||
      this.profile?.uid !== studentUid ||
      this.isSavingGrade
    )
      return false;
    const grade = this.currentGrades.find(
      (item) =>
        item.id === gradeId &&
        item.studentId === studentUid &&
        item.yearId === this.currentYearId &&
        !item.isFinal,
    );
    if (!grade) return false;
    const student = this.profile;
    this.isSavingGrade = true;
    try {
      const nextGrades = await this.saveGradeWithTermFinal(
        grade,
        true,
      );
      runInAction(() => {
        if (
          this.profile?.uid === grade.studentId &&
          this.currentYearId === grade.yearId
        )
          this.currentGrades = nextGrades;
      });
      toast.success("Оценка успешно удалена.");
      void this.notifyGradeChange(
        student,
        this.currentUserProfile,
        grade,
        true,
      );
      return true;
    } catch (error) {
      toast.error("Ошибка при удалении оценки");
      console.error(error);
      return false;
    } finally {
      runInAction(() => {
        this.isSavingGrade = false;
      });
    }
  };

  private async notifyGradeChange(
    student: IStudentProfile,
    user: IParentProfile | IStudentProfile,
    grade: IGrade,
    deleted: boolean,
  ) {
    if (
      !student.telegramChatIds ||
      (Array.isArray(student.telegramChatIds) &&
        !student.telegramChatIds.length)
    )
      return;
    const escape = (value: string) =>
      value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
    const subject =
      this.currentStudentSubjects?.[grade.subjectId]
        ?.name ?? grade.subjectId;
    const term =
      this.currentTerms.find(
        (item) => item.id === grade.termId,
      )?.name ?? grade.termId;
    const now = new Date();
    const formattedDateTime = now.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    await this.sendTelegramNotification(
      student.telegramChatIds,
      `<b>${deleted ? "Оценка удалена 🗑️" : "Оценка добавлена ➕"}</b>\n👤 ${escape(student.name)}\n📚 ${escape(subject)}\n 📅 ${escape(term)}\n💯 Оценка: ${grade.value} \n\n ⏰ <b>${deleted ? "Удалена:" : "Добавлена:"} ${formattedDateTime} \n${user.name}</b>`,
      student.BOT_TOKEN,
    );
  }

  getPrediction(
    currentMarks: number[],
    targetMark: number,
  ): string {
    if (targetMark < 1 || targetMark > 10)
      return "Оценка должна быть от 1 до 10";
    const sum = currentMarks.reduce((a, b) => a + b, 0);
    const count = currentMarks.length;
    if (count === 0) {
      return `Чтобы получить ${targetMark}, достаточно получить одну ${targetMark}.`;
    }
    const currentAverage = sum / count;
    if (Math.round(currentAverage) >= targetMark) {
      return `У тебя уже выходит ${targetMark} или выше! Отличная работа! 🎉`;
    }
    const requiredAverage = targetMark - 0.5;
    if (targetMark <= 10) {
      const denominator10 = 10 - requiredAverage;
      if (denominator10 > 0) {
        const needed10 = Math.ceil(
          (requiredAverage * count - sum) / denominator10,
        );
        if (needed10 > 0 && needed10 <= 15) {
          return `Тебе нужно получить еще ${needed10} шт оценок "10". 🚀`;
        }
      }
    }
    if (targetMark <= 9) {
      const denominator9 = 9 - requiredAverage;
      if (denominator9 > 0) {
        const needed9 = Math.ceil(
          (requiredAverage * count - sum) / denominator9,
        );
        if (needed9 > 0 && needed9 <= 15) {
          return `Тебе нужно получить еще столько оценок "9": ${needed9} шт. 👍`;
        }
      }
    }
    return `К сожалению, поднять балл до ${targetMark} в этой четверти математически почти невозможно. 📊`;
  }
  login = async (email: string, password: string) => {
    try {
      runInAction(() => {
        this.authError = null;
        this.isSigningIn = true;
      });
      await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
    } catch (error: unknown) {
      runInAction(() => {
        switch (
          error &&
          typeof error === "object" &&
          "code" in error
            ? error.code
            : null
        ) {
          case "auth/invalid-email":
            this.authError = "Некорректный формат Email";
            break;
          case "auth/user-not-found":
          case "auth/wrong-password":
          case "auth/invalid-credential":
            this.authError = "Неверный email или пароль";
            break;
          case "auth/too-many-requests":
            this.authError =
              "Слишком много попыток. Попробуйте позже";
            break;
          default:
            this.authError = "Произошла ошибка при входе";
        }
      });
    } finally {
      runInAction(() => {
        this.isSigningIn = false;
      });
    }
  };
  async logout(): Promise<boolean> {
    try {
      await auth.signOut();
      return true;
    } catch (error) {
      console.error("Ошибка при выходе:", error);
      toast.error("Не удалось выйти из аккаунта");
      return false;
    }
  }
}
export const userStore = new UserStore();
