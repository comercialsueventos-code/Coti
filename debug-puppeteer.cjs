const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class SUEDebugger {
  constructor() {
    this.browser = null;
    this.page = null;
    this.report = {
      timestamp: new Date().toISOString(),
      calculations: {},
      discrepancies: [],
      screenshots: [],
      consoleErrors: []
    };
  }

  async init() {
    console.log('🤖 ULTRATHINK: Initializing automated debugger...');
    this.browser = await puppeteer.launch({
      headless: false, // Show browser for debugging
      slowMo: 100, // Slow down actions for visibility
      defaultViewport: { width: 1920, height: 1080 }
    });
    
    this.page = await this.browser.newPage();
    
    // Listen for console messages from the app
    this.page.on('console', msg => {
      const text = msg.text();
      if (text.includes('ULTRATHINK') || text.includes('calculation') || text.includes('total')) {
        console.log('📊 APP LOG:', text);
        this.report.consoleErrors.push(text);
      }
    });

    // Navigate to the application
    console.log('🌐 Navigating to application...');
    await this.page.goto('http://localhost:3001', { waitUntil: 'networkidle2' });
    
    // Take initial screenshot
    await this.screenshot('01-initial-load');
    
    return true;
  }

  async screenshot(name) {
    const filename = `debug-${name}-${Date.now()}.png`;
    const filepath = path.join(__dirname, 'debug-screenshots', filename);
    
    // Create directory if it doesn't exist
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    await this.page.screenshot({ path: filepath, fullPage: true });
    this.report.screenshots.push({ name, filename, filepath });
    console.log(`📸 Screenshot saved: ${filename}`);
  }

  async navigateToPricingCalculator() {
    console.log('🧮 Navigating to Pricing Calculator...');
    
    // Look for pricing/calculator navigation
    await this.page.waitForSelector('a[href="/pricing"], button:contains("Calculadora"), button:contains("Pricing")', { timeout: 10000 });
    
    // Try different ways to navigate to pricing
    try {
      await this.page.click('a[href="/pricing"]');
    } catch {
      try {
        await this.page.click('button:has-text("Calculadora")');
      } catch {
        // Manual navigation
        await this.page.goto('http://localhost:3001/pricing', { waitUntil: 'networkidle2' });
      }
    }
    
    await this.page.waitForTimeout(2000);
    await this.screenshot('02-pricing-calculator');
  }

  async setupTestQuote() {
    console.log('💰 Setting up test quote...');
    
    try {
      // Wait for form elements to load
      await this.page.waitForSelector('input, select, button', { timeout: 10000 });
      
      // Fill client information
      const clientSelect = await this.page.$('select[name*="client"], div[role="combobox"]');
      if (clientSelect) {
        await clientSelect.click();
        await this.page.waitForTimeout(1000);
        // Select first client option
        const firstOption = await this.page.$('option:nth-child(2), li[role="option"]:first-child');
        if (firstOption) await firstOption.click();
      }

      // Fill event details
      const eventNameInput = await this.page.$('input[name*="event"], input[placeholder*="evento"], input[placeholder*="título"]');
      if (eventNameInput) {
        await eventNameInput.clear();
        await eventNameInput.type('Evento Corporativo Debug Test');
      }

      // Set dates
      const startDateInput = await this.page.$('input[type="date"]:first-of-type');
      if (startDateInput) {
        await startDateInput.focus();
        await startDateInput.evaluate(input => input.value = '2025-12-15');
      }

      const endDateInput = await this.page.$('input[type="date"]:nth-of-type(2)');
      if (endDateInput) {
        await endDateInput.focus();
        await endDateInput.evaluate(input => input.value = '2025-12-15');
      }

      // Set times
      const startTimeInput = await this.page.$('input[type="time"]:first-of-type');
      if (startTimeInput) {
        await startTimeInput.focus();
        await startTimeInput.evaluate(input => input.value = '08:00');
      }

      const endTimeInput = await this.page.$('input[type="time"]:nth-of-type(2)');
      if (endTimeInput) {
        await endTimeInput.focus();
        await endTimeInput.evaluate(input => input.value = '18:00');
      }

      await this.screenshot('03-event-details-filled');

      // Add employees
      const addEmployeeBtn = await this.page.$('button:has-text("Agregar Empleado"), button:has-text("Add Employee")');
      if (addEmployeeBtn) {
        await addEmployeeBtn.click();
        await this.page.waitForTimeout(1000);
      }

      // Add products
      const addProductBtn = await this.page.$('button:has-text("Agregar Producto"), button:has-text("Add Product")');
      if (addProductBtn) {
        await addProductBtn.click();
        await this.page.waitForTimeout(1000);
      }

      await this.screenshot('04-employees-products-added');

      return true;
    } catch (error) {
      console.error('❌ Error setting up test quote:', error.message);
      await this.screenshot('04-error-setup');
      return false;
    }
  }

  async captureCalculationResults() {
    console.log('📊 Capturing calculation results...');
    
    try {
      // Wait for results to appear
      await this.page.waitForSelector('[class*="result"], [class*="total"], [class*="summary"]', { timeout: 5000 });
      
      // Extract all monetary values from the page
      const values = await this.page.evaluate(() => {
        const results = {
          displayed_totals: [],
          quote_numbers: [],
          all_currency_values: []
        };

        // Find all elements with currency formatting
        const currencyElements = document.querySelectorAll('*');
        currencyElements.forEach(el => {
          const text = el.textContent || '';
          
          // Look for currency values ($ followed by numbers)
          const currencyMatches = text.match(/\$\s*[\d,]+\.?\d*/g);
          if (currencyMatches) {
            currencyMatches.forEach(match => {
              results.all_currency_values.push({
                value: match,
                element: el.tagName,
                className: el.className,
                text: text.trim().substring(0, 100)
              });
            });
          }

          // Look for quote numbers (SUE-YYYY-XXX pattern)
          const quoteMatches = text.match(/SUE-\d{4}-\d{3}/g);
          if (quoteMatches) {
            quoteMatches.forEach(match => {
              results.quote_numbers.push({
                value: match,
                element: el.tagName,
                className: el.className,
                text: text.trim().substring(0, 100)
              });
            });
          }

          // Look for specific totals
          if (text.includes('Total') || text.includes('TOTAL')) {
            results.displayed_totals.push({
              text: text.trim(),
              element: el.tagName,
              className: el.className
            });
          }
        });

        return results;
      });

      this.report.calculations = values;
      
      // Look for specific problematic values
      const problematicValues = values.all_currency_values.filter(v => 
        v.value.includes('232,643') || v.value.includes('224,643')
      );
      
      if (problematicValues.length > 0) {
        console.log('🚨 Found problematic values:', problematicValues);
        this.report.discrepancies.push({
          type: 'calculation_discrepancy',
          values: problematicValues
        });
      }

      await this.screenshot('05-calculation-results');
      
      return values;
    } catch (error) {
      console.error('❌ Error capturing results:', error.message);
      await this.screenshot('05-error-capture');
      return null;
    }
  }

  async checkQuotesList() {
    console.log('📋 Checking quotes list for display issues...');
    
    try {
      // Navigate to quotes page
      await this.page.goto('http://localhost:3001/quotes', { waitUntil: 'networkidle2' });
      await this.page.waitForTimeout(2000);
      
      await this.screenshot('06-quotes-list');

      // Extract quote information
      const quotesData = await this.page.evaluate(() => {
        const quotes = [];
        const quoteElements = document.querySelectorAll('[class*="card"], [class*="quote"], .MuiCard-root');
        
        quoteElements.forEach((card, index) => {
          const text = card.textContent || '';
          const quoteNumberMatch = text.match(/SUE-\d{4}-\d{3}/);
          const totalMatch = text.match(/Total[:\s]*(\$[\d,]+\.?\d*)/);
          
          if (quoteNumberMatch || totalMatch) {
            quotes.push({
              index,
              quote_number: quoteNumberMatch ? quoteNumberMatch[0] : null,
              total_displayed: totalMatch ? totalMatch[1] : null,
              full_text: text.substring(0, 200)
            });
          }
        });
        
        return quotes;
      });

      this.report.quotes_list = quotesData;
      console.log('📋 Found quotes:', quotesData.length);
      
      return quotesData;
    } catch (error) {
      console.error('❌ Error checking quotes list:', error.message);
      await this.screenshot('06-error-quotes');
      return [];
    }
  }

  async generateReport() {
    console.log('📝 Generating debug report...');
    
    const reportPath = path.join(__dirname, `debug-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(this.report, null, 2));
    
    // Generate human-readable summary
    const summaryPath = path.join(__dirname, `debug-summary-${Date.now()}.md`);
    const summary = `
# 🤖 ULTRATHINK Debug Report
**Generated:** ${this.report.timestamp}

## 🔍 Found Issues

### Currency Values Detected
${this.report.calculations.all_currency_values?.map(v => 
  `- **${v.value}** in ${v.element} (${v.className}): "${v.text}"`
).join('\n') || 'None found'}

### Quote Numbers Found
${this.report.calculations.quote_numbers?.map(q => 
  `- **${q.value}** in ${q.element}: "${q.text}"`
).join('\n') || 'None found'}

### Discrepancies Identified
${this.report.discrepancies.map(d => 
  `- **${d.type}**: ${JSON.stringify(d.values, null, 2)}`
).join('\n') || 'None found'}

### Quotes List Data
${this.report.quotes_list?.map(q => 
  `- Quote: ${q.quote_number || 'N/A'} | Total: ${q.total_displayed || 'N/A'}`
).join('\n') || 'No quotes found'}

### Screenshots Captured
${this.report.screenshots.map(s => `- ${s.name}: ${s.filename}`).join('\n')}

### Console Logs
${this.report.consoleErrors.join('\n') || 'No relevant logs captured'}
`;

    fs.writeFileSync(summaryPath, summary);
    
    console.log('✅ Debug report generated:');
    console.log(`📊 JSON Report: ${reportPath}`);
    console.log(`📝 Summary: ${summaryPath}`);
    
    return { reportPath, summaryPath, report: this.report };
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Run the debugger
async function runDebugger() {
  const sueDebugger = new SUEDebugger();
  
  try {
    await sueDebugger.init();
    await sueDebugger.navigateToPricingCalculator();
    await sueDebugger.setupTestQuote();
    await sueDebugger.captureCalculationResults();
    await sueDebugger.checkQuotesList();
    
    const { report } = await sueDebugger.generateReport();
    
    console.log('\n🎯 ULTRATHINK DEBUG COMPLETE!');
    console.log('📊 Issues found:', report.discrepancies.length);
    console.log('📸 Screenshots captured:', report.screenshots.length);
    
    return report;
  } catch (error) {
    console.error('❌ Debug process failed:', error);
    await sueDebugger.screenshot('error-final');
  } finally {
    await sueDebugger.close();
  }
}

// Export for require or run directly
if (require.main === module) {
  runDebugger()
    .then(report => {
      console.log('🎉 Debugging completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Debugging failed:', error);
      process.exit(1);
    });
}

module.exports = { SUEDebugger, runDebugger };