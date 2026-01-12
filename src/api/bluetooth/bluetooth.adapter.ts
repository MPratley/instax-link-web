import type {
  BluetoothDeviceHandle,
  BluetoothNotificationEvent,
  DisconnectCallback
} from './bluetooth.types'

export abstract class BluetoothAdapter {
  protected isBusy = false
  protected onDisconnect: DisconnectCallback | null = null

  setDisconnectCallback(callback: DisconnectCallback): void {
    this.onDisconnect = callback
  }

  abstract connect(): Promise<BluetoothDeviceHandle | false>
  abstract disconnect(): Promise<void>
  abstract send(
    command: Uint8Array,
    awaitResponse: boolean
  ): Promise<BluetoothNotificationEvent | void>
  abstract startNotifications(
    callback: (event: BluetoothNotificationEvent) => void
  ): Promise<void>
  abstract stopNotifications(): Promise<void>
}
