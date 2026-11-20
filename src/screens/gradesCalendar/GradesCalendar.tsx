import { type FC } from "react";
import { observer } from "mobx-react-lite";
import { gradesStore } from "../../store/GradesStore.ts";
import { userStore } from "../../store/UserStore.tsx";
import { Text } from "../../components/atoms/text/Text.tsx";
import { ErrorFallback } from "../../components/organizms/errorFallback/ErrorFallback.tsx";
import { ArrowBigLeft, ArrowBigRight } from "lucide-react";
import s from "./GradesCalendar.module.css";

const WEEK_DAYS = [
  "Пн",
  "Вт",
  "Ср",
  "Чт",
  "Пт",
  "Сб",
  "Вс",
];

export const GradesCalendar: FC = observer(() => {
  const viewDate = gradesStore.currentMonth;
  const { isLoading, error } = gradesStore;
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const daysInMonth = new Date(
    year,
    month + 1,
    0,
  ).getDate();
  const firstDayIndex =
    (new Date(year, month, 1).getDay() + 6) % 7;

  const handlePrevMonth = () =>
    gradesStore.changeMonth(new Date(year, month - 1, 1));
  const handleNextMonth = () =>
    gradesStore.changeMonth(new Date(year, month + 1, 1));

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const dateNow = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(
      2,
      "0",
    );
    const year = now.getFullYear();

    return `${day}.${month}.${year}`;
  };

  if (error) return <ErrorFallback error={error} />;

  return (
    <div className={s.calendarContainer}>
      {/* Сетка календаря */}
      <div className={s.calendarGrid}>
        <div className={s.actions}>
          <button
            className={s.monthBtn}
            onClick={handlePrevMonth}
          >
            <ArrowBigLeft size={30}/>
          </button>
          <Text
            as={"strong"}
            style={{ textTransform: "capitalize" }}
            size={'lg'}
          >
            {viewDate.toLocaleDateString("ru-RU", {
              month: "long",
              year: "numeric",
            })}
          </Text>
          <button
            className={s.monthBtn}
            onClick={handleNextMonth}
          >
            <ArrowBigRight size={30} />
          </button>
        </div>

        <div className={s.weekDays}>
          {WEEK_DAYS.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        <div className={s.dayNumberContainer}>
          {Array.from({ length: firstDayIndex }).map(
            (_, i) => (
              <div key={`empty-${i}`} />
            ),
          )}

          {Array.from({ length: daysInMonth }).map(
            (_, i) => {
              const dayNumber = i + 1;
              const currentDate = new Date(
                year,
                month,
                dayNumber,
              );
              const selected =
                gradesStore.selectedDate !== null &&
                isSameDay(
                  currentDate,
                  gradesStore.selectedDate,
                );
              const hasGrades =
                gradesStore.hasGradesOnDate(currentDate);

              return (
                <button
                  key={dayNumber}
                  className={`${s.dayNumber} ${hasGrades ? s.hasGrades : ""} ${selected ? s.selected : ""} ${isLoading ? s.loading : ""}`}
                  onClick={() =>
                    gradesStore.selectDate(currentDate)
                  }
                >
                  {dayNumber}
                  {/* Индикатор-точка под датой, если в этот день есть оценки */}
                  {hasGrades && (
                    <Text
                      as={"span"}
                      className={`${s.dot} ${selected ? s.dotSelected : ""}`}
                    />
                  )}
                </button>
              );
            },
          )}
        </div>
      </div>

      {/* Список оценок за выбранный день */}
      <div className={s.gradesListContainer}>
        <Text as={"p"} size={"lg"} className={s.dayNow}>
          Сегодня <Text as={"span"}>{dateNow()}</Text>
        </Text>
        {!gradesStore.selectedDate ? (
          <Text as={"p"} style={{ color: "#666" }}>
            Выберите день в календаре, чтобы посмотреть
            оценки.
          </Text>
        ) : (
          <>
            {isLoading ? (
              ""
            ) : (
              <Text as={"h3"} className={s.dateSelected}>
                Оценки за{" "}
                {gradesStore.selectedDate.toLocaleDateString(
                  "ru-RU",
                )}
              </Text>
            )}

            {isLoading && (
              <Text as={"p"}>
                Загрузка оценок за месяц...
              </Text>
            )}
            {error && (
              <Text as={"p"} style={{ color: "red" }}>
                {error}
              </Text>
            )}

            {!isLoading &&
              gradesStore.gradesForSelectedDate.length ===
                0 && (
                <Text as={"p"} style={{ color: "#666" }}>
                  За этот день оценок нет.
                </Text>
              )}

            <ul className={s.gradesList}>
              {gradesStore.gradesForSelectedDate.map(
                (grade) => {
                  console.log(grade.id, grade.value);
                  const subjectName =
                    userStore.currentStudentSubjects?.[
                      grade.subjectId
                    ]?.name ?? grade.subjectId;

                  return (
                    <li>
                      <div className={s.subjectGrade}>
                        <strong>{subjectName}</strong>
                        <Text
                          as={"span"}
                          size={"sm"}
                          weight={600}
                          style={{
                            color: "#2563eb",
                          }}
                        >
                          {grade.value}
                        </Text>
                      </div>
                      <Text
                        as={"small"}
                        style={{ color: "#94a3b8" }}
                        size={"xs"}
                      >
                        Время:{" "}
                        {grade.createdAt
                          .toDate()
                          .toLocaleTimeString("ru-RU", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                      </Text>
                    </li>
                  );
                },
              )}
            </ul>
          </>
        )}
      </div>
    </div>
  );
});
