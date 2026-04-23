import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    
    const randomStr = Math.random().toString(36).substring(2, 7);
    const email = `amir${randomStr}@maildrop.cc`;
    const password = "Amir" + Math.floor(1000 + Math.random() * 9000) + "!";
    const nextMonth = (new Date().getMonth() + 2) % 12 || 12;

    // זה הקוד שבאמת גולש ולוחץ על הכפתורים
    const script = `
    module.exports = async ({ page }) => {
      await page.goto('https://www.terminalx.com/customer/account/create/', { waitUntil: 'networkidle2' });
      await page.type('input[name="firstname"]', 'Amir');
      await page.type('input[name="lastname"]', 'Shaul');
      await page.type('input[name="email"]', '${email}');
      await page.type('input[name="password"]', '${password}');
      await page.click('input[value="1"]'); // זכר
      await page.select('select[name="day"]', '15');
      await page.select('select[name="month"]', '${nextMonth}');
      await page.select('select[name="year"]', '1995');
      
      await Promise.all([
        page.click('button.submit'),
        page.waitForNavigation({ waitUntil: 'networkidle2' })
      ]);
    };
    `;

    try {
        const response = await fetch(`https://chrome.browserless.io/js?token=${process.env.BROWSERLESS_KEY}`, {
            method: 'POST',
            body: script,
            headers: { 'Content-Type': 'application/javascript' }
        });

        if (!response.ok) throw new Error("Browserless failed to register");

        // רק אם הרישום בבראוזרלס הצליח - שומרים לסופהבייס
        await supabase.from('coupons').insert([
            { 
                terminal_email: email, 
                terminal_password: password, 
                inbox_url: `https://maildrop.cc/inbox/?mailbox=${email.split('@')[0]}` 
            }
        ]);

        return res.status(200).json({ success: true, email, password });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
