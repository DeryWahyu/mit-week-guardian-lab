export const LANDING_SECTIONS = {
  home: "landing-beranda",
  features: "landing-fitur",
  journey: "landing-cara-kerja",
  community: "landing-komunitas",
  start: "landing-mulai",
} as const;

export const PUBLIC_ROUTES = {
  home: "/",
  about: "/tentang",
  privacy: "/kebijakan-privasi",
  terms: "/ketentuan-penggunaan",
  sandboxWeb: "/sandbox/web",
  sandboxAndroid: "/sandbox/android",
  act: "/act",

  // Parameter Builders
  // APK values remain for legacy links; current APK navigation uses PROTECTED_ROUTES.apk.
  homeWithTab: (tab: "url" | "qr" | "apk") => `/?tab=${tab}`,
  homeWithGateway: (tab?: "url" | "qr" | "apk") => `/${tab ? `?tab=${tab}` : ""}#periksa`,
  investigation: (id: string, mode?: "human" | "geek") =>
    `/?investigation=${encodeURIComponent(id)}${mode ? `&mode=${mode}` : ""}`,
  homeWithMode: (mode: "human" | "geek", tab?: "url" | "qr" | "apk") =>
    `/?mode=${mode}${tab ? `&tab=${tab}` : ""}`,
  sandboxWebWithTarget: (target: string, investigationId?: string) =>
    `/sandbox/web?target=${encodeURIComponent(target)}${investigationId ? `&investigation=${encodeURIComponent(investigationId)}` : ""}`,
  actWithInvestigation: (id: string) => `/act?id=${encodeURIComponent(id)}`,
} as const;

export const AUTH_ROUTES = {
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  otp: "/otp",
  changePhone: "/change-phone",
  resetPassword: "/reset-password",
  loginWithRedirect: (target: string) => `/login?redirect=${encodeURIComponent(target)}`,
  registerWithRedirect: (target: string) => `/register?redirect=${encodeURIComponent(target)}`,
  forgotPasswordWithRedirect: (target: string) =>
    `/forgot-password?redirect=${encodeURIComponent(target)}`,
} as const;

export const PROTECTED_ROUTES = {
  profile: "/profile",
  apk: "/apk",
  apkWithMode: (mode: "human" | "geek") => (mode === "geek" ? "/apk?mode=geek" : "/apk"),
  apkWithInvestigation: (id: string, mode?: "human" | "geek") =>
    `/apk?investigation=${encodeURIComponent(id)}${mode === "geek" ? "&mode=geek" : ""}`,
  history: "/history",
  historyDetail: (id: string, mode?: "human" | "geek") =>
    `/history/${encodeURIComponent(id)}${mode === "geek" ? "?mode=geek" : ""}`,
  academy: "/academy",
  academyLesson: (id: string) => `/academy/${encodeURIComponent(id)}`,
  community: "/community",
  leaderboard: "/community/leaderboard",
  leaderboardPage: (page: number) => `/community/leaderboard?page=${page}`,
  communitySubmit: (id: string) => `/community/submit?id=${encodeURIComponent(id)}`,
  communityMine: "/community?view=mine",
  communityReplay: (id: string) => `/community/${encodeURIComponent(id)}`,
} as const;

export const ADMIN_ROUTES = {
  dashboard: "/admin",
  quizzes: "/admin/quizzes",
  communityReviews: "/admin/community-reviews",
  users: "/admin/users",
  user: (id: string) => `/admin/users/${encodeURIComponent(id)}`,
  investigations: "/admin/investigations",
  investigation: (id: string) => `/admin/investigations/${encodeURIComponent(id)}`,
  communityReview: (id: string) => `/admin/community-reviews/${encodeURIComponent(id)}`,
  monitor: "/admin/monitor",
  audit: "/admin/audit",
  reports: "/admin/reports",
} as const;

export const API_ROUTES = {
  profile: "/api/profile",
  platformOverview: "/api/platform/overview",
  leaderboard: (page: number) => `/api/community/leaderboard?page=${page}`,
  analyzeUrl: "/api/analyze-url",
  analyzeQr: "/api/analyze-qr",
  analyzeApk: "/api/analyze-apk",
  sandboxSession: "/api/sandbox/session",
  sandboxSessionStart: "/api/sandbox/session/start",
  sandboxSessionStop: "/api/sandbox/session/stop",
  sandboxAnalyzeDownload: (id: string, downloadId: string) =>
    `/api/sandbox/session/${encodeURIComponent(id)}/downloads/${encodeURIComponent(downloadId)}/analyze`,
  authRegister: "/api/auth/register",
  authLogin: "/api/auth/login",
  authLogout: "/api/auth/logout",
  authMe: "/api/auth/me",
  authOtpSend: "/api/auth/otp/send",
  authOtpVerify: "/api/auth/otp/verify",
  authOtpStatus: "/api/auth/otp/status",
  authOtpChangePhone: "/api/auth/otp/change-phone",
  authForgotPassword: "/api/auth/password/forgot",
  authResetPassword: "/api/auth/password/reset",
  history: "/api/history",
  historyDetail: (id: string) => `/api/history/${encodeURIComponent(id)}`,
  academyProgress: "/api/academy/progress",
  quizzes: "/api/academy/quizzes",
  quizDetail: (id: string) => `/api/academy/quizzes/${encodeURIComponent(id)}`,
  quizThumbnail: (id: string, version: string) =>
    `/api/academy/quizzes/${encodeURIComponent(id)}/thumbnail?v=${encodeURIComponent(version)}`,
  submitQuiz: "/api/academy/submit-quiz",
  communitySubmit: "/api/community/submit",
  communityReplays: "/api/community/replays",
  communityReplay: (id: string) => `/api/community/replays/${encodeURIComponent(id)}`,
  communityPreview: (id: string) =>
    `/api/community/submit?investigationId=${encodeURIComponent(id)}`,
  replayAttempt: (id: string) => `/api/community/replays/${encodeURIComponent(id)}/attempt`,
  replayChallenge: (id: string) => `/api/community/replays/${encodeURIComponent(id)}/challenge`,
  adminQuizzes: "/api/admin/quizzes",
  adminUsers: "/api/admin/users",
  adminUser: (id: string) => `/api/admin/users/${encodeURIComponent(id)}`,
  adminInvestigations: "/api/admin/investigations",
  adminInvestigation: (id: string) => `/api/admin/investigations/${encodeURIComponent(id)}`,
  adminMonitor: "/api/admin/monitor",
  adminAudit: "/api/admin/audit",
  adminReports: "/api/admin/reports",
  adminReportsExport: "/api/admin/reports/export",
  adminCaseWithdraw: (id: string) =>
    `/api/admin/community-reviews/${encodeURIComponent(id)}/withdraw`,
  adminQuizzesPage: (page: number) => `/api/admin/quizzes?page=${page}`,
  adminQuiz: (id: string) => `/api/admin/quizzes/${encodeURIComponent(id)}`,
  adminCommunityReviews: "/api/admin/community-reviews",
  adminCommunityReview: (id: string) => `/api/admin/community-reviews/${encodeURIComponent(id)}`,
} as const;

export const ROUTES = {
  public: PUBLIC_ROUTES,
  auth: AUTH_ROUTES,
  protected: PROTECTED_ROUTES,
  admin: ADMIN_ROUTES,
  api: API_ROUTES,
} as const;

export default ROUTES;
