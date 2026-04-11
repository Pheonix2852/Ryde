import { PaymentProps } from "@/types/type";
import { Text, View } from "react-native";
import CustomButton from "./CustomButton";

const Payments = (_props: PaymentProps) => {
  return (
    <View className="my-10">
      <CustomButton title="Confirm Ride" disabled className="opacity-50" />
      <Text className="text-center mt-3 text-sm text-gray-500">
        Payments are available in the mobile app.
      </Text>
    </View>
  );
};

export default Payments;
