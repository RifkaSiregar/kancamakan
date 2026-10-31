import { Animated, Platform, View, ViewProps } from 'react-native';

/**
 * Animated.View yang aman untuk web.
 * Animated di react-native-web menambahkan `collapsable={false}`, yang lalu diteruskan ke elemen HTML
 * dan memicu peringatan React ("Received `false` for a non-boolean attribute `collapsable`").
 * Di web kita buang atribut itu; di iOS/Android tetap memakai Animated.View biasa.
 */
function WebView({ collapsable: _c, ...rest }: ViewProps) {
  return <View {...rest} />;
}

export const AView: typeof Animated.View = Platform.OS === 'web' ? (Animated.createAnimatedComponent(WebView) as unknown as typeof Animated.View) : Animated.View;
