import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { SnackbarProvider } from "notistack";
import { Provider } from "react-redux";
import { store } from "./store/store";
import ROUTES from "./routes/Route";

const router = createBrowserRouter(ROUTES);

function App() {
  return (
    <>
      <Provider store={store}>
        <RouterProvider router={router} />
        <SnackbarProvider anchorOrigin={{ vertical: "bottom", horizontal: "right" }} />
      </Provider>

    </>
  );
}

export default App;
