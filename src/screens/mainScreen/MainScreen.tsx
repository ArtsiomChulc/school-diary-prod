import { useStudentSubjects } from "../../hooks/useStudentSubjects.ts";
import { Dashboard } from "../../components/organizms/dashboard/Dashboard.tsx";
import { observer } from "mobx-react-lite";
import { Text } from "../../components/atoms/text/Text.tsx";
import s from "./MainScreen.module.css";

export const MainScreen = observer(() => {
  const { profile, isEmpty } = useStudentSubjects();

  if (!profile) {
    return (
      <Text as={"p"} weight={500} size={"large"}>
        Ученик не выбран
      </Text>
    );
  }

  if (isEmpty) {
    return (
      <Text as={"p"} weight={500} size={"large"}>
        Список предметов пуст
      </Text>
    );
  }

  return (
    <div className={s.main_screen}>
      <main className={s.main_content}>
        <div className={s.info_block}>
          <div className={s.info_block_text}>
            <Text
              as={"h1"}
              size={"large"}
              align={"center"}
              color={"var(--text-main)"}
              weight={600}
            >
              Наглядное представление вашего прогресса.
            </Text>
            <Text
              as={"p"}
              size={"sm"}
              align={"center"}
              color={"var(--text-secondary)"}
            >
              Ваш учебный процесс — всё четко и
              организовано. Вот что вас ждет в этой учебной
              четверти.
            </Text>
          </div>
          <div className={s.info_block_nav}>
            <Dashboard />
          </div>
        </div>
      </main>
    </div>
  );
});
