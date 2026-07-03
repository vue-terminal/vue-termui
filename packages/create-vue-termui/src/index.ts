#!/usr/bin/env node
import { cp, mkdir, readdir, readFile, rename, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createInterface } from 'node:readline/promises'

const TEMPLATE_DIR = fileURLToPath(new URL('../template', import.meta.url))

async function prompt(question: string, fallback: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  try {
    const answer = (await rl.question(`${question} (${fallback}) `)).trim()
    return answer || fallback
  } finally {
    rl.close()
  }
}

async function isEmptyDir(dir: string): Promise<boolean> {
  const files = await readdir(dir)
  return files.length === 0 || (files.length === 1 && files[0] === '.git')
}

async function main() {
  let target = process.argv[2]
  if (!target) {
    target = await prompt('Project name?', 'vue-termui-app')
  }

  const root = resolve(process.cwd(), target)
  const projectName = basename(root)

  if (existsSync(root) && !(await isEmptyDir(root))) {
    console.error(`\nTarget directory "${target}" is not empty. Aborting.`)
    process.exit(1)
  }

  await mkdir(root, { recursive: true })
  await cp(TEMPLATE_DIR, root, { recursive: true })

  // npm strips a literal ".gitignore" from published packages, so the template
  // ships it as "_gitignore" — restore the real name on scaffold.
  const gitignore = join(root, '_gitignore')
  if (existsSync(gitignore)) {
    await rename(gitignore, join(root, '.gitignore'))
  }

  // Stamp the chosen project name into the generated package.json.
  const pkgPath = join(root, 'package.json')
  const pkg = JSON.parse(await readFile(pkgPath, 'utf-8'))
  pkg.name = projectName
  await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)

  console.log(`\nScaffolded ${projectName} in ${root}\n`)
  console.log('Next steps:\n')
  console.log(`  cd ${target}`)
  console.log('  pnpm install')
  console.log('  pnpm dev\n')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
