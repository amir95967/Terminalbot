import { createClient } from '@supabase/supabase-js';
const { chromium } = require('playwright-core');

export default async function handler(req, res) {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    let browser;

    try {
        // התחברות לדפדפן חיצוני - חוסך לורסל את כל המאמץ
        const browserWSEndpoint = `wss://chrome.browserless.io?token=${process.env.BROWSERLESS_KEY}`;
        browser = await chromium.connectOverCDP(browserWSEndpoint);

        const context = await browser.newContext();
        const page = await context.newPage();

        const randomStr = Math.random().toString(36).substring(2, 7);
        const email = `amir${randomStr}@maildrop.cc`;
        const password = "Amir" + Math.floor(1000 + Math.random() * 9000) + "!";

        // גלישה ומילוי (הפעם זה יהיה מהיר ויציב)
        await page.goto('https://www.terminalx.com/customer/account/create/', { waitUntil: 'networkidle' });

        await page.fill('input[name="firstname"]', 'Amir');
        await page.fill('input[name="lastname"]', 'Shaul');
        await page.fill('input[name="email"]', email);
        await page.fill('input[name="password"]', password);
        
        // בחירת מגדר ותאריך לידה (חובה בטרמינל X)
        await page.click('input[value="1"]'); 
        await page.selectOption('select[name="day"]', '10');
        await page.selectOption('select[name="month"]', '6'); // יוני - יומולדת בקרוב!
        await page.selectOption('select[name="year"]', '1995');

        await page.click('button.submit');
        await page.waitForTimeout(5000);

        const { error } = await supabase.from('coupons').insert([
            { terminal_email: email, terminal_password: password, inbox_url: `https://maildrop.cc/inbox/?mailbox=${email.split('@')[0]}` }
        ]);

        if (error) throw error;
        return res.status(200).json({ success: true, email });

    } catch (error) {
        return res.status(500).send("שגיאת בוט: " + error.message);
    } finally {
        if (browser) await browser.close();
    }
}
