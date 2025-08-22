import { useNavigate, useSearchParams } from "react-router-dom";
import { useFormik } from "formik";
import { enqueueSnackbar } from "notistack";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaGoogle, FaEye, FaEyeSlash } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch } from "react-redux";
import { jwtDecode } from "jwt-decode";
import controller from "@/services/commonRequest";
import endpoints from "@/services/api";
import loginValidation from "@/validations/loginValidation";
import registerValidation from "@/validations/registerValidation";
import { setUser } from "@/features/userSlice";
import logo from '@/assets/image.png';

function LoginRegister() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const message = searchParams.get("message");
  const error = searchParams.get("error");

  useEffect(() => {
    if (error) {
      enqueueSnackbar(
        "This account has been created with email, please try to login with email",
        {
          autoHideDuration: 2000,
          anchorOrigin: {
            vertical: "bottom",
            horizontal: "right",
          },
          variant: "error",
        }
      );
    }
  }, [error]);

  useEffect(() => {
    if (message) {
      enqueueSnackbar(message, {
        autoHideDuration: 2000,
        anchorOrigin: {
          vertical: "bottom",
          horizontal: "right",
        },
        variant: "success",
      });
    }
  }, [message]);

  const loginFormik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: loginValidation,
    onSubmit: async (values, actions) => {
      try {
        const { email, password } = values;

        const response = await controller.post(`${endpoints.users}/login`, {
          email,
          password,
        });

        if (response.statusCode === 401 || response.statusCode === 500) {
          actions.resetForm();
          enqueueSnackbar(response.message, {
            autoHideDuration: 2000,
            anchorOrigin: {
              vertical: "bottom",
              horizontal: "right",
            },
            variant: "error",
          });
          return;
        } else {
          enqueueSnackbar("User successfully logged in", {
            autoHideDuration: 2000,
            anchorOrigin: {
              vertical: "bottom",
              horizontal: "right",
            },
            variant: "success",
          });

          if (response.token) {
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
              } = jwtDecode(response.token);

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
                token: response.token
              }));

              localStorage.setItem("token", response.token);
              navigate("/dashboard");
            } catch (decodeError) {
              console.error("Error decoding JWT:", decodeError);
              localStorage.setItem("token", response.token);
              navigate("/dashboard");
            }
          }
        }

        actions.resetForm();
      } catch (error) {
        enqueueSnackbar("Login failed. Please try again.", {
          autoHideDuration: 2000,
          anchorOrigin: {
            vertical: "bottom",
            horizontal: "right",
          },
          variant: "error",
        });
      }
    },
  });

  const registerFormik = useFormik({
    initialValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
    validationSchema: registerValidation,
    onSubmit: async (values, action) => {
      console.log("Registration form submitted with values:", values);

      const registrationData = {
        email: values.email,
        password: values.password,
        fullName: values.fullName,
      };

      try {
        const response = await controller.post(`${endpoints.users}/register`, registrationData);
        console.log("Registration response:", response);

        enqueueSnackbar("User registered successfully! Please check your email for verification.", {
          autoHideDuration: 3000,
          anchorOrigin: {
            vertical: "bottom",
            horizontal: "right",
          },
          variant: "success",
        });

        action.resetForm();
        setActiveTab("login");
      } catch (error: any) {
        console.error("Registration error:", error);
        enqueueSnackbar(
          error.response?.data?.message || "Registration failed",
          {
            autoHideDuration: 2000,
            anchorOrigin: {
              vertical: "bottom",
              horizontal: "right",
            },
            variant: "error",
          }
        );
      }
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 px-4">
      <div className="w-full max-w-md text-center">
        {/* Logo and Title */}
        <div className="mb-6">
          <div className="flex flex-col items-center mb-4">
            <img className="w-16 h-16 rounded-full" src={logo} alt="TripCast Logo" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900">TripCast</h1>
          <p className="text-sm text-gray-500">
            Your travel companion for life's adventures
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-md p-6 relative overflow-hidden min-h-[450px]">
          {/* Tabs */}
          <div className="flex mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("login")}
              className={`flex-1 py-2 font-medium transition ${activeTab === "login"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-400"
                }`}
            >
              Login
            </button>
            <button
              onClick={() => setActiveTab("register")}
              className={`flex-1 py-2 font-medium transition ${activeTab === "register"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-400"
                }`}
            >
              Register
            </button>
          </div>

          {/* Animated Form Container */}
          <AnimatePresence mode="wait" initial={false}>
            {activeTab === "login" && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-lg font-semibold mb-1">Welcome back!</h2>
                <p className="text-sm text-gray-500 mb-4">
                  Sign in to continue your journey
                </p>

                <form onSubmit={loginFormik.handleSubmit}>
                  <div className="flex flex-col mb-4">
                    <input
                      type="email"
                      onBlur={loginFormik.handleBlur}
                      onChange={loginFormik.handleChange}
                      value={loginFormik.values.email}
                      placeholder="john@example.com"
                      name="email"
                      className="w-full px-4 py-2 mb-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    {loginFormik.errors.email && loginFormik.touched.email && (
                      <span className="text-red-500 text-sm block">
                        {loginFormik.errors.email}
                      </span>
                    )}
                  </div>
                  <div className="relative mb-3">
                    <input
                      onBlur={loginFormik.handleBlur}
                      onChange={loginFormik.handleChange}
                      value={loginFormik.values.password}
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      name="password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    {loginFormik.errors.password && loginFormik.touched.password && (
                      <span className="text-red-500 text-sm block">
                        {loginFormik.errors.password}
                      </span>
                    )}
                    <button
                      type="button"
                      className="absolute right-3 top-2.5 text-gray-500"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>

                  <div className="flex justify-between items-center mb-4 text-sm">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="accent-blue-500" />
                      Remember me
                    </label>
                    <Link
                      to="/auth/forgot-password"
                      className="text-blue-500 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 rounded-lg font-medium hover:opacity-90 transition"
                  >
                    Sign In
                  </button>

                  <div className="my-4 text-sm text-gray-400">
                    OR CONTINUE WITH
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = `${import.meta.env.VITE_SERVER_URL
                        }/auth/google?mode=login`;
                    }}
                    className="w-full flex items-center justify-center border border-gray-300 rounded-lg py-2 text-sm font-medium gap-2 hover:bg-gray-50"
                  >
                    <FaGoogle /> Continue with Google
                  </button>
                </form>
              </motion.div>
            )}

            {activeTab === "register" && (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-lg font-semibold mb-1">Create account</h2>
                <p className="text-sm text-gray-500 mb-4">
                  Start your travel journey today
                </p>

                <form onSubmit={registerFormik.handleSubmit}>
                  {/* Full Name */}
                  <div className="relative mb-3">
                    <input
                      onBlur={registerFormik.handleBlur}
                      onChange={registerFormik.handleChange}
                      value={registerFormik.values.fullName}
                      type="text"
                      placeholder="Full name"
                      name="fullName"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    {registerFormik.errors.fullName && registerFormik.touched.fullName && (
                      <span className="text-red-500 text-sm block">
                        {registerFormik.errors.fullName}
                      </span>
                    )}
                  </div>

                  {/* Email */}
                  <div className="relative mb-3">
                    <input
                      onBlur={registerFormik.handleBlur}
                      onChange={registerFormik.handleChange}
                      value={registerFormik.values.email}
                      type="email"
                      name="email"
                      placeholder="Email address"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    {registerFormik.errors.email && registerFormik.touched.email && (
                      <span className="text-red-500 text-sm block">
                        {registerFormik.errors.email}
                      </span>
                    )}
                  </div>

                  {/* Password */}
                  <div className="relative mb-3">
                    <input
                      onBlur={registerFormik.handleBlur}
                      onChange={registerFormik.handleChange}
                      value={registerFormik.values.password}
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      name="password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    {registerFormik.errors.password && registerFormik.touched.password && (
                      <span className="text-red-500 text-sm block">
                        {registerFormik.errors.password}
                      </span>
                    )}
                    <button
                      type="button"
                      className="absolute right-3 top-2.5 text-gray-500"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {/* Confirm Password */}
                  <div className="relative mb-3">
                    <input
                      onBlur={registerFormik.handleBlur}
                      onChange={registerFormik.handleChange}
                      value={registerFormik.values.confirmPassword}
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm password"
                      name="confirmPassword"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    {registerFormik.errors.confirmPassword && registerFormik.touched.confirmPassword && (
                      <span className="text-red-500 text-sm block">
                        {registerFormik.errors.confirmPassword}
                      </span>
                    )}
                    <button
                      type="button"
                      className="absolute right-3 top-2.5 text-gray-500"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>

                  {/* Terms Agreement */}
                  <div className="flex items-start text-sm text-gray-600 mb-4">
                    <input
                      type="checkbox"
                      name="acceptTerms"
                      checked={registerFormik.values.acceptTerms}
                      onChange={registerFormik.handleChange}
                      onBlur={registerFormik.handleBlur}
                      className="mr-2 mt-1 accent-blue-500"
                    />
                    <span>
                      I agree to the{" "}
                      <a href="#" className="text-blue-600 hover:underline">
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a href="#" className="text-blue-600 hover:underline">
                        Privacy Policy
                      </a>
                    </span>
                  </div>
                  {registerFormik.errors.acceptTerms && registerFormik.touched.acceptTerms && (
                    <div className="text-red-500 text-sm mb-3">
                      {registerFormik.errors.acceptTerms}
                    </div>
                  )}

                  {/* Register Button */}
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 rounded-lg font-medium hover:opacity-90 transition"
                  >
                    Create Account
                  </button>

                  {/* Divider */}
                  <div className="my-4 text-sm text-gray-400 text-center">
                    OR CONTINUE WITH
                  </div>

                  {/* Google Login */}
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = `${import.meta.env.VITE_SERVER_URL}/auth/google?mode=login`;
                    }}
                    className="w-full flex items-center justify-center border border-gray-300 rounded-lg py-2 text-sm font-medium gap-2 hover:bg-gray-50"
                  >
                    <FaGoogle /> Continue with Google
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default LoginRegister;
