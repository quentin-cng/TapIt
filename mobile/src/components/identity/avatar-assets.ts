import type { ImageSourcePropType } from "react-native";
import {
  normalizeProfileAvatarId,
  type ProfileAvatarId,
} from "../../domain/profile-avatar";

export const profileAvatarAssets: Record<
  ProfileAvatarId,
  ImageSourcePropType
> = {
  default: require("../../../assets/avatars/default.png"),
  mountain: require("../../../assets/avatars/mountain.png"),
  sunset: require("../../../assets/avatars/sunset.png"),
  forest: require("../../../assets/avatars/forest.png"),
  moon: require("../../../assets/avatars/moon.png"),
};

export function getProfileAvatarAsset(value: unknown): ImageSourcePropType {
  return profileAvatarAssets[normalizeProfileAvatarId(value)];
}
