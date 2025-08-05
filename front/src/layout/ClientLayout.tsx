import { Outlet } from "react-router-dom";
import Header from "../components/Header";

const ClientLayout = () => {
  return (
    <div >
      <Header />
      <Outlet />
    </div>
  );
};

export default ClientLayout;
