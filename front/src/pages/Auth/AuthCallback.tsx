import { enqueueSnackbar } from "notistack";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { jwtDecode } from "jwt-decode";
import { setUser } from "@/features/userSlice";

const AuthCallback = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token } = useParams();
  useEffect(() => {
    if (token) {
      try {
        const decoded: {
          id: string;
          email: string;
          fullName: string;
          profileImage?: {
            url: string;
            public_id?: string;
          };
          premium?: boolean;
          lists?: string[];
          journals?: string[];
          lastLogin?: string;
          loginAttempts?: number;
          lockUntil?: string;
          isVerified?: boolean;
          provider?: 'local' | 'google';
          providerId?: string;
          createdAt?: string;
          updatedAt?: string;
          iat: number;
          exp: number;
        } = jwtDecode(token);

        // Dispatch user data to Redux
        dispatch(setUser({
          id: decoded.id,
          email: decoded.email,
          fullName: decoded.fullName,
          profileImage: decoded.profileImage,
          premium: decoded.premium,
          lists: decoded.lists,
          journals: decoded.journals,
          lastLogin: decoded.lastLogin,
          loginAttempts: decoded.loginAttempts,
          lockUntil: decoded.lockUntil,
          isVerified: decoded.isVerified,
          provider: decoded.provider,
          providerId: decoded.providerId,
          createdAt: decoded.createdAt,
          updatedAt: decoded.updatedAt,
          token: token
        }));

        localStorage.setItem("token", token);
        enqueueSnackbar("Login successful", {
          variant: "success",
          autoHideDuration: 2000,
          anchorOrigin: {
            horizontal: "right",
            vertical: "bottom",
          },
        });

        navigate("/dashboard");
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
        navigate("/");
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
      navigate("/");
    }
  }, [navigate, token, dispatch]);

  return <div className="text-center mt-10 text-gray-600">Redirecting...</div>;
};

export default AuthCallback;
