import { Capacitor } from '@capacitor/core'
import { BluetoothAdapter } from './bluetooth.adapter'
import { WebBluetoothAdapter } from './web-bluetooth.adapter'
import { CapacitorBleAdapter } from './capacitor-ble.adapter'

export { BluetoothAdapter } from './bluetooth.adapter'
export { WebBluetoothAdapter } from './web-bluetooth.adapter'
export { CapacitorBleAdapter } from './capacitor-ble.adapter'
export * from './bluetooth.types'

export function createBluetoothAdapter(): BluetoothAdapter {
  if (Capacitor.isNativePlatform()) {
    return new CapacitorBleAdapter()
  }
  return new WebBluetoothAdapter()
}

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform()
}

export function getPlatform(): string {
  return Capacitor.getPlatform()
}
