import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

interface FieldUpdate {
  id: string;
  description: string;
  createdAt: string;
  field: { name: string };
}

interface Field {
  id: string;
  name: string;
  crop: string;
  season: string;
}

export default function ActivityFeed() {
  const { data: updates, isLoading } = useQuery<FieldUpdate[]>({
    queryKey: ["/api/updates"],
  });

  const { data: fields } = useQuery<Field[]>({
    queryKey: ["/api/fields"],
  });

  // Get adjacent fields needing permission for the dashboard summary
  const { data: adjacentFields, isLoading: adjacentFieldsLoading } = useQuery({
    queryKey: ["/api/fields/adjacent-needing-permission"],
  });

  // Show first few adjacent fields that need permission (for dashboard preview)
  const summaryAdjacentFields = (adjacentFields as any[])?.slice(0, 4) || [];

  return (
    <>
      {/* Recent Updates */}
      <Card className="bg-card rounded-lg border border-border" data-testid="card-recent-updates">
        <CardHeader className="p-6 border-b border-border">
          <CardTitle className="text-lg font-semibold text-foreground">Recent Updates</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start space-x-3 animate-pulse">
                    <div className="h-8 w-8 bg-muted rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : updates && updates.length > 0 ? (
              updates.map((update: any) => (
                <div key={update.id} className="flex items-start space-x-3" data-testid={`update-${update.id}`}>
                  <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <i className="fas fa-seedling text-primary text-sm" aria-hidden="true"></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground font-medium" data-testid={`update-description-${update.id}`}>
                      {update.description}
                    </p>
                    <p className="text-xs text-muted-foreground" data-testid={`update-time-${update.id}`}>
                      {update.field?.name} • {formatDistanceToNow(new Date(update.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <i className="fas fa-clock text-4xl text-muted-foreground mb-4" aria-hidden="true"></i>
                <p className="text-muted-foreground">No recent updates</p>
                <p className="text-sm text-muted-foreground mt-2">Field changes will appear here</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Adjacent Fields Summary */}
      <Card className="bg-card rounded-lg border border-border" data-testid="card-adjacent-fields-summary">
        <CardHeader className="p-6 border-b border-border">
          <CardTitle className="text-lg font-semibold text-foreground">Adjacent Fields</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {adjacentFieldsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start space-x-3 animate-pulse">
                    <div className="h-8 w-8 bg-muted rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : summaryAdjacentFields.length > 0 ? (
              summaryAdjacentFields.map((field: any) => (
                <div key={field.fieldId} className="flex items-center justify-between p-3 bg-muted rounded-lg" data-testid={`adjacent-field-${field.fieldId}`}>
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-secondary rounded-lg flex items-center justify-center">
                      <i className="fas fa-user text-secondary-foreground" aria-hidden="true"></i>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground" data-testid={`adjacent-owner-${field.fieldId}`}>
                        {field.ownerName}
                      </p>
                      <p className="text-xs text-muted-foreground" data-testid={`adjacent-distance-${field.fieldId}`}>
                        {field.distance ? `${Math.round(field.distance)}m away` : 'Adjacent field'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      Privacy Protected
                    </p>
                    <p className="text-xs text-primary font-medium">
                      Request Access
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <i className="fas fa-users text-4xl text-muted-foreground mb-4" aria-hidden="true"></i>
                <p className="text-muted-foreground">No adjacent fields yet</p>
                <p className="text-sm text-muted-foreground mt-2">Add fields to discover neighbors</p>
              </div>
            )}
            
            <Link href="/adjacent-fields" className="block w-full mt-4 text-sm text-primary hover:text-primary/80 font-medium py-2 border border-border rounded-md hover:bg-muted/50 text-center" data-testid="button-view-all-adjacent">
              View All Adjacent Fields
            </Link>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
