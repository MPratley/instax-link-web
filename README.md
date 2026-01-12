# Instax Link Web & iOS

This repo is a fork of the original [Instax Link Web](https://github.com/linssenste/instax-link-web) repository. I've added iOS support using Capacitor and a few v minor code changes. All credit for ble reverse engineering goes to the original authors of [Instax Link Web](https://github.com/linssenste/instax-link-web) and [InstaxBLE](https://github.com/javl/InstaxBLE).

## Installation

To set up the project locally, follow these steps:

1. Clone the repository
2. Install the dependencies (`npm i`)

## Usage

To run the project locally:

`npm run dev`

The application will be available at [http://localhost:5173](http://localhost:5173).

## Testing

To run unit tests using vitest:

`npm run test:unit`

## Building for iOS

To build the iOS app, run:

`npm run build:ios`

Standard capacitor caveats and limitations apply. The first time you load the app it'll take a good 10s for anything to appear, etc.

## Running the iOS app

To run the iOS app, open the `ios/App/App.xcworkspace` file in Xcode, target your device and run the app. I'm pretty sure bluetooth will not work on the simulator, but also haven't tried.

```bash
npm run open:ios
```

## Contributing

Contributions are welcome! If you'd like to help improve Instax Link Web or add support for additional printer models, please submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).
