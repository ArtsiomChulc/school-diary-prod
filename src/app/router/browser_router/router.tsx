import { ProtectedRoute } from "../ProtectedRoute.tsx";
import { createBrowserRouter } from "react-router";
import { SignIn } from "../../../screens/signIn/SignIn.tsx";
import { Layout } from "../../layout/Layout.tsx";
import GradeCalculator from "../../../screens/gradeCalculator/GradeCalculator.tsx";
import { MainScreen } from "../../../screens/mainScreen/MainScreen.tsx";
import { SubjectDetails } from "../../../components/organizms/subjectDetails/SubjectDetails.tsx";
import { Statistics } from "../../../screens/statistics/Statistics.tsx";
import { PATHS } from "../PATHS.ts";
import Schedule from "../../../screens/schedule/Schedule.tsx";
import NotFound from "../../../screens/notFound/NotFound.tsx";

export const router = createBrowserRouter([
  {
    path: PATHS.login,
    element: <SignIn />,
    errorElement: <div>not found</div>,
  },

  {
    path: "/",
    element: <ProtectedRoute />,
    errorElement: <NotFound />,
    children: [
      {
        element: <Layout />,
        children: [
          {
            index: true,
            element: <Statistics />,
          },
          {
            path: PATHS.subjects,
            element: <MainScreen />,
          },
          {
            path: PATHS.calculator,
            element: <GradeCalculator />,
          },
          {
            path: `${PATHS.subjects}/:subjectId`,
            element: <SubjectDetails />,
          },
          {
            path: PATHS.schedule,
            element: <Schedule />,
          },
        ],
      },
    ],
  },
]);
