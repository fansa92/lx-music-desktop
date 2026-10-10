/**
 * 生成 GitHub Release 说明（更新日志）
 *
 * 从 git 提交历史生成 Markdown，输出到环境变量 RELEASE_NOTES_FILE 指定的文件
 * （默认仓库根目录 RELEASE_NOTES.md），electron-builder 会通过
 * build-pack.js 的 releaseInfo.releaseNotes 把它写进 Release 说明。
 *
 * 环境变量：
 *   CHANGELOG_FROM        更新日志起始点（tag 或 commit sha），留空则自动取最近一个 tag
 *   CHANGELOG_MAX_COMMITS 找不到起始点时最多取多少条提交，默认 30
 *   PUBLISH_OWNER         仓库 owner，用于拼接 compare 链接
 *   PUBLISH_REPO          仓库名
 *   RELEASE_NOTES_FILE    输出文件路径，相对路径基于仓库根目录
 */

const { execSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const rootDir = path.join(__dirname, '..')
const { version } = require(path.join(rootDir, 'package.json'))

/**
 * 执行命令，失败时返回空字符串
 * @param {string} cmd
 * @returns {string}
 */
const run = (cmd) => {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1024 * 1024 * 16 }).trim()
  } catch {
    return ''
  }
}

const owner = process.env.PUBLISH_OWNER || 'fansa92'
const repo = process.env.PUBLISH_REPO || 'lx-music-desktop'
const tag = `v${version}`
const maxCommits = Number(process.env.CHANGELOG_MAX_COMMITS || 30) || 30

// 起始点只允许 tag / commit sha 的安全字符，避免被拼进 shell
const safeFrom = ((process.env.CHANGELOG_FROM || '').trim().match(/[\w.\-/+^~]+/) || [''])[0]
let from = safeFrom || run('git describe --tags --abbrev=0')

// 最近一个 tag 就是本次要发布的版本（版本号没变）时，往回取上一个 tag，
// 否则 compare 链接会变成 vX.Y.Z...vX.Y.Z 的空比较
if (from === tag && !safeFrom) {
  // 用 ~1 而不是 ^：Windows 下 ^ 是 cmd 的转义字符，会被吞掉
  from = run(`git describe --tags --abbrev=0 ${tag}~1`) || ''
}

const listCommits = (range) => run(`git log --no-merges --pretty=format:"- %s (%h)" ${range}`)

const lines = ['## 更新日志', '']

if (from) {
  let log = listCommits(`${from}..HEAD`)
  if (!log) {
    // 起始点可能不在当前克隆范围内，退回取最近若干条提交
    from = ''
  } else {
    lines.push(`完整变更：[${from}...${tag}](https://github.com/${owner}/${repo}/compare/${from}...${tag})`, '')
    lines.push(log, '')
  }
}

if (!from) {
  lines.push('（未找到可用的历史 tag，以下为最近的提交记录）', '')
  lines.push(listCommits(`-${maxCommits}`) || '- （无提交记录）', '')
}

const notes = lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n'

const outFile = path.resolve(rootDir, process.env.RELEASE_NOTES_FILE || 'RELEASE_NOTES.md')
fs.writeFileSync(outFile, notes)

console.log(`Release notes written to ${path.relative(rootDir, outFile)}:\n`)
console.log(notes)
