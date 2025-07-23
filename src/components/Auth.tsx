import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, Mail, Apple } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const [activeTab, setActiveTab] = useState('signin');
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // Clear any existing session when component mounts
  useEffect(() => {
    const clearSession = async () => {
      await supabase.auth.signOut();
    };
    clearSession();
  }, []);

  useEffect(() => {
    if (user && session) {
      navigate('/app');
    }
  }, [user, session, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          toast({
            title: "Account exists",
            description: "This email is already registered. Please sign in instead.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Sign up failed",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Check your email",
          description: "We've sent you a confirmation link to complete your registration.",
        });
      }
    } catch (error) {
      toast({
        title: "Sign up failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: "Sign in failed",
            description: "Invalid email or password. Please check your credentials.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Sign in failed",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        // Redirect to /app after successful login
        navigate('/app');
      }
    } catch (error) {
      toast({
        title: "Sign in failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-poppins">
      {/* Left Panel (Video) */}
      <div className="hidden md:flex flex-col justify-center items-center w-1/2 order-1 relative">
        <video src="/lp_fyv.mp4" autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" />
      </div>
      {/* Right Panel (Form) */}
      <div className="flex flex-col justify-center items-center w-full md:w-1/2 min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 order-2">
        <div className="w-full max-w-md px-10 py-12 h-[700px] transition-all duration-500 overflow-y-auto">
          <div className="flex items-center justify-center mb-8">
            <img src="/milao_logo.png" alt="Milao Logo" className="w-24 h-24 rounded-xl object-contain p-1" />
          </div>
          <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin" className="flex items-center space-x-2 font-medium">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="flex items-center space-x-2 font-medium">Sign Up</TabsTrigger>
            </TabsList>
            {/* Sign In Tab */}
            <TabsContent value="signin">
              {showReset ? (
                <div>
                  <div className="text-xl font-bold mb-2">Reset your password</div>
                  <p className="text-gray-500 text-sm font-normal mb-4">Enter your email to receive a password reset link.</p>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    setResetLoading(true);
                    try {
                      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail);
                      if (error) {
                        toast({ title: 'Reset failed', description: error.message, variant: 'destructive' });
                      } else {
                        toast({ title: 'Check your email', description: 'A password reset link has been sent.' });
                        setShowReset(false);
                      }
                    } catch (err) {
                      toast({ title: 'Reset failed', description: 'An error occurred.', variant: 'destructive' });
                    } finally {
                      setResetLoading(false);
                    }
                  }} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email" className="font-medium">Email</Label>
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="Enter your email"
                        value={resetEmail}
                        onChange={e => setResetEmail(e.target.value)}
                        required
                        className="rounded-md border p-3 text-sm w-full font-normal"
                      />
                    </div>
                    <Button type="submit" className="w-full bg-gradient-to-r from-purple-500/80 to-indigo-500/80 text-white rounded-md font-semibold py-3 shadow-lg backdrop-blur-sm" disabled={resetLoading}>
                      {resetLoading ? 'Sending...' : 'Reset Password'}
                    </Button>
                    <div className="mt-4 text-center text-xs text-gray-500">
                      <button type="button" className="text-blue-600 underline font-medium" onClick={() => setShowReset(false)}>Back to Sign In</button>
                    </div>
                  </form>
                </div>
              ) : (
                <>
                  <div>
                    <div className="text-xl font-bold mb-2">Welcome back</div>
                    <p className="text-gray-500 text-sm font-normal mb-4">Sign in to your account</p>
                  </div>
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email" className="font-medium">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="rounded-md border p-3 text-sm w-full font-normal"
                      />
                    </div>
                    <div className="space-y-2 relative">
                      <Label htmlFor="signin-password" className="font-medium">Password</Label>
                      <Input
                        id="signin-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="rounded-md border p-3 text-sm w-full font-normal pr-10"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-gray-400">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <div className="flex justify-end">
                      <button type="button" className="text-xs text-blue-600 underline font-medium" onClick={() => setShowReset(true)}>
                        Forgot password?
                      </button>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-purple-500/80 to-indigo-500/80 text-white rounded-md font-semibold py-3 shadow-lg backdrop-blur-sm" 
                      disabled={loading}
                    >
                      {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>
                  <div className="flex items-center my-6">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="mx-3 text-gray-400 text-xs font-light">or</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                  </div>
                  <div className="mt-6 text-center text-xs text-gray-500">
                    Don&apos;t have an account? <button type="button" className="text-blue-600 underline font-medium" onClick={() => setActiveTab('signup')}>Sign Up</button>
                  </div>
                </>
              )}
            </TabsContent>
            {/* Sign Up Tab */}
            <TabsContent value="signup">
              <div>
                <div className="text-xl font-bold mb-2">Create your account</div>
                <p className="text-gray-500 text-sm font-normal mb-4">Sign up to get started</p>
              </div>
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="font-medium">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="rounded-md border p-3 text-sm w-full font-normal"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="font-medium">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="rounded-md border p-3 text-sm w-full font-normal"
                  />
                </div>
                <div className="space-y-2 relative">
                  <Label htmlFor="signup-password" className="font-medium">Password</Label>
                  <Input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="rounded-md border p-3 text-sm w-full font-normal pr-10"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-gray-400">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input type="checkbox" id="terms" className="rounded border-gray-300" required />
                  <label htmlFor="terms" className="text-xs text-gray-500">I agree to the <a href="#" className="text-blue-600 underline">Terms & Conditions</a></label>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-purple-500/80 to-indigo-500/80 text-white rounded-md font-semibold py-3 shadow-lg backdrop-blur-sm" 
                  disabled={loading}
                >
                  {loading ? 'Creating account...' : 'Sign Up'}
                </Button>
              </form>
              <div className="flex items-center my-6">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="mx-3 text-gray-400 text-xs font-light">or</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>
              <div className="mt-6 text-center text-xs text-gray-500">
                Already have an account? <button type="button" className="text-blue-600 underline font-medium" onClick={() => setActiveTab('signin')}>Sign In</button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Auth;