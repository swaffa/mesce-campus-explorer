# Third-party notices

## Three.js r170

`public/vendor/three.module.js`, `GLTFLoader.js`, `SkeletonUtils.js` and `BufferGeometryUtils.js` are vendored from [Three.js](https://github.com/mrdoob/three.js/tree/r170), copyright 2010–2024 Three.js authors, under the MIT license. Loader/utility imports are adapted to local paths. The source header is retained and the full [MIT license](docs/licenses/threejs-MIT.txt) is included.

## Gentilis Bold

`public/fonts/gentilis_bold.typeface.json` contains Gentilis Bold font data. Its embedded metadata credits SIL International, J. Victor Gaultney, and Annie Olsen and includes the SIL Open Font License 1.1. That metadata is retained; the [font license](docs/licenses/gentilis-OFL.txt) is also included as readable text.

## Development tools

esbuild and Prettier are pinned development dependencies. Their packages retain their own MIT license files in `node_modules/`. Their versions and dependency integrity hashes are recorded in `package-lock.json`; they are not browser runtime dependencies.

## Project assets

Campus meshes, characters, procedural textures, synthesized sound design, and short library texts are original project assets. Reference images guide the stylized campus interpretation. No After School assets, recordings, or source code are included. See the [asset manifest](docs/ASSET-MANIFEST.md) for sound provenance and remaining production asset needs.

These notices describe third-party components and do not assign a new license to the original project source.
