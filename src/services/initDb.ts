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
        new Date("2026-09-01T06:00:00Z"),
      ),
      endDate: Timestamp.fromDate(
        new Date("2027-05-31T17:59:59Z"),
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
        "r7w8emJqMHMlQV57bC68sm68rX63",
      ),
      {
        uid: "r7w8emJqMHMlQV57bC68sm68rX63",
        name: "Артем Чульц",
        email: "artemorsha1982@gmail.com",
        role: "parent",
        children: ["2Kobdj6EPyOSw0Ba3WHxKaZSmzD3"], // Простой массив ID вместо объектов-карт
      },
    );

    await setDoc(
      doc(
        db,
        "users_parents",
        "y6YT7f7a9XZshFKevF7u1q3B5gH2",
      ),
      {
        uid: "y6YT7f7a9XZshFKevF7u1q3B5gH2",
        name: "Анастасия Чульц",
        email: "Anastasia_2@mail.ru",
        role: "parent",
        children: ["2Kobdj6EPyOSw0Ba3WHxKaZSmzD3"],
      },
    );
    console.log("✅ Профили родителей добавлены.");

    // === 3. УЧЕНИКИ ===
    await setDoc(
      doc(db, "students", "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3"),
      {
        uid: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        BOT_TOKEN:
          "8665712485:AAEEXv3_sCX0WMGjgiOpaUWJIZahw8Jp0sk",
        name: "Стефания Чульц",
        classId: "4_A",
        telegramChatIds: [8128695218],
        parents: [
          "r7w8emJqMHMlQV57bC68sm68rX63",
          "y6YT7f7a9XZshFKevF7u1q3B5gH2",
        ], // Взаимная связь массивом
      },
    );
    console.log("✅ Профили учеников добавлены.");

    // === 4. ПРЕДМЕТЫ (Справочник) ===
    const subjects = [
      { id: "blrlang", name: "Белорусский язык" },
      {
        id: "blrlit",
        name: "Белорусская литература (Литературное чтение)",
      },
      { id: "ruslang", name: "Русский язык" },
      {
        id: "ruslit",
        name: "Русская литература (Литературное чтение)",
      },
      { id: "foreign_lang", name: "Иностранный язык" },

      { id: "math", name: "Математика" },

      { id: "human_and_world", name: "Человек и мир" },
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
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "blrlit",
        value: 9,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-09-02T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_102",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "human_and_world",
        value: 10,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-09-02T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_103",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "math",
        value: 9,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-09-07T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_104",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "blrlit",
        value: 9,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-09-07T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_105",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "ruslit",
        value: 9,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-09-08T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_106",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "ruslang",
        value: 8,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-09-08T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_107",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "blrlit",
        value: 10,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-09-09T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_108",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "blrlang",
        value: 9,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-09-09T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_109",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "math",
        value: 9,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-09-09T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_110",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "foreign_lang",
        value: 9,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-09-10T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_111",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "ruslang",
        value: 9,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-09-10T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_112",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "blrlang",
        value: 8,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-09-14T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_113",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "math",
        value: 9,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-09-15T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_114",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "foreign_lang",
        value: 9,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-09-15T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_115",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "blrlit",
        value: 9,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-09-16T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_116",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "blrlang",
        value: 9,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-09-16T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_117",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "math",
        value: 6,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-09-16T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_118",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "math",
        value: 9,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-09-21T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_119",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "blrlit",
        value: 10,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-09-21T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_120",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "ruslit",
        value: 9,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-09-22T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_121",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "foreign_lang",
        value: 9,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-09-22T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_122",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "blrlang",
        value: 9,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-09-23T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_123",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "blrlang",
        value: 10,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-09-23T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_124",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "math",
        value: 6,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-09-23T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_125",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "foreign_lang",
        value: 9,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-09-24T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_126",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "ruslang",
        value: 8,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-09-25T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_127",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "ruslit",
        value: 8,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-09-25T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_128",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "blrlang",
        value: 10,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-09-28T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_129",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "blrlit",
        value: 10,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-09-28T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_130",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "ruslang",
        value: 10,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-09-29T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_131",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "ruslit",
        value: 10,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-09-29T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_132",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "foreign_lang",
        value: 9,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-09-29T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_133",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "blrlit",
        value: 10,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-09-30T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_134",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "human_and_world",
        value: 10,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-09-30T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_135",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "math",
        value: 9,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-09-30T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_136",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "math",
        value: 9,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-10-01T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_137",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "ruslit",
        value: 9,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-10-06T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_138",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "ruslang",
        value: 8,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-10-06T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_139",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "foreign_lang",
        value: 9,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-10-06T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_140",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "blrlit",
        value: 10,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-10-07T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_141",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "blrlang",
        value: 10,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-10-07T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_142",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "blrlang",
        value: 10,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-10-07T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_143",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "math",
        value: 10,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-10-07T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_144",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "math",
        value: 8,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-10-08T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_145",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "ruslang",
        value: 9,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-10-08T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_146",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "math",
        value: 9,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-10-13T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_147",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "blrlang",
        value: 8,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-10-14T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_148",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "human_and_world",
        value: 8,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-10-14T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_149",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "math",
        value: 6,
        comment: "Контрольная работа",
        createdAt: Timestamp.fromDate(
          new Date("2026-10-15T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_150",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "ruslang",
        value: 9,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-10-15T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_151",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "foreign_lang",
        value: 9,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-10-16T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_152",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "math",
        value: 9,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-10-19T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_153",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "ruslit",
        value: 9,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-10-20T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_154",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "ruslang",
        value: 9,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-10-20T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_155",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "ruslang",
        value: 10,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-10-20T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_156",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "foreign_lang",
        value: 9,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-10-20T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_157",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "blrlit",
        value: 8,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-10-21T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_158",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "blrlang",
        value: 10,
        comment: "Ответ у доски",
        createdAt: Timestamp.fromDate(
          new Date("2026-10-21T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_159",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "math",
        value: 10,
        comment: "Контрольная работа",
        createdAt: Timestamp.fromDate(
          new Date("2026-10-21T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_160",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "math",
        value: 9,
        comment: "Контрольная работа",
        createdAt: Timestamp.fromDate(
          new Date("2026-10-22T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_161",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "blrlang",
        value: 8,
        comment: "Контрольная работа",
        createdAt: Timestamp.fromDate(
          new Date("2026-10-26T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_162",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "blrlit",
        value: 8,
        comment: "Контрольная работа",
        createdAt: Timestamp.fromDate(
          new Date("2026-10-26T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_163",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "math",
        value: 9,
        comment: "Контрольная работа",
        createdAt: Timestamp.fromDate(
          new Date("2026-10-29T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_164",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "ruslang",
        value: 9,
        comment: "Контрольная работа",
        createdAt: Timestamp.fromDate(
          new Date("2026-10-29T10:00:00Z"),
        ),
        isFinal: false,
      },
      {
        id: "grade_id_165",
        studentId: "2Kobdj6EPyOSw0Ba3WHxKaZSmzD3",
        yearId: "year_2026_2027",
        termId: "term_1",
        subjectId: "ruslit",
        value: 10,
        comment: "Контрольная работа",
        createdAt: Timestamp.fromDate(
          new Date("2026-10-30T10:00:00Z"),
        ),
        isFinal: false,
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

// npx ts-node src/services/initDb.ts
