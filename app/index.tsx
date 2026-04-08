import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import "../global.css";

export default function Home() {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-red">
      <Text className="text-xl font-bold text-blue-500">
        Welcome to Nativewind!
      </Text>
    </SafeAreaView>
  );
}
