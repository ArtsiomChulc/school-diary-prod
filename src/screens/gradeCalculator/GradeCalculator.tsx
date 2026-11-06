import { type FC, useState } from "react";
import { userStore } from "../../store/UserStore.tsx";
import { NavLink } from "react-router";
import { observer } from "mobx-react-lite";
import { Text } from "../../components/atoms/text/Text.tsx";
import { TermSelector } from "../../components/molecules/termSelector/TermSelector.tsx";
import { useStudentSubjects } from "../../hooks/useStudentSubjects.ts";
import { useTermSelection } from "../../hooks/useTermSelection.ts";
import s from "./GradeCalculator.module.css";

const GradeCalculator: FC = observer(() => {
  const termSelector = useTermSelection();
  const { selectedTerm } = termSelector;
  const {
    profile,
    isEmpty,
    subjectMarks: subjectsList,
  } = useStudentSubjects(selectedTerm);

  const [targets, setTargets] = useState<
    Record<string, number>
  >({});
  if (isEmpty || !profile) return null;

  const handleTargetChange = (
    subjectId: string,
    value: number,
  ) => {
    setTargets((prev) => ({
      ...prev,
      [subjectId]: value,
    }));
  };

  return (
    <div className={s.container}>
      <NavLink to={"/"} className={s.backBtn}>
        ← на главную страницу
      </NavLink>
      <h2 className={s.title}>
        🔮 Магический калькулятор оценок для -{profile.name}
        -
      </h2>
      <p className={s.subtitle}>
        Узнай, сколько точных оценок нужно получить, чтобы
        исправить балл за четверть
      </p>

      <TermSelector
        {...termSelector}
        classes={{
          tabs: s.tabs,
          tabBtn: s.tabBtn,
          tabBtnActive: s.tabBtnActive,
          tabBtnInactive: s.tabBtnInactive,
        }}
      />

      <div className={s.grid}>
        {subjectsList.map((subject) => {
          const currentMarks = subject.currentMarks.map(
            (grade) => grade.value,
          );
          const currentTarget =
            targets[subject.subjectId] || 9;

          return (
            <div key={subject.subjectId} className={s.card}>
              <Text as={"h3"} className={s.subjectName}>
                {subject.subjectName}
              </Text>

              <div className={s.row}>
                <span>Текущие оценки: </span>
                <span className={s.currentMarks}>
                  {currentMarks.length > 0
                    ? `(${currentMarks.join(", ")})`
                    : "нет оценок"}
                </span>
              </div>

              <div className={s.inputRow}>
                <label
                  htmlFor={`select-${subject.subjectId}`}
                >
                  Хочу получить:
                </label>
                <select
                  id={`select-${subject.subjectId}`}
                  value={currentTarget}
                  onChange={(e) =>
                    handleTargetChange(
                      subject.subjectId,
                      Number(e.target.value),
                    )
                  }
                  className={s.selectInput}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(
                    (num) => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div className={s.predictionBox}>
                {userStore.getPrediction(
                  currentMarks,
                  currentTarget,
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default GradeCalculator;
