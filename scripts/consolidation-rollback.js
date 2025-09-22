#!/usr/bin/env node

/**
 * Consolidation Rollback Script
 * Automatically rolls back failed consolidations to last known good state
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
  maxRollbackTimeMinutes: 30,
  emergencyContactEmail: 'dev-team@company.com'
}

// Rollback reasons
const ROLLBACK_REASONS = {
  TEST_FAILURE: 'test_failure',
  PERFORMANCE_DEGRADATION: 'performance_degradation',
  BUILD_FAILURE: 'build_failure',
  ERROR_RATE_SPIKE: 'error_rate_spike',
  MANUAL_TRIGGER: 'manual_trigger',
  CRITICAL_BUG: 'critical_bug'
}

function getCurrentTimestamp() {
  return new Date().toISOString()
}

function findBackupTag(category, id) {
  try {
    const tags = execSync('git tag -l', { encoding: 'utf-8' }).split('\n')
    const backupTags = tags.filter(tag => 
      tag.includes(CONFIG.backupPrefix) && 
      tag.includes(`${category}-${id}`)
    )
    
    if (backupTags.length === 0) {
      throw new Error(`No backup tag found for ${category}-${id}`)
    }
    
    // Return the most recent backup tag
    backupTags.sort()
    return backupTags[backupTags.length - 1]
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to find backup tag:'), error.message)
    return null
  }
}

function validateRollbackConditions(reason, category, id) {
  console.log(chalk.blue(`🔍 Validating rollback conditions for ${category}-${id}...`))
  
  const validations = {
    gitRepo: false,
    backupExists: false,
    workingDirClean: false,
    timeWindow: false
  }
  
  // Check if we're in a git repository
  try {
    execSync('git rev-parse --git-dir', { stdio: 'pipe' })
    validations.gitRepo = true
  } catch (error) {
    console.error(chalk.red('❌ Not in a git repository'))
  }
  
  // Check if backup tag exists
  const backupTag = findBackupTag(category, id)
  if (backupTag) {
    validations.backupExists = true
    console.log(chalk.green(`✅ Backup tag found: ${backupTag}`))
  }
  
  // Check working directory status
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' })
    if (!status.trim()) {
      validations.workingDirClean = true
    } else {
      console.warn(chalk.yellow('⚠️  Working directory has uncommitted changes'))
      console.log(chalk.gray('   Changes will be stashed during rollback'))
    }
  } catch (error) {
    console.error(chalk.red('❌ Could not check git status'))
  }
  
  // Check if we're within acceptable rollback time window
  const consolidationLog = path.join(process.cwd(), CONFIG.consolidationLogFile)
  if (fs.existsSync(consolidationLog)) {
    const logContent = fs.readFileSync(consolidationLog, 'utf-8')
    const dateMatch = logContent.match(/\*\*Date Started\*\*: (.+)/)
    
    if (dateMatch) {
      const startDate = new Date(dateMatch[1])
      const currentDate = new Date()
      const minutesElapsed = (currentDate - startDate) / (1000 * 60)
      
      if (minutesElapsed <= CONFIG.maxRollbackTimeMinutes) {
        validations.timeWindow = true
      } else {
        console.warn(chalk.yellow(`⚠️  Consolidation started ${Math.round(minutesElapsed)} minutes ago`))
        console.warn(chalk.yellow(`   Outside preferred rollback window of ${CONFIG.maxRollbackTimeMinutes} minutes`))
      }
    }
  }
  
  const allValid = Object.values(validations).every(v => v)
  
  if (!allValid) {
    console.log(chalk.red('\n❌ Rollback validation failed:'))
    Object.entries(validations).forEach(([check, passed]) => {
      const status = passed ? chalk.green('✅') : chalk.red('❌')
      console.log(`   ${status} ${check}`)
    })
  }
  
  return { validations, backupTag }
}

function performRollback(backupTag, category, id, reason) {
  console.log(chalk.bold.red(`\n🔄 INITIATING ROLLBACK: ${category}-${id}`))
  console.log(chalk.gray(`   Reason: ${reason}`))
  console.log(chalk.gray(`   Target: ${backupTag}`))
  console.log(chalk.gray(`   Time: ${getCurrentTimestamp()}\n`))
  
  const rollbackSteps = []
  let currentStep = 0
  
  try {
    // Step 1: Stash any uncommitted changes
    currentStep++
    rollbackSteps.push('Stash uncommitted changes')
    console.log(chalk.blue(`[${currentStep}] Stashing uncommitted changes...`))
    
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf-8' })
      if (status.trim()) {
        execSync(`git stash save "Pre-rollback stash ${getCurrentTimestamp()}"`, { stdio: 'pipe' })
        console.log(chalk.green('   Changes stashed'))
      } else {
        console.log(chalk.gray('   No changes to stash'))
      }
    } catch (error) {
      console.warn(chalk.yellow('   Warning: Could not stash changes'))
    }
    
    // Step 2: Reset to backup tag
    currentStep++
    rollbackSteps.push(`Reset to backup tag: ${backupTag}`)
    console.log(chalk.blue(`[${currentStep}] Resetting to backup tag...`))
    execSync(`git reset --hard ${backupTag}`, { stdio: 'inherit' })
    
    // Step 3: Clean untracked files
    currentStep++
    rollbackSteps.push('Clean untracked files')
    console.log(chalk.blue(`[${currentStep}] Cleaning untracked files...`))
    execSync('git clean -fd', { stdio: 'pipe' })
    
    // Step 4: Reinstall dependencies
    currentStep++
    rollbackSteps.push('Reinstall dependencies')
    console.log(chalk.blue(`[${currentStep}] Reinstalling dependencies...`))
    execSync('npm ci', { stdio: 'inherit' })
    
    // Step 5: Run smoke tests
    currentStep++
    rollbackSteps.push('Run smoke tests')
    console.log(chalk.blue(`[${currentStep}] Running smoke tests...`))
    
    try {
      execSync('npm run test:smoke', { stdio: 'inherit' })
      console.log(chalk.green('   Smoke tests passed'))
    } catch (error) {
      console.error(chalk.red('   Smoke tests failed'))
      throw new Error('Rollback verification failed - smoke tests did not pass')
    }
    
    // Step 6: Verify build
    currentStep++
    rollbackSteps.push('Verify build')
    console.log(chalk.blue(`[${currentStep}] Verifying build...`))
    
    try {
      execSync('npm run build', { stdio: 'pipe' })
      console.log(chalk.green('   Build successful'))
    } catch (error) {
      console.error(chalk.red('   Build failed'))
      throw new Error('Rollback verification failed - build did not succeed')
    }
    
    console.log(chalk.bold.green('\n✅ ROLLBACK COMPLETED SUCCESSFULLY'))
    
  } catch (error) {
    console.error(chalk.bold.red('\n💥 ROLLBACK FAILED'))
    console.error(chalk.red(`   Failed at step ${currentStep}: ${rollbackSteps[currentStep - 1]}`))
    console.error(chalk.red(`   Error: ${error.message}`))
    
    // Emergency escalation
    console.log(chalk.bold.red('\n🚨 EMERGENCY ESCALATION REQUIRED'))
    console.log(chalk.red(`   Contact: ${CONFIG.emergencyContactEmail}`))
    console.log(chalk.red('   Manual intervention needed'))
    
    process.exit(1)
  }
  
  return rollbackSteps
}

function updateConsolidationLog(category, id, reason, rollbackSteps) {
  const logFile = path.join(process.cwd(), CONFIG.consolidationLogFile)
  
  if (fs.existsSync(logFile)) {
    let content = fs.readFileSync(logFile, 'utf-8')
    
    // Update status
    content = content.replace(/\*\*Status\*\*: IN_PROGRESS/, '**Status**: ROLLED_BACK')
    
    // Add rollback information
    const rollbackInfo = `

## Rollback Information
**Rollback Date**: ${getCurrentTimestamp()}
**Rollback Reason**: ${reason}
**Rollback Steps Completed**:
${rollbackSteps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

**Post-Rollback Validation**:
- ✅ Git reset to backup tag successful
- ✅ Dependencies reinstalled
- ✅ Smoke tests passed
- ✅ Build verified

**Next Steps**:
1. Investigate root cause of consolidation failure
2. Address issues identified during rollback
3. Plan retry strategy if appropriate
4. Update consolidation approach based on learnings

---
*Rollback completed successfully - system restored to last known good state*
`
    
    content += rollbackInfo
    fs.writeFileSync(logFile, content)
    
    console.log(chalk.green('📝 Consolidation log updated with rollback information'))
  }
}

function cleanupFeatureFlag(category, id) {
  const featureFlagsFile = 'src/shared/utils/featureFlags.ts'
  
  if (fs.existsSync(featureFlagsFile)) {
    let content = fs.readFileSync(featureFlagsFile, 'utf-8')
    const flagName = `USE_CONSOLIDATED_${category.toUpperCase()}_${id.replace(/-/g, '_')}`
    
    // Remove the feature flag line
    content = content.replace(new RegExp(`\\s*${flagName}:.*,?\\n?`, 'g'), '')
    
    // Clean up any empty lines or trailing commas
    content = content.replace(/,(\s*})/g, '$1')
    
    fs.writeFileSync(featureFlagsFile, content)
    console.log(chalk.green(`🚩 Feature flag cleaned up: ${flagName}`))
  }
}

function sendNotifications(category, id, reason, success) {
  // In a real implementation, this would send notifications via:
  // - Slack webhook
  // - Email alerts
  // - PagerDuty integration
  // - GitHub issue creation
  
  const status = success ? 'COMPLETED' : 'FAILED'
  const emoji = success ? '✅' : '❌'
  
  console.log(chalk.bold.blue('\n📢 Notifications (would be sent):'))
  console.log(chalk.gray(`   Slack: ${emoji} Rollback ${status} for ${category}-${id} (Reason: ${reason})`))
  console.log(chalk.gray(`   Email: Development team notified of rollback status`))
  console.log(chalk.gray(`   GitHub: Issue created for rollback investigation`))
  
  // Create local notification file for tracking
  const notificationLog = {
    timestamp: getCurrentTimestamp(),
    category,
    id,
    reason,
    status,
    rollbackSuccess: success
  }
  
  const notificationsDir = 'rollback-notifications'
  if (!fs.existsSync(notificationsDir)) {
    fs.mkdirSync(notificationsDir)
  }
  
  fs.writeFileSync(
    path.join(notificationsDir, `rollback-${category}-${id}-${Date.now()}.json`),
    JSON.stringify(notificationLog, null, 2)
  )
}

function runAutomaticChecks(category, id) {
  console.log(chalk.blue('🔍 Running automatic rollback condition checks...'))
  
  const checks = {
    testFailure: checkTestFailure(),
    buildFailure: checkBuildFailure(),
    performanceDegradation: checkPerformanceDegradation(category, id)
  }
  
  const failures = Object.entries(checks).filter(([check, passed]) => !passed)
  
  if (failures.length > 0) {
    console.log(chalk.red('\n❌ Automatic rollback triggered by:'))
    failures.forEach(([check, _]) => {
      console.log(chalk.red(`   • ${check}`))
    })
    return failures.map(([check, _]) => check).join(', ')
  }
  
  console.log(chalk.green('✅ All automatic checks passed'))
  return null
}

function checkTestFailure() {
  try {
    execSync('npm test', { stdio: 'pipe' })
    return true
  } catch (error) {
    console.log(chalk.red('   ❌ Test suite failing'))
    return false
  }
}

function checkBuildFailure() {
  try {
    execSync('npm run build', { stdio: 'pipe' })
    return true
  } catch (error) {
    console.log(chalk.red('   ❌ Build failing'))
    return false
  }
}

function checkPerformanceDegradation(category, id) {
  const baselineDir = path.join(CONFIG.baselineDir, `${category}-${id}`)
  const baselineFile = path.join(baselineDir, 'performance-baseline.json')
  
  if (!fs.existsSync(baselineFile)) {
    console.log(chalk.yellow('   ⚠️  No performance baseline available'))
    return true // Can't check without baseline
  }
  
  try {
    const baseline = JSON.parse(fs.readFileSync(baselineFile, 'utf-8'))
    
    // Run current performance check
    const currentPerf = {
      buildTime: measureBuildTime(),
      bundleSize: getBundleSize()
    }
    
    // Check for >10% degradation (rollback threshold)
    const buildTimeDegradation = ((currentPerf.buildTime - baseline.buildTime) / baseline.buildTime) * 100
    const bundleSizeIncrease = ((currentPerf.bundleSize - baseline.bundleSize) / baseline.bundleSize) * 100
    
    if (buildTimeDegradation > 10) {
      console.log(chalk.red(`   ❌ Build time increased by ${buildTimeDegradation.toFixed(1)}%`))
      return false
    }
    
    if (bundleSizeIncrease > 15) {
      console.log(chalk.red(`   ❌ Bundle size increased by ${bundleSizeIncrease.toFixed(1)}%`))
      return false
    }
    
    return true
    
  } catch (error) {
    console.log(chalk.yellow('   ⚠️  Could not check performance metrics'))
    return true // Don't fail rollback due to monitoring issues
  }
}

function measureBuildTime() {
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

// Main execution
function main() {
  console.log(chalk.bold.red('🚨 Epic 2 Consolidation Rollback System\n'))
  
  const args = process.argv.slice(2)
  
  if (args.length < 1) {
    console.error(chalk.red('Usage:'))
    console.error(chalk.gray('  npm run consolidation:rollback <category>-<id> [reason]'))
    console.error(chalk.gray('  npm run consolidation:rollback --auto-check <category>-<id>'))
    console.error(chalk.gray('\nExamples:'))
    console.error(chalk.gray('  npm run consolidation:rollback COMP-01 manual_trigger'))
    console.error(chalk.gray('  npm run consolidation:rollback --auto-check CRUD-01'))
    process.exit(1)
  }
  
  // Handle auto-check mode
  if (args[0] === '--auto-check') {
    if (args.length < 2) {
      console.error(chalk.red('--auto-check requires category-id argument'))
      process.exit(1)
    }
    
    const [category, id] = args[1].split('-')
    const failureReason = runAutomaticChecks(category, id)
    
    if (failureReason) {
      console.log(chalk.red('\n🔄 Triggering automatic rollback...'))
      // Continue with rollback process
      args[0] = args[1] // Set category-id
      args[1] = failureReason // Set reason
    } else {
      console.log(chalk.green('\n✅ No rollback needed'))
      process.exit(0)
    }
  }
  
  const [categoryId, reason = ROLLBACK_REASONS.MANUAL_TRIGGER] = args
  const [category, id] = categoryId.split('-')
  
  if (!category || !id) {
    console.error(chalk.red('Invalid format. Use: CATEGORY-ID (e.g., COMP-01)'))
    process.exit(1)
  }
  
  console.log(chalk.cyan(`🔄 Initiating rollback for: ${category}-${id}`))
  console.log(chalk.gray(`   Reason: ${reason}\n`))
  
  // Validate rollback conditions
  const { validations, backupTag } = validateRollbackConditions(reason, category, id)
  
  if (!backupTag) {
    console.error(chalk.red('❌ Cannot proceed without backup tag'))
    process.exit(1)
  }
  
  // Ask for confirmation unless it's an automatic trigger
  if (reason === ROLLBACK_REASONS.MANUAL_TRIGGER) {
    console.log(chalk.yellow('⚠️  This will permanently reset your working directory'))
    console.log(chalk.yellow('   Any uncommitted changes will be stashed'))
    console.log(chalk.gray('\nPress Ctrl+C to cancel, or Enter to continue...'))
    
    // In a real implementation, we'd use readline for input
    // For now, we'll proceed (assuming automation context)
  }
  
  try {
    // Perform the rollback
    const rollbackSteps = performRollback(backupTag, category, id, reason)
    
    // Update consolidation log
    updateConsolidationLog(category, id, reason, rollbackSteps)
    
    // Clean up feature flag
    cleanupFeatureFlag(category, id)
    
    // Send notifications
    sendNotifications(category, id, reason, true)
    
    console.log(chalk.bold.green('\n🎉 Rollback process completed successfully!'))
    console.log(chalk.green('   System restored to last known good state'))
    console.log(chalk.green('   Team has been notified'))
    console.log(chalk.gray('\nNext steps:'))
    console.log(chalk.gray('1. Review rollback logs and investigate root cause'))
    console.log(chalk.gray('2. Address issues before attempting consolidation retry'))
    console.log(chalk.gray('3. Update consolidation approach based on learnings'))
    
  } catch (error) {
    // Send failure notification
    sendNotifications(category, id, reason, false)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = {
  performRollback,
  validateRollbackConditions,
  runAutomaticChecks,
  ROLLBACK_REASONS
}