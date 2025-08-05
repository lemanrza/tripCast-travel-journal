// import controller from "@/services/commonRequest";
// import { useEffect, useState } from "react";
// import { FcGoogle } from "react-icons/fc";
// import { useNavigate, useSearchParams } from "react-router-dom";
// import { useFormik } from "formik";
// import loginValidation from "@/validations/loginValidation";
// import endpoints from "@/services/api";
// import { enqueueSnackbar } from "notistack";

// const Login = () => {
//   const [showPassword, setShowPassword] = useState(false);
//   const navigate = useNavigate();
//   const [searchParams] = useSearchParams();

//   const message = searchParams.get("message");
//   const error = searchParams.get("error");

//   useEffect(() => {
//     if (error) {
//       enqueueSnackbar(
//         "This account has been created with email, please try to login with email",
//         {
//           autoHideDuration: 2000,
//           anchorOrigin: {
//             vertical: "bottom",
//             horizontal: "right",
//           },
//           variant: "error",
//         }
//       );
//     }
//   }, [error]);

//   useEffect(() => {
//     if (message) {
//       enqueueSnackbar(message, {
//         autoHideDuration: 2000,
//         anchorOrigin: {
//           vertical: "bottom",
//           horizontal: "right",
//         },
//         variant: "success",
//       });
//     }
//   }, [message]);

//   const loginFormik = useFormik({
//     initialValues: {
//       email: "",
//       password: "",
//     },
//     validationSchema: loginValidation,
//     onSubmit: async (values, actions) => {
//       try {
//         const { email, password } = values;

//         const response = await controller.post(`${endpoints.users}/login`, {
//           email,
//           password,
//         });

//         if (response.statusCode == 401 || response.statusCode == 500) {
//           actions.resetForm();

//           return enqueueSnackbar(response.message, {
//             autoHideDuration: 2000,
//             anchorOrigin: {
//               vertical: "bottom",
//               horizontal: "right",
//             },
//             variant: "error",
//           });
//         } else {
//           enqueueSnackbar(t("login_success", "User successfully login"), {
//             autoHideDuration: 2000,
//             anchorOrigin: {
//               vertical: "bottom",
//               horizontal: "right",
//             },
//             variant: "success",
//           });

//           if (response.token) {
//             localStorage.setItem("token", response.token);

//             const userId = JSON.parse(atob(response.token.split(".")[1])).id;

//             navigate("/app/feed");

//             await controller.update(`${endpoints.users}/me`, userId, {
//               isOnline: true,
//             });
//           }
//         }

//         actions.resetForm();
//       } catch (error) {
//         console.log(error);
//       }
//     },
//   });

//   return (
//     <div className="min-h-screen flex items-center justify-center">
//       <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 flex flex-col gap-5">
//         <div className="flex flex-col items-center mb-2">
//           <h1 className="text-3xl font-bold text-[#222] mb-1">
//             Cat <span className="text-green-600">Wave</span>
//           </h1>
//           <p className="text-gray-500 text-sm">
//             {t("login_welcome")}
//           </p>
//         </div>

//         <div className="grid grid-cols-1 gap-3">
//           <button
//             onClick={() => {
//               window.location.href = `${import.meta.env.VITE_SERVER_URL
//                 }/auth/google?mode=login`;
//             }}
//             className="flex items-center justify-center w-full gap-3 border border-gray-300 py-2 rounded-lg hover:bg-gray-100 transition cursor-pointer"
//           >
//             <FcGoogle className="text-xl" />
//             <span className="text-sm text-gray-700">{t("login_google")}</span>
//           </button>
//           <button
//             onClick={() => {
//               window.location.href = `${import.meta.env.VITE_SERVER_URL
//                 }/auth/github?mode=login`;
//             }}
//             className="flex items-center justify-center w-full gap-3 border border-gray-300 py-2 rounded-lg hover:bg-gray-100 transition cursor-pointer"
//           >
//             <img
//               src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg"
//               alt="GitHub"
//               className="w-5 h-5"
//             />
//             <span className="text-sm text-gray-700">{t("login_github")}</span>
//           </button>
//           <div className="flex items-center gap-2 mt-1">
//             <span className="flex-1 h-px bg-gray-200" />
//             <span className="text-xs text-gray-400">
//               {t("login_or_email")}
//             </span>
//             <span className="flex-1 h-px bg-gray-200" />
//           </div>
//         </div>

//         <form
//           onSubmit={loginFormik.handleSubmit}
//           className="flex flex-col gap-4"
//         >
//           <div>
//             <label className="text-sm font-medium text-[#222]">{t("login_email_label")}</label>
//             <input
//               type="text"
//               name="email"
//               onChange={loginFormik.handleChange}
//               value={loginFormik.values.email}
//               onBlur={loginFormik.handleBlur}
//               placeholder={t("login_email_placeholder")}
//               className="mt-1 border rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#43e97b]"
//             />
//             {loginFormik.errors.email && loginFormik.touched.email && (
//               <span className="text-red-500 text-sm mt-1 block">
//                 {loginFormik.errors.email}
//               </span>
//             )}
//           </div>
//           <div className="relative">
//             <label className="text-sm font-medium text-[#222]">{t("login_password_label")}</label>
//             <input
//               type={showPassword ? "text" : "password"}
//               name="password"
//               onChange={loginFormik.handleChange}
//               value={loginFormik.values.password}
//               onBlur={loginFormik.handleBlur}
//               placeholder={t("login_password_placeholder")}
//               className="mt-1 border rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#43e97b] pr-10"
//             />
//             <button
//               type="button"
//               tabIndex={-1}
//               onClick={() => setShowPassword((v) => !v)}
//               className="absolute right-3 top-9.5 text-[#43e97b] cursor-pointer"
//             >
//               {showPassword ? (
//                 <svg
//                   xmlns="http://www.w3.org/2000/svg"
//                   fill="none"
//                   viewBox="0 0 24 24"
//                   strokeWidth={1.5}
//                   stroke="currentColor"
//                   className="w-5 h-5"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z"
//                   />
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
//                   />
//                 </svg>
//               ) : (
//                 <svg
//                   xmlns="http://www.w3.org/2000/svg"
//                   fill="none"
//                   viewBox="0 0 24 24"
//                   strokeWidth={1.5}
//                   stroke="currentColor"
//                   className="w-5 h-5"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     d="M3 3l18 18M9.88 9.88A3 3 0 0012 15a3 3 0 002.12-5.12M6.53 6.53C4.06 8.36 2.25 12 2.25 12s3.75 7.5 9.75 7.5c1.61 0 3.09-.22 4.41-.61M17.47 17.47C19.94 15.64 21.75 12 21.75 12c-.653-1.306-1.86-3.342-3.72-5.06"
//                   />
//                 </svg>
//               )}
//             </button>
//             {loginFormik.errors.password && loginFormik.touched.password && (
//               <span className="text-red-500 text-sm mt-1 block">
//                 {loginFormik.errors.password}
//               </span>
//             )}
//           </div>
//           <div className="flex items-center justify-between text-xs text-gray-500">
//             <label className="flex items-center gap-2">
//               <input type="checkbox" className="accent-[#43e97b]" /> {t("login_remember")}
//             </label>
//             <a
//               href="/auth/forgot-password"
//               className="hover:underline text-[#43e97b]"
//             >
//               {t("login_forgot")}
//             </a>
//           </div>
//           <button
//             type="submit"
//             disabled={
//               loginFormik.isSubmitting ||
//               !loginFormik.dirty ||
//               Object.entries(loginFormik.errors).length > 0
//             }
//             className="bg-[#43e97b] text-white rounded-lg py-2 font-semibold hover:bg-[#38d46d] transition disabled:cursor-not-allowed disabled:bg-[#43e97add] cursor-pointer"
//           >
//             {t("login_signin")}
//           </button>
//         </form>
//         <p className="text-center text-sm mt-4 text-gray-500">
//           {t("login_no_account")}
//           <a
//             href="/auth/register"
//             className="text-[#43e97b] font-semibold hover:underline"
//           >
//             {t("login_create_now")}
//           </a>
//         </p>
//       </div>
//     </div>
//   );
// };

// export default Login;

const Login = () => {
  return (
    <div>Login</div>
  )
}

export default Login