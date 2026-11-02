import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { fileUrl } from '../services/api';
import { t } from '../i18n';
import { C, R } from '../theme';

/** Video postingan dengan kontrol bawaan (tidak diputar otomatis). */
export function PostVideo({ uri, style }: { uri: string; style?: StyleProp<ViewStyle> }) {
  const src = uri.startsWith('file:') || uri.startsWith('blob:') || uri.startsWith('content:') ? uri : fileUrl(uri);
  const player = useVideoPlayer(src ?? null, (p) => {
    p.loop = false;
  });
  return (
    <View style={[st.box, style]}>
      <VideoView player={player} style={StyleSheet.absoluteFill} nativeControls contentFit="contain" accessibilityLabel={t('Video postingan')} />
    </View>
  );
}

const st = StyleSheet.create({
  box: { height: 220, borderRadius: R.tile, overflow: 'hidden', backgroundColor: C.dark },
});
