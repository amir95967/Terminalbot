const { chromium } = require('playwright-core');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async (req, res) => {
    const userToken = req.headers.authorization;
    const { data: { user } } = await supabase.auth.getUser(userToken);
    if (!user) return res.status(401).send("Unauthorized");

    let browser;
    try {
        browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        const id = Math.floor(Math.random() * 90000) + 10000;
        const email = `amir${id}@maildrop.cc`;
        const pass = "Pass123!@#";

        await page.goto('https://www.terminalx.com/women?auth=register');
        await page.fill('input[name="firstname"]', 'Amir');
        await page.fill('input[name="lastname"]', 'Shaul');
        await page.fill('input[name="email"]', email);
        await page.fill('input[name="password"]', pass);
        await page.selectOption('select[name="birth_day"]', '01');
        await page.selectOption('select[name="birth_month"]', '05');
        await page.selectOption('select[name="birth_year"]', '1995');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(5000);

        await supabase.from('coupons').insert({
            user_id: user.id, terminal_email: email, terminal_password: pass,
            inbox_url: `https://maildrop.cc/inbox/amir${id}`
        });

        await browser.close();
        return res.status(200).send("Success");
    } catch (err) {
        if (browser) await browser.close();
        return res.status(500).send(err.message);
    }
};
