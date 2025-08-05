import { Link, useSearchParams } from "react-router-dom";
import { CheckCircleIcon } from "lucide-react";

const EmailVerify = () => {
  const [searchParams] = useSearchParams();
  const message = searchParams.get("message");

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 flex flex-col gap-5">
        <div className="flex flex-col items-center mb-2">
          <h1 className="text-3xl font-bold text-[#222] mb-1">
            Chat <span className="text-[#43e97b]">Wave</span>
          </h1>
          <p className="text-gray-500 text-sm">Email verification successful</p>
        </div>

        <div className="flex flex-col items-center gap-6">
          <CheckCircleIcon className="h-16 w-16 text-[#43e97b]" />

          <div className="text-center">
            <h2 className="text-2xl font-semibold text-[#222] mb-2">
              {message || "Email Verified!"}
            </h2>
            <p className="text-gray-500 text-sm">
              Your email has been successfully verified. You're all set to sign
              in!
            </p>
          </div>

          <Link
            to="/auth/login"
            className="w-full bg-[#43e97b] text-white rounded-lg py-2 font-semibold hover:bg-[#38d46d] transition text-center"
          >
            Jump Right Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EmailVerify;
