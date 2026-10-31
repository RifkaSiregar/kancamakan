import { View } from 'react-native';
import { Text } from './Text';
import { C } from '../theme';

export function Progress({ step, total = 2 }: { step: number; total?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 18 }} accessibilityLabel={`Langkah ${step} dari ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: i < step ? C.acc : '#D5DFD8' }} />
      ))}
      <Text style={{ fontSize: 12, color: C.muted }}>
        Langkah {step} dari {total}
      </Text>
    </View>
  );
}
