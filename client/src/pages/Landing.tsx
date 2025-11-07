import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1574943320219-553eb213f72d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080')] bg-cover bg-center opacity-10" />
      </div>
      
      <Card className="w-full max-w-md relative z-10 border border-border shadow-2xl" data-testid="card-landing">
        <CardContent className="pt-6">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <i className="fas fa-seedling text-4xl text-primary mr-3" aria-hidden="true"></i>
              <h1 className="text-3xl font-bold text-foreground" data-testid="text-app-title">FieldShare</h1>
            </div>
            <p className="text-muted-foreground" data-testid="text-app-description">Secure agricultural field management</p>
          </div>
          
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Welcome to FieldShare</h2>
              <p className="text-sm text-muted-foreground">
                Connect with your neighbors to share field information and make informed spraying decisions.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-sm">
                <i className="fas fa-check-circle text-primary" aria-hidden="true"></i>
                <span className="text-foreground">Secure field boundary management</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <i className="fas fa-check-circle text-primary" aria-hidden="true"></i>
                <span className="text-foreground">Adjacent field crop visibility</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <i className="fas fa-check-circle text-primary" aria-hidden="true"></i>
                <span className="text-foreground">John Deere & multi-platform integration</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <i className="fas fa-check-circle text-primary" aria-hidden="true"></i>
                <span className="text-foreground">Real-time crop tracking</span>
              </div>
            </div>
            
            <Button 
              onClick={() => window.location.href = "/api/login"}
              className="w-full bg-primary text-primary-foreground font-medium py-3 px-4 rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
              data-testid="button-sign-in"
            >
              Sign In to Get Started
            </Button>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                New to FieldShare?{" "}
                <a 
                  href="/api/login" 
                  className="text-primary hover:text-primary/80"
                  data-testid="link-sign-up"
                >
                  Create an account
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
