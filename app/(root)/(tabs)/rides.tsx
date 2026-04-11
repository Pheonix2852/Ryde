import RideCard from "@/components/RideCard";
import { images } from "@/constants";
import { fetchAPI } from "@/lib/fetch";
import { Ride } from "@/types/type";
import { useAuth, useUser } from "@clerk/expo";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const rides = () => {
  const { user } = useUser();
  const { userId } = useAuth();
  const [recentRides, setRecentRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
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
    <SafeAreaView>
      <FlatList
        data={recentRides}
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
            <Text className="text-2xl font-JakartaBold my-5">All Rides</Text>
          </>
        )}
      />
    </SafeAreaView>
  );
};

export default rides;
