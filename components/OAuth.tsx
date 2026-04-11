import { icons } from "@/constants";
import { fetchAPI } from "@/lib/fetch";
import { useSSO } from "@clerk/expo";
import * as AuthSession from "expo-auth-session";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { Image, Platform, Text, View } from "react-native";
import CustomButton from "./CustomButton";

WebBrowser.maybeCompleteAuthSession();

const useWarmUpBrowser = () => {
  useEffect(() => {
    if (Platform.OS !== "android") return;

    void WebBrowser.warmUpAsync();

    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

const OAuth = () => {
  useWarmUpBrowser();

  const { startSSOFlow } = useSSO();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createUserIfNeeded = async (params: {
    createdUserId?: string | null;
    emailAddress?: string | null;
    fullName?: string | null;
  }) => {
    const { createdUserId, emailAddress, fullName } = params;

    if (!createdUserId || !emailAddress) return;

    try {
      await fetchAPI("/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: fullName?.trim() || "OAuth User",
          email: emailAddress,
          clerk_id: createdUserId,
        }),
      });
    } catch (error) {
      console.warn("User creation skipped:", error);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const { createdSessionId, setActive, signUp } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: AuthSession.makeRedirectUri({
          scheme: "ryde",
          path: "continue",
        }),
      });

      if (signUp?.status === "complete") {
        const fullName =
          `${signUp.firstName || ""} ${signUp.lastName || ""}`.trim();

        await createUserIfNeeded({
          createdUserId: signUp.createdUserId,
          emailAddress: signUp.emailAddress,
          fullName,
        });
      }

      if (createdSessionId && setActive) {
        await setActive({
          session: createdSessionId,
          navigate: ({ session }) => {
            if (session?.currentTask) {
              router.push("/(auth)/continue");
              return;
            }

            router.replace("/(root)/(tabs)/home");
          },
        });
      } else {
        router.push("/(auth)/continue");
      }
    } catch (error) {
      console.error("Google OAuth failed:", JSON.stringify(error, null, 2));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View>
      <View className="flex flex-row justify-center items-center mt-4 gap-x-3">
        <View className="flex-1 h-[1px] bg-neutral-100" />
        <Text className="text-lg">Or</Text>
        <View className="flex-1 h-[1px] bg-neutral-100" />
      </View>

      <CustomButton
        title={isSubmitting ? "Opening Google..." : "Continue With Google"}
        className="mt-5 w-full shadow-none"
        IconLeft={() => (
          <Image
            source={icons.google}
            resizeMode="contain"
            className="w-5 h-5 mx-2"
          />
        )}
        bgVariant="outline"
        textVariant="primary"
        onPress={handleGoogleSignIn}
        disabled={isSubmitting}
      />
    </View>
  );
};

export default OAuth;
