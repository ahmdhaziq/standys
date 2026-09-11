import { RegisterUser } from "../schema/register-user.schema";

export async function registerUser(dto: RegisterUser) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message ?? "Registration failed");
  }
  return res;
}
