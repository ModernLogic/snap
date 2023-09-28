/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs/promises')
const util = require('util')
const exec = util.promisify(require('child_process').exec)

const main = async () => {
  const command = process.argv[2] ?? 'build'

  if (!new Set(['build', 'hotfix', 'minor', 'major']).has(command)) {
    console.error('INVALID: pass one of [build hotfix minor major]')
    console.info('received: ', command)
    process.exit(-1)
  }

  console.log('Checking for uncommitted files')
  // Need to refresh first to fix an issue if there are files that have been touched, but whose contents
  // are the same as in the index, otherwise git diff-index incorrectly reports the tree is dirty
  try {
    await exec('git update-index --refresh > /dev/null || true')
    await exec('git diff-index --quiet HEAD --')
  } catch (e) {
    console.error('ERROR: There are unsaved changes')
    console.log('Commit changed files or revert them')
    process.exit(-1)
  }

  const [currentVersion, buildStr] = require('../package.json').version.split(/[+]/)

  const build = parseInt(buildStr)

  const [major, minor, patch] = currentVersion.split(/[.]/g).map((n) => { return parseInt(n) })
  const [newVersion, newBuild] = (() => {
    switch (command) {
      case 'build':
        return [currentVersion, build + 1]
      case 'minor':
        return [`${major}.${minor + 1}`, 1]
      case 'major':
        return [`${major + 1}.0`, 1]
      case 'hotfix':
        return [`${major}.${minor}.${(patch ?? 0) + 1}`, 1]
      default:
        return build
    }
  })()

  // jq '.version |= "1.2.3+4"' < package.json
  await exec(`jq '.version |= "${newVersion}+${newBuild}"' < package.json > package.json.tmp`)
  await fs.unlink('package.json')
  await fs.rename('package.json.tmp', 'package.json')

  await exec(`git commit -a -m "Build ${newVersion} (${newBuild})"`)
}

main()
