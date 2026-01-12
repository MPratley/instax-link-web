import { BleClient } from '@capacitor-community/bluetooth-le'
import { BluetoothAdapter } from './bluetooth.adapter'
import type { BluetoothDeviceHandle, BluetoothNotificationEvent } from './bluetooth.types'
import { INSTAX_PRINTER_NAME_PREFIX, INSTAX_PRINTER_SERVICES } from '../instax.config'

export class CapacitorBleAdapter extends BluetoothAdapter {
  private deviceId: string | null = null
  private serviceUuid: string = INSTAX_PRINTER_SERVICES[0]
  private writeCharUuid: string | null = null
  private notifyCharUuid: string | null = null
  private initialized = false

  async connect(): Promise<BluetoothDeviceHandle | false> {
    try {
      if (!this.initialized) {
        console.log('> Initializing BLE client...')
        await BleClient.initialize()
        this.initialized = true
        console.log('> BLE client initialized')
      }

      console.log('> Requesting device...')
      const device = await BleClient.requestDevice({
        namePrefix: INSTAX_PRINTER_NAME_PREFIX,
        optionalServices: INSTAX_PRINTER_SERVICES
      })
      console.log('> Device selected:', device)

      this.deviceId = device.deviceId

      await BleClient.connect(this.deviceId, () => {
        this.deviceId = null
        this.writeCharUuid = null
        this.notifyCharUuid = null
        this.onDisconnect?.()
      })

      const services = await BleClient.getServices(this.deviceId)
      const primaryService = services.find((s) => s.uuid === this.serviceUuid)

      if (!primaryService) {
        throw new Error('Primary service not found')
      }

      for (const char of primaryService.characteristics) {
        if (
          (char.properties.write || char.properties.writeWithoutResponse) &&
          !this.writeCharUuid
        ) {
          this.writeCharUuid = char.uuid
        }
        if (char.properties.notify && !this.notifyCharUuid) {
          this.notifyCharUuid = char.uuid
        }
      }

      if (!this.writeCharUuid || !this.notifyCharUuid) {
        throw new Error('Required characteristics not found')
      }

      console.log('> PRINTER CONNECTED (Capacitor)')

      return {
        id: this.deviceId,
        name: device.name ?? null,
        platform: 'capacitor'
      }
    } catch (error) {
      console.error('> BLE connect error:', error)
      this.deviceId = null
      this.writeCharUuid = null
      this.notifyCharUuid = null
      return false
    }
  }

  async disconnect(): Promise<void> {
    if (!this.deviceId) return

    try {
      await this.stopNotifications()
      await BleClient.disconnect(this.deviceId)
    } catch (error) {
      console.error('> error on manual disconnect: ', error)
    } finally {
      this.deviceId = null
      this.writeCharUuid = null
      this.notifyCharUuid = null
    }
  }

  async send(
    command: Uint8Array,
    awaitResponse = true
  ): Promise<BluetoothNotificationEvent | void> {
    if (this.isBusy || !this.deviceId) return
    this.isBusy = true

    let notificationPromise: Promise<BluetoothNotificationEvent> | null = null
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    if (awaitResponse) {
      notificationPromise = new Promise<BluetoothNotificationEvent>((resolve, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('Notification timeout'))
        }, 500)

        BleClient.startNotifications(
          this.deviceId!,
          this.serviceUuid,
          this.notifyCharUuid!,
          (value: DataView) => {
            if (timeoutId) clearTimeout(timeoutId)
            resolve({ value })
          }
        )
      })
    }

    const dataView = new DataView(command.buffer, command.byteOffset, command.byteLength)

    await BleClient.writeWithoutResponse(
      this.deviceId,
      this.serviceUuid,
      this.writeCharUuid!,
      dataView
    )

    this.isBusy = false

    if (!awaitResponse) return

    try {
      const event = await notificationPromise!
      return event
    } finally {
      if (timeoutId) clearTimeout(timeoutId)
      await this.stopNotifications()
    }
  }

  async startNotifications(
    callback: (event: BluetoothNotificationEvent) => void
  ): Promise<void> {
    if (!this.deviceId || !this.notifyCharUuid) return

    await BleClient.startNotifications(
      this.deviceId,
      this.serviceUuid,
      this.notifyCharUuid,
      (value: DataView) => {
        callback({ value })
      }
    )
  }

  async stopNotifications(): Promise<void> {
    if (!this.deviceId || !this.notifyCharUuid) return

    try {
      await BleClient.stopNotifications(this.deviceId, this.serviceUuid, this.notifyCharUuid)
    } catch {
      // Ignore errors when stopping notifications
    }
  }
}
