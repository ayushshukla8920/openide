"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { IDELayout } from "@/components/ide-layout";
export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      router.replace("/auth");
    }
  }, [router]);
  return <IDELayout />;
}
