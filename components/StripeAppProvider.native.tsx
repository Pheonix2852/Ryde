import { StripeProvider } from "@stripe/stripe-react-native";
import { ReactElement } from "react";

type StripeAppProviderProps = {
  children: ReactElement | ReactElement[];
};

const StripeAppProvider = ({ children }: StripeAppProviderProps) => {
  return (
    <StripeProvider
      publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_API_KEY!}
      merchantIdentifier="merchant.identifier"
      urlScheme="ryde"
    >
      {children}
    </StripeProvider>
  );
};

export default StripeAppProvider;
