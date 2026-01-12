import { useState, useEffect } from "react";
import api from "@/services/api";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Gem } from "lucide-react";


export default function VerifyEmail() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const submitOtp = async () => {
    setLoading(true);
    setError("");
    
    try {
      const res = await api.verifyEmailOtp({
        email: state.email,
        otp,
      });

      if (res.success) {
        navigate("/login");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;

    try {
      const res = await api.resendEmailOtp({ email: state.email });

      if (res.success) {
        toast({
          title: "OTP Sent",
          description: "A new OTP has been sent to your email",
        });

        setCooldown(30); // 30 seconds cooldown
      } else {
        toast({
          title: "Error",
          description: res.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to resend OTP",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (cooldown === 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
            <Gem className="h-8 w-8 text-secondary" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-gray-800">Kuber</h1>
          <p className="text-gray-600 text-sm">
            Gemstone Inventory System
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 transition-all duration-300 hover:shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="font-serif text-2xl font-semibold text-gray-800">
              Verify Your Email
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              We've sent a verification code to your email
            </p>
          </div>

          <div className="space-y-5">
            <p className="text-sm text-gray-600 text-center">
              Please check your email for the 6-digit verification code
            </p>

            <Input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              className="h-12 bg-gray-50 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-center text-lg tracking-widest transition-all duration-200"
            />

            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            <Button
              onClick={submitOtp}
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-white font-medium rounded-xl shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
            >
              {loading ? "Verifying..." : "Verify Account"}
            </Button>

            <div className="text-center pt-4">
              <button
                onClick={handleResendOtp}
                disabled={cooldown > 0}
                className="text-sm font-medium text-primary hover:text-primary/80 disabled:opacity-50 hover:underline transition-colors"
              >
                {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-500">
                © 2025 Kuber. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
