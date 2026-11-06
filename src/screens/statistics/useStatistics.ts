import { useTermSelection } from "../../hooks/useTermSelection.ts";
import type { ISubject } from "../../store/UserStore.tsx";
import { useStudentSubjects } from "../../hooks/useStudentSubjects.ts";
import { calculateSubjectStats } from "../../utils/subjectStatistics.ts";
import s from "./Statistics.module.css";

export interface SubjectStatistics {
  id: ISubject["id"];
  name: ISubject["name"];
  average: number;
  count: number;
  badgeClass: string;
  finalMark?: number | null;
}

const getBadgeClass = (average: number): string => {
  if (average >= 8) return s.badgeHigh;
  if (average >= 6) return s.badgeMedium;
  if (average >= 4) return s.badgeLow;
  return s.badgeCritical;
};

export const useStatistics = () => {
  const termSelector = useTermSelection();
  const { selectedTerm } = termSelector;
  const {
    profile,
    subjectMarks: studentSubjects,
    isEmpty,
  } = useStudentSubjects(selectedTerm);

  const subjects: SubjectStatistics[] = studentSubjects.map(
    (subject) => {
      const stats = calculateSubjectStats(
        subject.currentMarks.map((grade) => grade.value),
      );
      return {
        id: subject.subjectId,
        name: subject.subjectName,
        ...stats,
        badgeClass: getBadgeClass(stats.average),
        finalMark: subject.finalMark?.value,
      };
    },
  );

  return {
    studentName: profile?.name ?? "",
    grades: studentSubjects.flatMap((subject) =>
      subject.currentMarks.map((grade) => grade.value),
    ),
    isEmpty,
    subjects,
    termSelector,
  };
};
