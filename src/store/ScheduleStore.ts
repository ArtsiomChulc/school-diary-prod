import { makeAutoObservable, runInAction } from "mobx";
import {
  type DayOfWeek,
  type IDaySchedule,
  type ILesson,
  ScheduleService,
} from "../services/ScheduleService.ts";

// const MOCK_WEEK_SCHEDULE: Record<
//   Exclude<DayOfWeek, "saturday">,
//   ILesson[]
// > = {
//   monday: [
//     {
//       id: "1",
//       name: "Изобразительное искусство",
//       room: "103",
//     },
//     { id: "2", name: "Белорусский язык", room: "103" },
//     { id: "3", name: "Математика", room: "103" },
//     {
//       id: "4",
//       name: "Физическая культура",
//       room: "Спортзал",
//     },
//     {
//       id: "5",
//       name: "Белорусская литература",
//       room: "103",
//     },
//   ],
//   tuesday: [
//     { id: "1", name: "Русская литература", room: "103" },
//     { id: "2", name: "Русский язык", room: "103" },
//     { id: "3", name: "Математика", room: "103" },
//     { id: "4", name: "Иностранный язык", room: "103" },
//     {
//       id: "5",
//       name: "Физическая культура",
//       room: "Спортзал",
//     },
//   ],
//   wednesday: [
//     {
//       id: "1",
//       name: "Белорусская литература",
//       room: "103",
//     },
//     { id: "2", name: "Белорусский язык", room: "103" },
//     { id: "3", name: "Человек и мир", room: "103" },
//     { id: "4", name: "Математика", room: "103" },
//     { id: "5", name: "ОБЖ", room: "103" },
//   ],
//   thursday: [
//     { id: "1", name: "Математика", room: "103" },
//     { id: "2", name: "Иностранный язык", room: "103" },
//     {
//       id: "3",
//       name: "Физическая культура",
//       room: "Спортзал",
//     },
//     {
//       id: "4",
//       name: "Русский язык",
//       room: "103",
//     },
//   ],
//   friday: [
//     { id: "1", name: "Русская литература", room: "103" },
//     { id: "2", name: "Русский язык", room: "103" },
//     {
//       id: "3",
//       name: "Трудовое обучение",
//       room: "103",
//     },
//     { id: "4", name: "Иностранный язык", room: "103" },
//     { id: "4", name: "Музыка", room: "103" },
//   ],
// };

export class ScheduleStore {
  currentSchedule: IDaySchedule | null = null;
  classId: string | null = null;
  dayId: DayOfWeek | null = null;
  isLoading = false;
  error: string | null = null;
  private requestId = 0;

  constructor() {
    makeAutoObservable(this);
  }

  reset() {
    ++this.requestId;
    this.currentSchedule = null;
    this.classId = null;
    this.dayId = null;
    this.isLoading = false;
    this.error = null;
  }

  async fetchSchedule(classId: string, dayId: DayOfWeek) {
    const requestId = ++this.requestId;
    this.classId = classId;
    this.dayId = dayId;
    this.currentSchedule = null;
    this.isLoading = true;
    this.error = null;
    try {
      const data = await ScheduleService.getDaySchedule(
        classId,
        dayId,
      );
      if (requestId !== this.requestId) return;
      runInAction(() => {
        this.currentSchedule = data ?? { lessons: [] };
      });
    } catch (error: unknown) {
      if (requestId !== this.requestId) return;
      runInAction(() => {
        this.error =
          error instanceof Error
            ? error.message
            : "Ошибка при загрузке расписания";
      });
    } finally {
      if (requestId === this.requestId)
        runInAction(() => {
          this.isLoading = false;
        });
    }
  }

  async saveSchedule(
    classId: string,
    dayId: DayOfWeek,
    lessons: ILesson[],
  ): Promise<boolean> {
    const requestId = ++this.requestId;
    this.classId = classId;
    this.dayId = dayId;
    this.currentSchedule = null;
    this.isLoading = true;
    this.error = null;
    const scheduleData: IDaySchedule = { lessons };
    try {
      await ScheduleService.saveDaySchedule(
        classId,
        dayId,
        scheduleData,
      );
      if (requestId === this.requestId)
        runInAction(() => {
          this.currentSchedule = scheduleData;
        });
      return true;
    } catch (error: unknown) {
      if (requestId === this.requestId)
        runInAction(() => {
          this.error =
            error instanceof Error
              ? error.message
              : "Ошибка при сохранении расписания";
        });
      return false;
    } finally {
      if (requestId === this.requestId)
        runInAction(() => {
          this.isLoading = false;
        });
    }
  }

  // async seedMockData(classId: string = "4_A") {
  //   this.isLoading = true;
  //   this.error = null;
  //   try {
  //     const days = Object.keys(
  //       MOCK_WEEK_SCHEDULE,
  //     ) as DayOfWeek[];
  //
  //     for (const day of days) {
  //       const lessons =
  //         MOCK_WEEK_SCHEDULE[
  //           day as keyof typeof MOCK_WEEK_SCHEDULE
  //         ];
  //
  //       await ScheduleService.saveDaySchedule(
  //         classId,
  //         day,
  //         { lessons },
  //       );
  //     }
  //
  //     console.log(
  //       `[ScheduleStore] Моковые данные для класса ${classId} успешно сгенерированы!`,
  //     );
  //   } catch (err: any) {
  //     runInAction(() => {
  //       this.error =
  //         err.message ??
  //         "Не удалось загрузить моковые данные";
  //     });
  //   } finally {
  //     runInAction(() => {
  //       this.isLoading = false;
  //     });
  //   }
  // }
}

export const scheduleStore = new ScheduleStore();
