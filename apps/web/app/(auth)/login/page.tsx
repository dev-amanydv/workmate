import { getApiBaseUrl } from "../../../lib/api/client";
import { WorkmateLogo } from "../../../components/brand/logo";

interface LoginPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const hasAuthError = params.error === "auth_failed";
  const apiBaseUrl = getApiBaseUrl();
  const googleLoginUrl = `${apiBaseUrl}/auth/google`;

  return (
    <div className="w-full max-w-md space-y-7 rounded-xl border border-[#E6E5E0] bg-white p-8">
      <div className="text-center">
        <div className="flex justify-center mb-5">
          <WorkmateLogo size="lg" showWordmark={false} />
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-[#17191A]">
          Workmate
        </h1>
        <p className="mt-1.5 text-xs text-[#6C6F71]">
          A focused professional network for engineering and craft practitioners.
        </p>
      </div>

      {hasAuthError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300"
        >
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4 shrink-0 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Sign-in failed, please try again.</span>
          </div>
        </div>
      )}

      <div className="mt-6">
        <a
          href={googleLoginUrl}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-[#E6E5E0] bg-white px-4 py-2.5 text-xs font-semibold text-[#17191A] transition hover:bg-[#F5F4F0] focus:outline-none focus:border-[#184A45]"
        >
          <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Sign in with Google</span>
        </a>
      </div>

      <p className="text-center text-xs text-gray-500 dark:text-gray-400">
        By signing in, you agree to Workmate&apos;s Terms of Service and Privacy
        Policy.
      </p>
    </div>
  );
}
