import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { TopEnhancedLight } from "@/components/EnhancedLightBar";
import EnhancedParticles from "@/components/EnhancedParticles";
import ThemeLanguageSwitcher from "@/components/ThemeLanguageSwitcher";
import { useQueryParams } from "@/hooks/use-query-params";

const EmailVerified = () => {
  const [, setLocation] = useLocation();
  const { getParam } = useQueryParams();
  const { toast } = useToast();
  const [status, setStatus] = useState<"success" | "error" | "loading">("loading");

  useEffect(() => {
    // Get the success parameter from the URL
    const success = getParam("success");
    const error = getParam("error");
    
    if (success === "true") {
      setStatus("success");
      toast({
        title: "Email Verified",
        description: "Your email has been successfully verified.",
        variant: "default",
      });
    } else if (error) {
      setStatus("error");
      toast({
        title: "Verification Failed",
        description: error || "Failed to verify your email. Please try again.",
        variant: "destructive",
      });
    } else {
      // Default to success if no params (should not happen in normal flow)
      setStatus("success");
    }
  }, [getParam, toast]);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-b from-gray-50 via-gray-100 to-white dark:from-black dark:via-gray-950 dark:to-gray-900 relative">
      {/* Enhanced background effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-x-0 top-0">
          <TopEnhancedLight 
            intensity={0.6} 
            color={status === "success" ? "rgba(16, 185, 129, 0.5)" : "rgba(239, 68, 68, 0.5)"} 
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
          particleColor={status === "success" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}
          secondaryColor={status === "success" ? "rgba(96, 211, 148, 0.4)" : "rgba(248, 113, 113, 0.4)"}
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
          
          <ThemeLanguageSwitcher />
        </div>
      </header>

      <div className="container relative z-10 mx-auto px-4 pt-10 pb-20 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-md">
          {/* Verification Card */}
          <Card className="bg-white/90 dark:bg-black/30 backdrop-blur-xl border-gray-200 dark:border-white/10 shadow-xl overflow-hidden">
            <div className={`h-1.5 w-full ${status === "success" ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-gradient-to-r from-red-500 to-pink-500"}`}></div>
            
            <CardHeader className="space-y-1 pt-8">
              <div className="flex flex-col items-center">
                <div className={`h-16 w-16 rounded-full flex items-center justify-center mb-4 ${
                  status === "success" 
                    ? "bg-emerald-100 dark:bg-emerald-500/10" 
                    : "bg-red-100 dark:bg-red-500/10"
                }`}>
                  {status === "success" ? (
                    <CheckCircle2 className="h-8 w-8 text-emerald-500 dark:text-emerald-400" />
                  ) : (
                    <AlertCircle className="h-8 w-8 text-red-500 dark:text-red-400" />
                  )}
                </div>
                
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white text-center">
                  {status === "loading" && "Verifying Email..."}
                  {status === "success" && "Email Verified!"}
                  {status === "error" && "Verification Failed"}
                </CardTitle>
                
                <CardDescription className="text-gray-500 dark:text-white/60 text-center pt-2">
                  {status === "loading" && "Please wait while we verify your email address."}
                  {status === "success" && "Your email has been successfully verified. You can now log in to your account."}
                  {status === "error" && "We were unable to verify your email. Please try again or contact support."}
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="px-6 pt-2 pb-6 flex flex-col items-center">
              {status === "success" && (
                <div className="mt-2 mb-4 p-4 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 rounded-lg w-full">
                  <p className="text-sm text-emerald-700 dark:text-emerald-300 text-center">
                    Thank you for verifying your email. You now have full access to your PrepJet account!
                  </p>
                </div>
              )}
              
              {status === "error" && (
                <div className="mt-2 mb-4 p-4 bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10 rounded-lg w-full">
                  <p className="text-sm text-red-700 dark:text-red-300 text-center">
                    Your verification link may have expired or is invalid. Please try requesting a new verification email.
                  </p>
                </div>
              )}
              
              <div className="w-full mt-4">
                {status === "success" && (
                  <Button 
                    onClick={() => setLocation("/login")}
                    className="w-full h-12 text-base font-medium shadow-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-emerald-500/30 border-0 transition-all"
                  >
                    <div className="flex items-center justify-center">
                      <span>Continue to Login</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                  </Button>
                )}
                
                {status === "error" && (
                  <Button 
                    onClick={() => setLocation("/login")}
                    className="w-full h-12 text-base font-medium shadow-lg bg-gradient-to-r from-red-500 to-pink-500 hover:shadow-red-500/30 border-0 transition-all"
                  >
                    <span>Back to Login</span>
                  </Button>
                )}
                
                {status === "loading" && (
                  <div className="flex justify-center">
                    <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="bg-gray-50 dark:bg-white/5 px-6 py-4 flex justify-center">
              <div className="text-sm text-center text-gray-500 dark:text-white/60">
                Having trouble? <Link href="/login" className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">Contact Support</Link>
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

export default EmailVerified;