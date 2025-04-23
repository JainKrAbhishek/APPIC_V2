import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { GraduationCap, User as UserIcon, Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { User } from "@shared/schema";
import Logo from "@/components/common/Logo";

interface LoginProps {
  setUser?: (user: User) => void;
  onLoginSuccess?: () => void;
}

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

const Login = ({ setUser, onLoginSuccess }: LoginProps) => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Login failed");
      }
      
      // Handle successful login
      if (setUser) {
        setUser(result.user);
      }
      
      // Call the login success callback if provided
      if (onLoginSuccess) {
        onLoginSuccess();
      }
      
      // Redirect to dashboard
      setLocation("/dashboard");
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${result.user.firstName || result.user.username}!`,
      });
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-b from-gray-50 via-gray-100 to-white dark:from-black dark:via-gray-950 dark:to-gray-900 relative">
      {/* Header */}
      <header className="sticky top-0 z-30 py-4 px-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/">
            <div className="flex items-center gap-2 group">
              <Logo 
                size={40}
                color="text-primary"
                showText
                textColor="text-gray-900 dark:text-white"
              />
            </div>
          </Link>
          
          <div className="flex items-center gap-3">
            <Link href="/register">
              <Button 
                variant="outline" 
                size="sm"
                className="font-medium border-gray-300 dark:border-white/20 bg-white/90 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-white hover:text-gray-900 dark:hover:text-white"
              >
                Sign up
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container relative z-10 mx-auto px-4 pt-6 pb-20 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-md">
          {/* Login Card */}
          <Card className="bg-white/90 dark:bg-black/30 backdrop-blur-xl border-gray-200 dark:border-white/10 shadow-xl overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 to-teal-500"></div>
            <CardHeader className="space-y-1 pt-8">
              <div className="flex flex-col items-center">
                <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                  <Logo 
                    size={32} 
                    color="text-emerald-500 dark:text-emerald-400" 
                    showText={false}
                  />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white text-center">Welcome Back</CardTitle>
                <CardDescription className="text-gray-500 dark:text-white/60 text-center pt-1">
                  Enter your credentials to continue your GRE prep journey
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="px-6 pt-4 pb-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 dark:text-white/80 font-medium">Username</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <div className="absolute left-3 top-3 text-gray-400 dark:text-white/50">
                              <UserIcon className="h-5 w-5" />
                            </div>
                            <Input 
                              placeholder="Enter your username" 
                              {...field} 
                              className="h-12 pl-10 bg-white dark:bg-white/10 border-gray-200 dark:border-white/10 text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-500 dark:text-red-400 text-sm" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between">
                          <FormLabel className="text-gray-700 dark:text-white/80 font-medium">Password</FormLabel>
                          <Link href="/forgot-password" className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300">
                            Forgot password?
                          </Link>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <div className="absolute left-3 top-3 text-gray-400 dark:text-white/50">
                              <Lock className="h-5 w-5" />
                            </div>
                            <Input 
                              type="password" 
                              placeholder="Enter your password" 
                              {...field} 
                              className="h-12 pl-10 bg-white dark:bg-white/10 border-gray-200 dark:border-white/10 text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-500 dark:text-red-400 text-sm" />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full h-12 mt-2 text-base font-medium shadow-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-emerald-500/30 border-0 transition-all" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                        <span>Signing in...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <span>Sign In</span>
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </div>
                    )}
                  </Button>
                </form>
              </Form>
              
              <div className="mt-6 flex items-center justify-center space-x-2">
                <div className="h-px bg-gray-200 dark:bg-white/10 w-full"></div>
                <span className="text-gray-400 dark:text-white/50 text-sm px-2">OR</span>
                <div className="h-px bg-gray-200 dark:bg-white/10 w-full"></div>
              </div>
              
              <div className="mt-6 text-center text-gray-500 dark:text-white/70 text-sm">
                Don't have an account?{" "}
                <Link href="/register" className="text-emerald-600 dark:text-emerald-400 font-medium hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors">
                  Create an account
                </Link>
              </div>
            </CardContent>
            
            <CardFooter className="bg-gray-50 dark:bg-white/5 px-6 py-4 flex flex-col">
              <div className="bg-white/80 dark:bg-black/30 rounded-lg p-4 text-center border border-gray-200 dark:border-white/10">
                <p className="text-sm text-gray-600 dark:text-white/70 mb-2">Demo Accounts</p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-lg border border-gray-100 dark:border-transparent">
                    <div className="font-semibold text-gray-800 dark:text-white mb-1">Regular User</div>
                    <div className="text-gray-500 dark:text-white/60">username: alex</div>
                    <div className="text-gray-500 dark:text-white/60">password: password123</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-lg border border-gray-100 dark:border-transparent">
                    <div className="font-semibold text-gray-800 dark:text-white mb-1">Admin User</div>
                    <div className="text-gray-500 dark:text-white/60">username: admin</div>
                    <div className="text-gray-500 dark:text-white/60">password: admin123</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500 dark:text-white/60">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Full access to study materials</span>
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      {/* Footer */}
      <div className="absolute bottom-6 left-0 right-0 text-center text-gray-400 dark:text-white/40 text-xs">
        © {new Date().getFullYear()} PrepJet GRE • All rights reserved
      </div>
    </div>
  );
};

export default Login;
