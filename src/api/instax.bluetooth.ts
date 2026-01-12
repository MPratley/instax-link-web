import {
  createBluetoothAdapter,
  type BluetoothAdapter,
  type BluetoothDeviceHandle,
  type BluetoothNotificationEvent
} from './bluetooth'

export class InstaxBluetooth {
  protected adapter: BluetoothAdapter
  protected isBusy = false

  constructor() {
    this.adapter = createBluetoothAdapter()
  }

  protected async disconnect(): Promise<void> {
    await this.adapter.disconnect()
  }

  protected async notifications(
    callback: (event: BluetoothNotificationEvent) => void
  ): Promise<void> {
    await this.adapter.startNotifications(callback)
  }

  protected async send(
    command: Uint8Array,
    response = true
  ): Promise<BluetoothNotificationEvent | void> {
    return await this.adapter.send(command, response)
  }

  protected async connect(): Promise<BluetoothDeviceHandle | false> {
    return await this.adapter.connect()
  }

  setDisconnectCallback(callback: () => void): void {
    this.adapter.setDisconnectCallback(callback)
  }
}
