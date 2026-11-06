import { firestoreRequest } from "../utils/firestoreRequest.ts";
import { db } from "../../firebase.ts";
import { doc, setDoc, getDoc } from "firebase/firestore";

export interface ILesson {
  id: string;
  name: string;
  room: string;
}

export interface IDaySchedule {
  lessons: ILesson[];
}

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

export class ScheduleService {
  static async saveDaySchedule(
    classId: string,
    dayId: DayOfWeek,
    schedule: IDaySchedule,
  ): Promise<void> {
    const docRef = doc(
      db,
      "schedules",
      classId,
      "days",
      dayId,
    );
    await setDoc(docRef, schedule);
  }

  static async getDaySchedule(
    classId: string,
    dayId: DayOfWeek,
  ): Promise<IDaySchedule | null> {
    const docRef = doc(
      db,
      "schedules",
      classId,
      "days",
      dayId,
    );
    const docSnap = await firestoreRequest(getDoc(docRef));

    if (docSnap.exists()) {
      return docSnap.data() as IDaySchedule;
    }
    return null;
  }
}
