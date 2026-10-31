import { Platform, Text as RNText, TextInput as RNTextInput, StyleSheet, TextInputProps, TextProps, TextStyle } from 'react-native';
import { FONT } from '../theme';

/** Ubah fontWeight menjadi file Plus Jakarta Sans yang sesuai (berlaku di iOS, Android, dan web). */
function withFont(style: TextProps['style']) {
  const flat = (StyleSheet.flatten(style) || {}) as TextStyle;
  const w = String(flat.fontWeight ?? '400');
  const fam = FONT[w === 'bold' ? '700' : w === 'normal' ? '400' : w] ?? FONT['400'];
  return [style, { fontFamily: fam, fontWeight: undefined }];
}

/** Text dengan font aplikasi. Pakai ini sebagai pengganti Text dari react-native. */
export function Text(props: TextProps) {
  return <RNText {...props} style={withFont(props.style)} />;
}

export function TextInput(props: TextInputProps) {
  // Web: cincin fokus hijau (tetap terlihat untuk pengguna keyboard) menggantikan garis hitam bawaan browser.
  const focusRing = Platform.OS === 'web' ? ({ outlineColor: '#2FB57A', outlineWidth: 2, outlineOffset: 0 } as unknown as TextStyle) : null;
  return <RNTextInput placeholderTextColor="#8A9B92" {...props} style={[withFont(props.style), focusRing]} />;
}
