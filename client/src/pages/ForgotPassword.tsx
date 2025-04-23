import PasswordResetForm from "@/components/auth/PasswordResetForm";
import { ResponsiveContainer } from "@/components/ui/responsive-container";
import { useLocation } from "wouter";

const ForgotPassword = () => {
  const [_, setLocation] = useLocation();

  const handleSuccess = () => {
    // We don't redirect here since the PasswordResetForm
    // will show a success message with a link to login
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <ResponsiveContainer className="flex flex-col items-center justify-center py-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">Reset Your Password</h1>
            <p className="text-muted-foreground">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>
          <PasswordResetForm type="request" onSuccess={handleSuccess} />
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ForgotPassword;