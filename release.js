const fs = require('fs');
const child_process = require('child_process');

const type = process.argv[2];
if (!['patch', 'minor', 'major'].includes(type)) {
  console.error('Usage: npm run release -- <patch|minor|major>');
  process.exit(1);
}

console.log(`\n📦 Bumping ${type} version...\n`);

try {
  // 1. Bump libsquoosh version
  child_process.execSync(`npm --no-git-tag-version version ${type}`, {
    cwd: 'libsquoosh',
    stdio: 'inherit',
  });
  const libsquooshPkg = JSON.parse(fs.readFileSync('libsquoosh/package.json'));
  const newVersion = libsquooshPkg.version;

  // 2. Bump cli version
  child_process.execSync(`npm --no-git-tag-version version ${type}`, {
    cwd: 'cli',
    stdio: 'inherit',
  });

  // 3. Update the cli dependency to match the newly bumped libsquoosh version
  const cliPkg = JSON.parse(fs.readFileSync('cli/package.json'));
  cliPkg.dependencies['@bit-blazer/libsquoosh'] = `^${newVersion}`;
  fs.writeFileSync('cli/package.json', JSON.stringify(cliPkg, null, 2) + '\n');

  // 4. Update root version just for consistency
  child_process.execSync(`npm --no-git-tag-version version ${type}`, {
    stdio: 'inherit',
  });

  // 5. Commit and Tag
  console.log('\n✅ Committing and Tagging...\n');
  child_process.execSync(
    'git add libsquoosh/package*.json cli/package*.json package*.json',
    { stdio: 'inherit' },
  );

  child_process.execSync(`git commit -m "Bump version to v${newVersion}"`, {
    stdio: 'inherit',
  });
  child_process.execSync(`git tag v${newVersion}`, { stdio: 'inherit' });

  console.log(
    `\n🎉 Successfully bumped everything to v${newVersion} and tagged!`,
  );
  console.log(`\n🚀 NEXT STEP: Run 'git push origin dev --tags' to publish!`);
} catch (err) {
  console.error('\n❌ Release failed:', err.message);
  process.exit(1);
}
