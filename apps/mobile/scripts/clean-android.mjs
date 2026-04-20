import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mobileRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(mobileRoot, '..', '..');
const shortNativeBuildRoots = ['L:\\', 'C:\\laundry'];
const shortNativeBuildTargets = shortNativeBuildRoots.map((root) =>
  path.join(root, '.cxx', 'laundry-app'),
);

const targets = [
  path.join(mobileRoot, 'android', '.gradle'),
  path.join(mobileRoot, 'android', '.cxx'),
  path.join(mobileRoot, 'android', 'build'),
  path.join(mobileRoot, 'android', 'app', '.cxx'),
  path.join(mobileRoot, 'android', 'app', 'build'),
  path.join(repoRoot, 'node_modules', 'react-native-gesture-handler', 'android', '.cxx'),
  path.join(repoRoot, 'node_modules', 'react-native-gesture-handler', 'android', 'build'),
  path.join(repoRoot, 'node_modules', 'react-native-safe-area-context', 'android', '.cxx'),
  path.join(repoRoot, 'node_modules', 'react-native-safe-area-context', 'android', 'build'),
  path.join(repoRoot, 'node_modules', 'react-native-screens', 'android', '.cxx'),
  path.join(repoRoot, 'node_modules', 'react-native-screens', 'android', 'build'),
  path.join(repoRoot, 'node_modules', 'react-native-svg', 'android', '.cxx'),
  path.join(repoRoot, 'node_modules', 'react-native-svg', 'android', 'build'),
  path.join(repoRoot, 'node_modules', 'react-native-worklets', 'android', '.cxx'),
  path.join(repoRoot, 'node_modules', 'react-native-worklets', 'android', 'build'),
  path.join(repoRoot, 'node_modules', 'react-native-reanimated', 'android', '.cxx'),
  path.join(repoRoot, 'node_modules', 'react-native-reanimated', 'android', 'build'),
  path.join(mobileRoot, 'node_modules', '@react-native-community', 'slider', 'android', '.cxx'),
  path.join(mobileRoot, 'node_modules', '@react-native-community', 'slider', 'android', 'build'),
  ...shortNativeBuildTargets,
];

const removed = [];
const skipped = [];
const failed = [];

for (const target of targets) {
  if (!fs.existsSync(target)) {
    skipped.push(target);
    continue;
  }

  try {
    fs.rmSync(target, { recursive: true, force: true, maxRetries: 2, retryDelay: 150 });
    removed.push(target);
  } catch (error) {
    failed.push(`${target} :: ${error.message}`);
  }
}

if (removed.length) {
  console.log('Removed:');
  for (const entry of removed) console.log(`- ${entry}`);
}

if (skipped.length) {
  console.log('Skipped (not found):');
  for (const entry of skipped) console.log(`- ${entry}`);
}

if (failed.length) {
  console.error('Failed:');
  for (const entry of failed) console.error(`- ${entry}`);
  process.exitCode = 1;
}
