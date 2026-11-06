import { FormContainer } from "../../components/organizms/containers/form_container/FormContainer.tsx";
import { HeadIcon } from "../../components/molecules/headIcon/HeadIcon.tsx";
import { Input } from "../../components/atoms/input/Input.tsx";
import { LockOpen, Mail } from "lucide-react";
import { Button } from "../../components/atoms/button/Button.tsx";
import { type SyntheticEvent, useState } from "react";
import { userStore } from "../../store/UserStore.tsx";
import { Navigate, useLocation } from "react-router";
import { observer } from "mobx-react-lite";
import { LoaderPotter } from "../../components/organizms/loading/LoaderPotter.tsx";
import s from "./SignIn.module.css";

export const SignIn = observer(() => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const location = useLocation();

  const fromPage = location.state?.from?.pathname || "/";

  const {
    login,
    authError,
    isAuthReady,
    isSigningIn,
    user,
  } = userStore;

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      return;
    }

    await login(email, password);
  };

  if (!isAuthReady) {
    return <LoaderPotter text={"Восстанавливаем сессию"} />;
  }

  if (user) {
    return <Navigate to={fromPage} replace />;
  }

  return (
    <div className={s.sign_in_wrapper}>
      <div className={s.icon_and_text}>
        <HeadIcon />
      </div>
      <FormContainer>
        <h3 className={s.signin_title}>
          Ваша история обучения начинается здесь.
        </h3>
        <p className={s.signin_subtitle}>
          Войдите в систему, чтобы следить за своей
          успеваемостью
        </p>
        {authError && (
          <div className={s.error_login}>{authError}</div>
        )}
        <form onSubmit={handleSubmit} className={s.form}>
          <Input
            id="email"
            label="Почтовый адрес"
            type="email"
            placeholder="you@school.com"
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail size={20} strokeWidth={1.5} />}
            required
          />
          <Input
            id="password"
            label="Пароль"
            type="password"
            placeholder="Введи свой  пароль"
            onChange={(e) => setPassword(e.target.value)}
            icon={<LockOpen size={20} strokeWidth={1.5} />}
            disabled={isSigningIn}
            required
          />
          <Button type={"submit"} disabled={isSigningIn}>
            {isSigningIn ? "Вход..." : "Войти"}
          </Button>
        </form>
      </FormContainer>
    </div>
  );
});
