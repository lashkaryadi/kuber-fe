import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Gem, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-6">
          <Gem className="h-8 w-8 text-secondary" />
        </div>
        <h1 className="font-serif text-6xl font-bold text-foreground mb-2">404</h1>
        <p className="text-xl text-muted-foreground mb-8">
          The page you're looking for doesn't exist
        </p>
        <Button asChild>
          <Link to="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
