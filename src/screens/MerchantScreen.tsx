/**
 * NIRA - layar Dashboard penjual (gaya iOS).
 *
 * Sisi penjual: lihat pendapatan & porsi terselamatkan, unggah makanan surplus,
 * dan verifikasi pengambilan pesanan (inti alur bisnisnya).
 */
import React, { useMemo, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Badge, Button, Card, Divider, EmptyState, Group, Icon, IconBadge, LargeTitle, Reveal, SectionLabel, T } from '../ui';
import { resolvePhoto, rupiah } from '../data';
import { palette, radius, spacing, type, TABBAR_SPACE } from '../theme';
import { useStore } from '../store';
import { useAuth } from '../auth';
import type { Order, OrderStatus, SurplusItem } from '../types';
import type { IconName } from '../ui';

const STATUS_META: Record<OrderStatus, { label: string; tone: 'neutral' | 'accent' | 'green' | 'warning' | 'danger' }> = {
  pending: { label: 'Menunggu bayar', tone: 'warning' },
  paid: { label: 'Perlu diverifikasi', tone: 'accent' },
  picked_up: { label: 'Selesai', tone: 'green' },
  cancelled: { label: 'Batal', tone: 'danger' },
};

const CATEGORIES = ['Masakan Rumah', 'Bakery', 'Kafe', 'Restoran', 'Healthy Food', 'Lainnya'];

/** Pilihan ikon makanan - pengganti deretan emoji. */
const FOOD_ICONS: IconName[] = [
  'rice', 'food-drumstick', 'food-variant', 'food-croissant', 'bowl-mix',
  'food', 'noodles', 'cupcake', 'coffee', 'pizza', 'bread-slice', 'pot-steam',
];

/* --------------------------------------------------------------- Upload form */

function UploadSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { addSurplus } = useStore();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState<IconName>('rice');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [original, setOriginal] = useState('');
  const [price, setPrice] = useState('');
  const [portions, setPortions] = useState('3');
  const [start, setStart] = useState('18:00');
  const [end, setEnd] = useState('21:00');
  const [desc, setDesc] = useState('');
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const num = (s: string) => parseInt(s.replace(/[^0-9]/g, ''), 10) || 0;
  const valid = title.trim().length >= 3 && num(original) > 0 && num(price) > 0 && num(price) < num(original) && num(portions) > 0;

  async function pickPhoto() {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Izin ditolak', 'Izinkan akses galeri untuk memilih foto makanan.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        allowsEditing: true,
        aspect: [4, 3],
      });
      if (!res.canceled && res.assets[0]) setPhoto(res.assets[0]);
    } catch {
      Alert.alert('Galeri gagal dibuka', 'Coba lagi sebentar lagi.');
    }
  }

  async function takePhoto() {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Izin ditolak', 'Izinkan akses kamera untuk memotret makanan.');
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        allowsEditing: true,
        aspect: [4, 3],
      });
      if (!res.canceled && res.assets[0]) setPhoto(res.assets[0]);
    } catch {
      Alert.alert('Kamera gagal dibuka', 'Coba lagi sebentar lagi.');
    }
  }

  function submit() {
    if (!valid) {
      Alert.alert('Belum lengkap', 'Isi nama makanan, harga normal, harga diskon (lebih murah), dan jumlah porsi.');
      return;
    }
    addSurplus({
      merchantId: user?.merchantId ?? 'm1', // akun penjual yang sedang masuk
      title: title.trim(),
      description: desc.trim() || 'Makanan surplus siap diambil pada jam yang tertera.',
      icon,
      photo: photo ? { uri: photo.uri } : undefined,
      originalPrice: num(original),
      price: num(price),
      portions: num(portions),
      portionsTotal: num(portions),
      pickupStart: start,
      pickupEnd: end,
      category,
      hoursValid: 6,
    });
    setTitle(''); setOriginal(''); setPrice(''); setPortions('3'); setDesc(''); setPhoto(null);
    onClose();
    Alert.alert('Terunggah', 'Makanan surplus langsung tampil di halaman Jelajahi konsumen.');
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.sheetWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.sheet, { paddingBottom: Math.max(spacing.lg, insets.bottom + spacing.md) }]}>
          <View style={styles.grabber} />
          <Text style={styles.sheetTitle}>Unggah Surplus</Text>
          <T tone="muted" style={[type.small, { textAlign: 'center', marginTop: 2 }]}>
            Makanan berlebih hari ini, harga hemat
          </T>

          <ScrollView
            contentContainerStyle={{ paddingBottom: spacing.xxl }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <T tone="muted" style={[type.tiny, { marginTop: spacing.lg }]}>FOTO MAKANAN</T>
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
              <Button label="Kamera" icon="camera" variant="secondary" onPress={takePhoto} style={{ flex: 1, height: 42 }} />
              <Button label="Galeri" icon="image" variant="secondary" onPress={pickPhoto} style={{ flex: 1, height: 42 }} />
            </View>
            {photo ? (
              <View style={styles.photoPreview}>
                <Image source={{ uri: photo.uri }} style={styles.photoImg} resizeMode="cover" />
                <Button label="Hapus foto" variant="ghost" onPress={() => setPhoto(null)} style={{ height: 32, marginTop: spacing.sm }} />
              </View>
            ) : (
              <T tone="muted" style={[type.tiny, { marginTop: spacing.sm }]}>
                Tanpa foto, kartu makanan memakai ikon:
              </T>
            )}
            <View style={styles.iconRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, alignItems: 'center' }}>
                {FOOD_ICONS.map((ic) => {
                  const on = ic === icon;
                  return (
                    <Pressable
                      key={ic}
                      testID={`icon-${ic}`}
                      onPress={() => setIcon(ic)}
                      style={[styles.iconChoice, on && styles.iconChoiceOn]}
                    >
                      <Icon name={ic} size={22} color={on ? '#fff' : palette.textMuted} />
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <Field label="Nama makanan" value={title} onChange={setTitle} placeholder="cth. Nasi Ayam Geprek" />
            <Field label="Deskripsi (opsional)" value={desc} onChange={setDesc} placeholder="cth. sisa closing, masih hangat" />

            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <Field label="Harga normal" value={original} onChange={setOriginal} placeholder="25000" keyboardType="number-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Harga diskon" value={price} onChange={setPrice} placeholder="10000" keyboardType="number-pad" />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <Field label="Jumlah porsi" value={portions} onChange={setPortions} placeholder="3" keyboardType="number-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Jam mulai" value={start} onChange={setStart} placeholder="18:00" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Jam selesai" value={end} onChange={setEnd} placeholder="21:00" />
              </View>
            </View>

            <T tone="muted" style={[type.tiny, { marginTop: spacing.md }]}>KATEGORI</T>
            <View style={styles.wrapRow}>
              {CATEGORIES.map((c) => (
                <Button
                  key={c}
                  label={c}
                  variant={c === category ? 'primary' : 'secondary'}
                  onPress={() => setCategory(c)}
                  style={{ height: 34, paddingHorizontal: 12, marginTop: spacing.sm }}
                />
              ))}
            </View>

            {num(original) > 0 && num(price) > 0 && num(price) < num(original) ? (
              <Card style={{ marginTop: spacing.lg, backgroundColor: palette.greenSoft }}>
                <T style={[type.small, { color: '#3f7a38' }]}>
                  Konsumen hemat {rupiah(num(original) - num(price))} ({Math.round(((num(original) - num(price)) / num(original)) * 100)}%).
                  Kamu tetap dapat {rupiah(num(price) * num(portions))} dari {num(portions)} porsi.
                </T>
              </Card>
            ) : null}

            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl }}>
              <Button label="Tutup" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
              <Button label="Unggah" variant="primary" onPress={submit} style={{ flex: 2 }} />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({
  label, value, onChange, placeholder, keyboardType, multiline,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad';
  multiline?: boolean;
}) {
  return (
    <View style={{ marginTop: spacing.md }}>
      <T tone="muted" style={type.tiny}>{label.toUpperCase()}</T>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={palette.textDim}
        keyboardType={keyboardType ?? 'default'}
        multiline={multiline}
        style={[styles.input, multiline ? { height: 72, textAlignVertical: 'top', paddingTop: 10 } : null]}
      />
    </View>
  );
}

/* ------------------------------------------------------------- Order row */

function MerchantOrderCard({ order, index }: { order: Order; index: number }) {
  const { confirmPickup } = useStore();
  const meta = STATUS_META[order.status];
  const actionable = order.status === 'paid';

  return (
    <Reveal delay={Math.min(index * 45, 240)}>
      <Card style={actionable ? { borderColor: palette.accent, borderWidth: 1.5 } : undefined}>
        <View style={styles.row}>
          <View style={styles.thumb}>
            {resolvePhoto(order.photo ?? undefined) ? (
              <Image source={resolvePhoto(order.photo ?? undefined)!} style={styles.thumbImg} resizeMode="cover" />
            ) : (
              <Icon name={order.icon} size={24} color={palette.textMuted} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <T style={type.bodyStrong} numberOfLines={2}>{order.itemTitle}</T>
            <T tone="muted" style={[type.small, { marginTop: 2 }]}>
              {order.qty} porsi · {rupiah(order.totalPrice)}
            </T>
          </View>
          <Badge label={meta.label} tone={meta.tone} />
        </View>

        <Divider style={{ marginVertical: spacing.md }} />

        <View style={styles.row}>
          <View>
            <T tone="muted" style={type.tiny}>KODE PICKUP KONSUMEN</T>
            <Text style={styles.code}>{order.code}</Text>
          </View>
          {actionable ? (
            <Button
              label="Verifikasi ambil"
              variant="green"
              testID={`verify-${order.id}`}
              onPress={() => confirmPickup(order.id)}
              style={{ height: 40 }}
            />
          ) : null}
        </View>
      </Card>
    </Reveal>
  );
}

/* ---------------------------------------------------------------- Screen */

export default function MerchantScreen() {
  const { orders, items, statsFor, confirmPickup } = useStore();
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'orders' | 'stock'>('orders');
  const [uploadOpen, setUploadOpen] = useState(false);

  // Merchant ID mengikuti akun penjual yang sedang masuk.
  const MERCHANT_ID = user?.merchantId ?? 'm1';
  const stats = statsFor(MERCHANT_ID);

  const myOrders = useMemo(() => orders.filter((o) => o.merchantId === MERCHANT_ID), [orders, MERCHANT_ID]);
  const needAction = myOrders.filter((o) => o.status === 'paid');
  const riwayat = myOrders.filter((o) => o.status !== 'paid');
  const myStock = useMemo(
    () => items.filter((i) => i.merchantId === MERCHANT_ID),
    [items, MERCHANT_ID],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <LargeTitle
        title="Dashboard"
        subtitle={`${user?.business?.businessName ?? 'Usaha kamu'}${user?.business?.address ? ' · ' + user.business.address.split(',').slice(-1)[0].trim() : ''}`}
      />

      <ScrollView contentContainerStyle={{ padding: spacing.gutter, paddingTop: 0, paddingBottom: spacing.xxl + insets.bottom + TABBAR_SPACE }}>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Button label="Upload surplus" icon="plus" variant="primary" testID="btn-upload" onPress={() => setUploadOpen(true)} style={{ flex: 1, height: 44 }} />
          <Button label="Keluar" variant="ghost" testID="btn-merchant-signout" onPress={signOut} style={{ height: 44, paddingHorizontal: 12 }} />
        </View>

        <View style={styles.statGrid}>
          <StatCard icon="cash" label="Pendapatan" value={rupiah(stats.revenue)} />
          <StatCard icon="food" label="Porsi terjual" value={String(stats.portionsRescued)} />
        </View>

        <SectionLabel text={`Perlu diverifikasi · ${needAction.length}`} />
        {needAction.length > 0 ? (
          <Group>
            {needAction.map((o) => (
              <View key={o.id} style={styles.verifyRow}>
                <View style={{ flex: 1 }}>
                  <T style={type.bodyStrong} numberOfLines={1}>{o.itemTitle}</T>
                  <T tone="muted" style={[type.small, { marginTop: 1 }]}>{o.qty} porsi</T>
                  <Text style={styles.codeSm}>{o.code}</Text>
                </View>
                <Button
                  label="Verifikasi"
                  variant="green"
                  testID={`verify-${o.id}`}
                  onPress={() => confirmPickup(o.id)}
                  style={{ height: 38, paddingHorizontal: 14 }}
                />
              </View>
            ))}
          </Group>
        ) : (
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Icon name="check-circle-outline" size={20} color={palette.accent} />
              <T tone="muted" style={[type.small, { flex: 1 }]}>
                Semua pesanan sudah diverifikasi. Kode pickup baru akan muncul di sini.
              </T>
            </View>
          </Card>
        )}

        <View style={styles.segment}>
          {([
            { key: 'orders' as const, label: 'Pesanan masuk' },
            { key: 'stock' as const, label: 'Stok surplus' },
          ]).map((t) => {
            const on = tab === t.key;
            return (
              <Pressable key={t.key} onPress={() => setTab(t.key)} style={[styles.segmentOpt, on && styles.segmentOptOn]}>
                <Text style={[type.bodyStrong, { color: on ? palette.text : palette.textMuted }]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {tab === 'orders' ? (
          myOrders.length === 0 ? (
            <EmptyState
              icon="mailbox-outline"
              title="Belum ada pesanan"
              body="Pesanan dari konsumen akan muncul di sini beserta kode pickup untuk diverifikasi."
            />
          ) : (
            riwayat.map((o, i) => <View key={o.id} style={{ marginTop: spacing.md }}><MerchantOrderCard order={o} index={i} /></View>)
          )
        ) : (
          myStock.length === 0 ? (
            <EmptyState
              icon="silverware-fork-knife"
              title="Belum ada makanan surplus"
              body="Tekan tombol Upload surplus untuk menjual makanan berlebih hari ini."
            />
          ) : (
            myStock.map((it, i) => (
              <Reveal key={it.id} delay={Math.min(i * 45, 240)}>
                <StockCard item={it} />
              </Reveal>
            ))
          )
        )}
      </ScrollView>

      <UploadSheet visible={uploadOpen} onClose={() => setUploadOpen(false)} />
    </SafeAreaView>
  );
}

/* --------------------------------------------------------- kartu stok */

/**
 * Kartu stok surplus yang BISA DIEDIT.
 *
 *   - tombol − / + mengubah jumlah porsi langsung (tersimpan ke penyimpanan)
 *   - tombol "Sunting" membuka form untuk mengubah harga, judul, jam, catatan
 *   - porsi otomatis tidak boleh kurang dari yang sudah dipesan
 */
function StockCard({ item }: { item: SurplusItem }) {
  const { editItem, removeItem, orders } = useStore();
  const [buka, setBuka] = useState(false);

  const [judul, setJudul] = useState(item.title);
  const [harga, setHarga] = useState(String(item.price));
  const [asli, setAsli] = useState(String(item.originalPrice));
  const [catatan, setCatatan] = useState(item.description);
  const [mulai, setMulai] = useState(item.pickupStart);
  const [selesai, setSelesai] = useState(item.pickupEnd);

  // porsi yang sudah dipesan konsumen (tidak boleh dikurangi di bawah ini)
  const terjual = useMemo(
    () => orders.filter((o) => o.itemId === item.id && o.status !== 'cancelled').reduce((n, o) => n + o.qty, 0),
    [orders, item.id],
  );
  const bisaKurang = item.portions > Math.max(0, terjual);

  const simpan = () => {
    const p = parseInt(harga, 10);
    const o = parseInt(asli, 10);
    editItem(item.id, {
      title: judul.trim() || item.title,
      price: Number.isFinite(p) && p > 0 ? p : item.price,
      originalPrice: Number.isFinite(o) && o >= p ? o : item.originalPrice,
      description: catatan,
      pickupStart: mulai,
      pickupEnd: selesai,
    });
    setBuka(false);
  };

  return (
    <Card style={{ marginTop: spacing.md }}>
      <View style={styles.row}>
        <View style={styles.thumb}>
          {resolvePhoto(item.photo) ? (
            <Image source={resolvePhoto(item.photo)!} style={styles.thumbImg} resizeMode="cover" />
          ) : (
            <Icon name={item.icon} size={24} color={palette.textMuted} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <T style={type.bodyStrong} numberOfLines={2}>{item.title}</T>
          <T tone="muted" style={[type.small, { marginTop: 2 }]}>
            {rupiah(item.price)} · sisa {item.portions}/{item.portionsTotal} porsi
          </T>
          <T tone="muted" style={type.tiny}>Ambil {item.pickupStart}–{item.pickupEnd}</T>
        </View>
        <Badge
          label={item.portions === 0 ? 'Habis' : item.portions <= 2 ? 'Hampir habis' : 'Aktif'}
          tone={item.portions === 0 ? 'neutral' : item.portions <= 2 ? 'warning' : 'green'}
        />
      </View>

      {/* ---- pengatur porsi langsung ---- */}
      <View style={styles.stokAksi}>
        <T tone="muted" style={type.tiny}>ATUR PORSI</T>
        <View style={styles.stokStepper}>
          <Button
            label="−"
            variant="secondary"
            disabled={!bisaKurang}
            onPress={() => editItem(item.id, { portions: item.portions - 1 })}
            style={styles.stokBtn}
          />
          <Text style={styles.stokJumlah}>{item.portions}</Text>
          <Button
            label="+"
            variant="secondary"
            onPress={() => editItem(item.id, { portions: item.portions + 1 })}
            style={styles.stokBtn}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Button
            label={buka ? 'Tutup' : 'Sunting'}
            variant="ghost"
            onPress={() => setBuka((v) => !v)}
            style={{ height: 34, paddingHorizontal: 10 }}
          />
          <Button
            label="Hapus"
            variant="danger"
            onPress={() => removeItem(item.id)}
            style={{ height: 34, paddingHorizontal: 10 }}
          />
        </View>
      </View>

      {terjual > 0 ? (
        <T tone="muted" style={[type.tiny, { marginTop: 6 }]}>
          {terjual} porsi sudah dipesan — jumlah tidak bisa kurang dari ini.
        </T>
      ) : null}

      {/* ---- form sunting ---- */}
      {buka ? (
        <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
          <Divider />
          <Field label="Nama makanan" value={judul} onChange={setJudul} />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Field label="Harga jual (Rp)" value={harga} onChange={setHarga} keyboardType="number-pad" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Harga normal (Rp)" value={asli} onChange={setAsli} keyboardType="number-pad" />
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Field label="Jam ambil mulai" value={mulai} onChange={setMulai} />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Jam ambil selesai" value={selesai} onChange={setSelesai} />
            </View>
          </View>
          <Field label="Catatan" value={catatan} onChange={setCatatan} multiline />
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
            <Button label="Batal" variant="secondary" onPress={() => setBuka(false)} style={{ flex: 1 }} />
            <Button label="Simpan" variant="primary" onPress={simpan} style={{ flex: 1 }} />
          </View>
        </View>
      ) : null}
    </Card>
  );
}

function StatCard({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <Card style={{ flex: 1 }}>
      <IconBadge name={icon} size={20} boxSize={42} />
      <T tone="muted" style={[type.tiny, { marginTop: spacing.sm }]}>{label.toUpperCase()}</T>
      <Text style={styles.statNum} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  statGrid: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  statNum: { fontSize: 19, fontWeight: '700', color: palette.text, marginTop: 3, letterSpacing: -0.4 },
  segment: {
    flexDirection: 'row', backgroundColor: palette.grouped, borderRadius: 10,
    padding: 2, marginTop: spacing.lg,
  },
  segmentOpt: { flex: 1, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  segmentOptOn: { backgroundColor: palette.surface },
  verifyRow: {
    flexDirection: 'row', gap: spacing.md, alignItems: 'center',
    paddingVertical: 11, paddingHorizontal: spacing.lg,
  },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'center', justifyContent: 'space-between' },
  thumb: {
    width: 48, height: 48, borderRadius: radius.sm, backgroundColor: palette.surfaceAlt,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palette.border,
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
  photoPreview: { marginTop: spacing.md, alignItems: 'center' },
  photoImg: { width: '100%', height: 170, borderRadius: radius.sm, borderWidth: 1, borderColor: palette.border },
  /** Tinggi eksplisit: ScrollView horizontal tanpa ini collapse di native. */
  iconRow: { height: 52, marginTop: spacing.sm },
  iconChoice: {
    width: 46, height: 44, borderRadius: radius.sm, backgroundColor: palette.surface,
    borderWidth: 1, borderColor: palette.border, alignItems: 'center', justifyContent: 'center',
  },
  iconChoiceOn: { backgroundColor: palette.accent, borderColor: palette.accent },
  code: { fontSize: 20, fontWeight: '700', letterSpacing: 2.5, color: palette.accent, marginTop: 2 },
  codeSm: { fontSize: 17, fontWeight: '700', letterSpacing: 2, color: palette.accent, marginTop: 2 },
  input: {
    height: 42, borderRadius: radius.sm, backgroundColor: palette.surface,
    borderWidth: 1, borderColor: palette.border, paddingHorizontal: spacing.md,
    fontSize: 14, color: palette.text, marginTop: 4,
  },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  sheetWrap: { flex: 1, backgroundColor: palette.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: palette.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg, paddingTop: spacing.sm, maxHeight: '92%',
  },
  grabber: {
    width: 36, height: 5, borderRadius: 3, backgroundColor: palette.separator,
    alignSelf: 'center', marginBottom: spacing.sm,
  },
  sheetTitle: { fontSize: 20, fontWeight: '600', color: palette.text, textAlign: 'center', letterSpacing: -0.3 },
  stokAksi: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    gap: spacing.sm, marginTop: spacing.md, paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.border,
  },
  stokStepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stokBtn: { width: 40, height: 34, paddingHorizontal: 0 },
  stokJumlah: { fontSize: 17, fontWeight: '700', color: palette.text, minWidth: 34, textAlign: 'center' },
});
