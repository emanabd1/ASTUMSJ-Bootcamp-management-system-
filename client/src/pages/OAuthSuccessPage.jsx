import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../hooks/useAuth";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function OAuthSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const finishOAuthLogin = async () => {
      const token = searchParams.get("token");

      if (!token) {
        navigate("/login?oauth=failed", { replace: true });
        return;
      }

      try {
        const res = await axios.get(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const user = res.data.user || res.data;

        if (!user) {
          throw new Error("User information was not returned.");
        }

        login(user, token);

        const role = user.role?.toLowerCase();

        switch (role) {
          case "admin":
            navigate("/admin/dashboard", { replace: true });
            break;

          case "mentor":
            navigate("/mentor/dashboard", { replace: true });
            break;

          case "student":
            navigate("/student/dashboard", { replace: true });
            break;

          default:
            navigate("/login?oauth=unknown-role", {
              replace: true,
            });
        }
      } catch (error) {
        console.error("OAuth login error:", error);
        navigate("/login?oauth=failed", { replace: true });
      }
    };

    finishOAuthLogin();
  }, [navigate, searchParams, login]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#c89b7b]">
      <div className="rounded-2xl bg-[#1e1713] px-8 py-6 text-center text-[#f5efe6] shadow-2xl">
        <h2 className="mb-2 text-xl font-bold">
          Signing you in...
        </h2>

        <p className="text-sm text-[#a39081]">
          Please wait while we complete your login.
        </p>
      </div>
    </div>
  );
}