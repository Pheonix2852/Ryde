import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import OAuth from "@/components/OAuth";
import { useSignIn } from "@clerk/expo";
import { Image } from "expo-image";
import { type Href, Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { icons, images } from "../../constants";

const SignIn = () => {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [code, setCode] = useState("");

  const isFetching = fetchStatus === "fetching";

  const onSignInPress = async () => {
    if (!form.email || !form.password || isFetching) return;

    const { error } = await signIn.password({
      emailAddress: form.email,
      password: form.password,
    });

    if (error) {
      console.error(JSON.stringify(error, null, 2));
      return;
    }

    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            console.log(session.currentTask);
            return;
          }

          const url = decorateUrl("/");
          router.push(url as Href);
        },
      });
    } else if (signIn.status === "needs_second_factor") {
      // Non-email second factor flows can be handled here when enabled.
    } else if (signIn.status === "needs_client_trust") {
      const emailCodeFactor = signIn.supportedSecondFactors.find(
        (factor) => factor.strategy === "email_code",
      );

      if (emailCodeFactor) {
        await signIn.mfa.sendEmailCode();
      }
    } else {
      console.error("Sign-in attempt not complete:", signIn);
    }
  };

  const handleVerify = async () => {
    if (!code || isFetching) return;

    await signIn.mfa.verifyEmailCode({ code });

    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            console.log(session.currentTask);
            return;
          }

          const url = decorateUrl("/");
          router.push(url as Href);
        },
      });
    } else {
      console.error("Sign-in attempt not complete:", signIn);
    }
  };

  if (signIn.status === "needs_client_trust") {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView className="flex-1 bg-white">
          <View className="flex-1 bg-white">
            <View className="relative w-full h-[250px]">
              <Image
                source={images.signUpCar}
                className="z-0 w-full"
                style={{ height: 250 }}
              />
              <Text className="text-3xl text-black font-JakartaSemiBold absolute bottom-5 left-5">
                Verify Your Account
              </Text>
            </View>

            <View className="p-5">
              <Text className="text-base text-gray-600 mb-4">
                Enter the code sent to your email to continue.
              </Text>

              <TextInput
                className="rounded-2xl p-4 text-[15px] border border-neutral-200 bg-neutral-100"
                value={code}
                placeholder="Enter your verification code"
                placeholderTextColor="#666666"
                onChangeText={setCode}
                keyboardType="numeric"
              />

              {errors?.fields?.code && (
                <Text className="text-red-500 mt-2 text-sm">
                  {errors.fields.code.message}
                </Text>
              )}

              <CustomButton
                title={isFetching ? "Verifying..." : "Verify"}
                onPress={handleVerify}
                className="mt-6"
                disabled={isFetching}
              />

              <Pressable
                className="mt-4"
                onPress={() => signIn.mfa.sendEmailCode()}
                disabled={isFetching}
              >
                <Text className="text-center text-primary-500 font-JakartaSemiBold">
                  I need a new code
                </Text>
              </Pressable>

              <Pressable
                className="mt-3"
                onPress={() => signIn.reset()}
                disabled={isFetching}
              >
                <Text className="text-center text-primary-500 font-JakartaSemiBold">
                  Start over
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 bg-white">
        <View className="relative w-full h-[250px]">
          <Image
            source={images.signUpCar}
            className="z-0 w-full"
            style={{ height: 250 }}
          />
          <Text className="text-3xl text-black font-JakartaSemiBold absolute bottom-5 left-5">
            Welcome👋
          </Text>
        </View>

        <View className="p-5">
          <InputField
            label="Email"
            placeholder="Enter Your Email"
            icon={icons.email}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
            value={form.email}
            onChangeText={(value) => setForm({ ...form, email: value })}
          />

          {errors?.fields?.identifier && (
            <Text className="text-red-500 mt-1 text-sm">
              {errors.fields.identifier.message}
            </Text>
          )}

          <InputField
            label="Password"
            placeholder="Enter Your Password"
            icon={icons.lock}
            secureTextEntry={true}
            textContentType="password"
            value={form.password}
            onChangeText={(value) => setForm({ ...form, password: value })}
          />

          {errors?.fields?.password && (
            <Text className="text-red-500 mt-1 text-sm">
              {errors.fields.password.message}
            </Text>
          )}

          <CustomButton
            title={isFetching ? "Signing In..." : "Sign In"}
            onPress={onSignInPress}
            className="mt-6"
            disabled={!form.email || !form.password || isFetching}
          />

          <OAuth />

          <Link
            href="/(auth)/signUp"
            className="text-lg text-center text-general-200 mt-10"
          >
            <Text>New User?</Text>
            <Text className="text-primary-500"> Create an account</Text>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
};

export default SignIn;
