import { Image, StyleSheet, useWindowDimensions, View } from "react-native";

const homeArtwork = require("../../../assets/illustrations/home-chill-penguin.png");
const penguinArtwork = require("../../../assets/illustrations/penguin-chill.png");

export function PenguinProfileArtwork() {
  return (
    <View style={styles.profileSurface}>
      <Image
        accessibilityIgnoresInvertColors
        resizeMode="contain"
        source={penguinArtwork}
        style={styles.profileImage}
      />
    </View>
  );
}

export function HomeHeroArtwork({ height }: { height: number }) {
  const { width: windowWidth } = useWindowDimensions();
  const artworkHeight = height;
  const artworkWidth = Math.max(windowWidth, artworkHeight * (1362 / 1155));
  const artworkLeft = (windowWidth - artworkWidth) / 2;

  return (
    <View
      style={[
        styles.heroFrame,
        {
          height: artworkHeight,
          left: artworkLeft,
          width: artworkWidth,
        },
      ]}
    >
      <Image
        accessibilityIgnoresInvertColors
        resizeMode="contain"
        source={homeArtwork}
        style={{ height: artworkHeight, width: artworkWidth }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  profileSurface: {
    width: 38,
    height: 38,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#1a1333",
    borderRadius: 19,
    backgroundColor: "#ffcfaa",
  },
  profileImage: {
    position: "absolute",
    top: -6,
    left: -25,
    width: 88,
    height: 59,
  },
  heroFrame: {
    position: "absolute",
    top: 0,
    overflow: "hidden",
  },
});
