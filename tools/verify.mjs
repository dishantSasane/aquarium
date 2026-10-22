import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
try {
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(process.env.AQUAVR_URL||'http://localhost:8000');
  await page.waitForFunction(()=>window.aquavr?.status.ready);
  await mkdir('test-results',{recursive:true});
  await page.screenshot({path:'test-results/aquarium.png'});
  console.log(await page.evaluate(()=>window.aquavr.status));
  if(errors.length)throw new Error(errors.join('\n'));
  console.log('Visual startup check passed. Screenshot: test-results/aquarium.png');
} finally {await browser.close();}
