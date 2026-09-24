/**
 * Shim web untuk react-native-maps.
 *
 * react-native-maps hanya punya implementasi native (Android/iOS). Di web
 * (target screenshot & preview browser), impor modul aslinya meledak saat
 * bundle dimuat. File ini menyediakan komponen pengganti ber-API sama supaya
 * kode layar tetap seragam — Metro otomatis memilih berkas *.web.tsx di web.
 */
import React from 'react';
import { Text, View } from 'react-native';
import { Icon } from './ui';

export const PROVIDER_DEFAULT = 'default';
export const PROVIDER_GOOGLE = 'google';

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

/** Peta statis sederhana: kotak berbingkai + label koordinat. */
export function MapView({
  style,
  initialRegion,
  children,
}: {
  style?: any;
  initialRegion?: Region;
  children?: React.ReactNode;
  provider?: string;
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  toolbarEnabled?: boolean;
}) {
  const r = initialRegion;
  return (
    <View style={[{ backgroundColor: '#e8edf1', overflow: 'hidden' }, style]}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="map-marker-outline" size={30} color="#6b7785" />
        {r ? (
          <Text style={{ fontSize: 11, color: '#6b7785', marginTop: 4 }}>
            {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}
          </Text>
        ) : null}
        {children}
      </View>
    </View>
  );
}

export function Marker({
  title,
  description,
}: {
  coordinate: { latitude: number; longitude: number };
  title?: string;
  description?: string;
}) {
  return (
    <View style={{ alignItems: 'center', marginTop: 6 }}>
      <Icon name="map-marker" size={20} color="#1B7A3E" />
      {title ? <Text style={{ fontSize: 12, fontWeight: '600', color: '#222' }}>{title}</Text> : null}
      {description ? (
        <Text style={{ fontSize: 10, color: '#6b7785', textAlign: 'center' }}>{description}</Text>
      ) : null}
    </View>
  );
}

export default MapView;
