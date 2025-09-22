const puppeteer = require('puppeteer');

async function checkQuoteCards() {
  let browser;
  try {
    console.log('🔍 Checking quote cards display...');
    
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

    // Navigate to the quotes page
    console.log('📍 Navigating to quotes page...');
    await page.goto('http://localhost:3002/quotes', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Click on "Cotizaciones Existentes" tab
    console.log('📋 Clicking on Cotizaciones Existentes tab...');
    try {
      await page.evaluate(() => {
        // Find the tab with "Cotizaciones Existentes" text
        const tabs = Array.from(document.querySelectorAll('button[role="tab"], .MuiTab-root'));
        const targetTab = tabs.find(tab => tab.textContent?.includes('Cotizaciones Existentes'));
        if (targetTab) {
          targetTab.click();
        }
      });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (e) {
      console.log('⚠️ Could not click tab, trying different approach...');
    }

    // Take screenshot of the quote cards
    await page.screenshot({ 
      path: 'quote-cards-display.png', 
      fullPage: true 
    });
    console.log('📸 Screenshot saved as quote-cards-display.png');

    // Look for SUE-2025-015 and SUE-2025-016 in quote cards
    console.log('\n🔍 Analyzing quote card contents...');
    
    const quoteCardAnalysis = await page.evaluate(() => {
      const results = [];
      
      // Look for quote cards (MuiCard-root or similar)
      const cards = document.querySelectorAll('.MuiCard-root, [class*="Card"]');
      
      cards.forEach((card, index) => {
        const cardText = card.innerText || card.textContent || '';
        
        if (cardText.includes('SUE-2025-015') || cardText.includes('SUE-2025-016')) {
          // Find all text elements in this card
          const textElements = Array.from(card.querySelectorAll('*')).map(el => ({
            tag: el.tagName,
            class: el.className,
            text: (el.innerText || el.textContent || '').trim()
          })).filter(item => item.text.length > 0 && item.text.length < 200);
          
          results.push({
            cardIndex: index,
            cardText: cardText.substring(0, 500),
            elements: textElements.slice(0, 10)
          });
        }
      });
      
      return results;
    });

    console.log('📋 Quote card analysis results:');
    if (quoteCardAnalysis.length === 0) {
      console.log('❌ No quote cards found with SUE-2025-015 or SUE-2025-016');
      
      // Let's check what's actually displayed
      const allCards = await page.evaluate(() => {
        const cards = document.querySelectorAll('.MuiCard-root, [class*="Card"]');
        return Array.from(cards).map((card, i) => ({
          index: i,
          text: (card.innerText || card.textContent || '').substring(0, 300)
        }));
      });
      
      console.log('\n📋 All cards found:');
      allCards.forEach(card => {
        console.log(`Card ${card.index}: ${card.text}`);
        console.log('---');
      });
      
    } else {
      quoteCardAnalysis.forEach((card, i) => {
        console.log(`\n🔍 CARD ${card.cardIndex}:`);
        console.log(`Full text: ${card.cardText}`);
        console.log('Elements:');
        card.elements.forEach(el => {
          console.log(`  - ${el.tag}.${el.class}: "${el.text}"`);
        });
      });
    }

    // Check for any binding issues where numbers appear instead of monetary values
    const bindingIssues = await page.evaluate(() => {
      const issues = [];
      const elements = document.querySelectorAll('*');
      
      elements.forEach(el => {
        const text = el.innerText || el.textContent || '';
        // Look for patterns where a quote number might appear where money should be
        if (text.includes('Total:') && text.includes('SUE-2025-')) {
          issues.push({
            text: text.trim(),
            tag: el.tagName,
            class: el.className,
            parent: el.parentElement ? el.parentElement.tagName : 'None'
          });
        }
      });
      
      return issues;
    });

    if (bindingIssues.length > 0) {
      console.log('\n🚨 POTENTIAL BINDING ISSUES FOUND:');
      bindingIssues.forEach((issue, i) => {
        console.log(`${i+1}. ${issue.tag}.${issue.class}: "${issue.text}"`);
      });
    } else {
      console.log('\n✅ No obvious binding issues found');
    }

  } catch (error) {
    console.error('❌ Error during check:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

checkQuoteCards().catch(console.error);