// import { useFormik } from "formik";
// import { enqueueSnackbar } from "notistack";
// import { useNavigate, useParams } from "react-router-dom";
// import resetPasswordValidationSchema from "../../validations/resetPasswordValidation";
// import { jwtDecode } from "jwt-decode";
// import { useEffect } from "react";
// import controller from "@/services/commonRequest";
// import endpoints from "@/services/api";
// import chatLogo from "../../assets/images/chatlogo.png";

// const ResetPassword = () => {
//   const { token } = useParams();
//   const navigate = useNavigate();
//   let error: boolean = false;
//   let decoded:
//     | {
//       email: string;
//       id: string;
//       iat: Date;
//       exp: Date;
//     }
//     | undefined = undefined;

//   if (token) {
//     try {
//       decoded = jwtDecode(token);
//     } catch (err) {
//       console.log("err: ", err);
//       error = true;
//     }
//   }

//   useEffect(() => {
//     if (error) {
//       navigate("/auth/login");
//     }
//   }, [navigate, error]);

//   const formik = useFormik({
//     initialValues: {
//       newPassword: "",
//       confirmNewPassword: "",
//     },
//     validationSchema: resetPasswordValidationSchema,
//     onSubmit: async (values, actions) => {
//       await controller.post(`${endpoints.users}/reset-password`, {
//         newPassword: values.newPassword,
//         email: decoded?.email,
//       });

//       actions.resetForm();

//       enqueueSnackbar("Password reset successfully!", {
//         anchorOrigin: { vertical: "bottom", horizontal: "right" },
//         variant: "success",
//         autoHideDuration: 2000,
//       });

//       navigate("/auth/login");
//     },
//   });

//   return (
//     <div className="min-h-screen flex items-center justify-center px-4">
//       <div className="w-full max-w-md rounded-2xl shadow-xl p-8 flex flex-col gap-6">
//         <div className="flex flex-col items-center">
//           <img src={chatLogo} alt="Chat Wave Logo" className="w-14 h-14 drop-shadow-md mb-2" />
//           <h1 className="text-3xl font-bold text-[#222]">
//             Chat <span className="text-[#43e97b]">Wave</span>
//           </h1>
//           <p className="text-gray-500 text-sm font-medium">Reset your password</p>
//         </div>

//         <form onSubmit={formik.handleSubmit} className="space-y-5 text-sm">
//           <div>
//             <label htmlFor="newPassword" className="block font-medium text-gray-700 mb-1">
//               New Password
//             </label>
//             <input
//               id="newPassword"
//               type="password"
//               name="newPassword"
//               value={formik.values.newPassword}
//               onChange={formik.handleChange}
//               onBlur={formik.handleBlur}
//               placeholder="••••••••"
//               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#43e97b]"
//               required
//             />
//             {formik.errors.newPassword && formik.touched.newPassword && (
//               <span className="text-red-500 text-sm">{formik.errors.newPassword}</span>
//             )}
//           </div>

//           <div>
//             <label htmlFor="confirmNewPassword" className="block font-medium text-gray-700 mb-1">
//               Confirm New Password
//             </label>
//             <input
//               id="confirmNewPassword"
//               type="password"
//               name="confirmNewPassword"
//               value={formik.values.confirmNewPassword}
//               onChange={formik.handleChange}
//               onBlur={formik.handleBlur}
//               placeholder="••••••••"
//               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#43e97b]"
//               required
//             />
//             {formik.errors.confirmNewPassword && formik.touched.confirmNewPassword && (
//               <span className="text-red-500 text-sm">{formik.errors.confirmNewPassword}</span>
//             )}
//           </div>

//           <button
//             type="submit"
//             disabled={
//               formik.isSubmitting ||
//               !formik.dirty ||
//               Object.keys(formik.errors).length > 0
//             }
//             className="w-full py-3 bg-[#43e97b] text-white font-semibold rounded-lg transition hover:bg-blue-400 disabled:bg-green-300 disabled:cursor-not-allowed"
//           >
//             Reset Password
//           </button>
//         </form>

//         <a
//           href="/auth/login"
//           className="flex justify-center items-center text-[#43e97b] font-medium hover:underline gap-2 mt-2"
//         >
//           <svg width="18" height="18" fill="none" stroke="#43e97b" strokeWidth="2" viewBox="0 0 24 24">
//             <path d="M15 19l-7-7 7-7" />
//           </svg>
//           Back to Sign In
//         </a>
//       </div>
//     </div>
//   );
// };

// export default ResetPassword;

const ResetPassword = () => {
  return (
    <div>ResetPassword</div>
  )
}

export default ResetPassword