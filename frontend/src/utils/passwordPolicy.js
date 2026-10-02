const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S{6,64}$/;

export const PASSWORD_REQUIREMENTS = [
  { label: "6–64 characters", test: (password) => password.length >= 6 && password.length <= 64 },
  { label: "One uppercase letter", test: (password) => /[A-Z]/.test(password) },
  { label: "One lowercase letter", test: (password) => /[a-z]/.test(password) },
  { label: "One number", test: (password) => /\d/.test(password) },
  { label: "One special character", test: (password) => /[^A-Za-z0-9\s]/.test(password) },
];

export function isValidPassword(password) {
  return PASSWORD_PATTERN.test(password);
}
