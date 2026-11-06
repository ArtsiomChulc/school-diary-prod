import { userStore } from "../../store/UserStore.tsx";
import { Text } from "../atoms/text/Text.tsx";
import { observer } from "mobx-react-lite";
import s from "./CurrentYear.module.css";

const CurrentYear = observer(() => {
  const { currentAcademicYearName } = userStore;
  return (
    <div className={s.currentYearContainer}>
      <Text
        as={"h4"}
        size={"md"}
        color={"var(--text-secondary)"}
      >
        {currentAcademicYearName}
      </Text>
    </div>
  );
});

export default CurrentYear;
