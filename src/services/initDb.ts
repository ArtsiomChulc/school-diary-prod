import { doc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "../../firebase.ts";

async function seedFirestore() {
  console.log(
    "⏳ Начинается инициализация Cloud Firestore...",
  );
  try {
    // === 1. УЧЕБНЫЕ ГОДЫ И ЧЕТВЕРТИ (Иерархическая структура) ===
    const yearId = "year_2026_2027";
    const yearRef = doc(db, "academic_years", yearId);

    await setDoc(yearRef, {
      id: yearId,
      name: "2026/2027 учебный год",
      startDate: Timestamp.fromDate(
        new Date("2026-09-01T00:00:00Z"),
      ),
      endDate: Timestamp.fromDate(
        new Date("2027-05-31T23:59:59Z"),
      ),
      isCompleted: false,
    });

    // Создаем четверти как подколлекцию "terms" внутри учебного года
    const terms = [
      {
        id: "term_1",
        name: "1 четверть",
        start: "2026-09-01",
        end: "2026-10-31",
        completed: true,
      },
      {
        id: "term_2",
        name: "2 четверть",
        start: "2026-11-09",
        end: "2026-12-30",
        completed: false,
      },
      {
        id: "term_3",
        name: "3 четверть",
        start: "2027-01-11",
        end: "2027-03-27",
        completed: false,
      },
      {
        id: "term_4",
        name: "4 четверть",
        start: "2027-04-05",
        end: "2027-05-31",
        completed: false,
      },
    ];

    for (const term of terms) {
      const termRef = doc(
        db,
        "academic_years",
        yearId,
        "terms",
        term.id,
      );
      await setDoc(termRef, {
        id: term.id,
        name: term.name,
        startDate: Timestamp.fromDate(
          new Date(`${term.start}T00:00:00Z`),
        ),
        endDate: Timestamp.fromDate(
          new Date(`${term.end}T23:59:59Z`),
        ),
        isCompleted: term.completed,
      });
    }
    console.log("✅ Учебные годы и четверти добавлены.");

    // === 2. РОДИТЕЛИ (Связь многие ко многим через массивы строк) ===
    await setDoc(
      doc(
        db,
        "users_parents",
        "sxG55AJC3TZQR0M11Bkt26Pqdcd2",
      ),
      {
        uid: "sxG55AJC3TZQR0M11Bkt26Pqdcd2",
        name: "Иванов Иван Иванович",
        email: "test_new@test.com",
        role: "parent",
        children: [
          "FdByhBl1k9QXncVe26fCuDzRmgk2",
          "student_id_2",
        ], // Простой массив ID вместо объектов-карт
      },
    );

    await setDoc(doc(db, "users_parents", "parent_id_2"), {
      uid: "parent_id_2",
      name: "Иванова Мария Сергеевна",
      email: "parent2@example.com",
      role: "parent",
      children: ["FdByhBl1k9QXncVe26fCuDzRmgk2"],
    });
    console.log("✅ Профили родителей добавлены.");

    // === 3. УЧЕНИКИ ===
    await setDoc(
      doc(db, "students", "FdByhBl1k9QXncVe26fCuDzRmgk2"),
      {
        uid: "FdByhBl1k9QXncVe26fCuDzRmgk2",
        name: "Стефания Чульц",
        classId: "4_A",
        telegramChatIds: [],
        parents: [
          "sxG55AJC3TZQR0M11Bkt26Pqdcd2",
          "parent_id_2",
        ], // Взаимная связь массивом
      },
    );

    await setDoc(doc(db, "students", "student_id_2"), {
      uid: "student_id_2",
      name: "Иванова Ольга Ивановна",
      classId: "1_Б",
      telegramChatIds: [],
      parents: ["sxG55AJC3TZQR0M11Bkt26Pqdcd2"],
    });
    console.log("✅ Профили учеников добавлены.");

    // === 4. ПРЕДМЕТЫ (Справочник) ===
    const subjects = [
      { id: "sub_math", name: "Математика" },
      { id: "sub_rus", name: "Русский язык" },
      { id: "sub_bel_lit", name: "Белорусская литература" },
    ];

    for (const sub of subjects) {
      await setDoc(doc(db, "subjects", sub.id), sub);
    }
    console.log("✅ Справочник предметов добавлен.");

    // === 5. ОЦЕНКИ (Плоская структура с индексами - Best Practice для Firestore) ===
    // Текущие текущие оценки
    const gradesToSeed = [
      {
        id: "grade_id_101",
        studentId: "FdByhBl1k9QXncVe26fCuDzRmgk2",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "sub_math",
        value: 9,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-09-15T10:00:00Z"),
        ),
        isFinal: false, // Флаг, указывающий, текущая это оценка или четвертная
      },
      {
        id: "grade_id_102",
        studentId: "FdByhBl1k9QXncVe26fCuDzRmgk2",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "sub_math",
        value: 8,
        comment: "Самостоятельная работа",
        createdAt: Timestamp.fromDate(
          new Date("2026-10-05T11:30:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_103",
        studentId: "FdByhBl1k9QXncVe26fCuDzRmgk2",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "sub_rus",
        value: 10,
        createdAt: Timestamp.fromDate(
          new Date("2026-09-16T09:15:00Z"),
        ),
        isFinal: false,
      },
      // Пример выставленной четвертной (итоговой) оценки за 1-ю четверть
      {
        id: "grade_id_final_1",
        studentId: "FdByhBl1k9QXncVe26fCuDzRmgk2",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "sub_math",
        value: 9,
        comment: "Итог за 1 четверть",
        createdAt: Timestamp.fromDate(
          new Date("2026-10-30T12:00:00Z"),
        ),
        isFinal: true, // Вот так оформляется четвертная оценка
      },
    ];

    for (const grade of gradesToSeed) {
      await setDoc(doc(db, "grades", grade.id), grade);
    }
    console.log("✅ Тестовые оценки добавлены.");

    console.log(
      "🚀 Firestore успешно проинициализирован и готов к работе!",
    );
  } catch (error) {
    console.error(
      "❌ Ошибка при наполнении Cloud Firestore:",
      error,
    );
  }
}

// Запуск скрипта
seedFirestore();

//npx ts-node src/services/initDb.ts
