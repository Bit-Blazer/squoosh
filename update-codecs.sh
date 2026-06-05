#!/bin/bash

# Create a log directory in the root
mkdir -p build_logs
LOG_DIR="$(pwd)/build_logs"

echo "1. Upgrading Emscripten to latest in Dockerfiles..."
sed -i 's/FROM emscripten\/emsdk:2.0.34/FROM emscripten\/emsdk:latest/g' codecs/cpp.Dockerfile
sed -i 's/FROM emscripten\/emsdk:2.0.8 AS wasm-tools/FROM emscripten\/emsdk:latest AS wasm-tools/g' codecs/rust.Dockerfile

echo "2. Patching sysroot paths for Rust codecs..."
sed -i 's|COPY --from=wasm-tools /emsdk/upstream/emscripten/system/include/libc/ /wasm32/include/||g' codecs/rust.Dockerfile
sed -i 's|COPY --from=wasm-tools /emsdk/upstream/emscripten/system/lib/libc/musl/arch/emscripten/bits/ /wasm32/include/bits/|COPY --from=wasm-tools /emsdk/upstream/emscripten/cache/sysroot/include/ /wasm32/include/|g' codecs/rust.Dockerfile

echo "3. Patching Makefiles for C++ codecs..."
sed -i 's/\.\/configure \\/emconfigure \.\/configure --host=wasm32-unknown-emscripten \\/g' codecs/mozjpeg/Makefile
sed -i 's/\.\/configure \\/emconfigure \.\/configure --host=wasm32-unknown-emscripten \\/g' codecs/imagequant/Makefile
sed -i 's/llvm-ar/emar/g' codecs/jxl/Makefile

echo "4. Building all codecs..."
cd codecs
for dir in */; do
    if [ -f "$dir/package.json" ]; then
        codec_name=$(basename "$dir")
        log_file="$LOG_DIR/${codec_name}_build.log"
        
        echo "====================================="
        echo "Building $codec_name (logging to $log_file)"
        echo "====================================="
        
        cd "$dir"
        
        sudo rm -rf node_modules
        
        npm install > "$log_file" 2>&1
        
        if npm run build >> "$log_file" 2>&1; then
            echo "✅ $codec_name built successfully!"
        else
            echo "❌ $codec_name build FAILED! Check $log_file"
        fi
        
        cd ..
    fi
done

echo "🎉 All builds finished! Check the build_logs/ directory for output."
