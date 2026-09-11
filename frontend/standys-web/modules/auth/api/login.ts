export async function login(email: string, password: string) {
  // use raw fetch instead of api client since we call the api from Next.js server, not core backend
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message ?? "Login Failed. Please Try Again.");
  }
  return res;
}
