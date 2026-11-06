import { useNavigate } from "react-router";
import { Text } from "../../components/atoms/text/Text.tsx";
import s from "./NotFound.module.css";
import { Button } from "../../components/atoms/button/Button.tsx";

export const NotFound = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate("/"); // Перенаправление на главную страницу (страницу дневника)
  };

  return (
    <div className={s.notFoundContainer}>
      <div className={s.errorCard}>
        {/* Декоративный визуальный элемент ошибки */}
        <div className={s.errorCodeBadge}>
          <Text
            as="span"
            weight={700}
            className={s.codeText}
          >
            404
          </Text>
        </div>

        <Text as="h1" weight={700} className={s.title}>
          Страница не найдена
        </Text>

        <Text
          as="p"
          color="var(--text-secondary)"
          className={s.description}
        >
          Возможно, этот учебный год или четверть еще не
          созданы в базе данных, либо адрес страницы указан
          неверно.
        </Text>

        <Button
          onClick={handleGoHome}
          className={s.homeBtn}
        >
          Вернуться на главную
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
