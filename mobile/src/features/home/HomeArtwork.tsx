import { Image, StyleSheet, useWindowDimensions } from "react-native";

const homeArtwork = require("../../../assets/illustrations/home-chill-penguin.png");

export function HomeHeroArtwork({ height }: { height: number }) {
  const { width: windowWidth } = useWindowDimensions();

  return (
    <Image
      accessibilityIgnoresInvertColors
      resizeMode="cover"
      source={homeArtwork}
      style={[styles.heroImage, { height, width: windowWidth }]}
    />
  );
}

const styles = StyleSheet.create({
  heroImage: {
    position: "absolute",
    top: 0,
    left: 0,
  },
});
