import { enqueueSnackbar } from 'notistack';
import { useFormik } from 'formik';
import endpoints from '@/services/api';
import controller from '@/services/commonRequest';
import forgotPasswordValidationSchema from '@/validations/forgotPasswordValidation';
import { useState } from 'react';
import logo from '@/assets/image.png';

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);

  const formik = useFormik({
    initialValues: { email: "" },
    validationSchema: forgotPasswordValidationSchema,
    onSubmit: async (values, actions) => {
      setIsLoading(true);
      try {
        const res: { message: string; statusCode?: number } = await controller.post(
          `${endpoints.users}/forgot-password`,
          { email: values.email }
        );

        if (res.statusCode === 401) {
          enqueueSnackbar(res.message || "Unauthorized", {
            autoHideDuration: 2200,
            anchorOrigin: { vertical: "bottom", horizontal: "right" },
            variant: "error",
          });
        } else {
          enqueueSnackbar( "Reset password email was sent!", {
            autoHideDuration: 2200,
            anchorOrigin: { vertical: "bottom", horizontal: "right" },
            variant: "success",
          });
        }
        actions.resetForm();
      } catch (err: any) {
        enqueueSnackbar(
          err?.response?.data?.message || "Something went wrong",
          {
            autoHideDuration: 2500,
            anchorOrigin: { vertical: "bottom", horizontal: "right" },
            variant: "error",
          }
        );
      } finally {
        setIsLoading(false);
      }
    },
  });

  const isDisabled =
    isLoading || formik.isSubmitting || !formik.dirty || Object.keys(formik.errors).length > 0;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-pink-200/40 blur-3xl" />
      </div>

      <div className="w-full max-w-md z-10">
        <div className="rounded-2xl bg-white/70 backdrop-blur-xl shadow-xl ring-1 ring-white/60">
          <div className="p-8 flex flex-col gap-6">
            {/* Brand */}
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-3">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-blue-300/40 via-purple-300/40 to-pink-300/40 blur-xl" />
                <img
                  src={logo}
                  alt="TripCast Logo"
                  className="relative w-14 h-14 mx-auto drop-shadow-md"
                />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent">
                  Trip<span className="font-black">Cast</span>
                </span>
              </h1>
              <p className="text-slate-600 text-sm mt-1">Reset Password</p>
            </div>

            {/* Card */}
            <div className="rounded-xl border border-white/60 bg-white/60 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 text-center">
                Forgot password
              </h2>
              <p className="text-slate-600 text-sm text-center mt-1">
                Enter your email address and we’ll send you a link to reset your password.
              </p>

              <form onSubmit={formik.handleSubmit} className="mt-5 flex flex-col gap-4">
                <div>
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-slate-800 flex items-center gap-2"
                  >
                    Email address
                    {formik.errors.email && formik.touched.email ? (
                      <span className="text-red-500 font-normal">• {formik.errors.email}</span>
                    ) : null}
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formik.values.email}
                    name="email"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white/90 px-4 py-2.5 text-slate-900 placeholder-slate-400 shadow-sm outline-none
                               focus:ring-4 focus:ring-blue-200 focus:border-blue-300 transition"
                    required
                    aria-invalid={!!(formik.errors.email && formik.touched.email)}
                    aria-describedby="email-help"
                  />
                  <p id="email-help" className="sr-only">
                    Email address
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isDisabled}
                  aria-busy={isLoading}
                  className={`group inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-semibold text-white
                             shadow-lg transition focus:outline-none
                             disabled:cursor-not-allowed disabled:opacity-60
                             ${isDisabled
                      ? "bg-gradient-to-r from-blue-400 to-indigo-400"
                      : "bg-gradient-to-r from-blue-600 via-indigo-600 to-pink-600 hover:brightness-110 active:brightness-95"}`}
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <circle cx="12" cy="12" r="9" strokeWidth="2" className="opacity-30" />
                        <path d="M21 12a9 9 0 0 1-9 9" strokeWidth="2" />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg
                        width="18"
                        height="18"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M22 2L11 13" />
                        <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                      </svg>
                     Send reset link
                    </>
                  )}
                </button>
              </form>

              <a
                href="/"
                className="mt-4 flex items-center justify-center gap-2 font-medium text-blue-700 hover:underline"
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15 19l-7-7 7-7" />
                </svg>
                Back to Sign In
              </a>
            </div>
          </div>
        </div>

        {/* Subtle bottom note */}
        <p className="mt-4 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} TripCast — All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
