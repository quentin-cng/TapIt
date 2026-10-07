import { Image, StyleSheet, useWindowDimensions, View } from "react-native";

const friendsArtwork = require("../../../assets/illustrations/friends-background.png");

export function FriendsHero() {
  const { width } = useWindowDimensions();
  const heroHeight = Math.max(160, Math.min(190, width * 0.46));
  const artworkHeight = width * (1024 / 1536);

  return (
    <View style={[styles.hero, { height: heroHeight }]}>
      <Image
        accessibilityIgnoresInvertColors
        resizeMode="cover"
        source={friendsArtwork}
        style={[styles.artwork, { height: artworkHeight, width }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    position: "relative",
    overflow: "hidden",
    marginHorizontal: -20,
    backgroundColor: "#faeee3",
  },
  artwork: {
    position: "absolute",
    right: 0,
    bottom: 0,
  },
});
