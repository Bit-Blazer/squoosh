/// <reference path="../../emscripten-types.d.ts" />

declare module 'asset-url:*' {
  const value: string;
  export default value;
}

// Somehow TS picks up definitions from the module itself
// instead of using `asset-url:*`. It is probably related to
// specifity of the module declaration and these declarations below fix it
declare module 'asset-url:../../codecs/png/pkg/squoosh_png_bg.wasm' {
  const value: string;
  export default value;
}

declare module 'asset-url:../../codecs/oxipng/pkg/squoosh_oxipng_bg.wasm' {
  const value: string;
  export default value;
}

declare module 'asset-url:../../codecs/resize/pkg/squoosh_resize_bg.wasm' {
  const value: string;
  export default value;
}

declare module 'chunk-url:../../codecs/avif/enc/avif_node_enc_mt.worker.js' {
  const value: string;
  export default value;
}
