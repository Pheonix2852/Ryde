import { Show, useClerk, useUser } from "@clerk/expo";
import { router } from "expo-router";
import React from "react";

import { Pressable, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const home = () => {
  const { user } = useUser();
  const { signOut } = useClerk();

  return (
    <SafeAreaView>
      <Show when="signed-in">
        <Text>Hello {user?.emailAddresses[0].emailAddress}</Text>
        <Pressable
          onPress={async () => {
            await signOut();
            router.replace("/(auth)/welcome");
          }}
        >
          <Text>Sign out</Text>
        </Pressable>
      </Show>
    </SafeAreaView>
  );
};

export default home;
