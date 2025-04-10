const fs = require('fs');
const path = require('path');
const express = require('express');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 8000;
const filePath = path.join(__dirname, 'codes.json');
const EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds
app.use(express.json());


// Email Configuration
const transporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com', // Hostinger's SMTP server
    port: 465, // or 587 if TLS
    secure: true, // true for port 465, false for 587
    auth: {
        user: 'otp@callinclinic.com', // your custom email
        pass: 'otp@IPMC123'   // your Hostinger email password
    }
});

// Function to generate a single random 5-digit number
function generateRandomNumber() {
    return Math.floor(1000 + Math.random() * 9000);
}

// Function to read existing codes from file
function readCodes() {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data) || [];
    } catch (err) {
        return [];
    }
}

// Function to write codes to file
function writeCodes(codes) {
    fs.writeFileSync(filePath, JSON.stringify(codes, null, 2));
}

// Function to send email with the generated code
function sendEmail(code, recipientEmail) {
    const mailOptions = {
        from: 'otp@callinclinic.com',
        to: recipientEmail,
        subject: 'Call in Clinic OTP Verification Code',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px; max-width: 400px; margin: auto; background-color: #f9f9f9;">
                <h2 style="color: #333; text-align: center;">Call in Clinic OTP</h2>
                <p style="font-size: 16px; color: #555; text-align: center;">Hello,</p>
                <p style="font-size: 18px; color: #222; text-align: center;">
                    Your verification code is: 
                    <strong style="font-size: 22px; color: #007BFF;">${code}</strong>
                </p>
                <p style="font-size: 14px; color: #777; text-align: center;">
                    Please enter it within <strong>5 minutes</strong> to proceed.
                </p>
                <p style="font-size: 14px; color: #999; text-align: center;">
                    If you didn’t request this, ignore this email.
                </p>
            </div>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
}




// Route to generate and send OTP
app.post('/send_code', (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    const codes = readCodes();
    const newCode = { code: generateRandomNumber(), timestamp: Date.now(), email };
    codes.push(newCode);

    const validCodes = codes.filter(code => Date.now() - code.timestamp < EXPIRY_TIME);
    writeCodes(validCodes);

    sendEmail(newCode.code, email);

    res.json({ message: 'OTP sent successfully', email, code: newCode.code });
});




// Route to verify OTP
app.get('/verify', (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).json({ error: 'Code is required' });
    }

    const codes = readCodes();
    const isValid = codes.some(c => c.code == code);

    res.json({ valid: isValid });
});


// Route to check stored codes (for testing)
app.get('/', (req, res) => {
    res.json({ message: 'Server is running', codes: readCodes().map(c => c.code) });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
