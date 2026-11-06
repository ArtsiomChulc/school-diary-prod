import { type FC, useState } from "react";
import { observer } from "mobx-react-lite";
import { useTermSelection } from "../../../hooks/useTermSelection.ts";
import { TermSelector } from "../../molecules/termSelector/TermSelector.tsx";
import {
  type IGrade,
  userStore,
} from "../../../store/UserStore.tsx";
import toast from "react-hot-toast";
import { ArrowLeftIcon, TrashIcon } from "lucide-react";
import { Text } from "../../atoms/text/Text.tsx";
import { Button } from "../../atoms/button/Button.tsx";
import { useNavigate, useParams } from "react-router";
import s from "./SubjectDetails.module.css";

export const SubjectDetails: FC = observer(() => {
  const navigate = useNavigate();
  const { subjectId } = useParams<{ subjectId: string }>();

  const { profile, isSavingGrade } = userStore;
  const termSelector = useTermSelection();
  const { selectedTerm } = termSelector;
  const [showMarkSelector, setShowMarkSelector] =
    useState(false);
  const subject = subjectId
    ? userStore.currentStudentSubjects?.[subjectId]
    : null;
  const currentTermData = userStore
    .getSubjectMarks(selectedTerm)
    .find((item) => item.subjectId === subjectId);
  if (!profile) return <Text>Ученик не выбран</Text>;
  if (!subject || !subjectId)
    return <Text>Предмет не найден в журнале</Text>;

  const handleAddMark = async (value: number) => {
    if (
      await userStore.addMarkAndSave(
        profile.uid,
        subjectId,
        selectedTerm,
        value,
      )
    )
      setShowMarkSelector(false);
  };
  const handleDeleteMark = async (grade: IGrade) => {
    if (
      !(await userStore.deleteMarkAndSave(
        profile.uid,
        grade.id,
      ))
    )
      return;
    toast(
      (t) => (
        <Text color="var(--text-main)">
          Оценка <b>{grade.value}</b> удалена.
          <Button
            onClick={async () => {
              if (await userStore.restoreGrade(grade))
                toast.dismiss(t.id);
            }}
          >
            Отменить
          </Button>
        </Text>
      ),
      { duration: 6000, icon: "🗑️" },
    );
  };

  return (
    <div className={s.container}>
      <Button
        onClick={() => navigate("/")}
        className={s.backBtn}
      >
        <ArrowLeftIcon
          size={16}
          style={{ marginRight: "6px" }}
        />
        На главную
      </Button>

      <Text
        as={"h2"}
        color={"var(--text-main)"}
        style={{
          textTransform: "capitalize",
          paddingBottom: "16px",
          marginTop: "16px",
        }}
      >
        {subject.name}
      </Text>

      <TermSelector
        {...termSelector}
        classes={{
          tabs: s.tabs,
          tabBtn: s.tabBtn,
          tabBtnActive: s.tabBtnActive,
          tabBtnInactive: s.tabBtnInactive,
        }}
      />

      <div className={s.detailsCard}>
        <Text as={"h3"} color={"var(--text-main)"}>
          Текущие оценки:
        </Text>
        <div className={s.marksContainer}>
          {currentTermData?.currentMarks &&
          currentTermData.currentMarks.length > 0 ? (
            currentTermData.currentMarks.map((mark) => {
              const jsDate = mark.createdAt.toDate();

              const formatted = jsDate.toLocaleDateString(
                "ru-BY",
                {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                },
              );
              return (
                <div className={s.markBadgeContainer}>
                  <div
                    key={mark.id}
                    className={s.markBadge}
                    title={mark.comment}
                  >
                    <Text as={"span"}>{mark.value}</Text>
                    <Button
                      onClick={() =>
                        void handleDeleteMark(mark)
                      }
                      disabled={
                        isSavingGrade ||
                        termSelector.isSelectionCompleted
                      }
                      className={`${s.deleteMarkBtn}${termSelector.isSelectionCompleted || isSavingGrade ? s.disabled : ""}`}
                      title="Удалить оценку"
                    >
                      <TrashIcon size={18} />
                    </Button>
                  </div>
                  <Text as={"span"} size={"xxs"}>
                    {formatted}
                  </Text>
                </div>
              );
            })
          ) : (
            <Text
              className={s.emptyMarks}
              as={"span"}
              color={"var(--text-secondary)"}
            >
              Оценок пока нет
            </Text>
          )}
        </div>

        <div className={s.finalMarkWrapper}>
          <Text as={"strong"}>
            Итоговая оценка за четверть:{" "}
          </Text>
          <Text
            as={"span"}
            color={"var(--bg-button-form)"}
            style={{ fontSize: "1.25rem", fontWeight: 600 }}
          >
            {currentTermData?.finalMark?.value ??
              "не выставлена"}
          </Text>
        </div>

        <div className={s.addMarkSection}>
          {!showMarkSelector ? (
            <Button
              onClick={() => setShowMarkSelector(true)}
              disabled={
                termSelector.isSelectionCompleted ||
                isSavingGrade ||
                !selectedTerm ||
                !userStore.currentYearId
              }
              className={s.addBtn}
            >
              + Добавить оценку
            </Button>
          ) : (
            <>
              <Text
                as={"p"}
                weight={500}
                style={{ marginBottom: "8px" }}
              >
                Выберите балл:
              </Text>
              {!termSelector.isSelectionCompleted && (
                <div className={s.digitsGrid}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(
                    (num) => (
                      <Button
                        key={num}
                        onClick={() =>
                          void handleAddMark(num)
                        }
                        disabled={
                          isSavingGrade ||
                          termSelector.isSelectionCompleted
                        }
                        className={s.digitBtn}
                      >
                        {num}
                      </Button>
                    ),
                  )}
                </div>
              )}
              <Button
                onClick={() => setShowMarkSelector(false)}
                className={s.cancelBtn}
              >
                Отмена
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
});
