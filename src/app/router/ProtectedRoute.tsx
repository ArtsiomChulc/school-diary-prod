import { type FC } from "react";
import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router";
import { userStore } from "../../store/UserStore.tsx";
import { observer } from "mobx-react-lite";
import { LoaderPotter } from "../../components/organizms/loading/LoaderPotter.tsx";
import { PATHS } from "./PATHS.ts";
import { Button } from "../../components/atoms/button/Button.tsx";
import { Text } from "../../components/atoms/text/Text.tsx";

export const ProtectedRoute: FC = observer(() => {
  const location = useLocation();
  const { isAuthReady, isLoading, profileError, user } =
    userStore;

  if (!isAuthReady) {
    return <LoaderPotter text={"Восстанавливаем сессию"} />;
  }

  if (!user) {
    return (
      <Navigate
        to={PATHS.login}
        state={{ from: location }}
        replace
      />
    );
  }

  if (isLoading) {
    return <LoaderPotter text={"Шалость удалась"} />;
  }

  if (profileError) {
    return (
      <div
        role="alert"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          margin: "50px auto",
          padding: 18,
          maxWidth: 490,
          width: "100%",
        }}
      >
        <Text
          as={"p"}
          size={"xxl"}
          color={"var(--text-secondary)"}
          style={{
            marginBottom: 30,
          }}
        >
          {profileError}
        </Text>
        <Button
          onClick={() => void userStore.retryProfile()}
        >
          Повторить попытку
        </Button>
        <Button onClick={() => void userStore.logout()}>
          Выйти
        </Button>
      </div>
    );
  }

  return <Outlet />;
});
