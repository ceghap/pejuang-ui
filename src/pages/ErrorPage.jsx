import { useRouteError, useNavigate } from 'react-router-dom';
import { AlertTriangle, Home, RefreshCcw, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function ErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();
  
  console.error(error);

  const errorMessage = error?.statusText || error?.message || "An unexpected error occurred.";
  const is404 = error?.status === 404;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full border-rose-500/20 shadow-xl shadow-rose-500/5">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mb-4 text-rose-500">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            {is404 ? "Page Not Found" : "Oops! Something went wrong"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            {is404 
              ? "The page you are looking for doesn't exist or has been moved." 
              : "We encountered an error while rendering this page. Our team has been notified."}
          </p>
          
          <div className="p-3 bg-muted rounded-md text-left overflow-hidden">
            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Error Details</p>
            <p className="text-xs font-mono text-rose-600 break-words line-clamp-3">
              {errorMessage}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button 
            className="w-full bg-rose-600 hover:bg-rose-700 text-white"
            onClick={() => window.location.reload()}
          >
            <RefreshCcw className="w-4 h-4 mr-2" /> Reload Application
          </Button>
          <div className="grid grid-cols-2 gap-2 w-full">
            <Button 
              variant="outline" 
              className="w-full border-border"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft className="w-4 h-4 mr-2" /> Go Back
            </Button>
            <Button 
              variant="outline" 
              className="w-full border-border"
              onClick={() => navigate('/profile')}
            >
              <Home className="w-4 h-4 mr-2" /> Dashboard
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
