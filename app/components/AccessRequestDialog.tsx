import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AccessRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fieldId: string;
  fieldName?: string;
}

interface AccessRequestData {
  ownerFieldId: string;
  viewerFieldId?: string; // Optional - for field-to-field permissions
}

export default function AccessRequestDialog({ 
  open, 
  onOpenChange, 
  fieldId, 
  fieldName = "Private Field" 
}: AccessRequestDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const requestAccessMutation = useMutation({
    mutationFn: (data: AccessRequestData) => 
      apiRequest('POST', '/api/fields/request-access', data),
    onSuccess: () => {
      toast({
        title: "Access Request Sent",
        description: `Your request to view ${fieldName} has been sent to the field owner.`,
      });
      onOpenChange(false);
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/fields/all-nearby'] });
      queryClient.invalidateQueries({ queryKey: ['/api/fields/access-requests/pending'] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Request Failed",
        description: error.message || "Failed to send access request. Please try again.",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    requestAccessMutation.mutate({
      ownerFieldId: fieldId,
      // viewerFieldId is optional - not provided means user wants general access
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-access-request">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">🔒</span>
            Request Field Access
          </DialogTitle>
          <DialogDescription>
            Request permission to view detailed information about <strong>{fieldName}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                This will send a request to the field owner asking for permission to view their field details for spray coordination.
              </p>
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-request"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={requestAccessMutation.isPending || !fieldId}
              data-testid="button-send-request"
            >
              {requestAccessMutation.isPending ? "Sending..." : "Send Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}