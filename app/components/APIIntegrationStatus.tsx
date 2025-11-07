import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Integration {
  provider: string;
  isConnected: boolean;
}

export default function APIIntegrationStatus() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: integrations, isLoading } = useQuery<Integration[]>({
    queryKey: ["/api/integrations"],
  });

  const connectJohnDeereMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/integrations/john-deere/connect");
      return response.json();
    },
    onSuccess: (data) => {
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to John Deere",
        variant: "destructive",
      });
    },
  });

  const connectLeafMutation = useMutation({
    mutationFn: async (apiKey: string) => {
      await apiRequest("POST", "/api/integrations/leaf-agriculture/connect", { apiKey });
    },
    onSuccess: () => {
      toast({
        title: "Connected",
        description: "Leaf Agriculture connected successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to Leaf Agriculture",
        variant: "destructive",
      });
    },
  });

  const getIntegrationStatus = (provider: string) => {
    const integration = integrations?.find((i: any) => i.provider === provider);
    return integration?.isConnected ? 'connected' : 'available';
  };

  const handleConnectLeaf = () => {
    const apiKey = prompt("Enter your Leaf Agriculture API key:");
    if (apiKey?.trim()) {
      connectLeafMutation.mutate(apiKey.trim());
    }
  };

  const integrationConfigs = [
    {
      id: 'john-deere',
      title: 'John Deere API',
      subtitle: 'Operations Center',
      description: 'Automatically sync field boundaries and crop data',
      icon: 'fas fa-tractor',
      color: 'chart-1',
      action: () => connectJohnDeereMutation.mutate(),
      actionLabel: 'Connect Now',
    },
    {
      id: 'climate-fieldview',
      title: 'Climate FieldView',
      subtitle: 'Digital Farming Platform',
      description: 'Import field data from FieldView platform',
      icon: 'fas fa-cloud',
      color: 'chart-2',
      action: () => {
        toast({
          title: "Coming Soon",
          description: "Climate FieldView integration will be available soon",
        });
      },
      actionLabel: 'Coming Soon',
    },
    {
      id: 'leaf-agriculture',
      title: 'Leaf Agriculture',
      subtitle: 'Unified API',
      description: 'Connect to 120+ agricultural platforms',
      icon: 'fas fa-leaf',
      color: 'chart-3',
      action: handleConnectLeaf,
      actionLabel: 'Connect Now',
    },
  ];

  if (isLoading) {
    return (
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border border-border">
            <CardContent className="p-6 animate-pulse">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-8 w-8 bg-muted rounded"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
              <div className="h-3 bg-muted rounded w-full mb-3"></div>
              <div className="h-8 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
      {integrationConfigs.map((config) => {
        const status = getIntegrationStatus(config.id);
        const isConnected = status === 'connected';
        
        return (
          <Card key={config.id} className="border border-border" data-testid={`card-integration-${config.id}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <i className={`${config.icon} text-2xl text-${config.color}`} aria-hidden="true"></i>
                  <div>
                    <h4 className="font-semibold text-foreground" data-testid={`text-integration-title-${config.id}`}>
                      {config.title}
                    </h4>
                    <p className="text-xs text-muted-foreground" data-testid={`text-integration-subtitle-${config.id}`}>
                      {config.subtitle}
                    </p>
                  </div>
                </div>
                <Badge 
                  className={`text-xs px-2 py-1 rounded-full ${
                    isConnected ? 'bg-chart-1/10 text-chart-1' : 'bg-muted text-muted-foreground'
                  }`}
                  data-testid={`badge-integration-status-${config.id}`}
                >
                  {isConnected ? 'Connected' : 'Available'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3" data-testid={`text-integration-description-${config.id}`}>
                {config.description}
              </p>
              <Button 
                className={`w-full py-2 text-sm rounded-md ${
                  isConnected 
                    ? 'bg-muted text-foreground hover:bg-muted/80' 
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
                onClick={config.action}
                disabled={
                  (config.id === 'john-deere' && connectJohnDeereMutation.isPending) ||
                  (config.id === 'leaf-agriculture' && connectLeafMutation.isPending) ||
                  config.actionLabel === 'Coming Soon'
                }
                data-testid={`button-integration-action-${config.id}`}
              >
                {(config.id === 'john-deere' && connectJohnDeereMutation.isPending) ||
                 (config.id === 'leaf-agriculture' && connectLeafMutation.isPending) ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mr-2" />
                    Connecting...
                  </>
                ) : (
                  isConnected ? 'Manage Integration' : config.actionLabel
                )}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
