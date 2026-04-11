import { ReactNode } from "react";

type StripeAppProviderProps = {
  children: ReactNode;
};

const StripeAppProvider = ({ children }: StripeAppProviderProps) => {
  return <>{children}</>;
};

export default StripeAppProvider;
