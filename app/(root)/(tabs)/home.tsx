import GoogleTextInput from "@/components/GoogleTextInput";
import Map from "@/components/Map";
import RideCard from "@/components/RideCard";
import { icons, images } from "@/constants";
import { fetchAPI } from "@/lib/fetch";
import { useLocationStore } from "@/store";
import { Ride } from "@/types/type";
import { useAuth, useUser } from "@clerk/expo";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

const home = () => {
  const { setUserLocation, setDestinationLocation } = useLocationStore();
  const { userId, signOut } = useAuth();
  const { user } = useUser();
  const [recentRides, setRecentRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  const handleSignOut = () => {
    signOut();
    router.push("/(auth)/signIn");
  };
  const handleDestinationPress = (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => {
    setDestinationLocation(location);

    router.push("/(root)/findRide");
  };

  useEffect(() => {
    const requestLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        return;
      }

      let location = await Location.getCurrentPositionAsync();

      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords?.latitude!,
        longitude: location.coords?.longitude!,
      });

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: `${address[0].name} ${address[0].region}`,
      });
    };
    requestLocation();
  }, [setUserLocation]);

  useEffect(() => {
    const loadRecentRides = async () => {
      if (!userId) {
        setRecentRides([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetchAPI<{ data: Ride[] }>(
          `/(api)/(ride)/${userId}`,
        );
        setRecentRides(response?.data || []);
      } catch (error) {
        console.error("Error fetching recent rides:", error);
        setRecentRides([]);
      } finally {
        setLoading(false);
      }
    };

    loadRecentRides();
  }, [userId]);

  return (
    <SafeAreaView className="bg-general-500">
      <FlatList
        data={recentRides?.slice(0, 5)}
        renderItem={({ item }: { item: Ride }) => <RideCard ride={item} />}
        className="px-5"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingBottom: 100,
        }}
        ListEmptyComponent={() => (
          <View className="flex flex-col items-center justify-center">
            {!loading ? (
              <>
                <Image
                  source={images.noResult}
                  className="w-40 h-40"
                  alt="No rides found"
                  resizeMode="contain"
                />
                <Text className="text-sm">No Recent Rides Found!</Text>
              </>
            ) : (
              <ActivityIndicator size="small" color="#000" />
            )}
          </View>
        )}
        ListHeaderComponent={() => (
          <>
            <View className="flex flex-row items-center justify-between my-5">
              <Text className="text-2xl font-JakartaExtraBold capitalize">
                Welcome,{" "}
                {user?.firstName ||
                  user?.emailAddresses[0].emailAddress.split("@")[0]}{" "}
                👋
              </Text>
              <TouchableOpacity
                onPress={handleSignOut}
                className="justify-center items-center w-10 h-10 rounded-full bg-white"
              >
                <Image source={icons.out} className="w-4 h-4" />
              </TouchableOpacity>
            </View>

            <GoogleTextInput
              icon={icons.search}
              containerStyle="bg-white shadow-md shadow--neutral-300"
              handlePress={handleDestinationPress}
            />

            <Text className="text-xl font-JakartaBold mt-5 mb-3">
              Your Current Location
            </Text>
            <View className="flex flex-row items-center bg-transparent h-[300px]">
              <Map />
            </View>

            <Text className="text-xl font-JakartaBold mt-5 mb-3">
              Recent Rides
            </Text>
          </>
        )}
      />
    </SafeAreaView>
  );
};

export default home;
