# [Squoosh]!

[Squoosh] is an image compression web app that reduces image sizes through numerous formats.

# API & CLI

Squoosh has [an API](https://github.com/Bit-Blazer/squoosh/tree/dev/libsquoosh) and [a CLI](https://github.com/Bit-Blazer/squoosh/tree/dev/cli) to compress many images at once.

# Privacy

Squoosh does not send your image to a server. All image compression processes locally.

However, Squoosh utilizes Google Analytics to collect the following:

- [Basic visitor data](https://support.google.com/analytics/answer/6004245?ref_topic=2919631).
- The before and after image size value.
- If Squoosh PWA, the type of Squoosh installation.
- If Squoosh PWA, the installation time and date.

# Developing

To develop for Squoosh:

1. Clone the repository
1. To install node packages, run:
   ```sh
   npm install
   ```
1. Then build the app by running:
   ```sh
   npm run build
   ```
1. After building, start the development server by running:
   ```sh
   npm run dev
   ```

# Releasing (Maintainers)

To release new versions of the Squoosh packages to npm, run the automated release script:

```sh
npm run release -- patch  # for bug fixes (0.0.x)
npm run release -- minor  # for new features (0.x.0)
npm run release -- major  # for breaking changes (x.0.0)
```

This will automatically bump package versions, synchronize lockfiles, and tag the release. Afterward, run `git push origin dev --tags` to trigger the GitHub Actions workflow, which securely publishes the packages using npm Trusted Publishing.

# Contributing

Squoosh is an open-source project that appreciates all community involvement. To contribute to the project, follow the [contribute guide](/CONTRIBUTING.md).

[squoosh]: https://bit-blazer.github.io/squoosh
