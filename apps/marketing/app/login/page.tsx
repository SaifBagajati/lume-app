import { redirect } from "next/navigation";

// Redirect to dashboard login
export default function LoginPage() {
  // In production, this would redirect to app.lume.ca/login
  // For development, redirect to localhost:3001/login
  redirect("http://localhost:3001/login");
}
