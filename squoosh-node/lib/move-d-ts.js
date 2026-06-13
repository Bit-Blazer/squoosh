import fs from 'fs';
import path from 'path';
import { deleteAsync as del } from 'del';

const tsOutputDir = path.resolve('.tmp', 'ts', 'squoosh-node');
const tsOutputSourceDir = path.join(tsOutputDir, 'src');
const buildDir = path.resolve('build');

(async () => {
  await del(path.join(buildDir, '*.d.ts'));
  const files = await fs.promises.readdir(tsOutputSourceDir);

  const movePromises = [];
  for (const file of files) {
    if (file.endsWith('d.ts') || file.endsWith('d.ts.map')) {
      movePromises.push(
        fs.promises.rename(
          path.join(tsOutputSourceDir, file),
          path.join(buildDir, file),
        ),
      );
    }
  }
  // We need to remove `tsconfig.tsbuildinfo` otherwise TS does not emit unchanged `.d.ts` files
  await del([path.join(tsOutputDir, 'tsconfig.tsbuildinfo')], { force: true });
})();
