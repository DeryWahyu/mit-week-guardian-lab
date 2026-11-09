/**
 * Test Fixtures: User Accounts, Sessions, Roles, and Auth Edge Cases
 */

export interface TestUserFixture {
  id: string;
  email: string;
  name: string;
  passwordPlainText: string;
  role: "ADMIN" | "USER";
  exp: number;
  streakDays: number;
}

export const ADMIN_USER_FIXTURE: TestUserFixture = {
  id: "usr_admin_001",
  email: "admin@guardianlab.test",
  name: "Master Admin Guardian",
  passwordPlainText: "password",
  role: "ADMIN",
  exp: 1500,
  streakDays: 45,
};

export const STANDARD_USER_FIXTURE: TestUserFixture = {
  id: "usr_user_002",
  email: "user@guardianlab.test",
  name: "Gading",
  passwordPlainText: "password",
  role: "USER",
  exp: 250,
  streakDays: 7,
};

export const NEW_REGISTERED_USER_FIXTURE = {
  name: "Siti Rahmawati",
  email: "siti.rahma@example.com",
  phone: "+6281234567890",
  password: "PasswordSuperKuat2026!",
};

export const BOUNDARY_AUTH_FIXTURES = {
  emptyFields: { email: "", password: "", name: "" },
  invalidEmailFormat: { email: "not-an-email", password: "Password123!", name: "Test User" },
  shortPassword: { email: "short@example.com", password: "123", name: "Short Pass" },
  sqliEmailPayload: {
    email: "' OR '1'='1' --",
    password: "' OR '1'='1",
    name: "SQLi Injector",
  },
  xssNamePayload: {
    name: '<script>alert("Hacked")</script>',
    email: "xss.user@example.com",
    password: "Password123!",
  },
  forgedRolePayload: {
    name: "Role Attacker",
    email: "attacker@example.com",
    password: "Password123!",
    role: "ADMIN", // Attacker trying to elevate role during registration
  },
  tamperedSessionCookie: "eyJhbGciOiJIUzI1NiJ9.tampered_payload_signature_broken",
  expiredSessionCookie: "guardian_session_expired_timestamp_zero",
};
