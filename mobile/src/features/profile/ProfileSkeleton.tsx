import { StyleSheet, View } from "react-native";

const blockColor = "#eadfd4";

function Block({ style }: { style: object }) {
  return <View style={[styles.block, style]} />;
}

export function ProfileSkeleton() {
  return (
    <View accessible accessibilityLabel="Loading profile" style={styles.container}>
      <View style={styles.identity}>
        <Block style={styles.avatar} />
        <Block style={styles.name} />
        <Block style={styles.username} />
        <Block style={styles.editButton} />
      </View>

      <Block style={styles.sectionTitle} />
      <View style={styles.goalChoices}>
        {Array.from({ length: 7 }, (_, index) => (
          <Block key={index} style={styles.goalChoice} />
        ))}
      </View>
      <Block style={styles.goalCopy} />

      <Block style={[styles.sectionTitle, styles.accountTitle]} />
      <View style={styles.settings}>
        <View style={styles.row}>
          <Block style={styles.rowIcon} />
          <Block style={styles.rowText} />
        </View>
        <View style={styles.row}>
          <Block style={styles.rowIcon} />
          <Block style={styles.rowTextWide} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 16 },
  block: { backgroundColor: blockColor },
  identity: { alignItems: "center" },
  avatar: { width: 76, height: 76, borderRadius: 38 },
  name: { width: 126, height: 22, marginTop: 15, borderRadius: 7 },
  username: { width: 94, height: 11, marginTop: 8, borderRadius: 5 },
  editButton: { width: 112, height: 38, marginTop: 17, borderRadius: 19 },
  sectionTitle: { width: 90, height: 16, marginTop: 34, borderRadius: 5 },
  goalChoices: {
    flexDirection: "row",
    gap: 7,
    marginTop: 14,
  },
  goalChoice: { flex: 1, height: 40, borderRadius: 13 },
  goalCopy: { width: 190, height: 11, marginTop: 14, borderRadius: 5 },
  accountTitle: { width: 78, marginTop: 38 },
  settings: {
    marginTop: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: blockColor,
  },
  row: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: blockColor,
  },
  rowIcon: { width: 38, height: 38, borderRadius: 12 },
  rowText: { width: 126, height: 12, borderRadius: 5 },
  rowTextWide: { width: 158, height: 12, borderRadius: 5 },
});
