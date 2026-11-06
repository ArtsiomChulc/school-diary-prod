import { type FC, useState } from "react";
import { Button } from "../../atoms/button/Button.tsx";
import { Text } from "../../atoms/text/Text.tsx";
import {
  BookAIcon,
  Calculator,
  HomeIcon,
  OutdentIcon,
  SunMoon,
  BookmarkCheck,
} from "lucide-react";
import { NickNameIco } from "../../atoms/nickNameIco/NickNameIco.tsx";
import useTheme from "../../../hooks/useTheme.ts";
import { userStore } from "../../../store/UserStore.tsx";
import { NavLink } from "react-router";
import { observer } from "mobx-react-lite";
import useWindowWidth from "../../../hooks/useWindowSize.ts";
import { Hamburger } from "../../molecules/hamburger/Hamburger.tsx";
import { PATHS } from "../../../app/router/PATHS.ts";
import s from "./Header.module.css";

interface Props {
  handleLogout: () => void;
}

export const Header: FC<Props> = observer(
  ({ handleLogout }) => {
    const { toggleTheme } = useTheme();
    const { currentUserProfile } = userStore;
    const width = useWindowWidth();

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const mobile = width <= 1028;

    const toggleMenu = () => setIsMenuOpen((prev) => !prev);
    const closeMenu = () => setIsMenuOpen(false);

    return (
      <header className={s.header}>
        {!mobile && (
          <nav className={s.desktop_nav}>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `${s.header_btn} ${isActive ? s.active : ""}`
              }
            >
              <Text as="span">Домой</Text>
            </NavLink>
            <NavLink
              to={PATHS.calculator}
              className={({ isActive }) =>
                `${s.header_btn} ${isActive ? s.active : ""}`
              }
            >
              <Text as="span">Калькулятор оценок</Text>
            </NavLink>
            <NavLink
              to={PATHS.subjects}
              className={({ isActive }) =>
                `${s.header_btn} ${isActive ? s.active : ""}`
              }
            >
              <Text as="span">Дневник</Text>
            </NavLink>
            <NavLink
              to={PATHS.schedule}
              className={({ isActive }) =>
                `${s.header_btn} ${isActive ? s.active : ""}`
              }
            >
              <Text as="span">Расписание</Text>
            </NavLink>
            <Button
              onClick={toggleTheme}
              className={s.header_btn}
              title="Сменить тему"
            >
              <Text
                as="span"
                size={"sm"}
                className={s.header_btn_theme}
              >
                Сменить тему
              </Text>
            </Button>
            <Button
              onClick={handleLogout}
              className={s.header_btn}
              title="Выход"
            >
              <Text as="span">Выход</Text>
            </Button>
          </nav>
        )}

        {mobile && (
          <div className={s.mobile_header_row}>
            <Hamburger
              isOpen={isMenuOpen}
              onToggle={toggleMenu}
            />
            <Text
              as="span"
              weight={600}
              className={s.mobile_title}
            >
              🏫 Дневник
            </Text>
          </div>
        )}

        {!mobile && (
          <NickNameIco
            fullName={currentUserProfile?.name}
            role={
              currentUserProfile &&
              "role" in currentUserProfile
                ? currentUserProfile.role
                : "student"
            }
            email={
              currentUserProfile &&
              "email" in currentUserProfile
                ? currentUserProfile.email
                : (userStore.user?.email ?? undefined)
            }
          />
        )}

        {mobile && (
          <>
            <div
              className={`${s.overlay} ${isMenuOpen ? s.overlay_active : ""}`}
              onClick={closeMenu}
            />

            <aside
              className={`${s.sidebar} ${isMenuOpen ? s.sidebar_open : ""}`}
            >
              <div className={s.sidebar_profile}>
                <NickNameIco
                  fullName={currentUserProfile?.name}
                  role={
                    currentUserProfile &&
                    "role" in currentUserProfile
                      ? currentUserProfile.role
                      : "student"
                  }
                />
                <Text
                  as="p"
                  size="sm"
                  color="var(--text-secondary)"
                  style={{ marginTop: "4px" }}
                >
                  {currentUserProfile &&
                  "email" in currentUserProfile
                    ? currentUserProfile.email
                    : (userStore.user?.email ?? undefined)}
                </Text>
              </div>

              <nav className={s.sidebar_nav}>
                <NavLink
                  to="/"
                  end
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `${s.sidebar_link} ${isActive ? s.sidebar_link_active : ""}`
                  }
                >
                  <HomeIcon size={22} />
                  <Text as="span">Главная</Text>
                </NavLink>

                <NavLink
                  to={PATHS.subjects}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `${s.sidebar_link} ${isActive ? s.sidebar_link_active : ""}`
                  }
                >
                  <BookAIcon size={22} />
                  <Text as="span">Дневник</Text>
                </NavLink>

                <NavLink
                  to={PATHS.calculator}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `${s.sidebar_link} ${isActive ? s.sidebar_link_active : ""}`
                  }
                >
                  <Calculator size={22} />
                  <Text as="span">Калькулятор</Text>
                </NavLink>
                <NavLink
                  to={PATHS.schedule}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `${s.sidebar_link} ${isActive ? s.sidebar_link_active : ""}`
                  }
                >
                  <BookmarkCheck size={22} />
                  <Text as="span">Расписание</Text>
                </NavLink>
              </nav>

              <div className={s.sidebar_footer}>
                <Button
                  onClick={() => {
                    toggleTheme();
                    closeMenu();
                  }}
                  className={s.sidebar_btn}
                >
                  <SunMoon size={20} />
                  <Text as="span">Сменить тему</Text>
                </Button>

                <Button
                  onClick={() => {
                    handleLogout();
                    closeMenu();
                  }}
                  className={`${s.sidebar_btn} ${s.logout_btn}`}
                >
                  <OutdentIcon size={20} />
                  <Text as="span">Выход</Text>
                </Button>
              </div>
            </aside>
          </>
        )}
      </header>
    );
  },
);
