import { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '../theme';

/** Bottom sheet sederhana. Ketuk latar atau tombol kembali Android untuk menutup. */
export function Sheet({ visible, onClose, title, body, children, dismissable = true }: { visible: boolean; onClose: () => void; title?: string; body?: string; children: ReactNode; dismissable?: boolean }) {
  const ins = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => {
      if (dismissable) onClose();
    }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable style={st.bg} onPress={() => {
          if (dismissable) onClose();
        }} accessibilityLabel="Tutup" />
        <View style={[st.sheet, { paddingBottom: 22 + ins.bottom }]} accessibilityViewIsModal>
          <View style={st.grab} />
          {title ? <Text style={st.title}>{title}</Text> : null}
          {body ? <Text style={st.body}>{body}</Text> : null}
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function SheetOpt({ label, onPress, danger, muted, right }: { label: string; onPress: () => void; danger?: boolean; muted?: boolean; right?: string }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={st.opt}>
      <Text style={{ flex: 1, fontWeight: '700', fontSize: 15, color: danger ? C.red : muted ? C.muted : C.ink }}>{label}</Text>
      {right ? <Text style={{ fontSize: 11.5, color: C.muted }}>{right}</Text> : null}
    </Pressable>
  );
}

const st = StyleSheet.create({
  bg: { flex: 1, backgroundColor: 'rgba(15,42,31,0.55)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 10, maxHeight: '82%' },
  grab: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: '#D3DED8', marginBottom: 14 },
  title: { fontSize: 19, fontWeight: '800', color: C.ink, marginBottom: 6, letterSpacing: -0.2 },
  body: { color: C.muted, fontSize: 13.5, lineHeight: 20, marginBottom: 12 },
  opt: { minHeight: 50, borderTopWidth: 1, borderTopColor: C.lineSoft, flexDirection: 'row', alignItems: 'center' },
});
