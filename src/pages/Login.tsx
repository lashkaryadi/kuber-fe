import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gem, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import api from '@/services/api';
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!email.trim() || !password.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter both email and password',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const result = await login(email, password);

      if (result.success) {
        toast({
          title: 'Welcome',
          description: 'You have successfully logged in',
        });
        navigate('/dashboard');
      } else {
        // Check if it's an email verification error
        if (result.requiresVerification) {
          navigate("/verify-email", {
            state: { email: result.email },
          });
        } else {
          toast({
            title: 'Login Failed',
            description: result.error || 'Invalid credentials',
            variant: 'destructive',
          });
        }
      }
    } catch (err: any) {
      // Handle direct API errors (not through auth context)
      if (err?.response?.data?.requiresVerification) {
        navigate("/verify-email", {
          state: { email: err.response.data.email },
        });
      } else {
        toast({
          title: 'Login Failed',
          description: err.response?.data?.message || 'Invalid credentials',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Logo Section */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/5 mb-6 border border-primary/10">
            <Gem className="h-10 w-10 text-primary" />
          </div>
          <h1 className="font-serif text-4xl font-bold text-foreground tracking-tight">
            Kuber
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Gemstone Inventory System
          </p>
        </div>

        {/* Login Card */}
        <div className="royal-card p-8 sm:p-10 border-t-4 border-t-primary">
          <div className="mb-8 text-center">
            <h2 className="font-serif text-2xl font-semibold text-foreground">
              Welcome Back
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Sign in to manage your inventory
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="h-12 bg-muted/50 border-input focus:ring-primary/20"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a href="#" className="text-xs font-medium text-primary hover:text-primary/80">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-12 bg-muted/50 border-input focus:ring-primary/20 pr-10"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 text-base font-medium transition-all duration-300 shadow-lg shadow-primary/20"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <a
                href="/signup"
                className="font-medium text-primary hover:underline hover:text-primary/80"
              >
                Create account
              </a>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground/60">
          © 2025 Kuber. Secured System.
        </p>
      </div>
    </div>
  );
}
