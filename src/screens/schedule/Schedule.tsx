import { useStudentSchedule } from "../../hooks/useStudentSchedule.ts";
import { observer } from "mobx-react-lite";
import { TermSelector } from "../../components/molecules/termSelector/TermSelector.tsx";
import { Text } from "../../components/atoms/text/Text.tsx";
import { Loader } from "../../components/organizms/loading/loaderCircle/Loader.tsx"; // Импортируем css-модуль для сетки и карточек
import s from "./Schedule.module.css";

const LESSON_TIMING: Record<string, string> = {
  "1": "8:00 - 8:45",
  "2": "9:00 - 9:45",
  "3": "10:00 - 10:45",
  "4": "11:00 - 11:45",
  "5": "12:00 - 12:45",
  "6": "13:00 - 13:45",
};

const getLessonTime = (id: string) => {
  return LESSON_TIMING[id || "00:00 - 00:00"];
};

const Schedule = observer(() => {
  const { termSelectorProps, schedule, isLoading, error } =
    useStudentSchedule("4_A");

  if (isLoading) {
    return <Loader size={50} centered />;
  }

  if (error) {
    return <div className={s.errorState}>{error}</div>;
  }

  return (
    <div className={s.scheduleWrapper}>
      <Text as="h2" weight={600} className={s.title}>
        Расписание уроков
      </Text>

      <TermSelector
        {...termSelectorProps}
        classes={{
          tabs: s.tabs,
          tabBtn: s.tabBtn,
          tabBtnActive: s.tabBtnActive,
          tabBtnInactive: s.tabBtnInactive,
        }}
      />

      <div className={s.lessonsList}>
        {schedule?.lessons &&
        schedule.lessons.length > 0 ? (
          schedule.lessons
            .slice()
            .sort((a, b) => Number(a.id) - Number(b.id))
            .map(({ room, name, id }) => {
              return (
                <div key={id} className={s.lessonCard}>
                  <div className={s.lessonNumber}>{id}</div>
                  <div className={s.lessonInfo}>
                    <Text
                      as="span"
                      weight={500}
                      className={s.lessonName}
                    >
                      {name}
                    </Text>
                    <div className={s.lessonRoomTime}>
                      <Text
                        as="small"
                        color="var(--text-secondary)"
                      >
                        Кабинет: {room}
                      </Text>
                      <Text
                        as="small"
                        color="var(--text-secondary)"
                      >
                        {getLessonTime(id)}
                      </Text>
                    </div>
                  </div>
                </div>
              );
            })
        ) : (
          <div className={s.centerState}>
            В этот день занятий нет
          </div>
        )}
      </div>
    </div>
  );
});

export default Schedule;
