import { useFormik } from "formik";
import { enqueueSnackbar } from "notistack";
import { useNavigate, useParams } from "react-router-dom";
import resetPasswordValidationSchema from "../../validations/resetPasswordValidation";
import { jwtDecode } from "jwt-decode";
import { useEffect, useMemo, useState } from "react";
import controller from "@/services/commonRequest";
import endpoints from "@/services/api";

type ResetToken = {
  email: string;
  id: string;
  iat?: number; // seconds
  exp?: number; // seconds
};

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Decode token safely
  const { decoded, hasError, isExpired } = useMemo(() => {
    let d: ResetToken | undefined;
    let err = false;
    let expired = false;

    if (!token) {
      err = true;
    } else {
      try {
        d = jwtDecode<ResetToken>(token);
        if (d?.exp) expired = d.exp * 1000 < Date.now();
      } catch (e) {
        err = true;
      }
    }
    return { decoded: d, hasError: err, isExpired: expired };
  }, [token]);

  useEffect(() => {
    if (hasError || isExpired) {
      enqueueSnackbar(
        isExpired ? "Reset link has expired. Please request a new one." : "Invalid reset link.",
        { variant: "error", autoHideDuration: 2500, anchorOrigin: { vertical: "bottom", horizontal: "right" } }
      );
      navigate("/", { replace: true });
    }
  }, [hasError, isExpired, navigate]);

  const formik = useFormik({
    initialValues: { newPassword: "", confirmNewPassword: "" },
    validationSchema: resetPasswordValidationSchema,
    onSubmit: async (values, actions) => {
      setIsLoading(true);
      try {
        await controller.post(`${endpoints.users}/reset-password`, {
          newPassword: values.newPassword,
          email: decoded?.email,
        });

        actions.resetForm();
        enqueueSnackbar("Password reset successfully!", {
          anchorOrigin: { vertical: "bottom", horizontal: "right" },
          variant: "success",
          autoHideDuration: 2000,
        });
        navigate("/", { replace: true });
      } catch (err: any) {
        enqueueSnackbar(
          err?.response?.data?.message || "Could not reset password. Please try again.",
          { variant: "error", autoHideDuration: 2500, anchorOrigin: { vertical: "bottom", horizontal: "right" } }
        );
      } finally {
        setIsLoading(false);
      }
    },
  });

  const isDisabled =
    isLoading ||
    formik.isSubmitting ||
    !formik.dirty ||
    Object.keys(formik.errors).length > 0;

  // small helper to mask email in UI if desired
  const maskedEmail = useMemo(() => {
    const e = decoded?.email || "";
    const [user, domain] = e.split("@");
    if (!user || !domain) return "";
    const head = user.slice(0, 2);
    return `${head}${"*".repeat(Math.max(user.length - 2, 0))}@${domain}`;
  }, [decoded?.email]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative soft blobs */}
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
                  src={"../../src/assets/image.png"}
                  alt="Trip Cast Logo"
                  className="relative w-14 h-14 mx-auto drop-shadow-md"
                />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent">
                  Trip<span className="font-black">Cast</span>
                </span>
              </h1>
              <p className="text-slate-600 text-sm mt-1">Reset your password</p>
              {decoded?.email && (
                <p className="text-slate-500 text-sm mt-1">
                  For account: <span className="font-medium text-slate-700">{maskedEmail}</span>
                </p>
              )}
            </div>

            {/* Form card */}
            <div className="rounded-xl border border-white/60 bg-white/60 p-6 shadow-sm">
              <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4 text-sm">
                <div>
                  <label htmlFor="newPassword" className="flex items-center gap-2 font-medium text-slate-800">
                    New Password
                    {formik.errors.newPassword && formik.touched.newPassword ? (
                      <span className="text-red-500 font-normal">• {formik.errors.newPassword}</span>
                    ) : null}
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    name="newPassword"
                    value={formik.values.newPassword}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="••••••••"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white/90 px-4 py-2.5 text-slate-900 placeholder-slate-400 shadow-sm outline-none
                               focus:ring-4 focus:ring-blue-200 focus:border-blue-300 transition"
                    required
                    aria-invalid={!!(formik.errors.newPassword && formik.touched.newPassword)}
                  />
                </div>

                <div>
                  <label htmlFor="confirmNewPassword" className="flex items-center gap-2 font-medium text-slate-800">
                    Confirm New Password
                    {formik.errors.confirmNewPassword && formik.touched.confirmNewPassword ? (
                      <span className="text-red-500 font-normal">• {formik.errors.confirmNewPassword}</span>
                    ) : null}
                  </label>
                  <input
                    id="confirmNewPassword"
                    type="password"
                    name="confirmNewPassword"
                    value={formik.values.confirmNewPassword}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="••••••••"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white/90 px-4 py-2.5 text-slate-900 placeholder-slate-400 shadow-sm outline-none
                               focus:ring-4 focus:ring-blue-200 focus:border-blue-300 transition"
                    required
                    aria-invalid={!!(formik.errors.confirmNewPassword && formik.touched.confirmNewPassword)}
                  />
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
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                        <circle cx="12" cy="12" r="9" strokeWidth="2" className="opacity-30" />
                        <path d="M21 12a9 9 0 0 1-9 9" strokeWidth="2" />
                      </svg>
                      Resetting…
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M3 12h18" />
                        <path d="M12 5l7 7-7 7" />
                      </svg>
                      Reset Password
                    </>
                  )}
                </button>
              </form>

              <a
                href="/auth/login"
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

        <p className="mt-4 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} TripCast — All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
