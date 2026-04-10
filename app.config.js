module.exports = ({ config }) => {
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

  const pluginsWithoutMaps = (config.plugins || []).filter((plugin) => {
    if (typeof plugin === "string") {
      return plugin !== "react-native-maps";
    }

    return !(Array.isArray(plugin) && plugin[0] === "react-native-maps");
  });

  return {
    ...config,
    plugins: [
      ...pluginsWithoutMaps,
      [
        "react-native-maps",
        {
          androidGoogleMapsApiKey: googleMapsApiKey,
          iosGoogleMapsApiKey: googleMapsApiKey,
        },
      ],
    ],
  };
};
