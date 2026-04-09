import { useAuth } from "@clerk/expo";
import { Redirect } from "expo-router";
import "../global.css";

export default function Home() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return null;
  }

  if (isSignedIn) {
    return <Redirect href="/(root)/(tabs)/home" />;
  }

  return <Redirect href="/(auth)/welcome" />;
}
