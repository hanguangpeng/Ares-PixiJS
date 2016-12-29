tsc ../src/ares/pixijs/PIXICompiler.ts --outFile ../dist/ares_pixi.js --sourceMap --target es5
uglifyjs ../dist/ares_pixi.js -o ../dist/ares_pixi.min.js
