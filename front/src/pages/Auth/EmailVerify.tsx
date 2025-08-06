import { Link, useSearchParams } from "react-router-dom";
import { CheckCircleIcon } from "lucide-react";

const EmailVerify = () => {
  const [searchParams] = useSearchParams();
  const message = searchParams.get("message");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 px-4">
      <div className="w-full max-w-md text-center">
        {/* Logo and Title */}
        <div className="mb-6">
          <div className="flex flex-col items-center mb-4">
            <img className="w-16 h-16 rounded-full" src="/src/assets/image.png" alt="TripCast Logo" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900">TripCast</h1>
          <p className="text-sm text-gray-500">Your email verification was successful</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-md p-6 relative overflow-hidden min-h-[250px]">
          <div className="flex flex-col items-center gap-6">
            <CheckCircleIcon className="h-16 w-16 text-indigo-400" />

            <div className="text-center">
              <h2 className="text-2xl font-semibold text-[#222] mb-2">
                {message || "Email Verified!"}
              </h2>
              <p className="text-gray-500 text-sm">
                Your email has been successfully verified. You're all set to sign in!
              </p>
            </div>

            <Link
              to="/"
              className="w-full bg-gradient-to-r from-indigo-300 to-indigo-400 text-white rounded-lg py-2 font-semibold hover:bg-indigo-600 transition text-center"
            >
              Jump Right Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerify;
