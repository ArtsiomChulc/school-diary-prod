import React from "react";
import { useNavigate } from "react-router";
import { Text } from "../../atoms/text/Text.tsx";
import { Button } from "../../atoms/button/Button.tsx";
import { AlertCircle } from "lucide-react";
import s from "./ErrorFallback.module.css";

interface ErrorFallbackProps {
  error: string;
  onGoHome?: () => void;
  onReload?: () => void;
}

export const ErrorFallback: React.FC<
  ErrorFallbackProps
> = ({ error, onGoHome, onReload }) => {
  const navigate = useNavigate();

  const handleReload = () => {
    if (onReload) {
      onReload();
    } else {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      navigate("/");
    }
  };

  return (
    <div
      className={s.container}
      role="alert"
      aria-live="assertive"
    >
      <div className={s.card}>
        <div
          className={s.iconWrapper}
          aria-hidden="true"
        >
          <AlertCircle size={24}/>
          {/*<svg*/}
          {/*  className={s.icon}*/}
          {/*  viewBox="0 0 24 24"*/}
          {/*  fill="none"*/}
          {/*  stroke="currentColor"*/}
          {/*  strokeWidth="2"*/}
          {/*  strokeLinecap="round"*/}
          {/*  strokeLinejoin="round"*/}
          {/*>*/}
          {/*  <circle cx="12" cy="12" r="10" />*/}
          {/*  <line x1="12" y1="8" x2="12" y2="12" />*/}
          {/*  <line x1="12" y1="16" x2="12.01" y2="16" />*/}
          {/*</svg>*/}
        </div>

        <Text as={'h2'} className={s.title}>
          Что-то пошло не так
        </Text>

        <Text as={'p'} className={s.message}>{error}</Text>

        <div className={s.actions}>
          <Button
            type="button"
            className={`${s.button} ${s.primaryButton}`}
            onClick={handleReload}
          >
            Перезагрузить страницу
          </Button>

          <Button
            type="button"
            className={`${s.button} ${s.secondaryButton}`}
            onClick={handleGoHome}
          >
            На главную
          </Button>
        </div>
      </div>
    </div>
  );
};
