export interface BluetoothDeviceHandle {
  id: string
  name: string | null
  platform: 'web' | 'capacitor'
  rawDevice?: BluetoothDevice
}

export interface BluetoothNotificationEvent {
  value: DataView
}

export type DisconnectCallback = () => void
