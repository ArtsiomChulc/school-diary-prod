import { userStore } from "../store/UserStore.tsx";

export const useStudentSubjects = (termId?: string) => {
  const { profile, isLoading, currentStudentSubjects } =
    userStore;
  const subjects = Object.values(
    currentStudentSubjects ?? {},
  );
  return {
    profile,
    isLoading,
    subjects,
    isEmpty: !profile || subjects.length === 0,
    subjectMarks: termId
      ? userStore.getSubjectMarks(termId)
      : [],
  };
};
