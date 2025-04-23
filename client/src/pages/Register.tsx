import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { GraduationCap, UserPlus, Mail, User as UserIcon, Lock, Shield, ArrowRight, CheckCircle2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { User } from "@shared/schema";
import { TopEnhancedLight } from "@/components/effects/EnhancedLightBar";
import EnhancedParticles from "@/components/effects/EnhancedParticles";
import ThemeLanguageSwitcher from "@/components/common/ThemeLanguageSwitcher";

interface RegisterProps {
  setUser?: (user: User) => void;
  onRegisterSuccess?: () => void;
}

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

const Register = ({ setUser, onRegisterSuccess }: RegisterProps) => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      const registerResult = await response.json();
      
      if (!response.ok || !registerResult.success) {
        throw new Error(registerResult.message || "Registration failed");
      }
      
      // Auto login after successful registration
      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: data.username,
          password: data.password,
        }),
        credentials: "include",
      });
      
      const loginResult = await loginResponse.json();
      
      if (!loginResponse.ok || !loginResult.success) {
        // Even if auto-login fails, we can still show registration was successful
        toast({
          title: "Registration successful",
          description: "Your account has been created. Please verify your email and log in.",
        });
        setLocation("/login");
        return;
      }
      
      // Set user if the prop is provided
      if (setUser) {
        setUser(loginResult.user);
      }
      
      // Call register success callback if provided
      if (onRegisterSuccess) {
        onRegisterSuccess();
      }
      
      // Redirect to dashboard
      setLocation("/dashboard");
      
      toast({
        title: "Registration successful",
        description: `Welcome to PrepJet, ${loginResult.user.firstName || loginResult.user.username}!`,
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-b from-gray-50 via-gray-100 to-white dark:from-black dark:via-gray-950 dark:to-gray-900 relative">
      {/* Enhanced background effects similar to landing page */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-x-0 top-0">
          <TopEnhancedLight 
            intensity={0.6} 
            color="rgba(16, 185, 129, 0.5)" 
            maskImage={true}
            fullBleed={true}
          />
        </div>
        
        <EnhancedParticles 
          density={100}
          speedFactor={0.4}
          particleSize={[1, 3]}
          particleOpacity={[0.2, 0.5]}
          className="h-full w-full"
          maskImage={true}
          particleColor="rgba(16, 185, 129, 0.3)"
          secondaryColor="rgba(96, 211, 148, 0.4)"
          interactive={true}
          pulseEffect={true}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 py-4 px-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/">
            <div className="flex items-center gap-2 group">
              <div className="relative h-10 w-10 rounded-xl overflow-hidden transition-all duration-300 group-hover:scale-105">
                <img 
                  src="/images/prepjet-logo.png" 
                  alt="PrepJet Logo" 
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-gray-900 dark:text-white font-bold text-xl">PrepJet</span>
                <span className="text-xs font-medium text-gray-600 dark:text-white/70">GRE Preparation</span>
              </div>
            </div>
          </Link>
          
          <div className="flex items-center gap-3">
            <ThemeLanguageSwitcher />
            <Link href="/login">
              <Button 
                variant="outline" 
                size="sm"
                className="font-medium border-gray-300 dark:border-white/20 bg-white/90 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-white hover:text-gray-900 dark:hover:text-white"
              >
                Log in
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container relative z-10 mx-auto px-4 pt-2 pb-20 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-lg">
          {/* Register Card */}
          <Card className="bg-white/90 dark:bg-black/30 backdrop-blur-xl border-gray-200 dark:border-white/10 shadow-xl overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 to-teal-500"></div>
            <CardHeader className="space-y-1 pt-8">
              <div className="flex flex-col items-center">
                <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                  <UserPlus className="h-8 w-8 text-emerald-500 dark:text-emerald-400" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white text-center">Create an Account</CardTitle>
                <CardDescription className="text-gray-500 dark:text-white/60 text-center pt-1">
                  Join thousands of students preparing for the GRE
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="px-6 pt-2 pb-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 dark:text-white/80 font-medium">First Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <div className="absolute left-3 top-3 text-gray-400 dark:text-white/50">
                                <UserIcon className="h-5 w-5" />
                              </div>
                              <Input 
                                placeholder="John" 
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
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 dark:text-white/80 font-medium">Last Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <div className="absolute left-3 top-3 text-gray-400 dark:text-white/50">
                                <UserIcon className="h-5 w-5" />
                              </div>
                              <Input 
                                placeholder="Doe" 
                                {...field} 
                                className="h-12 pl-10 bg-white dark:bg-white/10 border-gray-200 dark:border-white/10 text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-500 dark:text-red-400 text-sm" />
                        </FormItem>
                      )}
                    />
                  </div>
                  
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
                              placeholder="johndoe" 
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
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 dark:text-white/80 font-medium">Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <div className="absolute left-3 top-3 text-gray-400 dark:text-white/50">
                              <Mail className="h-5 w-5" />
                            </div>
                            <Input 
                              type="email" 
                              placeholder="john.doe@example.com" 
                              {...field} 
                              className="h-12 pl-10 bg-white dark:bg-white/10 border-gray-200 dark:border-white/10 text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-500 dark:text-red-400 text-sm" />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 dark:text-white/80 font-medium">Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <div className="absolute left-3 top-3 text-gray-400 dark:text-white/50">
                                <Lock className="h-5 w-5" />
                              </div>
                              <Input 
                                type="password" 
                                placeholder="At least 6 characters" 
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
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 dark:text-white/80 font-medium">Confirm Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <div className="absolute left-3 top-3 text-gray-400 dark:text-white/50">
                                <Shield className="h-5 w-5" />
                              </div>
                              <Input 
                                type="password" 
                                placeholder="Repeat password" 
                                {...field} 
                                className="h-12 pl-10 bg-white dark:bg-white/10 border-gray-200 dark:border-white/10 text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-500 dark:text-red-400 text-sm" />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-12 mt-4 text-base font-medium shadow-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-emerald-500/30 border-0 transition-all" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                        <span>Creating Account...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <span>Create Account</span>
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
                Already have an account?{" "}
                <Link href="/login" className="text-emerald-600 dark:text-emerald-400 font-medium hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors">
                  Sign in instead
                </Link>
              </div>
            </CardContent>
            
            <CardFooter className="bg-gray-50 dark:bg-white/5 px-6 py-4 flex flex-col">
              <div className="text-sm text-center text-gray-500 dark:text-white/60">
                By creating an account, you agree to our{" "}
                <a href="#" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 hover:underline">Terms of Service</a>{" "}
                and{" "}
                <a href="#" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 hover:underline">Privacy Policy</a>
              </div>
              
              <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500 dark:text-white/60">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Free to get started</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Cancel anytime</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span>No credit card required</span>
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

export default Register;