import { enqueueSnackbar } from "notistack";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  useEffect(() => {
    if (token) {
      try {
        localStorage.setItem("token", token);
        enqueueSnackbar("Login successful", {
          variant: "success",
          autoHideDuration: 2000,
          anchorOrigin: {
            horizontal: "right",
            vertical: "bottom",
          },
        });

        navigate("/app/feed");
      } catch (err) {
        console.log("error: ", err);
        enqueueSnackbar("Invalid token", {
          variant: "error",
          autoHideDuration: 2000,
          anchorOrigin: {
            vertical: "bottom",
            horizontal: "right",
          },
        });
        navigate("/auth/login");
      }
    } else {
      enqueueSnackbar("Token not found. Please try logging in again.", {
        variant: "error",
        autoHideDuration: 2000,
        anchorOrigin: {
          vertical: "bottom",
          horizontal: "right",
        },
      });
      navigate("/auth/login");
    }
  }, [navigate, token]);

  return <div className="text-center mt-10 text-gray-600">Redirecting...</div>;
};

export default AuthCallback;
