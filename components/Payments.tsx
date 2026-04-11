import { images } from "@/constants";
import { fetchAPI } from "@/lib/fetch";
import { useLocationStore } from "@/store";
import { PaymentProps } from "@/types/type";
import { useAuth } from "@clerk/expo";
import {
  IntentCreationCallbackParams,
  PaymentSheetError,
  useStripe,
} from "@stripe/stripe-react-native";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Image, Text, View } from "react-native";
import Modal from "react-native-modal";
import CustomButton from "./CustomButton";

const Payments = ({
  fullName,
  email,
  amount,
  driverId,
  rideTime,
}: PaymentProps) => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [success, setSuccess] = useState(false);
  const {
    userAddress,
    destinationAddress,
    userLatitude,
    userLongitude,
    destinationLatitude,
    destinationLongitude,
  } = useLocationStore();
  const { userId } = useAuth();

  const parsedAmount = Number(amount || "0");
  const amountInCents = Math.max(50, Math.round(parsedAmount * 100));

  const initializePaymentSheet = useCallback(
    async ({
      showValidationAlert = false,
    }: { showValidationAlert?: boolean } = {}) => {
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        if (showValidationAlert) {
          Alert.alert("Invalid fare", "Please select a valid ride fare.");
        }
        return false;
      }

      const { error } = await initPaymentSheet({
        merchantDisplayName: "Ryde",
        intentConfiguration: {
          mode: {
            amount: amountInCents,
            currencyCode: "USD",
          },
          confirmHandler: async (_, __, intentCreationCallback) => {
            try {
              const { paymentIntent } = await fetchAPI<{
                paymentIntent: { client_secret: string };
              }>("/(api)/(stripe)/create", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  name: fullName || email.split("@")[0],
                  email,
                  amount: amountInCents / 100,
                }),
              });

              if (!paymentIntent?.client_secret) {
                throw new Error("Missing payment intent client secret");
              }

              intentCreationCallback({
                clientSecret: paymentIntent.client_secret,
              });
            } catch (err) {
              const message =
                err instanceof Error ? err.message : "Failed to create payment";

              intentCreationCallback({
                error: {
                  code: "Failed",
                  message,
                  localizedMessage: message,
                },
              } as IntentCreationCallbackParams);
            }
          },
        },
        returnURL: "ryde://bookRide",
      });

      if (error) {
        console.error("Payment sheet init error:", error.code, error.message);
        Alert.alert("Payment setup failed", error.message);
        return false;
      }

      return true;
    },
    [amountInCents, email, fullName, initPaymentSheet, parsedAmount],
  );

  const createRide = useCallback(async () => {
    if (!userId) {
      throw new Error("Missing user id");
    }

    await fetchAPI("/(api)/(ride)/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        origin_address: userAddress,
        destination_address: destinationAddress,
        origin_latitude: userLatitude,
        origin_longitude: userLongitude,
        destination_latitude: destinationLatitude,
        destination_longitude: destinationLongitude,
        ride_time: Math.round(rideTime),
        payment_status: "paid",
        fare_price: amountInCents,
        driver_id: driverId,
        user_id: userId,
      }),
    });
  }, [
    amountInCents,
    destinationAddress,
    destinationLatitude,
    destinationLongitude,
    driverId,
    rideTime,
    userAddress,
    userId,
    userLatitude,
    userLongitude,
  ]);

  useEffect(() => {
    initializePaymentSheet();
  }, [initializePaymentSheet]);

  const openPaymentSheet = async () => {
    const isReady = await initializePaymentSheet({ showValidationAlert: true });
    if (!isReady) return;

    const { error } = await presentPaymentSheet();

    if (error) {
      if (error.code === PaymentSheetError.Canceled) {
        return;
      } else {
        Alert.alert("Payment failed", `${error.message} (code: ${error.code})`);
      }
      return;
    }

    try {
      await createRide();
      setSuccess(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to create ride";
      Alert.alert("Ride creation failed", message);
    }
  };

  return (
    <>
      <CustomButton
        title="Confirm Ride"
        className="my-10"
        onPress={openPaymentSheet}
        disabled={
          !Number.isFinite(parsedAmount) || parsedAmount <= 0 || !driverId
        }
      />

      <Modal isVisible={success} onBackdropPress={() => setSuccess(false)}>
        <View className="flex flex-col items-center justify-center bg-white p-7 rounded-2xl">
          <Image source={images.check} className="w-28 h-28 mt-5" />

          <Text className="text-2xl text-center font-JakartaBold mt-5">
            Ride Booked!!!
          </Text>

          <Text className="text-md text-general-200 font-JakartaMedium text-center mt-3">
            Thank you for booking. Have a happy and safe journey.
          </Text>

          <CustomButton
            title="Back Home"
            className="mt-5"
            onPress={() => {
              setSuccess(false);
              router.push("/(root)/(tabs)/home");
            }}
          />
        </View>
      </Modal>
    </>
  );
};

export default Payments;
