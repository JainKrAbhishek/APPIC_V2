import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";

// Schema for requesting a password reset
const passwordResetRequestSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

// Schema for resetting a password with a token
const passwordResetSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type PasswordResetRequestValues = z.infer<typeof passwordResetRequestSchema>;
type PasswordResetValues = z.infer<typeof passwordResetSchema>;

interface PasswordResetFormProps {
  type: "request" | "reset";
  token?: string;
  onSuccess?: () => void;
}

export const PasswordResetForm = ({ type, token, onSuccess }: PasswordResetFormProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form for requesting a password reset
  const requestForm = useForm<PasswordResetRequestValues>({
    resolver: zodResolver(passwordResetRequestSchema),
    defaultValues: {
      email: "",
    },
  });

  // Form for resetting a password with a token
  const resetForm = useForm<PasswordResetValues>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // For development environments to display manual reset instructions
  const [devToken, setDevToken] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  
  // Handle request form submission
  const onSubmitRequest = async (values: PasswordResetRequestValues) => {
    try {
      setIsLoading(true);
      
      // Define the response type
      interface PasswordResetResponse {
        success: boolean;
        message: string;
        token?: string;
        resetUrl?: string;
      }
      
      const response = await apiRequest<PasswordResetResponse>("/api/auth/forgot-password", {
        method: "POST",
        data: values,
      });

      // Check if we got a development token (email service not configured)
      if (response.token && response.resetUrl) {
        setDevToken(response.token);
        setResetUrl(response.resetUrl);
        
        toast({
          title: "Development Mode",
          description: "Email service is not configured. Instructions for manual reset have been displayed.",
          variant: "default",
        });
      } else {
        setIsSuccess(true);
        toast({
          title: "Password Reset Email Sent",
          description: "If your email is registered, you will receive instructions to reset your password.",
        });
      }

      if (onSuccess && !devToken) onSuccess();
    } catch (error) {
      console.error("Error requesting password reset:", error);
      toast({
        title: "Error",
        description: "An error occurred while processing your request. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle reset form submission
  const onSubmitReset = async (values: PasswordResetValues) => {
    if (!token) {
      toast({
        title: "Error",
        description: "Missing reset token. Please try again or request a new password reset link.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Define response type
      interface ResetPasswordResponse {
        success: boolean;
        message: string;
      }
      
      const response = await apiRequest<ResetPasswordResponse>("/api/auth/reset-password", {
        method: "POST",
        data: {
          token,
          password: values.password,
        },
      });

      setIsSuccess(true);
      toast({
        title: "Password Reset Successful",
        description: "Your password has been reset. You can now log in with your new password.",
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error resetting password:", error);
      toast({
        title: "Error",
        description: "An error occurred while resetting your password. The token may be invalid or expired.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show development mode manual instructions when email service is not available
  if (devToken && resetUrl) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Development Mode - Manual Reset</CardTitle>
          <CardDescription className="text-amber-600 dark:text-amber-400">
            Email service is not configured. Use the link below to manually reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-amber-50 dark:bg-amber-900/30 p-4 border border-amber-200 dark:border-amber-800">
            <h3 className="font-medium text-amber-800 dark:text-amber-400">Manual Reset Instructions</h3>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
              In production, an email would be sent. Since email service is not available, use this link:
            </p>
            <div className="mt-2 p-2 bg-white dark:bg-black rounded border border-amber-200 dark:border-amber-800 overflow-auto">
              <code className="text-xs break-all text-amber-700 dark:text-amber-300">
                {resetUrl}
              </code>
            </div>
          </div>
          <Button asChild className="w-full">
            <a href={resetUrl} target="_blank" rel="noopener noreferrer">
              Open Reset Link
            </a>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Return to Login</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isSuccess && type === "request") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Check Your Email</CardTitle>
          <CardDescription>
            We've sent password reset instructions to your email address. Please check your inbox and
            follow the instructions to reset your password.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Return to Login</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (isSuccess && type === "reset") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Password Reset Complete</CardTitle>
          <CardDescription>
            Your password has been successfully reset. You can now log in with your new password.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href="/login">Log In</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>
          {type === "request" ? "Reset Your Password" : "Create New Password"}
        </CardTitle>
        <CardDescription>
          {type === "request"
            ? "Enter your email address and we'll send you a link to reset your password."
            : "Please enter your new password below."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {type === "request" ? (
          <Form {...requestForm}>
            <form onSubmit={requestForm.handleSubmit(onSubmitRequest)} className="space-y-6">
              <FormField
                control={requestForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="your.email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Spinner className="mr-2" size="sm" /> : null}
                Send Reset Link
              </Button>
            </form>
          </Form>
        ) : (
          <Form {...resetForm}>
            <form onSubmit={resetForm.handleSubmit(onSubmitReset)} className="space-y-6">
              <FormField
                control={resetForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={resetForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Spinner className="mr-2" size="sm" /> : null}
                Reset Password
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-6">
        <Button asChild variant="link">
          <Link href="/login">Return to Login</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PasswordResetForm;