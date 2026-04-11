import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import { fetchAPI } from "@/lib/fetch";
import { useSignIn, useSignUp } from "@clerk/expo";
import { type Href, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";

const ContinueOAuth = () => {
  const router = useRouter();
  const {
    signUp,
    errors: signUpErrors,
    fetchStatus: signUpFetchStatus,
  } = useSignUp();
  const { signIn } = useSignIn();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
  });
  const [isFinishingSignIn, setIsFinishingSignIn] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  if (!signUp || !signIn) {
    return null;
  }

  useEffect(() => {
    const finalizeSignIn = async () => {
      if (signIn.status !== "complete" || isFinishingSignIn) return;

      try {
        setIsFinishingSignIn(true);
        await signIn.finalize({
          navigate: ({ session }) => {
            if (session?.currentTask) {
              return;
            }

            router.replace("/(root)/(tabs)/home");
          },
        });
      } finally {
        setIsFinishingSignIn(false);
      }
    };

    finalizeSignIn();
  }, [isFinishingSignIn, router, signIn]);

  if (signIn.status === "complete") {
    return null;
  }

  const handleSubmit = async () => {
    if (!signUp || signUpFetchStatus === "fetching") return;

    const updatePayload: { firstName?: string; lastName?: string } = {};

    if (signUp.missingFields?.includes("first_name")) {
      updatePayload.firstName = form.firstName.trim();
    }

    if (signUp.missingFields?.includes("last_name")) {
      updatePayload.lastName = form.lastName.trim();
    }

    if (Object.keys(updatePayload).length > 0) {
      const { error } = await signUp.update(updatePayload);
      if (error) {
        console.error(
          "Failed to update sign-up:",
          JSON.stringify(error, null, 2),
        );
        return;
      }
    }

    if (signUp.status === "complete" && !isCreatingUser) {
      const fullName =
        `${(signUp.firstName || "").trim()} ${(signUp.lastName || "").trim()}`.trim();

      try {
        setIsCreatingUser(true);
        await fetchAPI("/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: fullName || "OAuth User",
            email: signUp.emailAddress,
            clerk_id: signUp.createdUserId,
          }),
        });
      } catch (error) {
        // User may already exist if OAuth callback retried; continue finalization.
        console.warn("User creation skipped:", error);
      } finally {
        setIsCreatingUser(false);
      }

      await signUp.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            console.log(session.currentTask);
            return;
          }

          const url = decorateUrl("/");
          router.push(url as Href);
        },
      });
    }
  };

  if (signUp.status !== "missing_requirements") {
    return null;
  }

  const needsFirstName = signUp.missingFields?.includes("first_name");
  const needsLastName = signUp.missingFields?.includes("last_name");

  const canSubmit =
    signUpFetchStatus !== "fetching" &&
    (!needsFirstName || form.firstName.trim().length > 0) &&
    (!needsLastName || form.lastName.trim().length > 0);

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 p-5">
        <Text className="text-3xl text-black font-JakartaSemiBold">
          Continue Sign Up
        </Text>

        <Text className="text-base text-gray-600 mt-3 mb-6">
          One last step to complete your Google sign in.
        </Text>

        {needsFirstName ? (
          <InputField
            label="First Name"
            placeholder="Enter your first name"
            placeholderTextColor="gray"
            value={form.firstName}
            onChangeText={(value) =>
              setForm((prev) => ({ ...prev, firstName: value }))
            }
          />
        ) : null}

        {needsLastName ? (
          <InputField
            label="Last Name"
            placeholder="Enter your last name"
            placeholderTextColor="gray"
            value={form.lastName}
            onChangeText={(value) =>
              setForm((prev) => ({ ...prev, lastName: value }))
            }
          />
        ) : null}

        {signUpErrors?.errors?.length ? (
          <Text className="text-red-500 mt-2 text-sm">
            {signUpErrors.errors[0].longMessage ||
              signUpErrors.errors[0].message}
          </Text>
        ) : null}

        <CustomButton
          title={
            signUpFetchStatus === "fetching" || isCreatingUser
              ? "Submitting..."
              : "Continue"
          }
          onPress={handleSubmit}
          className="mt-6"
          disabled={!canSubmit || isCreatingUser}
        />
      </View>
    </ScrollView>
  );
};

export default ContinueOAuth;
