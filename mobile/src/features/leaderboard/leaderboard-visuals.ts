const avatarPalette = [
  { background: "#dcd0fb", foreground: "#5632b8" },
  { background: "#dce9fa", foreground: "#315e9c" },
  { background: "#dff1e9", foreground: "#267155" },
  { background: "#f8e1e8", foreground: "#a44465" },
  { background: "#f7ead1", foreground: "#9a651b" },
] as const;

export function getAvatarColors(key: string) {
  let hash = 0;

  for (const character of key) {
    hash = (hash * 31 + (character.codePointAt(0) ?? 0)) | 0;
  }

  return avatarPalette[Math.abs(hash) % avatarPalette.length];
}

export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials =
    parts.length > 1
      ? `${Array.from(parts[0])[0] ?? ""}${Array.from(parts.at(-1) ?? "")[0] ?? ""}`
      : Array.from(parts[0] ?? "T")[0] ?? "T";

  return initials.toLocaleUpperCase("en-CA");
}
