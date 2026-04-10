import { useLocationStore } from "@/store";
import { Text, View } from "react-native";

const findRide = () => {
  const {
    userAddress,
    destinationAddress,
    setDestinationLocation,
    setUserLocation,
  } = useLocationStore();
  return (
    <View>
      <Text>Current Location: {userAddress}</Text>
      <Text>Destination Location: {destinationAddress}</Text>
    </View>
  );
};

export default findRide;
