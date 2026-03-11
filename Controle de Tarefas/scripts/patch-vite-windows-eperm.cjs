const fs = require('fs')
const path = require('path')

const viteConfigChunkPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'vite',
  'dist',
  'node',
  'chunks',
  'config.js',
)

const invalidateBlockPattern =
  /function invalidatePackageData\(packageCache, pkgPath\) \{[\s\S]*?\n\}\nfunction resolvePackageData/

const optimizeBlockPattern =
  /function optimizeSafeRealPathSync\(\) \{[\s\S]*?\n\}\nfunction ensureWatchedFile/

const invalidateBlockReplacement = `function invalidatePackageData(packageCache, pkgPath) {
\tconst pkgDir = normalizePath(path.dirname(pkgPath));
\tpackageCache.forEach((pkg, cacheKey) => {
\t\tif (pkg.dir === pkgDir) packageCache.delete(cacheKey);
\t});
}
function resolvePackageData`

const optimizeBlockReplacement = `function optimizeSafeRealPathSync() {
\ttry {
\t\tfs.realpathSync.native(path.resolve("./"));
\t} catch (error$1) {
\t\tif (error$1.message.includes("EISDIR: illegal operation on a directory")) {
\t\t\tsafeRealpathSync = fs.realpathSync;
\t\t\treturn;
\t\t}
\t}
\t/* vite-windows-spawn-eperm-guard */
\ttry {
\t\texec("net use", (error$1, stdout) => {
\t\t\tif (error$1) return;
\t\t\tconst lines = stdout.split("\\n");
\t\t\tfor (const line of lines) {
\t\t\t\tconst m = parseNetUseRE.exec(line);
\t\t\t\tif (m) windowsNetworkMap.set(m[2], m[1]);
\t\t\t}
\t\t\tif (windowsNetworkMap.size === 0) safeRealpathSync = fs.realpathSync.native;
\t\t\telse safeRealpathSync = windowsMappedRealpathSync;
\t\t});
\t} catch (_error) {
\t\tsafeRealpathSync = fs.realpathSync.native;
\t}
}
function ensureWatchedFile`

function patchViteWindowsExec() {
  if (!fs.existsSync(viteConfigChunkPath)) {
    console.log('[vite-patch] Arquivo do Vite não encontrado, ignorando patch.')
    return
  }

  const source = fs.readFileSync(viteConfigChunkPath, 'utf8')

  let output = source
  let changed = false

  if (invalidateBlockPattern.test(output)) {
    output = output.replace(invalidateBlockPattern, invalidateBlockReplacement)
    changed = true
  }

  if (optimizeBlockPattern.test(output)) {
    output = output.replace(optimizeBlockPattern, optimizeBlockReplacement)
    changed = true
  }

  if (!changed) {
    console.log('[vite-patch] Padrões não encontrados ou patch já aplicado.')
    return
  }

  fs.writeFileSync(viteConfigChunkPath, output, 'utf8')
  console.log('[vite-patch] Patch aplicado com sucesso.')
}

patchViteWindowsExec()
