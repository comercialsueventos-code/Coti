#!/usr/bin/env node

/**
 * Consolidation Start Script
 * Initializes a new consolidation with proper setup and safety measures
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const chalk = require('chalk')

// Configuration
const CONFIG = {
  backupPrefix: 'backup-pre-consolidation-',
  consolidationLogFile: 'CONSOLIDATION_LOG.md',
  baselineDir: 'consolidation-baselines',
  featureFlagsFile: 'src/shared/utils/featureFlags.ts'
}

function getCurrentTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
}

function createBackupTag(category, id) {
  const timestamp = getCurrentTimestamp()
  const tagName = `${CONFIG.backupPrefix}${category}-${id}-${timestamp}`
  
  console.log(chalk.blue('📦 Creating backup tag...'))
  execSync(`git tag ${tagName}`, { stdio: 'inherit' })
  
  return tagName
}

function establishBaseline(category, id) {
  const baselineDir = path.join(CONFIG.baselineDir, `${category}-${id}`)
  
  if (!fs.existsSync(CONFIG.baselineDir)) {
    fs.mkdirSync(CONFIG.baselineDir, { recursive: true })
  }
  
  if (!fs.existsSync(baselineDir)) {
    fs.mkdirSync(baselineDir, { recursive: true })
  }
  
  console.log(chalk.blue('📊 Establishing performance baseline...'))
  
  // Run tests and capture baseline metrics
  try {
    console.log('  Running test suite...')
    const testResults = execSync('npm run test -- --verbose', { encoding: 'utf-8' })
    fs.writeFileSync(path.join(baselineDir, 'test-results-baseline.txt'), testResults)
    
    console.log('  Analyzing bundle...')  
    const bundleAnalysis = execSync('npm run build:analyze', { encoding: 'utf-8' })
    fs.writeFileSync(path.join(baselineDir, 'bundle-analysis-baseline.json'), bundleAnalysis)
    
    console.log('  Checking test coverage...')
    const coverageResults = execSync('npm run test:coverage', { encoding: 'utf-8' })
    fs.writeFileSync(path.join(baselineDir, 'coverage-baseline.txt'), coverageResults)
    
    console.log('  Running performance benchmarks...')
    // This would run actual performance benchmarks
    const perfResults = JSON.stringify({
      timestamp: new Date().toISOString(),
      buildTime: measureBuildTime(),
      bundleSize: getBundleSize(),
      testRunTime: measureTestRunTime()
    }, null, 2)
    fs.writeFileSync(path.join(baselineDir, 'performance-baseline.json'), perfResults)
    
    console.log(chalk.green('✅ Baseline established'))
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to establish baseline:'), error.message)
    process.exit(1)
  }
}

function measureBuildTime() {
  console.log('    Measuring build time...')
  const start = Date.now()
  execSync('npm run build', { stdio: 'pipe' })
  return Date.now() - start
}

function getBundleSize() {
  const distDir = path.join(process.cwd(), 'dist')
  if (fs.existsSync(distDir)) {
    const stats = fs.statSync(distDir)
    return stats.size
  }
  return 0
}

function measureTestRunTime() {
  console.log('    Measuring test run time...')
  const start = Date.now()
  execSync('npm test', { stdio: 'pipe' })
  return Date.now() - start
}

function createConsolidationLog(category, id, description, affectedFiles) {
  const logContent = `# Consolidation Log: ${category}-${id}

## Overview
**Category**: ${category}
**ID**: ${id}
**Description**: ${description}
**Date Started**: ${new Date().toISOString()}
**Status**: IN_PROGRESS

## Affected Files
${affectedFiles.map(file => `- \`${file}\``).join('\n')}

## Baseline Metrics
- **Test Results**: See \`consolidation-baselines/${category}-${id}/test-results-baseline.txt\`
- **Bundle Analysis**: See \`consolidation-baselines/${category}-${id}/bundle-analysis-baseline.json\`
- **Coverage**: See \`consolidation-baselines/${category}-${id}/coverage-baseline.txt\`
- **Performance**: See \`consolidation-baselines/${category}-${id}/performance-baseline.json\`

## Progress Log
- ${new Date().toISOString()}: Consolidation started
- ${new Date().toISOString()}: Baseline established
- ${new Date().toISOString()}: Backup tag created

## Next Steps
1. Implement consolidated solution in \`src/shared/${category.toLowerCase()}/\`
2. Create comprehensive test suite
3. Implement feature flag for gradual rollout
4. Run comparative testing
5. Update affected components

## Risk Assessment
- **Complexity**: [To be assessed]
- **Dependencies**: [To be mapped]
- **Rollback Plan**: Automated via \`npm run consolidation:rollback ${category}-${id}\`

## Success Criteria
- [ ] Functionality equivalent to original implementations
- [ ] Performance within ±5% of baseline
- [ ] Test coverage maintained >90%
- [ ] No breaking changes for consumers
- [ ] Documentation complete

---
*Log will be updated throughout consolidation process*
`

  fs.writeFileSync(CONFIG.consolidationLogFile, logContent)
  console.log(chalk.green('📝 Consolidation log created'))
}

function createFeatureFlag(category, id) {
  const flagName = `USE_CONSOLIDATED_${category.toUpperCase()}_${id.replace(/-/g, '_')}`
  
  if (!fs.existsSync(CONFIG.featureFlagsFile)) {
    // Create feature flags file if it doesn't exist
    const featureFlagsContent = `// Feature flags for gradual consolidation rollout
export const FEATURE_FLAGS = {
  // Consolidation flags
  ${flagName}: false, // ${category}-${id}: Start disabled for safety
} as const

export type FeatureFlag = keyof typeof FEATURE_FLAGS

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag] ?? false
}

export function getFeatureFlags() {
  return FEATURE_FLAGS
}
`
    
    // Ensure directory exists
    const dir = path.dirname(CONFIG.featureFlagsFile)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    
    fs.writeFileSync(CONFIG.featureFlagsFile, featureFlagsContent)
  } else {
    // Add feature flag to existing file
    let content = fs.readFileSync(CONFIG.featureFlagsFile, 'utf-8')
    
    // Insert new flag
    const flagLine = `  ${flagName}: false, // ${category}-${id}: Start disabled for safety`
    content = content.replace(
      /(export const FEATURE_FLAGS = \{[^}]*)(})/,
      `$1  ${flagLine}\n$2`
    )
    
    fs.writeFileSync(CONFIG.featureFlagsFile, content)
  }
  
  console.log(chalk.green(`🚩 Feature flag created: ${flagName}`))
}

function validateGitState() {
  try {
    // Check if we're in a git repository
    execSync('git rev-parse --git-dir', { stdio: 'pipe' })
    
    // Check if working directory is clean
    const status = execSync('git status --porcelain', { encoding: 'utf-8' })
    if (status.trim()) {
      console.error(chalk.red('❌ Working directory is not clean. Please commit or stash changes.'))
      process.exit(1)
    }
    
    // Check if we're on main/master
    const currentBranch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim()
    if (!['main', 'master', 'develop'].includes(currentBranch)) {
      console.warn(chalk.yellow(`⚠️  You're not on main/master/develop branch (currently on: ${currentBranch})`))
      console.warn(chalk.yellow('   Consider switching to main branch before starting consolidation'))
    }
    
    console.log(chalk.green('✅ Git state validated'))
    
  } catch (error) {
    console.error(chalk.red('❌ Git validation failed:'), error.message)
    process.exit(1)
  }
}

function createConsolidationBranch(category, id, description) {
  const branchName = `consolidation/${category}-${id}-${description.toLowerCase().replace(/\s+/g, '-')}`
  
  console.log(chalk.blue(`🌿 Creating consolidation branch: ${branchName}`))
  
  try {
    execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' })
    console.log(chalk.green('✅ Branch created successfully'))
    return branchName
  } catch (error) {
    console.error(chalk.red('❌ Failed to create branch:'), error.message)
    process.exit(1)
  }
}

// Main execution
function main() {
  console.log(chalk.bold.blue('🚀 Epic 2 Consolidation Starter\n'))
  
  // Get command line arguments
  const args = process.argv.slice(2)
  
  if (args.length < 3) {
    console.error(chalk.red('Usage: npm run consolidation:start <category> <id> <description> [affected-files...]'))
    console.error(chalk.gray('Example: npm run consolidation:start COMP 01 "tabpanel-components" src/pages/suppliers/components/TabPanel.tsx src/pages/machinery/components/TabPanel.tsx'))
    process.exit(1)
  }
  
  const [category, id, description, ...affectedFiles] = args
  
  console.log(chalk.cyan(`📋 Starting consolidation: ${category}-${id}`))
  console.log(chalk.gray(`   Description: ${description}`))
  console.log(chalk.gray(`   Affected files: ${affectedFiles.length} files\n`))
  
  // Step 1: Validate git state
  validateGitState()
  
  // Step 2: Create consolidation branch
  const branchName = createConsolidationBranch(category, id, description)
  
  // Step 3: Create backup tag
  const backupTag = createBackupTag(category, id)
  
  // Step 4: Establish baseline metrics  
  establishBaseline(category, id)
  
  // Step 5: Create consolidation log
  createConsolidationLog(category, id, description, affectedFiles)
  
  // Step 6: Create feature flag
  createFeatureFlag(category, id)
  
  // Step 7: Final instructions
  console.log(chalk.bold.green('\n🎉 Consolidation initialized successfully!\n'))
  console.log(chalk.bold('Next Steps:'))
  console.log(chalk.gray('1. Implement consolidated solution in:'), chalk.cyan(`src/shared/${category.toLowerCase()}/`))
  console.log(chalk.gray('2. Create comprehensive tests'))
  console.log(chalk.gray('3. Update affected components to use feature flag'))
  console.log(chalk.gray('4. Run:'), chalk.cyan('npm run consolidation:validate'))
  console.log(chalk.gray('5. Create PR using consolidation template\n'))
  
  console.log(chalk.bold('Safety Measures Active:'))
  console.log(chalk.gray('- Backup tag:'), chalk.cyan(backupTag))
  console.log(chalk.gray('- Branch:'), chalk.cyan(branchName))
  console.log(chalk.gray('- Baseline:'), chalk.cyan(`consolidation-baselines/${category}-${id}/`))
  console.log(chalk.gray('- Feature flag:'), chalk.cyan(`USE_CONSOLIDATED_${category.toUpperCase()}_${id.replace(/-/g, '_')}`))
  console.log(chalk.gray('- Rollback available:'), chalk.cyan(`npm run consolidation:rollback ${category}-${id}\n`))
}

if (require.main === module) {
  main()
}

module.exports = {
  createBackupTag,
  establishBaseline,
  createConsolidationLog,
  createFeatureFlag,
  validateGitState
}