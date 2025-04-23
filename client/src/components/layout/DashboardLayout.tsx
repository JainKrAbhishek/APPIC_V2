import { ReactNode } from "react";
import { UserRecord } from "@shared/types";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  user?: UserRecord;
  showBackButton?: boolean;
  backPath?: string;
}

const DashboardLayout = ({
  children,
  title,
  user,
  showBackButton = false,
  backPath = "/dashboard"
}: DashboardLayoutProps) => {
  return (
    <div className="space-y-4">
      {/* Back button (optional) - only shown when showBackButton is true */}
      {showBackButton && (
        <div className="mb-4">
          <Link href={backPath}>
            <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-300 hover:bg-primary/5 hover:text-primary flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span>Back</span>
            </Button>
          </Link>
        </div>
      )}

      {/* Main content */}
      <div className="space-y-4 md:space-y-6">
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;