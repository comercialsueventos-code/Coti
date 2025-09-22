const puppeteer = require('puppeteer');
const fs = require('fs');

async function quickDebug() {
  console.log('🚀 ULTRATHINK Quick Debug - Finding $232k vs $224k discrepancy');
  
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  const page = await browser.newPage();
  
  // Listen for console logs
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('CALCULATION') || text.includes('232') || text.includes('224') || text.includes('total')) {
      console.log('📊 APP:', text);
    }
  });

  try {
    // Navigate to app
    console.log('🌐 Loading app...');
    await page.goto('http://localhost:3001', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Take screenshot of homepage
    await page.screenshot({ path: 'debug-homepage.png' });
    console.log('📸 Homepage screenshot taken');

    // Extract all monetary values visible on homepage
    console.log('💰 Scanning for monetary values...');
    const allValues = await page.evaluate(() => {
      const values = [];
      const textNodes = document.querySelectorAll('*');
      
      textNodes.forEach(node => {
        const text = node.textContent || '';
        // Look for currency patterns
        const matches = text.match(/\$[\s]*[\d,]+\.?\d*/g);
        if (matches) {
          matches.forEach(match => {
            values.push({
              value: match.trim(),
              element: node.tagName,
              class: node.className,
              context: text.substring(0, 100)
            });
          });
        }
        
        // Look for specific problematic values
        if (text.includes('232') || text.includes('224')) {
          values.push({
            value: 'POTENTIAL_ISSUE',
            text: text.substring(0, 100),
            element: node.tagName
          });
        }
      });
      
      return values;
    });

    console.log(`💰 Found ${allValues.length} monetary references:`);
    allValues.forEach((v, i) => {
      console.log(`${i+1}. ${v.value} in ${v.element} - "${v.context || v.text}"`);
    });

    // Try to navigate to pricing calculator
    console.log('🧮 Looking for pricing calculator...');
    try {
      // Look for navigation elements
      await page.waitForSelector('a, button, nav', { timeout: 5000 });
      
      // Try to find pricing/calculator link
      const pricingLink = await page.$('a[href*="pricing"], button:contains("Pricing"), button:contains("Calculadora")');
      if (pricingLink) {
        console.log('🎯 Found pricing calculator link');
        await pricingLink.click();
        await page.waitForTimeout(3000);
        
        // Take screenshot of pricing page
        await page.screenshot({ path: 'debug-pricing.png' });
        console.log('📸 Pricing page screenshot taken');
        
        // Extract values from pricing page
        const pricingValues = await page.evaluate(() => {
          const results = [];
          const elements = document.querySelectorAll('*');
          
          elements.forEach(el => {
            const text = el.textContent || '';
            
            // Look for totals, subtotals, margins
            if (text.includes('Total') || text.includes('Subtotal') || text.includes('Margen')) {
              results.push({
                type: 'calculation_line',
                text: text.trim().substring(0, 150),
                element: el.tagName,
                className: el.className
              });
            }
            
            // Look for the specific problematic amounts
            if (text.includes('232,643') || text.includes('224,643') || text.includes('232.643') || text.includes('224.643')) {
              results.push({
                type: 'PROBLEMATIC_AMOUNT',
                text: text.trim(),
                element: el.tagName,
                className: el.className
              });
            }
          });
          
          return results;
        });
        
        console.log('\n🔍 PRICING PAGE ANALYSIS:');
        pricingValues.forEach((v, i) => {
          console.log(`${i+1}. [${v.type}] ${v.text}`);
        });
      }
    } catch (e) {
      console.log('⚠️  Could not navigate to pricing calculator:', e.message);
    }

    // Check quotes list
    console.log('\n📋 Checking quotes page...');
    try {
      await page.goto('http://localhost:3001/quotes', { waitUntil: 'networkidle2', timeout: 15000 });
      await page.screenshot({ path: 'debug-quotes.png' });
      
      const quotesData = await page.evaluate(() => {
        const quotes = [];
        const cards = document.querySelectorAll('[class*="card"], [class*="quote"], .MuiCard-root, .MuiPaper-root');
        
        cards.forEach(card => {
          const text = card.textContent || '';
          
          // Look for quote numbers
          const quoteNumber = text.match(/SUE-\d{4}-\d{3}/);
          const totalAmount = text.match(/Total[:\s]*(\$[\d,]+\.?\d*)/);
          
          if (quoteNumber || totalAmount) {
            quotes.push({
              quoteNumber: quoteNumber ? quoteNumber[0] : null,
              totalAmount: totalAmount ? totalAmount[1] : null,
              fullText: text.substring(0, 200)
            });
          }
        });
        
        return quotes;
      });
      
      console.log('\n📋 QUOTES FOUND:');
      quotesData.forEach((q, i) => {
        console.log(`${i+1}. Quote: ${q.quoteNumber || 'N/A'} | Total: ${q.totalAmount || 'N/A'}`);
        if (q.quoteNumber === 'SUE-2025-015') {
          console.log(`🚨 FOUND PROBLEMATIC QUOTE: ${q.fullText}`);
        }
      });
      
    } catch (e) {
      console.log('⚠️  Could not check quotes page:', e.message);
    }

    // Generate final report
    const report = {
      timestamp: new Date().toISOString(),
      homepage_values: allValues,
      pricing_values: pricingValues || [],
      quotes_data: quotesData || []
    };

    fs.writeFileSync('debug-report.json', JSON.stringify(report, null, 2));
    console.log('\n✅ QUICK DEBUG COMPLETE!');
    console.log('📊 Report saved to debug-report.json');
    console.log('📸 Screenshots: debug-homepage.png, debug-pricing.png, debug-quotes.png');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    await page.screenshot({ path: 'debug-error.png' });
  } finally {
    await browser.close();
  }
}

quickDebug();