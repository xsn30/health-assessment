import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f8f4] px-6">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center">
        <div className="grid w-full gap-12 py-16 md:grid-cols-2 md:items-center">
          {/* Left */}
          <section>
            <div className="mb-6 inline-flex rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm">
              Personalized health assessment
            </div>

            <h1 className="max-w-xl text-5xl font-semibold leading-tight tracking-tight text-gray-900 md:text-6xl">
              A healthier plan,
              <br />
              built around you.
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-8 text-gray-600">
              Answer a few simple questions and receive a personalized
              assessment based on your body profile, goals, and activity
              level.
            </p>

            <div className="mt-9">
              <Link
                href="/quiz"
                className="inline-flex rounded-2xl bg-gray-900 px-8 py-4 font-semibold text-white shadow-sm transition hover:bg-gray-800"
              >
                Start my assessment
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
              <span>✓ About 2 minutes</span>
              <span>✓ Personalized results</span>
              <span>✓ Progress saved automatically</span>
            </div>
          </section>

          {/* Right */}
          <section className="rounded-[2rem] bg-white p-7 shadow-sm md:p-9">
            <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Your assessment
            </p>

            <h2 className="mt-3 text-2xl font-semibold text-gray-900">
              Understand your starting point
            </h2>

            <p className="mt-3 leading-7 text-gray-600">
              We combine your profile and goals to create a simple,
              personalized wellness overview.
            </p>

            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-4 rounded-2xl bg-[#f7f8f4] p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white font-semibold text-gray-900">
                  01
                </div>

                <div>
                  <p className="font-medium text-gray-900">
                    Tell us about yourself
                  </p>
                  <p className="text-sm text-gray-500">
                    Basic profile and your health goal
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-2xl bg-[#f7f8f4] p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white font-semibold text-gray-900">
                  02
                </div>

                <div>
                  <p className="font-medium text-gray-900">
                    Complete your assessment
                  </p>
                  <p className="text-sm text-gray-500">
                    Body data and weekly activity
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-2xl bg-[#f7f8f4] p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white font-semibold text-gray-900">
                  03
                </div>

                <div>
                  <p className="font-medium text-gray-900">
                    Get your personalized plan
                  </p>
                  <p className="text-sm text-gray-500">
                    BMI, calorie estimate and progress forecast
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-7 text-xs leading-5 text-gray-400">
              This assessment provides general wellness estimates for
              demonstration purposes and is not medical advice.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}