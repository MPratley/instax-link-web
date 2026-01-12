import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'dev.linssenste.instax',
  appName: 'Instax Link',
  webDir: 'dist',
  plugins: {
    BluetoothLe: {
      displayStrings: {
        scanning: 'Scanning for Instax printers...',
        cancel: 'Cancel',
        availableDevices: 'Available Devices',
        noDeviceFound: 'No printer found'
      }
    }
  }
}

export default config
