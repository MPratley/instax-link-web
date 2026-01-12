import { BluetoothAdapter } from './bluetooth.adapter'
import type { BluetoothDeviceHandle, BluetoothNotificationEvent } from './bluetooth.types'
import { INSTAX_PRINTER_NAME_PREFIX, INSTAX_PRINTER_SERVICES } from '../instax.config'

interface CharacteristicRef {
  server: BluetoothRemoteGATTServer | null
  notify: BluetoothRemoteGATTCharacteristic | null
  write: BluetoothRemoteGATTCharacteristic | null
}

export class WebBluetoothAdapter extends BluetoothAdapter {
  private characteristicRef: CharacteristicRef = {
    server: null,
    notify: null,
    write: null
  }
  private device: BluetoothDevice | null = null

  async connect(): Promise<BluetoothDeviceHandle | false> {
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: INSTAX_PRINTER_NAME_PREFIX }],
        optionalServices: INSTAX_PRINTER_SERVICES
      })

      this.device = device

      device.addEventListener('gattserverdisconnected', () => {
        this.characteristicRef.write = null
        this.characteristicRef.notify = null
        this.onDisconnect?.()
      })

      const server = await device.gatt!.connect()
      this.characteristicRef.server = server

      const service = await server.getPrimaryService(INSTAX_PRINTER_SERVICES[0])
      const characteristics = await service.getCharacteristics()

      if (!characteristics) {
        throw new Error('invalid-characteristic')
      }

      const writeCharacteristic = characteristics.reduce(
        (a: BluetoothRemoteGATTCharacteristic, b: BluetoothRemoteGATTCharacteristic) =>
          a.properties.write && a.properties.writeWithoutResponse ? a : b
      )
      const notifyCharacteristic = characteristics.reduce(
        (a: BluetoothRemoteGATTCharacteristic, b: BluetoothRemoteGATTCharacteristic) =>
          a.properties.notify ? a : b
      )

      if (
        !notifyCharacteristic?.properties.notify ||
        !writeCharacteristic?.properties.write
      ) {
        throw new Error('missing-characteristics')
      }

      this.characteristicRef.notify = notifyCharacteristic
      this.characteristicRef.write = writeCharacteristic

      console.log('> PRINTER CONNECTED')

      return {
        id: device.id,
        name: device.name ?? null,
        platform: 'web',
        rawDevice: device
      }
    } catch (error) {
      this.characteristicRef.notify = null
      this.characteristicRef.write = null
      return false
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.characteristicRef.notify) {
        await this.characteristicRef.notify.stopNotifications()
      }
      this.characteristicRef.server?.disconnect()
    } catch (error) {
      console.error('> error on manual disconnect: ', error)
    }
  }

  async send(
    command: Uint8Array,
    awaitResponse = true
  ): Promise<BluetoothNotificationEvent | void> {
    if (this.isBusy) return
    this.isBusy = true

    let timeout: ReturnType<typeof setTimeout> | null = null
    let notificationHandle: BluetoothRemoteGATTCharacteristic | null = null
    let notificationPromise: Promise<BluetoothNotificationEvent> | null = null
    let timeoutPromise: Promise<BluetoothNotificationEvent> | null = null

    if (awaitResponse) {
      notificationHandle = await this.characteristicRef.notify!.startNotifications()

      notificationPromise = new Promise<BluetoothNotificationEvent>((resolve) => {
        notificationHandle!.addEventListener(
          'characteristicvaluechanged',
          (e: Event) => {
            if (timeout) clearTimeout(timeout)
            const target = e.target as BluetoothRemoteGATTCharacteristic
            resolve({ value: target.value! })
          },
          { once: true }
        )
      })

      timeoutPromise = new Promise<BluetoothNotificationEvent>((_, reject) => {
        timeout = setTimeout(() => {
          notificationHandle!.removeEventListener('characteristicvaluechanged', () => {})
          reject(new Error('Notification timeout'))
        }, 500)
      })
    }

    await this.characteristicRef.write!.writeValueWithoutResponse(command)
    this.isBusy = false

    if (!awaitResponse) return

    try {
      const event = await Promise.race([notificationPromise!, timeoutPromise!])
      return event
    } finally {
      if (timeout) clearTimeout(timeout)
      await notificationHandle?.stopNotifications()
    }
  }

  async startNotifications(
    callback: (event: BluetoothNotificationEvent) => void
  ): Promise<void> {
    if (!this.characteristicRef.notify) return

    const handle = await this.characteristicRef.notify.startNotifications()

    handle.addEventListener('characteristicvaluechanged', (e: Event) => {
      const target = e.target as BluetoothRemoteGATTCharacteristic
      callback({ value: target.value! })
    })
  }

  async stopNotifications(): Promise<void> {
    if (this.characteristicRef.notify) {
      await this.characteristicRef.notify.stopNotifications()
    }
  }
}
