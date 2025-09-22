const puppeteer = require('puppeteer');

async function checkCurrentState() {
  let browser;
  try {
    console.log('🔍 Checking current application state...');
    
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

    // Navigate to the application
    console.log('📍 Navigating to application...');
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait a bit for the page to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Navigate to quotes page
    console.log('📋 Going to Quotes page...');
    try {
      // Try to click on the quotes navigation
      await page.click('a[href="/quotes"], a[href="/cotizaciones"]');
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (e) {
      console.log('⚠️ Could not find quotes navigation, trying URL navigation...');
      await page.goto('http://localhost:3002/quotes', { waitUntil: 'networkidle2' });
    }

    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Take screenshot
    await page.screenshot({ 
      path: 'current-quotes-state.png', 
      fullPage: true 
    });
    console.log('📸 Screenshot saved as current-quotes-state.png');

    // Look for specific issues
    console.log('\n🔍 Checking for display issues...');
    
    // Check for quote numbers appearing where they shouldn't
    const pageText = await page.evaluate(() => document.body.innerText);
    
    if (pageText.includes('SUE-2025-015') || pageText.includes('SUE-2025-016')) {
      console.log('✅ Found quote numbers in page');
      
      // Check if these appear near monetary values
      const suspiciousElements = await page.evaluate(() => {
        const elements = [];
        const allText = document.querySelectorAll('*');
        
        allText.forEach(el => {
          const text = el.innerText || el.textContent || '';
          if (text.includes('SUE-2025-015') || text.includes('SUE-2025-016')) {
            elements.push({
              text: text.trim(),
              tagName: el.tagName,
              className: el.className,
              context: el.parentElement ? el.parentElement.innerText?.substring(0, 200) : 'No parent'
            });
          }
        });
        
        return elements;
      });
      
      console.log('🔍 Elements containing quote numbers:');
      suspiciousElements.forEach((el, i) => {
        console.log(`${i+1}. ${el.tagName}.${el.className}: "${el.text}"`);
        console.log(`   Context: "${el.context}"`);
        console.log('');
      });
    }

    // Check for any monetary value displays
    const monetaryElements = await page.evaluate(() => {
      const elements = [];
      const moneyRegex = /\$[\d,]+|\$\s*[\d,]+|[\d,]+\s*COP|Total.*[\d,]/i;
      const allText = document.querySelectorAll('*');
      
      allText.forEach(el => {
        const text = el.innerText || el.textContent || '';
        if (moneyRegex.test(text) && text.length < 100) {
          elements.push({
            text: text.trim(),
            tagName: el.tagName,
            className: el.className
          });
        }
      });
      
      return elements.slice(0, 10); // Limit to first 10 matches
    });
    
    console.log('\n💰 Monetary elements found:');
    monetaryElements.forEach((el, i) => {
      console.log(`${i+1}. ${el.tagName}.${el.className}: "${el.text}"`);
    });

  } catch (error) {
    console.error('❌ Error during check:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

checkCurrentState().catch(console.error);