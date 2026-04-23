import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    
    const randomStr = Math.random().toString(36).substring(2, 7);
    const email = `amir${randomStr}@maildrop.cc`;
    const password = "Amir" + Math.floor(1000 + Math.random() * 9000) + "!";
    const nextMonth = (new Date().getMonth() + 2) % 12 || 12;

    // הפקודות שיישלחו ל-Browserless
    const payload = {
        "url": "https://www.terminalx.com/customer/account/create/",
        "options": {
            "fullPage": false
        },
        "gotoOptions": {
            "waitUntil": "networkidle2"
        },
        "scripts": [
            `document.querySelector('input[name="firstname"]').value = "Amir"`,
            `document.querySelector('input[name="lastname"]').value = "Shaul"`,
            `document.querySelector('input[name="email"]').value = "${email}"`,
            `document.querySelector('input[name="password"]').value = "${password}"`,
            `document.querySelector('input[value="1"]').click()`,
            `document.querySelector('select[name="day"]').value = "15"`,
            `document.querySelector('select[name="month"]').value = "${nextMonth}"`,
            `document.querySelector('select[name="year"]').value = "1995"`,
            `document.querySelector('button.submit').click()`
        ]
    };

    try {
        const response = await fetch(`https://chrome.browserless.io/screenshot?token=${process.env.BROWSERLESS_KEY}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Browserless Error: ${errorText}`);
        }

        // אם הגענו לכאן, סימן ש-Browserless הצליח להריץ את ה-Scripts
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
