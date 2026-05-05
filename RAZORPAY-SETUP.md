# Razorpay Integration Setup Guide

This guide will help you properly set up your Razorpay integration with separate environments for development and production.

## 1. Set Up Development Environment (Test Mode)

1. **Get Test Keys from Razorpay**:
   - Log in to your [Razorpay Dashboard](https://dashboard.razorpay.com/)
   - Go to Settings → API Keys
   - Generate new test keys (they'll start with `rzp_test_`)

2. **Create Development Environment File**:
   - Copy `.env.development.template` to `.env.development`
   - Replace the placeholders with your actual test keys:
     \`\`\`
     RAZORPAY_KEY_ID=rzp_test_your_test_key_here
     RAZORPAY_KEY_SECRET=your_test_secret_here
     \`\`\`
   - Keep your existing Supabase and other configuration values

3. **Switch to Development Environment**:
   - Run: `node scripts/switch-env.js dev`
   - This will copy your development environment to `.env.local`

4. **Verify Configuration**:
   - Install ts-node if you haven't already: `npm install -g ts-node`
   - Run: `npx ts-node scripts/verify-env.ts`
   - Make sure there are no warnings

## 2. Set Up Production Environment (Live Mode)

1. **Secure Your Live Keys**:
   - Copy `.env.production.template` to `.env.production`
   - Replace the placeholders with your actual live keys:
     \`\`\`
     RAZORPAY_KEY_ID=rzp_live_your_live_key_here
     RAZORPAY_KEY_SECRET=your_live_secret_here
     \`\`\`
   - Update your production URL and other settings

2. **Switch to Production Environment (Local Testing)**:
   - Run: `node scripts/switch-env.js prod`
   - This will copy your production environment to `.env.local`

3. **Verify Configuration**:
   - Run: `npx ts-node scripts/verify-env.ts`
   - Make sure there are no warnings

## Razorpay Live Keys Setup

This guide will help you set up your application to use Razorpay live keys.

### Quick Setup

1. **Copy the Template File**:
   - Copy `.env.local.template` to `.env.local`
   - Replace the placeholders with your actual live keys

2. **Add Your Live Keys**:
   \`\`\`
   RAZORPAY_KEY_ID=rzp_live_your_actual_key
   RAZORPAY_KEY_SECRET=your_actual_secret
   RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
   \`\`\`

3. **Restart Your Application**:
   - After updating the `.env.local` file, restart your Next.js server

### Important Notes

1. **Real Transactions**: All payments will process real money
2. **Testing**: Use small amounts (₹1) for testing to minimize refund hassle
3. **Security**: Keep your live keys secure and never commit them to version control

## 3. Deployment Configuration

When deploying to production:

1. **Set Environment Variables on Your Hosting Platform**:
   - Add all variables from `.env.production` to your hosting platform (Vercel, etc.)
   - Make sure `NODE_ENV` is set to `production`

2. **Never Commit API Keys to Version Control**:
   - Add these files to your `.gitignore`:
     \`\`\`
     .env.development
     .env.production
     .env.local
     \`\`\`

## 4. Testing Your Integration

### Development Testing:
- Use test card number: 4111 1111 1111 1111
- Any future expiry date
- Any 3-digit CVV
- Any name

### Production Testing:
- Make a small real payment to verify everything works
- Check your Razorpay dashboard to confirm the payment was received

## 5. Troubleshooting

If you encounter issues:

1. Visit `/admin/api-verification` to check your configuration
2. Make sure you're using the correct keys for your environment
3. Check the browser console for any JavaScript errors
4. Verify your webhook configuration if you're using webhooks

### Troubleshooting

If you encounter issues:
1. Visit `/admin/api-verification` to check your configuration
\`\`\`

Let's also create a client component to fetch the Razorpay key from the server:
