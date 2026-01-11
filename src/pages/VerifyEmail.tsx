import { useState, useEffect } from "react";
import api from "@/services/api";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Verify Email
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Please check your email for the verification code
            </p>

            <Input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
            />

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <Button
              onClick={submitOtp}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Verifying..." : "Verify"}
            </Button>

            <div className="text-center pt-2">
              <button
                onClick={handleResendOtp}
                disabled={cooldown > 0}
                className="text-sm text-primary disabled:opacity-50 hover:underline"
              >
                {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
