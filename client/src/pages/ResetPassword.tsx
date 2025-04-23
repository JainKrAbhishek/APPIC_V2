import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import PasswordResetForm from "@/components/auth/PasswordResetForm";
import { ResponsiveContainer } from "@/components/ui/responsive-container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Spinner } from "@/components/ui/spinner";

const ResetPassword = () => {
  const [_, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Extract token from URL
    const searchParams = new URLSearchParams(window.location.search);
    const tokenParam = searchParams.get("token");

    if (!tokenParam) {
      setIsError(true);
    } else {
      setToken(tokenParam);
    }
    
    setIsLoading(false);
  }, []);

  const handleSuccess = () => {
    // We don't redirect here since the PasswordResetForm
    // will show a success message with a link to login
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (isError || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <ResponsiveContainer maxWidth="md">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Invalid Reset Link</CardTitle>
              <CardDescription>
                The password reset link you followed is invalid or has expired.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground mb-4">
                Please request a new password reset link.
              </p>
              <Button asChild className="w-full">
                <Link href="/forgot-password">Request New Reset Link</Link>
              </Button>
              <Button asChild variant="outline" className="mt-2 w-full">
                <Link href="/login">Return to Login</Link>
              </Button>
            </CardContent>
          </Card>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <ResponsiveContainer className="flex flex-col items-center justify-center py-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">Reset Your Password</h1>
            <p className="text-muted-foreground">
              Create a new password for your account.
            </p>
          </div>
          <PasswordResetForm type="reset" token={token} onSuccess={handleSuccess} />
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ResetPassword;