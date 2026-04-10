import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import OAuth from "@/components/OAuth";
import { fetchAPI } from "@/lib/fetch";
import { useAuth, useSignUp } from "@clerk/expo";
import { Image } from "expo-image";
import { type Href, Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { icons, images } from "../../constants";

const SignUp = () => {
  const { signUp, errors, fetchStatus } = useSignUp();
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [code, setCode] = useState("");

  const isFetching = fetchStatus === "fetching";

  const onSignUpPress = async () => {
    if (!form.email || !form.password) return;

    const { error } = await signUp.password({
      emailAddress: form.email,
      password: form.password,
    });

    if (error) {
      console.error(JSON.stringify(error, null, 2));
      return;
    }

    if (!error) await signUp.verifications.sendEmailCode();
  };

  const handleVerify = async () => {
    await signUp.verifications.verifyEmailCode({
      code,
    });

    if (signUp.status === "complete") {
      await fetchAPI("/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          clerk_id: signUp.createdUserId,
        }),
      });
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
    } else {
      console.error("Sign-up attempt not complete:", signUp);
    }
  };

  if (signUp.status === "complete" || isSignedIn) {
    return null;
  }

  if (
    signUp.status === "missing_requirements" &&
    signUp.unverifiedFields.includes("email_address") &&
    signUp.missingFields.length === 0
  ) {
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
              Verify Your Account
            </Text>
          </View>

          <View className="p-5">
            <Text className="text-base text-gray-600 mb-4">
              We sent a verification code to your email.
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
              bgVariant="primary"
              className="mt-6 shadow-black"
              onPress={handleVerify}
              disabled={isFetching}
            />

            <Pressable
              className="mt-4"
              onPress={() => signUp.verifications.sendEmailCode()}
              disabled={isFetching}
            >
              <Text className="text-center text-primary-500 font-JakartaSemiBold">
                I need a new code
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    );
  }

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
              Create Your Account
            </Text>
          </View>

          <View className="p-5">
            <InputField
              label="Name"
              placeholder="Enter Your Name"
              placeholderTextColor="gray"
              icon={icons.person}
              value={form.name}
              onChangeText={(value) => setForm({ ...form, name: value })}
            />

            <InputField
              label="Email"
              placeholder="Enter Your Email"
              placeholderTextColor="gray"
              icon={icons.email}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
              value={form.email}
              onChangeText={(value) => setForm({ ...form, email: value })}
            />

            <InputField
              label="Password"
              placeholder="Enter Your Password"
              placeholderTextColor="gray"
              icon={icons.lock}
              secureTextEntry={true}
              textContentType="password"
              value={form.password}
              onChangeText={(value) => setForm({ ...form, password: value })}
            />

            {errors?.fields?.emailAddress && (
              <Text className="text-red-500 mt-1 text-sm">
                {errors.fields.emailAddress.message}
              </Text>
            )}

            {errors?.fields?.password && (
              <Text className="text-red-500 mt-1 text-sm">
                {errors.fields.password.message}
              </Text>
            )}

            <CustomButton
              title={isFetching ? "Signing Up..." : "Sign Up"}
              onPress={onSignUpPress}
              className="mt-6"
              disabled={!form.email || !form.password || isFetching}
            />

            <OAuth />

            <Link
              href="/(auth)/signIn"
              className="text-lg text-center text-general-200 mt-10"
            >
              <Text>Already have an account?</Text>
              <Text className="text-primary-500"> Log In</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignUp;
