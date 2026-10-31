import { useEffect, useRef } from 'react';
import { AView } from './AView';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { Text } from './Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from '../store';
import { shadow } from '../theme';

export function Toast() {
  const { msg, action, hide } = useToast();
  const ins = useSafeAreaInsets();
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, { toValue: msg ? 1 : 0, duration: 220, useNativeDriver: true }).start();
  }, [msg, a]);
  return (
    <AView
      pointerEvents={msg ? 'box-none' : 'none'}
      accessibilityLiveRegion="polite"
      style={[st.wrap, { bottom: 112 + ins.bottom, opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }]}
    >
      <Text style={st.txt}>{msg}</Text>
      {action && (
        <Pressable
          onPress={() => {
            action.run();
            hide();
          }}
          hitSlop={8}
        >
          <Text style={st.act}>{action.label}</Text>
        </Pressable>
      )}
    </AView>
  );
}

const st = StyleSheet.create({
  wrap: { position: 'absolute', left: 18, right: 18, backgroundColor: '#0F2A1F', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 12, zIndex: 80, ...shadow(3) },
  txt: { color: '#fff', fontSize: 14, lineHeight: 20, flex: 1, fontWeight: '600' },
  act: { color: '#F5B82E', fontWeight: '800', fontSize: 14 },
});
