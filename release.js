const fs = require('fs');
const child_process = require('child_process');

const type = process.argv[2];
if (!['patch', 'minor', 'major'].includes(type)) {
  console.error('Usage: npm run release -- <patch|minor|major>');
  process.exit(1);
}

console.log(`\n📦 Bumping ${type} version...\n`);

try {
  // 1. Bump squoosh-node version
  child_process.execSync(`npm --no-git-tag-version version ${type}`, {
    cwd: 'squoosh-node',
    stdio: 'inherit',
  });
  const squooshNodePkg = JSON.parse(
    fs.readFileSync('squoosh-node/package.json'),
  );
  const newVersion = squooshNodePkg.version;

  // 2. Bump squoosh-cli version
  child_process.execSync(`npm --no-git-tag-version version ${type}`, {
    cwd: 'squoosh-cli',
    stdio: 'inherit',
  });

  // 3. Update the squoosh-cli dependency to match the newly bumped squoosh-node version
  const squooshCliPkg = JSON.parse(fs.readFileSync('squoosh-cli/package.json'));
  squooshCliPkg.dependencies['@bit-blazer/squoosh-node'] = `^${newVersion}`;
  fs.writeFileSync(
    'squoosh-cli/package.json',
    JSON.stringify(squooshCliPkg, null, 2) + '\n',
  );

  // 3.5 Sync the lockfile
  child_process.execSync('npm install --package-lock-only', {
    cwd: 'squoosh-cli',
    stdio: 'inherit',
  });

  // 4. Bump squoosh browser version
  child_process.execSync(`npm --no-git-tag-version version ${type}`, {
    cwd: 'squoosh',
    stdio: 'inherit',
  });

  // 5. Update root version just for consistency
  child_process.execSync(`npm --no-git-tag-version version ${type}`, {
    stdio: 'inherit',
  });

  // 5. Commit and Tag
  console.log('\n📦 Committing and Tagging...\n');
  child_process.execSync(
    'git add squoosh-node/package*.json squoosh-cli/package*.json squoosh/package*.json package*.json',
    { stdio: 'inherit' },
  );

  child_process.execSync(`git commit -m "Bump version to v${newVersion}"`, {
    stdio: 'inherit',
  });
  child_process.execSync(`git tag v${newVersion}`, { stdio: 'inherit' });

  console.log(
    `\n🎉 Successfully bumped everything to v${newVersion} and tagged!`,
  );
  console.log(`\n🚀 NEXT STEP: Run 'git push --tags' to publish!`);
} catch (err) {
  console.error('\n❌ Release failed:', err.message);
  process.exit(1);
}
