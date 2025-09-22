const puppeteer = require('puppeteer');
const fs = require('fs');

async function finalDebug() {
  console.log('🎯 ULTRATHINK Final Debug - Hunting for calculation discrepancies');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50,
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  const page = await browser.newPage();
  
  // Listen for ALL console logs
  page.on('console', msg => {
    console.log(`🟦 BROWSER: ${msg.text()}`);
  });

  const report = {
    findings: [],
    screenshots: []
  };

  try {
    console.log('🌐 Loading application...');
    await page.goto('http://localhost:3001', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('📊 Checking if we have active quotes to examine...');
    
    // Navigate to quotes page
    console.log('📋 Going to quotes page...');
    await page.goto('http://localhost:3001/quotes', { 
      waitUntil: 'networkidle2', 
      timeout: 15000 
    });

    await page.screenshot({ path: 'debug-quotes-page.png' });
    report.screenshots.push('debug-quotes-page.png');

    // Look for all quotes and their details
    const quotesInfo = await page.evaluate(() => {
      const quotes = [];
      
      // Look for all clickable quote elements
      const quoteCards = document.querySelectorAll('[class*="card"], [class*="quote"], .MuiCard-root, .MuiPaper-root, [role="button"]');
      
      quoteCards.forEach((card, index) => {
        const text = card.textContent || '';
        
        // Look for SUE-2025 pattern
        const quoteNumberMatch = text.match(/SUE-\d{4}-\d{3}/);
        
        // Look for money amounts
        const moneyMatches = text.match(/\$[\s\d,]+\.?\d*/g) || [];
        
        // Look for the specific problematic amounts
        const hasProblematicAmount = text.includes('232') || text.includes('224');
        
        if (quoteNumberMatch || moneyMatches.length > 0 || hasProblematicAmount) {
          quotes.push({
            index,
            quoteNumber: quoteNumberMatch ? quoteNumberMatch[0] : null,
            moneyAmounts: moneyMatches,
            hasProblematicAmount,
            textSnippet: text.substring(0, 300),
            element: card.tagName,
            className: card.className
          });
        }
      });
      
      return quotes;
    });

    console.log(`\n📋 FOUND ${quotesInfo.length} QUOTES:`);
    quotesInfo.forEach((q, i) => {
      console.log(`${i+1}. ${q.quoteNumber || 'No Number'} | Money: [${q.moneyAmounts.join(', ')}] | Problematic: ${q.hasProblematicAmount}`);
      if (q.hasProblematicAmount) {
        console.log(`   🚨 POTENTIAL ISSUE: ${q.textSnippet}`);
      }
    });

    // Try to click on the first quote to see details
    if (quotesInfo.length > 0) {
      console.log('\n🔍 Examining first quote in detail...');
      
      try {
        // Click on the first quote
        await page.click(`[class*="card"]:first-of-type, .MuiCard-root:first-of-type`);
        await page.waitForTimeout(3000);
        
        await page.screenshot({ path: 'debug-quote-detail.png' });
        report.screenshots.push('debug-quote-detail.png');
        
        // Extract detailed information
        const quoteDetail = await page.evaluate(() => {
          const calculations = [];
          const elements = document.querySelectorAll('*');
          
          elements.forEach(el => {
            const text = el.textContent || '';
            
            // Look for calculation-related text
            if (text.includes('Total') || text.includes('Subtotal') || text.includes('Margen') || 
                text.includes('Retención') || text.includes('232') || text.includes('224')) {
              calculations.push({
                text: text.trim(),
                tag: el.tagName,
                className: el.className
              });
            }
          });
          
          return calculations;
        });
        
        console.log('\n💰 QUOTE DETAIL CALCULATIONS:');
        quoteDetail.forEach((calc, i) => {
          console.log(`${i+1}. ${calc.text}`);
        });
        
        report.findings.push({
          type: 'quote_detail_calculations',
          data: quoteDetail
        });
        
      } catch (e) {
        console.log('⚠️ Could not examine quote detail:', e.message);
      }
    }

    // Try to go to pricing calculator
    console.log('\n🧮 Attempting to access pricing calculator...');
    try {
      await page.goto('http://localhost:3001/pricing', { 
        waitUntil: 'networkidle2', 
        timeout: 15000 
      });
      
      await page.screenshot({ path: 'debug-pricing-calculator.png' });
      report.screenshots.push('debug-pricing-calculator.png');
      
      console.log('✅ Successfully accessed pricing calculator');
      
      // Look for any existing calculations or forms
      const pricingElements = await page.evaluate(() => {
        const elements = [];
        const nodes = document.querySelectorAll('input, select, div, span, p');
        
        nodes.forEach(node => {
          const text = node.textContent || node.value || '';
          
          // Look for any pre-filled values or calculations
          if (text && (text.includes('$') || text.includes('232') || text.includes('224') || 
                      text.includes('Total') || text.includes('Subtotal'))) {
            elements.push({
              text: text.trim(),
              tag: node.tagName,
              type: node.type || 'N/A',
              className: node.className,
              value: node.value || 'N/A'
            });
          }
        });
        
        return elements;
      });
      
      console.log('\n🧮 PRICING CALCULATOR ELEMENTS:');
      pricingElements.forEach((el, i) => {
        console.log(`${i+1}. [${el.tag}] ${el.text} | Value: ${el.value}`);
      });
      
      report.findings.push({
        type: 'pricing_calculator_elements',
        data: pricingElements
      });
      
    } catch (e) {
      console.log('⚠️ Could not access pricing calculator:', e.message);
    }

    // Save comprehensive report
    fs.writeFileSync('comprehensive-debug-report.json', JSON.stringify(report, null, 2));
    
    console.log('\n✅ COMPREHENSIVE DEBUG COMPLETE!');
    console.log('📊 Report saved to: comprehensive-debug-report.json');
    console.log('📸 Screenshots taken:', report.screenshots.length);
    console.log('🔍 Findings recorded:', report.findings.length);

    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Review the screenshots to see the UI');
    console.log('2. Check comprehensive-debug-report.json for detailed data');
    console.log('3. Look for discrepancies between displayed values');

  } catch (error) {
    console.error('❌ Debug process failed:', error.message);
    await page.screenshot({ path: 'debug-final-error.png' });
  } finally {
    console.log('\n⏸️  Browser will stay open for 10 seconds for manual inspection...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

finalDebug();