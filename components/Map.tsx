import { icons } from "@/constants";
import { useFetch } from "@/lib/fetch";
import {
  calculateDriverTimes,
  calculateRegion,
  generateMarkersFromData,
} from "@/lib/map";
import { useDriverStore, useLocationStore } from "@/store";
import { Driver, MarkerData } from "@/types/type";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";

const Map = () => {
  const mapRef = useRef<MapView>(null);
  const { data: drivers, loading, error } = useFetch<Driver[]>("/driver");
  const {
    userLatitude,
    userLongitude,
    destinationLatitude,
    destinationLongitude,
  } = useLocationStore();

  const { selectedDriver, setSelectedDriver, setDrivers } = useDriverStore();
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [showDirections, setShowDirections] = useState(true);

  const region = calculateRegion({
    userLatitude,
    userLongitude,
    destinationLatitude,
    destinationLongitude,
  });

  useEffect(() => {
    if (Array.isArray(drivers)) {
      if (userLatitude == null || userLongitude == null) return;

      const newMarkers = generateMarkersFromData({
        data: drivers,
        userLatitude,
        userLongitude,
      });

      setMarkers(newMarkers);
    }
  }, [drivers, userLatitude, userLongitude]);

  useEffect(() => {
    if (
      markers.length > 0 &&
      destinationLatitude != null &&
      destinationLongitude != null
    ) {
      calculateDriverTimes({
        markers,
        userLongitude,
        userLatitude,
        destinationLatitude,
        destinationLongitude,
      }).then((drivers) => {
        setDrivers((drivers || []) as MarkerData[]);
      });
    }
  }, [
    markers,
    destinationLatitude,
    destinationLongitude,
    userLatitude,
    userLongitude,
    setDrivers,
  ]);

  useEffect(() => {
    setShowDirections(true);
  }, [userLatitude, userLongitude, destinationLatitude, destinationLongitude]);

  if (loading || userLatitude == null || userLongitude == null) {
    return (
      <View className="flex  justify-between items-center w-full">
        <ActivityIndicator size="small" color="#000" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex  justify-between items-center w-full">
        <Text>Error: {error}</Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        tintColor="black"
        mapType="standard"
        showsPointsOfInterests={false}
        region={region}
        showsUserLocation={true}
        userInterfaceStyle="light"
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id.toString()}
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
            title={marker.title}
            onPress={() => setSelectedDriver(marker.id)}
            image={
              selectedDriver === marker.id ? icons.selectedMarker : icons.marker
            }
          />
        ))}

        {destinationLatitude != null && destinationLongitude != null && (
          <>
            <Marker
              key="destination"
              coordinate={{
                latitude: destinationLatitude,
                longitude: destinationLongitude,
              }}
              title="Destination"
              icon={icons.pin}
            />

            {showDirections && (
              <MapViewDirections
                origin={{
                  latitude: userLatitude,
                  longitude: userLongitude,
                }}
                destination={{
                  latitude: destinationLatitude,
                  longitude: destinationLongitude,
                }}
                apikey={process.env.EXPO_PUBLIC_GOOGLE_API_KEY!}
                strokeColor="#0286ff"
                strokeWidth={2}
                onReady={(result) => {
                  if (result.coordinates.length > 1) {
                    mapRef.current?.fitToCoordinates(result.coordinates, {
                      edgePadding: {
                        top: 80,
                        right: 40,
                        bottom: 80,
                        left: 40,
                      },
                      animated: true,
                    });
                  }
                }}
                onError={() => setShowDirections(false)}
              />
            )}

            {!showDirections && (
              <Polyline
                coordinates={[
                  { latitude: userLatitude, longitude: userLongitude },
                  {
                    latitude: destinationLatitude,
                    longitude: destinationLongitude,
                  },
                ]}
                strokeColor="#0286ff"
                strokeWidth={2}
              />
            )}
          </>
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
  },
  map: {
    width: "100%",
    height: "100%",
  },
});

export default Map;
