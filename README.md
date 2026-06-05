# [Squoosh]!

[Squoosh] is an image compression web app that reduces image sizes through numerous formats.

# API & CLI

Squoosh has [an API](https://github.com/Bit-Blazer/squoosh/tree/dev/squoosh-node) and [a CLI](https://github.com/Bit-Blazer/squoosh/tree/dev/squoosh-cli) to compress many images at once.

# Privacy

Squoosh does not send your image to a server. All image compression processes locally.

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

Squoosh is an open-source project that appreciates all community involvement. To contribute to the project, feel free to open an issue or submit a pull request.

[squoosh]: https://bit-blazer.github.io/squoosh
