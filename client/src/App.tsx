import "./styles/index.css";
import { Suspense } from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { AI_BEST_CASE } from "./pages/ai-best-case";

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      children: [
        {
          path: "ai-best-case",
          index: true,
          element: <AI_BEST_CASE />,
        },
      ],
    },
  ]);
  return (
    <Suspense fallback={null}>
      <RouterProvider router={router} />
    </Suspense>
  );
}

export default App;
