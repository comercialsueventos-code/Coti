/**
 * Snapshot Testing Framework for UI Consolidations
 * Ensures visual consistency when consolidating components
 */

import fs from 'fs'
import path from 'path'

// Snapshot testing configuration
export const SNAPSHOT_CONFIG = {
  threshold: 0.001, // Threshold for visual differences
  updateSnapshots: process.env.UPDATE_SNAPSHOTS === 'true',
  snapshotDir: 'tests/snapshots/consolidations',
  diffDir: 'tests/diffs/consolidations',
  formats: ['json', 'html', 'png'] as const
}

// Types for snapshot testing
export interface SnapshotTestCase {
  name: string
  component: any
  props: any
  variants: SnapshotVariant[]
  category: string
  id: string
}

export interface SnapshotVariant {
  name: string
  props: any
  description: string
  tags: string[]
}

export interface SnapshotResult {
  testCase: string
  variant: string
  passed: boolean
  similarity: number
  oldSnapshot?: any
  newSnapshot?: any
  diff?: any
  error?: string
}

export interface VisualRegressionReport {
  category: string
  id: string
  timestamp: string
  summary: {
    total: number
    passed: number
    failed: number
    newSnapshots: number
    averageSimilarity: number
  }
  results: SnapshotResult[]
  recommendations: string[]
}

/**
 * Snapshot testing class for component consolidations
 */
export class ConsolidationSnapshotTester {
  private category: string
  private id: string
  private results: SnapshotResult[] = []

  constructor(category: string, id: string) {
    this.category = category
    this.id = id
    this.ensureDirectoriesExist()
  }

  /**
   * Run snapshot tests for component consolidation
   */
  async runSnapshotTests(
    oldComponent: any,
    newComponent: any,
    testCases: SnapshotTestCase[]
  ): Promise<VisualRegressionReport> {
    console.log(`📸 Running snapshot tests for ${this.category}-${this.id}`)
    
    for (const testCase of testCases) {
      console.log(`  Testing component: ${testCase.name}`)
      
      for (const variant of testCase.variants) {
        console.log(`    Variant: ${variant.name}`)
        
        try {
          const result = await this.compareSnapshots(
            testCase,
            variant,
            oldComponent,
            newComponent
          )
          
          this.results.push(result)
          
          const status = result.passed ? '✅' : '❌'
          const similarity = (result.similarity * 100).toFixed(1)
          console.log(`      ${status} ${variant.name} (${similarity}% similar)`)
          
        } catch (error) {
          const errorResult: SnapshotResult = {
            testCase: testCase.name,
            variant: variant.name,
            passed: false,
            similarity: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
          
          this.results.push(errorResult)
          console.log(`      ❌ ${variant.name} - Error: ${errorResult.error}`)
        }
      }
    }

    return this.generateReport()
  }

  /**
   * Compare snapshots between old and new component
   */
  private async compareSnapshots(
    testCase: SnapshotTestCase,
    variant: SnapshotVariant,
    oldComponent: any,
    newComponent: any
  ): Promise<SnapshotResult> {
    const testName = `${testCase.name}_${variant.name}`
    const snapshotPath = this.getSnapshotPath(testName)
    
    // Render old component (if first time, this becomes the baseline)
    const oldSnapshot = await this.renderComponent(oldComponent, {
      ...testCase.props,
      ...variant.props
    })

    // Render new component  
    const newSnapshot = await this.renderComponent(newComponent, {
      ...testCase.props,
      ...variant.props
    })

    // Load existing snapshot if it exists
    let existingSnapshot: any = null
    if (fs.existsSync(snapshotPath)) {
      existingSnapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf-8'))
    }

    let passed = false
    let similarity = 0
    let diff: any = null

    if (existingSnapshot) {
      // Compare with existing snapshot
      const comparison = await this.compareRenderedOutput(existingSnapshot, newSnapshot)
      similarity = comparison.similarity
      passed = similarity >= (1 - SNAPSHOT_CONFIG.threshold)
      diff = comparison.diff
      
      if (!passed) {
        // Save diff for analysis
        await this.saveDiff(testName, existingSnapshot, newSnapshot, diff)
      }
    } else {
      // First time - create baseline snapshot
      console.log(`      📝 Creating baseline snapshot for ${testName}`)
      passed = true
      similarity = 1.0
    }

    // Update snapshot if configured to do so or if it's new
    if (SNAPSHOT_CONFIG.updateSnapshots || !existingSnapshot) {
      await this.saveSnapshot(testName, newSnapshot)
    }

    return {
      testCase: testCase.name,
      variant: variant.name,
      passed,
      similarity,
      oldSnapshot: existingSnapshot,
      newSnapshot,
      diff
    }
  }

  /**
   * Render component to snapshot format
   */
  private async renderComponent(component: any, props: any): Promise<any> {
    // This would use a proper React renderer in a real implementation
    // For now, we'll create a mock snapshot structure
    
    return {
      type: component.displayName || component.name || 'Component',
      props: this.sanitizeProps(props),
      children: this.extractChildren(component, props),
      timestamp: new Date().toISOString(),
      hash: this.generateHash(component, props)
    }
  }

  /**
   * Sanitize props for snapshot consistency
   */
  private sanitizeProps(props: any): any {
    // Remove functions, dates, and other non-deterministic values
    const sanitized = { ...props }
    
    Object.keys(sanitized).forEach(key => {
      const value = sanitized[key]
      
      if (typeof value === 'function') {
        sanitized[key] = '[Function]'
      } else if (value instanceof Date) {
        sanitized[key] = '[Date]'
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeProps(value)
      }
    })
    
    return sanitized
  }

  /**
   * Extract children structure for snapshot
   */
  private extractChildren(component: any, props: any): any {
    // Mock implementation - would use actual React tree extraction
    if (props.children) {
      if (typeof props.children === 'string') {
        return props.children
      } else if (Array.isArray(props.children)) {
        return props.children.map((child, index) => ({ 
          key: index, 
          type: typeof child === 'string' ? 'text' : 'element',
          value: child
        }))
      }
    }
    return null
  }

  /**
   * Generate hash for component + props combination
   */
  private generateHash(component: any, props: any): string {
    const content = JSON.stringify({
      component: component.name || 'Anonymous',
      props: this.sanitizeProps(props)
    })
    
    // Simple hash function - would use crypto in real implementation
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    
    return hash.toString(36)
  }

  /**
   * Compare two rendered outputs
   */
  private async compareRenderedOutput(
    snapshot1: any,
    snapshot2: any
  ): Promise<{ similarity: number; diff: any }> {
    // Deep comparison of snapshot structures
    const differences: string[] = []
    
    const compareObjects = (obj1: any, obj2: any, path = ''): void => {
      if (typeof obj1 !== typeof obj2) {
        differences.push(`${path}: type mismatch`)
        return
      }
      
      if (typeof obj1 === 'object' && obj1 !== null && obj2 !== null) {
        const keys1 = Object.keys(obj1)
        const keys2 = Object.keys(obj2)
        
        // Check for missing keys
        keys1.forEach(key => {
          if (!keys2.includes(key)) {
            differences.push(`${path}.${key}: missing in new snapshot`)
          }
        })
        
        keys2.forEach(key => {
          if (!keys1.includes(key)) {
            differences.push(`${path}.${key}: added in new snapshot`)
          }
        })
        
        // Compare common keys
        keys1.forEach(key => {
          if (keys2.includes(key)) {
            compareObjects(obj1[key], obj2[key], path ? `${path}.${key}` : key)
          }
        })
      } else if (obj1 !== obj2) {
        differences.push(`${path}: value mismatch`)
      }
    }
    
    compareObjects(snapshot1, snapshot2)
    
    // Calculate similarity based on differences
    const totalProperties = this.countProperties(snapshot1)
    const changedProperties = differences.length
    const similarity = Math.max(0, (totalProperties - changedProperties) / totalProperties)
    
    return {
      similarity,
      diff: {
        differences,
        totalProperties,
        changedProperties,
        similarityPercentage: similarity * 100
      }
    }
  }

  /**
   * Count total properties in object recursively
   */
  private countProperties(obj: any): number {
    if (typeof obj !== 'object' || obj === null) {
      return 1
    }
    
    return Object.keys(obj).reduce((count, key) => {
      return count + this.countProperties(obj[key])
    }, 1)
  }

  /**
   * Save snapshot to file
   */
  private async saveSnapshot(testName: string, snapshot: any): Promise<void> {
    const snapshotPath = this.getSnapshotPath(testName)
    
    const snapshotData = {
      ...snapshot,
      metadata: {
        category: this.category,
        id: this.id,
        testName,
        createdAt: new Date().toISOString(),
        version: '1.0.0'
      }
    }
    
    fs.writeFileSync(snapshotPath, JSON.stringify(snapshotData, null, 2))
  }

  /**
   * Save diff for failed snapshot
   */
  private async saveDiff(
    testName: string, 
    oldSnapshot: any, 
    newSnapshot: any, 
    diff: any
  ): Promise<void> {
    const diffPath = this.getDiffPath(testName)
    
    const diffData = {
      testName,
      category: this.category,
      id: this.id,
      timestamp: new Date().toISOString(),
      oldSnapshot,
      newSnapshot,
      diff,
      analysis: {
        significantChanges: diff.differences.filter((d: string) => 
          !d.includes('timestamp') && !d.includes('hash')
        ),
        recommendation: this.generateDiffRecommendation(diff)
      }
    }
    
    fs.writeFileSync(diffPath, JSON.stringify(diffData, null, 2))
  }

  /**
   * Generate recommendation based on diff analysis
   */
  private generateDiffRecommendation(diff: any): string {
    if (diff.changedProperties === 0) {
      return 'No changes detected - snapshots are identical'
    } else if (diff.changedProperties <= 2) {
      return 'Minor changes detected - review diff for intentional changes'
    } else if (diff.similarityPercentage > 90) {
      return 'Small changes detected - likely acceptable'
    } else if (diff.similarityPercentage > 75) {
      return 'Moderate changes detected - review carefully'
    } else {
      return 'Significant changes detected - verify this is intentional'
    }
  }

  /**
   * Generate comprehensive report
   */
  private generateReport(): VisualRegressionReport {
    const total = this.results.length
    const passed = this.results.filter(r => r.passed).length
    const failed = total - passed
    const newSnapshots = this.results.filter(r => !r.oldSnapshot).length
    
    const averageSimilarity = total > 0 ? 
      this.results.reduce((acc, r) => acc + r.similarity, 0) / total : 
      1

    const recommendations = this.generateRecommendations()

    return {
      category: this.category,
      id: this.id,
      timestamp: new Date().toISOString(),
      summary: {
        total,
        passed,
        failed,
        newSnapshots,
        averageSimilarity
      },
      results: this.results,
      recommendations
    }
  }

  /**
   * Generate recommendations based on snapshot results
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = []
    
    const failedTests = this.results.filter(r => !r.passed)
    if (failedTests.length > 0) {
      recommendations.push(`Review ${failedTests.length} failed snapshot tests`)
      recommendations.push('Check if visual changes are intentional')
      recommendations.push('Update snapshots if changes are approved')
    }

    const lowSimilarity = this.results.filter(r => r.similarity < 0.8)
    if (lowSimilarity.length > 0) {
      recommendations.push(`${lowSimilarity.length} tests have significant visual changes`)
    }

    const averageSimilarity = this.results.reduce((acc, r) => acc + r.similarity, 0) / this.results.length
    if (averageSimilarity < 0.95) {
      recommendations.push('Consider reviewing consolidation approach - multiple visual changes detected')
    }

    if (this.results.some(r => !r.oldSnapshot)) {
      recommendations.push('New snapshots created - establish baseline for future comparisons')
    }

    return recommendations
  }

  /**
   * Utility methods
   */
  private ensureDirectoriesExist(): void {
    const dirs = [
      path.join(SNAPSHOT_CONFIG.snapshotDir, this.category),
      path.join(SNAPSHOT_CONFIG.diffDir, this.category)
    ]
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
    })
  }

  private getSnapshotPath(testName: string): string {
    return path.join(
      SNAPSHOT_CONFIG.snapshotDir, 
      this.category, 
      `${this.id}_${testName}.json`
    )
  }

  private getDiffPath(testName: string): string {
    return path.join(
      SNAPSHOT_CONFIG.diffDir,
      this.category,
      `${this.id}_${testName}_diff.json`
    )
  }
}

/**
 * Utility functions for snapshot testing
 */
export const SnapshotUtils = {
  /**
   * Create test cases for common component patterns
   */
  createComponentTestCases(
    category: string, 
    id: string, 
    componentName: string
  ): SnapshotTestCase[] {
    const baseTestCase: SnapshotTestCase = {
      name: componentName,
      component: null, // Will be set by caller
      props: {},
      category,
      id,
      variants: []
    }

    // Generate common variants based on component type
    switch (category.toUpperCase()) {
      case 'COMP':
        baseTestCase.variants = [
          {
            name: 'default',
            props: {},
            description: 'Default component state',
            tags: ['default', 'baseline']
          },
          {
            name: 'with_props',
            props: { title: 'Test Title', disabled: false },
            description: 'Component with common props',
            tags: ['props', 'interactive']
          },
          {
            name: 'disabled',
            props: { disabled: true },
            description: 'Disabled state',
            tags: ['disabled', 'state']
          },
          {
            name: 'loading',
            props: { loading: true },
            description: 'Loading state',
            tags: ['loading', 'state']
          }
        ]
        break

      case 'FORM':
        baseTestCase.variants = [
          {
            name: 'empty',
            props: { values: {}, errors: {} },
            description: 'Empty form',
            tags: ['empty', 'initial']
          },
          {
            name: 'filled',
            props: { 
              values: { name: 'Test', email: 'test@example.com' },
              errors: {}
            },
            description: 'Form with values',
            tags: ['filled', 'data']
          },
          {
            name: 'with_errors',
            props: {
              values: { name: '', email: 'invalid' },
              errors: { name: 'Required', email: 'Invalid email' }
            },
            description: 'Form with validation errors',
            tags: ['errors', 'validation']
          }
        ]
        break

      default:
        baseTestCase.variants = [
          {
            name: 'default',
            props: {},
            description: 'Default state',
            tags: ['default']
          }
        ]
    }

    return [baseTestCase]
  },

  /**
   * Clean old snapshots for category
   */
  cleanOldSnapshots(category: string, id: string, olderThanDays = 30): number {
    const snapshotDir = path.join(SNAPSHOT_CONFIG.snapshotDir, category)
    if (!fs.existsSync(snapshotDir)) return 0

    let cleaned = 0
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    const files = fs.readdirSync(snapshotDir).filter(f => f.startsWith(`${id}_`))
    
    files.forEach(file => {
      const filepath = path.join(snapshotDir, file)
      const stats = fs.statSync(filepath)
      
      if (stats.mtime < cutoffDate) {
        fs.unlinkSync(filepath)
        cleaned++
      }
    })

    return cleaned
  }
}