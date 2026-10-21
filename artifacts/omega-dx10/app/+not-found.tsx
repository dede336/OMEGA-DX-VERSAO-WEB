import { useLanguage } from '@/context/LanguageContext';
import { Text } from '@/components/localization/LocalizedNative';
import { Link, Stack } from "expo-router";
import { StyleSheet, View } from 'react-native';

import { useColors } from "@/hooks/useColors";

export default function NotFoundScreen() {
  const { t } = useLanguage();
  const colors = useColors();

  return (
    <>
      <Stack.Screen options={{ title: t('common.error') }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          This screen doesn&apos;t exist.
        </Text>

        <Link href="/" style={styles.link}>
          <Text style={[styles.linkText, { color: colors.primary }]}>
            Go to home screen!
          </Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 15,
    fontWeight: "bold",
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 12,
  },
});
