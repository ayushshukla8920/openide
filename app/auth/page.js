"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      router.replace("/");
    }
  }, [router]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    const action = isLogin ? "login" : "signup";
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, username, password }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("userId", data.userId);
        router.replace("/");
      } else {
        setMessage(data.error);
      }
    } catch (err) {
      setMessage("Something went wrong. Try again.");
    }
  };
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[#1e1e1e]">
      <div className="w-full max-w-md bg-[#252526] rounded-2xl shadow-lg px-8 py-10">
        <h1 className="text-4xl font-bold text-center text-[#d4d4d4] mb-10">Open IDE</h1>
        {message && (
          <div className="mb-4 text-center text-sm text-[#f48771]">{message}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2 rounded bg-[#1e1e1e] text-[#d4d4d4] border border-[#3c3c3c] focus:outline-none focus:border-[#007acc]"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 rounded bg-[#1e1e1e] text-[#d4d4d4] border border-[#3c3c3c] focus:outline-none focus:border-[#007acc]"
            required
          />
          <button
            type="submit"
            className="w-full bg-[#007acc] hover:bg-[#006bb3] text-white py-2 rounded font-medium transition"
          >
            {isLogin ? "Login" : "Sign Up"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-[#d4d4d4]">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setMessage("");
            }}
            className="text-[#007acc] hover:underline font-medium"
          >
            {isLogin ? "Sign Up" : "Login"}
          </button>
        </div>
      </div>
    </div>
  );
}
