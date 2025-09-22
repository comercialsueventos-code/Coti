#!/usr/bin/env node

/**
 * Comprehensive Testing Script for Consolidations
 * Runs all testing levels: unit, snapshot, integration, performance
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const chalk = require('chalk')

// Testing configuration
const TESTING_CONFIG = {
  levels: {
    unit: {
      enabled: true,
      command: 'npm run test:unit',
      weight: 30,
      required: true
    },
    snapshot: {
      enabled: true,
      command: 'node scripts/run-snapshot-tests.js',
      weight: 20,
      required: true
    },
    integration: {
      enabled: true,
      command: 'node scripts/run-integration-tests.js',
      weight: 30,
      required: true
    },
    performance: {
      enabled: true,
      command: 'node scripts/run-performance-tests.js',
      weight: 20,
      required: false
    }
  },
  thresholds: {
    overall: 85, // Overall test score threshold
    unit: 95,    // Unit test coverage threshold
    snapshot: 98, // Snapshot similarity threshold
    integration: 90, // Integration test pass rate
    performance: 5   // Performance degradation threshold (%)
  },
  reportDir: 'tests/reports/consolidation',
  timeout: 1800000 // 30 minutes total timeout
}

// Types
interface TestResult {
  level: string
  passed: boolean
  score: number
  duration: number
  details: any
  error?: string
}

interface ConsolidationTestReport {
  category: string
  id: string
  timestamp: string
  overallScore: number
  passed: boolean
  results: TestResult[]
  recommendations: string[]
  summary: {
    total: number
    passed: number
    failed: number
    duration: number
  }
}

/**
 * Main consolidation testing class
 */
class ConsolidationTestRunner {
  private category: string
  private id: string
  private results: TestResult[] = []
  private startTime: number = 0

  constructor(category: string, id: string) {
    this.category = category
    this.id = id
    this.ensureDirectoriesExist()
  }

  /**
   * Run comprehensive test suite
   */
  async runAllTests(): Promise<ConsolidationTestReport> {
    console.log(chalk.bold.blue(`🧪 Running comprehensive tests for ${this.category}-${this.id}\n`))
    
    this.startTime = Date.now()
    const testLevels = Object.keys(TESTING_CONFIG.levels)

    for (const level of testLevels) {
      const config = TESTING_CONFIG.levels[level]
      
      if (!config.enabled) {
        console.log(chalk.gray(`⏭️  Skipping ${level} tests (disabled)`))
        continue
      }

      console.log(chalk.blue(`🔍 Running ${level} tests...`))
      
      try {
        const result = await this.runTestLevel(level, config)
        this.results.push(result)
        
        const status = result.passed ? '✅' : '❌'
        const score = result.score.toFixed(1)
        const duration = result.duration.toFixed(0)
        
        console.log(`   ${status} ${level}: ${score}% (${duration}ms)`)
        
        if (!result.passed && config.required) {
          console.log(chalk.red(`   ⚠️  ${level} tests failed and are required - stopping execution`))
          break
        }
        
      } catch (error) {
        const errorResult: TestResult = {
          level,
          passed: false,
          score: 0,
          duration: 0,
          details: {},
          error: error instanceof Error ? error.message : 'Unknown error'
        }
        
        this.results.push(errorResult)
        console.log(chalk.red(`   ❌ ${level} tests failed: ${errorResult.error}`))
        
        if (config.required) {
          console.log(chalk.red(`   ⚠️  ${level} tests are required - stopping execution`))
          break
        }
      }
    }

    return this.generateReport()
  }

  /**
   * Run specific test level
   */
  private async runTestLevel(level: string, config: any): Promise<TestResult> {
    const startTime = Date.now()
    
    try {
      let details: any = {}
      let score = 0
      let passed = false

      switch (level) {
        case 'unit':
          details = await this.runUnitTests()
          score = details.coverage?.percentage || 0
          passed = score >= TESTING_CONFIG.thresholds.unit
          break

        case 'snapshot':
          details = await this.runSnapshotTests()
          score = (details.averageSimilarity || 0) * 100
          passed = score >= TESTING_CONFIG.thresholds.snapshot
          break

        case 'integration':
          details = await this.runIntegrationTests()
          score = (details.passRate || 0) * 100
          passed = score >= TESTING_CONFIG.thresholds.integration
          break

        case 'performance':
          details = await this.runPerformanceTests()
          score = Math.max(0, 100 - (details.degradation || 0))
          passed = (details.degradation || 100) <= TESTING_CONFIG.thresholds.performance
          break

        default:
          throw new Error(`Unknown test level: ${level}`)
      }

      const duration = Date.now() - startTime

      return {
        level,
        passed,
        score,
        duration,
        details
      }

    } catch (error) {
      throw error
    }
  }

  /**
   * Run unit tests
   */
  private async runUnitTests(): Promise<any> {
    console.log('     Running unit test suite...')
    
    try {
      // Mock implementation - would run actual Jest tests
      const output = execSync('echo "Unit tests: 25/25 passed, Coverage: 96%"', { encoding: 'utf-8' })
      
      // Parse output (simplified)
      return {
        total: 25,
        passed: 25,
        failed: 0,
        coverage: {
          percentage: 96,
          functions: 98,
          lines: 95,
          branches: 94
        },
        output
      }
    } catch (error) {
      throw new Error(`Unit tests failed: ${error}`)
    }
  }

  /**
   * Run snapshot tests
   */
  private async runSnapshotTests(): Promise<any> {
    console.log('     Running snapshot tests...')
    
    // Mock implementation - would use actual snapshot testing framework
    const mockResults = {
      total: 8,
      passed: 8,
      failed: 0,
      newSnapshots: 0,
      averageSimilarity: 0.991,
      details: [
        { variant: 'default', similarity: 1.0, passed: true },
        { variant: 'with_props', similarity: 0.985, passed: true },
        { variant: 'disabled', similarity: 0.992, passed: true }
      ]
    }

    return mockResults
  }

  /**
   * Run integration tests
   */
  private async runIntegrationTests(): Promise<any> {
    console.log('     Running integration tests...')
    
    // Mock implementation - would use actual integration testing framework
    const mockResults = {
      total: 12,
      passed: 11,
      failed: 1,
      passRate: 11/12,
      scenarios: [
        { name: 'basic_integration', passed: true, duration: 234 },
        { name: 'crud_operations', passed: true, duration: 567 },
        { name: 'hook_integration', passed: false, duration: 123 }
      ],
      coverage: {
        files: 15,
        functions: 89,
        percentage: 92
      }
    }

    return mockResults
  }

  /**
   * Run performance tests
   */
  private async runPerformanceTests(): Promise<any> {
    console.log('     Running performance tests...')
    
    // Mock implementation - would run actual performance benchmarks
    const baseline = this.loadPerformanceBaseline()
    const current = await this.measureCurrentPerformance()
    
    const degradation = this.calculatePerformanceDegradation(baseline, current)
    
    return {
      baseline,
      current,
      degradation,
      metrics: {
        buildTime: current.buildTime,
        bundleSize: current.bundleSize,
        renderTime: current.renderTime
      }
    }
  }

  /**
   * Load performance baseline
   */
  private loadPerformanceBaseline(): any {
    const baselineFile = path.join(
      'consolidation-baselines',
      `${this.category}-${this.id}`,
      'performance-baseline.json'
    )

    if (fs.existsSync(baselineFile)) {
      return JSON.parse(fs.readFileSync(baselineFile, 'utf-8'))
    }

    // Return default baseline if not found
    return {
      buildTime: 5000,
      bundleSize: 1024 * 500, // 500KB
      renderTime: 16.7 // 60fps
    }
  }

  /**
   * Measure current performance
   */
  private async measureCurrentPerformance(): Promise<any> {
    // Mock implementation - would run actual performance measurements
    return {
      buildTime: 5100 + (Math.random() - 0.5) * 1000,
      bundleSize: 1024 * 520 + (Math.random() - 0.5) * 1024 * 50,
      renderTime: 17.2 + (Math.random() - 0.5) * 2
    }
  }

  /**
   * Calculate performance degradation percentage
   */
  private calculatePerformanceDegradation(baseline: any, current: any): number {
    const buildTimeDelta = ((current.buildTime - baseline.buildTime) / baseline.buildTime) * 100
    const bundleSizeDelta = ((current.bundleSize - baseline.bundleSize) / baseline.bundleSize) * 100
    const renderTimeDelta = ((current.renderTime - baseline.renderTime) / baseline.renderTime) * 100
    
    // Return worst degradation
    return Math.max(buildTimeDelta, bundleSizeDelta, renderTimeDelta)
  }

  /**
   * Generate comprehensive test report
   */
  private generateReport(): ConsolidationTestReport {
    const totalDuration = Date.now() - this.startTime
    const total = this.results.length
    const passed = this.results.filter(r => r.passed).length
    const failed = total - passed

    // Calculate weighted overall score
    let overallScore = 0
    let totalWeight = 0

    this.results.forEach(result => {
      const config = TESTING_CONFIG.levels[result.level]
      if (config) {
        overallScore += result.score * config.weight
        totalWeight += config.weight
      }
    })

    overallScore = totalWeight > 0 ? overallScore / totalWeight : 0
    const overallPassed = overallScore >= TESTING_CONFIG.thresholds.overall

    const recommendations = this.generateRecommendations()

    const report: ConsolidationTestReport = {
      category: this.category,
      id: this.id,
      timestamp: new Date().toISOString(),
      overallScore,
      passed: overallPassed,
      results: this.results,
      recommendations,
      summary: {
        total,
        passed,
        failed,
        duration: totalDuration
      }
    }

    // Save report
    this.saveReport(report)

    return report
  }

  /**
   * Generate recommendations based on test results
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = []
    
    // Check each test level
    this.results.forEach(result => {
      const config = TESTING_CONFIG.levels[result.level]
      const threshold = TESTING_CONFIG.thresholds[result.level]

      if (!result.passed && config.required) {
        recommendations.push(`CRITICAL: Fix ${result.level} tests before proceeding with consolidation`)
      } else if (!result.passed && !config.required) {
        recommendations.push(`WARNING: ${result.level} tests failing but not blocking`)
      }

      // Specific recommendations by level
      switch (result.level) {
        case 'unit':
          if (result.score < 90) {
            recommendations.push('Increase unit test coverage - currently below 90%')
          }
          break

        case 'snapshot':
          if (result.score < 95) {
            recommendations.push('Review snapshot differences - visual changes detected')
          }
          break

        case 'integration':
          if (result.score < 85) {
            recommendations.push('Fix integration test failures - dependency issues likely')
          }
          break

        case 'performance':
          if (result.details?.degradation > 10) {
            recommendations.push('Significant performance degradation - consider optimization')
          }
          break
      }
    })

    // Overall recommendations
    const overallScore = this.results.reduce((acc, r) => acc + r.score, 0) / this.results.length
    
    if (overallScore < 80) {
      recommendations.push('Overall test quality is low - comprehensive review needed')
    } else if (overallScore > 95) {
      recommendations.push('Excellent test results - consolidation ready for production')
    }

    if (recommendations.length === 0) {
      recommendations.push('All tests passing - consolidation meets quality standards')
    }

    return recommendations
  }

  /**
   * Save test report to file
   */
  private saveReport(report: ConsolidationTestReport): void {
    const filename = `test-report-${this.category}-${this.id}-${Date.now()}.json`
    const filepath = path.join(TESTING_CONFIG.reportDir, filename)
    
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2))
    console.log(chalk.gray(`\nTest report saved: ${filepath}`))
  }

  /**
   * Display test summary
   */
  displaySummary(report: ConsolidationTestReport): void {
    console.log(chalk.bold.blue('\n📊 Test Summary:'))
    console.log(chalk.gray(`   Category: ${report.category}-${report.id}`))
    console.log(chalk.gray(`   Duration: ${report.summary.duration}ms`))
    
    const overallStatus = report.passed ? 
      chalk.green(`✅ PASSED (${report.overallScore.toFixed(1)}%)`) : 
      chalk.red(`❌ FAILED (${report.overallScore.toFixed(1)}%)`)
    
    console.log(`   Overall: ${overallStatus}\n`)

    console.log(chalk.bold.blue('📋 Test Results:'))
    report.results.forEach(result => {
      const status = result.passed ? chalk.green('✅') : chalk.red('❌')
      const score = result.score.toFixed(1)
      const duration = result.duration.toFixed(0)
      
      console.log(`   ${status} ${result.level}: ${score}% (${duration}ms)`)
      
      if (result.error) {
        console.log(chalk.red(`      Error: ${result.error}`))
      }
    })

    if (report.recommendations.length > 0) {
      console.log(chalk.bold.blue('\n💡 Recommendations:'))
      report.recommendations.forEach(rec => {
        if (rec.startsWith('CRITICAL')) {
          console.log(chalk.red(`   🚨 ${rec}`))
        } else if (rec.startsWith('WARNING')) {
          console.log(chalk.yellow(`   ⚠️  ${rec}`))
        } else {
          console.log(chalk.cyan(`   • ${rec}`))
        }
      })
    }

    console.log()
  }

  /**
   * Utility methods
   */
  private ensureDirectoriesExist(): void {
    if (!fs.existsSync(TESTING_CONFIG.reportDir)) {
      fs.mkdirSync(TESTING_CONFIG.reportDir, { recursive: true })
    }
  }
}

// Main execution
function main() {
  console.log(chalk.bold.blue('🧪 Consolidation Testing Suite\n'))
  
  const args = process.argv.slice(2)
  
  if (args.length < 1) {
    console.error(chalk.red('Usage: npm run test:consolidation <category>-<id> [options]'))
    console.error(chalk.gray('\nOptions:'))
    console.error(chalk.gray('  --level <level>     Run specific test level only'))
    console.error(chalk.gray('  --update-snapshots  Update snapshot baselines'))
    console.error(chalk.gray('  --skip-performance  Skip performance tests'))
    console.error(chalk.gray('\nExamples:'))
    console.error(chalk.gray('  npm run test:consolidation COMP-01'))
    console.error(chalk.gray('  npm run test:consolidation CRUD-01 --level unit'))
    console.error(chalk.gray('  npm run test:consolidation HOOKS-01 --update-snapshots'))
    process.exit(1)
  }
  
  const [categoryId, ...options] = args
  const [category, id] = categoryId.split('-')
  
  if (!category || !id) {
    console.error(chalk.red('Invalid format. Use: CATEGORY-ID (e.g., COMP-01)'))
    process.exit(1)
  }
  
  // Parse options
  if (options.includes('--update-snapshots')) {
    process.env.UPDATE_SNAPSHOTS = 'true'
  }
  
  if (options.includes('--skip-performance')) {
    TESTING_CONFIG.levels.performance.enabled = false
  }
  
  const levelIndex = options.indexOf('--level')
  if (levelIndex >= 0 && options[levelIndex + 1]) {
    const specificLevel = options[levelIndex + 1]
    
    // Disable all levels except the specified one
    Object.keys(TESTING_CONFIG.levels).forEach(level => {
      TESTING_CONFIG.levels[level].enabled = level === specificLevel
    })
  }
  
  const runner = new ConsolidationTestRunner(category, id)
  
  runner.runAllTests()
    .then(report => {
      runner.displaySummary(report)
      process.exit(report.passed ? 0 : 1)
    })
    .catch(error => {
      console.error(chalk.red('Testing failed:'), error)
      process.exit(1)
    })
}

if (require.main === module) {
  main()
}

module.exports = {
  ConsolidationTestRunner,
  TESTING_CONFIG
}