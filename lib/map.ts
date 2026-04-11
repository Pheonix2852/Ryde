import { Driver, MarkerData } from "@/types/type";

const directionsAPI = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;
const DEFAULT_DRIVER_TIME_MINUTES = 5;
const DEFAULT_DRIVER_PRICE = (DEFAULT_DRIVER_TIME_MINUTES * 0.5).toFixed(2);

type DirectionsResponse = {
  status?: string;
  error_message?: string;
  routes?: Array<{
    legs?: Array<{
      duration?: {
        value?: number;
      };
    }>;
  }>;
};

const getDirectionsDurationInSeconds = async ({
  originLatitude,
  originLongitude,
  destinationLatitude,
  destinationLongitude,
}: {
  originLatitude: number;
  originLongitude: number;
  destinationLatitude: number;
  destinationLongitude: number;
}): Promise<number | null> => {
  if (!directionsAPI) {
    return null;
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/directions/json?origin=${originLatitude},${originLongitude}&destination=${destinationLatitude},${destinationLongitude}&key=${directionsAPI}`,
  );

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as DirectionsResponse;
  const durationValue = data.routes?.[0]?.legs?.[0]?.duration?.value;

  if (typeof durationValue !== "number") {
    return null;
  }

  return durationValue;
};

const withFallbackTimeAndPrice = (marker: MarkerData): MarkerData => ({
  ...marker,
  time: DEFAULT_DRIVER_TIME_MINUTES,
  price: DEFAULT_DRIVER_PRICE,
});

export const generateMarkersFromData = ({
  data,
  userLatitude,
  userLongitude,
}: {
  data: Driver[];
  userLatitude: number;
  userLongitude: number;
}): MarkerData[] => {
  return data.map((driver) => {
    const latOffset = (Math.random() - 0.5) * 0.01; // Random offset between -0.005 and 0.005
    const lngOffset = (Math.random() - 0.5) * 0.01; // Random offset between -0.005 and 0.005
    const markerId =
      (driver as Driver & { id?: number }).id ?? driver.driver_id;

    return {
      id: markerId,
      latitude: userLatitude + latOffset,
      longitude: userLongitude + lngOffset,
      title: `${driver.first_name} ${driver.last_name}`,
      ...driver,
    };
  });
};

export const calculateRegion = ({
  userLatitude,
  userLongitude,
  destinationLatitude,
  destinationLongitude,
}: {
  userLatitude: number | null;
  userLongitude: number | null;
  destinationLatitude?: number | null;
  destinationLongitude?: number | null;
}) => {
  if (userLatitude == null || userLongitude == null) {
    return {
      latitude: 37.78825,
      longitude: -122.4324,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }

  if (destinationLatitude == null || destinationLongitude == null) {
    return {
      latitude: userLatitude,
      longitude: userLongitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }

  const minLat = Math.min(userLatitude, destinationLatitude);
  const maxLat = Math.max(userLatitude, destinationLatitude);
  const minLng = Math.min(userLongitude, destinationLongitude);
  const maxLng = Math.max(userLongitude, destinationLongitude);

  const latitudeDelta = (maxLat - minLat) * 1.3; // Adding some padding
  const longitudeDelta = (maxLng - minLng) * 1.3; // Adding some padding

  const latitude = (userLatitude + destinationLatitude) / 2;
  const longitude = (userLongitude + destinationLongitude) / 2;

  return {
    latitude,
    longitude,
    latitudeDelta,
    longitudeDelta,
  };
};

export const calculateDriverTimes = async ({
  markers,
  userLatitude,
  userLongitude,
  destinationLatitude,
  destinationLongitude,
}: {
  markers: MarkerData[];
  userLatitude: number | null;
  userLongitude: number | null;
  destinationLatitude: number | null;
  destinationLongitude: number | null;
}) => {
  if (
    userLatitude == null ||
    userLongitude == null ||
    destinationLatitude == null ||
    destinationLongitude == null
  ) {
    return [];
  }

  try {
    const userToDestinationDuration = await getDirectionsDurationInSeconds({
      originLatitude: userLatitude,
      originLongitude: userLongitude,
      destinationLatitude,
      destinationLongitude,
    });

    if (userToDestinationDuration == null) {
      return markers.map(withFallbackTimeAndPrice);
    }

    const timesPromises = markers.map(async (marker) => {
      const timeToUser = await getDirectionsDurationInSeconds({
        originLatitude: marker.latitude,
        originLongitude: marker.longitude,
        destinationLatitude: userLatitude,
        destinationLongitude: userLongitude,
      });

      if (timeToUser == null) {
        return withFallbackTimeAndPrice(marker);
      }

      const totalTime = (timeToUser + userToDestinationDuration) / 60; // Total time in minutes
      const price = (totalTime * 0.5).toFixed(2); // Calculate price based on time

      return { ...marker, time: totalTime, price };
    });

    return await Promise.all(timesPromises);
  } catch (error) {
    console.error("Error calculating driver times:", error);
    return markers.map(withFallbackTimeAndPrice);
  }
};
