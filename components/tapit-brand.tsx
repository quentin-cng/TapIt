import { TapItMascot } from "./tapit-mascot";
import { TapItWordmark } from "./tapit-wordmark";

export function TapItBrand() {
  return (
    <div className="tapit-brand-lockup">
      <TapItMascot size="brand" />
      <TapItWordmark />
    </div>
  );
}
