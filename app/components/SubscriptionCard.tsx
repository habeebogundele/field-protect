import { useState } from "react";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PayPalButton from "@/components/PayPalButton";

// Only initialize Stripe if the public key is available
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
let stripePromise: Promise<any> | null = null;

if (stripePublicKey) {
  stripePromise = loadStripe(stripePublicKey);
} else {
  console.warn('Missing VITE_STRIPE_PUBLIC_KEY - Stripe payments will not work');
}

const CheckoutForm = ({ planType, planPrice }: { planType: string; planPrice: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Subscription Active",
        description: "Your subscription has been activated successfully!",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-stripe-checkout">
      <PaymentElement />
      <Button type="submit" className="w-full" disabled={!stripe} data-testid="button-confirm-payment">
        Subscribe to {planType} - ${planPrice}
      </Button>
    </form>
  );
};

interface SubscriptionCardProps {
  planType: 'monthly' | 'yearly';
  title: string;
  price: string;
  features: string[];
  recommended?: boolean;
}

export default function SubscriptionCard({ 
  planType, 
  title, 
  price, 
  features, 
  recommended = false 
}: SubscriptionCardProps) {
  const [showStripeCheckout, setShowStripeCheckout] = useState(false);
  const [showPayPalCheckout, setShowPayPalCheckout] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>("");
  const { toast } = useToast();

  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  const createSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/get-or-create-subscription");
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      setShowStripeCheckout(true);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create subscription",
        variant: "destructive",
      });
    },
  });

  const handleStripeSubscribe = () => {
    createSubscriptionMutation.mutate();
  };

  const handlePayPalSubscribe = () => {
    setShowPayPalCheckout(true);
  };

  const isCurrentPlan = user?.subscriptionStatus === 'active' && user?.subscriptionType === planType;

  return (
    <Card 
      className={`relative border ${recommended ? 'border-primary shadow-lg' : 'border-border'}`}
      data-testid={`card-subscription-${planType}`}
    >
      {recommended && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-3 py-1">
            Recommended
          </Badge>
        </div>
      )}
      
      <CardHeader className="text-center">
        <CardTitle className="text-xl" data-testid={`text-plan-title-${planType}`}>
          {title}
        </CardTitle>
        <div className="text-3xl font-bold text-foreground" data-testid={`text-plan-price-${planType}`}>
          ${price}
          <span className="text-lg font-normal text-muted-foreground">
            /{planType === 'monthly' ? 'month' : 'year'}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center space-x-2" data-testid={`feature-${planType}-${index}`}>
              <i className="fas fa-check-circle text-primary" aria-hidden="true"></i>
              <span className="text-sm text-foreground">{feature}</span>
            </li>
          ))}
        </ul>
        
        {isCurrentPlan ? (
          <Button variant="outline" className="w-full" disabled data-testid={`button-current-plan-${planType}`}>
            Current Plan
          </Button>
        ) : (
          <div className="space-y-3">
            {!showStripeCheckout && !showPayPalCheckout ? (
              <>
                {stripePromise ? (
                  <Button 
                    onClick={handleStripeSubscribe}
                    className="w-full"
                    disabled={createSubscriptionMutation.isPending}
                    data-testid={`button-stripe-subscribe-${planType}`}
                  >
                    {createSubscriptionMutation.isPending ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
                        Setting up...
                      </>
                    ) : (
                      <>
                        <i className="fab fa-cc-stripe mr-2" aria-hidden="true"></i>
                        Subscribe with Card
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="w-full p-3 bg-muted rounded-lg text-center" data-testid={`message-stripe-unavailable-${planType}`}>
                    <p className="text-sm text-muted-foreground">
                      <i className="fas fa-exclamation-triangle mr-2" aria-hidden="true"></i>
                      Card payments temporarily unavailable
                    </p>
                  </div>
                )}
                
                <Button 
                  variant="outline"
                  onClick={handlePayPalSubscribe}
                  className="w-full"
                  data-testid={`button-paypal-subscribe-${planType}`}
                >
                  <i className="fab fa-paypal mr-2" aria-hidden="true"></i>
                  Subscribe with PayPal
                </Button>
              </>
            ) : showStripeCheckout && clientSecret && stripePromise ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm planType={title} planPrice={price} />
              </Elements>
            ) : showPayPalCheckout ? (
              <div className="space-y-4">
                <PayPalButton
                  amount={price}
                  currency="USD"
                  intent="subscription"
                />
                <Button 
                  variant="ghost" 
                  onClick={() => setShowPayPalCheckout(false)}
                  className="w-full text-sm"
                  data-testid={`button-back-${planType}`}
                >
                  ← Back to payment options
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
