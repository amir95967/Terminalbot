import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    
    const randomStr = Math.random().toString(36).substring(2, 7);
    const email = `amir${randomStr}@maildrop.cc`;
    const password = "Amir" + Math.floor(1000 + Math.random() * 9000) + "!";
    const nextMonth = (new Date().getMonth() + 2) % 12 || 12;

    // קוד נקי עבור Browserless
    const code = `
        async function run() {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.goto('https://www.terminalx.com/customer/account/create/', { waitUntil: 'networkidle2' });
            
            await page.waitForSelector('input[name="firstname"]');
            await page.fill('input[name="firstname"]', 'Amir');
            await page.fill('input[name="lastname"]', 'Shaul');
            await page.fill('input[name="email"]', '${email}');
            await page.fill('input[name="password"]', '${password}');
            
            // בחירת מגדר
            const gender = await page.$('input[value="1"]');
            if (gender) await gender.click();

            // תאריך לידה
            await page.select('select[name="day"]', '15');
            await page.select('select[name="month"]', '${nextMonth}');
            await page.select('select[name="year"]', '1995');

            // לחיצה על הרשמה
            await page.click('button.submit');
            await page.waitForTimeout(5000);
            
            await browser.close();
            return { status: 'success' };
        }
    `;

    try {
        const response = await fetch(`https://chrome.browserless.io/js?token=${process.env.BROWSERLESS_KEY}`, {
            method: 'POST',
            body: code, // שולחים את הקוד כטקסט פשוט
            headers: { 'Content-Type': 'application/javascript' }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Browserless Error: ${errorText}`);
        }

        // אם הגענו לכאן, הבוט סיים לעבוד בענן - נשמור לסופהבייס
        const { error } = await supabase.from('coupons').insert([
            { 
                terminal_email: email, 
                terminal_password: password, 
                inbox_url: `https://maildrop.cc/inbox/?mailbox=${email.split('@')[0]}` 
            }
        ]);

        if (error) throw error;
        return res.status(200).json({ success: true, email });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
