import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    // בדיקה שהמפתחות קיימים בשרת
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY || !process.env.BROWSERLESS_KEY) {
        return res.status(500).json({ error: "Missing Environment Variables in Vercel settings" });
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    
    const randomStr = Math.random().toString(36).substring(2, 7);
    const email = `amir${randomStr}@maildrop.cc`;
    const password = "Amir" + Math.floor(1000 + Math.random() * 9000) + "!";
    const nextMonth = (new Date().getMonth() + 2) % 12 || 12;

    const browserContext = {
        "browserWSEndpoint": `wss://chrome.browserless.io?token=${process.env.BROWSERLESS_KEY}`,
        "actions": [
            { "type": "goto", "url": "https://www.terminalx.com/customer/account/create/" },
            { "type": "fill", "selector": "input[name='firstname']", "value": "Amir" },
            { "type": "fill", "selector": "input[name='lastname']", "value": "Shaul" },
            { "type": "fill", "selector": "input[name='email']", "value": email },
            { "type": "fill", "selector": "input[name='password']", "value": password },
            { "type": "click", "selector": "input[value='1']" },
            { "type": "selectOption", "selector": "select[name='day']", "value": "15" },
            { "type": "selectOption", "selector": "select[name='month']", "value": nextMonth.toString() },
            { "type": "selectOption", "selector": "select[name='year']", "value": "1995" },
            { "type": "click", "selector": "button.submit" },
            { "type": "wait", "delay": 5000 }
        ]
    };

    try {
        const response = await fetch(`https://chrome.browserless.io/scratch?token=${process.env.BROWSERLESS_KEY}`, {
            method: 'POST',
            body: JSON.stringify(browserContext),
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Browserless Error: ${errorText}`);
        }

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
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
}
