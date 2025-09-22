const puppeteer = require('puppeteer');

async function finalHunt() {
  console.log('🎯 FINAL BUG HUNT: Complete analysis');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Capture all console logs
  page.on('console', msg => console.log(`🟦 BROWSER: ${msg.text()}`));

  try {
    await page.goto('http://localhost:3001/pricing');
    await page.waitForSelector('body');
    
    console.log('✅ Page loaded, taking initial screenshot...');
    await page.screenshot({ path: 'final-hunt-1-initial.png' });
    
    // Configure the form with data that might trigger the bug
    console.log('📝 Configuring form...');
    await page.evaluate(() => {
      // Set event name
      const eventName = document.querySelector('input[placeholder*="evento"], input[name*="event"]');
      if (eventName) {
        eventName.value = 'Evento Corporativo Test';
        eventName.dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      // Set dates for December (high season)
      const dates = document.querySelectorAll('input[type="date"]');
      if (dates.length >= 2) {
        dates[0].value = '2025-12-20';
        dates[1].value = '2025-12-20';
        dates[0].dispatchEvent(new Event('change', { bubbles: true }));
        dates[1].dispatchEvent(new Event('change', { bubbles: true }));
      }
      
      // Set long hours (12 hours)
      const times = document.querySelectorAll('input[type="time"]');
      if (times.length >= 2) {
        times[0].value = '08:00';
        times[1].value = '20:00';
        times[0].dispatchEvent(new Event('change', { bubbles: true }));
        times[1].dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    
    // Wait using setTimeout
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('📸 Taking configured form screenshot...');
    await page.screenshot({ path: 'final-hunt-2-configured.png' });
    
    // Try to add employees and products
    console.log('➕ Adding employees and products...');
    await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      let clicks = 0;
      
      buttons.forEach(btn => {
        if (btn.textContent.includes('Agregar') && clicks < 4) {
          btn.click();
          clicks++;
          console.log('Button clicked:', btn.textContent);
        }
      });
    });
    
    // Wait for additions
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('📸 Taking items added screenshot...');
    await page.screenshot({ path: 'final-hunt-3-items.png' });
    
    // Extract comprehensive data
    const finalData = await page.evaluate(() => {
      const results = {
        all_text_content: [],
        money_values: [],
        potential_bugs: [],
        form_state: {},
        calculations: []
      };
      
      // Get all visible text
      document.querySelectorAll('*').forEach(el => {
        const text = el.textContent;
        if (text && text.trim().length > 0) {
          
          // Money values
          const money = text.match(/\$[\s\d,]+\.?\d*/g);
          if (money) {
            money.forEach(m => {
              results.money_values.push({
                amount: m,
                context: text.substring(0, 80),
                element: el.tagName
              });
            });
          }
          
          // Look for specific problematic values
          if (text.includes('232') || text.includes('224')) {
            results.potential_bugs.push({
              text: text.substring(0, 100),
              element: el.tagName,
              className: el.className
            });
          }
          
          // Calculations
          if (text.includes('Total') || text.includes('Subtotal') || 
              text.includes('Margen') || text.includes('Retención')) {
            results.calculations.push({
              text: text.substring(0, 120),
              element: el.tagName
            });
          }
        }
      });
      
      // Get form state
      document.querySelectorAll('input, select').forEach(input => {
        if (input.value) {
          results.form_state[input.name || input.type] = input.value;
        }
      });
      
      return results;
    });
    
    console.log('\n🔍 COMPREHENSIVE ANALYSIS:');
    console.log('========================');
    
    console.log('\n💰 MONEY VALUES FOUND:');
    finalData.money_values.forEach((m, i) => {
      console.log(`${i+1}. ${m.amount} - "${m.context}"`);
    });
    
    console.log('\n📊 CALCULATIONS FOUND:');
    finalData.calculations.forEach((c, i) => {
      console.log(`${i+1}. ${c.text}`);
    });
    
    console.log('\n🚨 POTENTIAL BUG INDICATORS:');
    finalData.potential_bugs.forEach((b, i) => {
      console.log(`${i+1}. ${b.text} (${b.element})`);
    });
    
    console.log('\n📝 FORM STATE:');
    Object.entries(finalData.form_state).forEach(([key, value]) => {
      console.log(`${key}: ${value}`);
    });
    
    // Save comprehensive report
    require('fs').writeFileSync('final-hunt-report.json', JSON.stringify(finalData, null, 2));
    
    console.log('\n🎯 HUNT SUMMARY:');
    console.log(`💰 Money values found: ${finalData.money_values.length}`);
    console.log(`📊 Calculation elements: ${finalData.calculations.length}`);
    console.log(`🚨 Potential issues: ${finalData.potential_bugs.length}`);
    console.log('📋 Full report saved to: final-hunt-report.json');
    console.log('📸 Screenshots: final-hunt-1-initial.png, final-hunt-2-configured.png, final-hunt-3-items.png');
    
    console.log('\n⏸️ Browser staying open for 20 seconds...');
    await new Promise(resolve => setTimeout(resolve, 20000));
    
  } catch (error) {
    console.error('❌ Final hunt failed:', error);
    await page.screenshot({ path: 'final-hunt-error.png' });
  } finally {
    await browser.close();
    console.log('🏁 Hunt complete!');
  }
}

finalHunt();