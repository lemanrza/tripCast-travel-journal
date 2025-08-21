// src/pages/NotFound.tsx
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="relative min-h-dvh bg-white text-gray-900">
      {/* ultra-subtle ambient blobs (very light) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-blue-500/7 blur-3xl" />
        <div className="absolute -bottom-28 -right-28 h-80 w-80 rounded-full bg-purple-500/7 blur-3xl" />
      </div>

      {/* Centered content */}
      <section className="relative z-10 mx-auto grid min-h-dvh max-w-2xl place-items-center p-6">
        <div className="flex w-full flex-col items-center text-center">
          {/* Big animated 404 */}
          <h1
            className="select-none text-[92px] leading-none font-extrabold tracking-tight sm:text-[120px]"
            aria-label="404"
            title="404"
          >
            <span className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent animate-sheen">
              404
            </span>
          </h1>

          {/* Helper text */}
          <p className="mt-3 text-lg text-gray-600">
            we can't find the page that you search
          </p>

          {/* Buttons */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <Link
              to="/dashboard"
              className="group inline-flex items-center rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 px-5 py-2.5 text-white shadow-md transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
            >
              ⟵ Back home
            </Link>
            <Link
              to="/lists"
              className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
            >
               Explore lists
            </Link>
          </div>

          {/* Small note */}
          <p className="mt-4 text-xs text-gray-400">
            Error code: 404 • Not Found
          </p>
        </div>
      </section>

      <DecorDots />

      <style>{keyframes}</style>
    </main>
  );
}

function DecorDots() {
  const dots = Array.from({ length: 10 });
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {dots.map((_, i) => {
        const top = Math.random() * 90 + 5;     
        const left = Math.random() * 90 + 5;    
        const delay = (i * 0.25).toFixed(2) + "s";
        const size = i % 3 === 0 ? 100 : 70;
        return (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              top: `${top}%`,
              left: `${left}%`,
              width: size,
              height: size,
              background:
                i % 2 === 0
                  ? "rgba(59,130,246,.15)"
                  : "rgba(168,85,247,.15)",
              animation: "floatY 6s ease-in-out infinite",
              animationDelay: delay,
            }}
          />
        );
      })}
    </div>
  );
}

const keyframes = `
@keyframes sheen {
  0% { background-position: 0% 50%; filter: drop-shadow(0 0 0 rgba(107,114,128,0)); }
  50% { background-position: 100% 50%; filter: drop-shadow(0 8px 20px rgba(59,130,246,.25)); }
  100% { background-position: 0% 50%; filter: drop-shadow(0 0 0 rgba(107,114,128,0)); }
}
@keyframes floatY {
  0%,100% { transform: translateY(0); opacity: .7; }
  50% { transform: translateY(-10px); opacity: 1; }
}

/* utility classes for this page */
.animate-sheen {
  background-size: 200% 200%;
  animation: sheen 3.5s ease-in-out infinite;
}
`;
