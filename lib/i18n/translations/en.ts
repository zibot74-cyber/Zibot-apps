// ─────────────────────────────────────────────────────────────────────────────
//  lib/i18n/translations/en.ts
//  English (LTR) translation strings.
// ─────────────────────────────────────────────────────────────────────────────

import type { Translations } from '../types'

export const en: Translations = {
  meta: { lang: 'en', dir: 'ltr' },

  // ── Navigation ──────────────────────────────────────────────────────────────
  nav: {
    howItWorks: 'How It Works',
    features: 'Features',
    pricing: 'Pricing',
    faq: 'FAQ',
    subscribe: 'Get Started',
    logoLabel: 'ZIbot - Home',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    mainNav: 'Main navigation',
    mobileNav: 'Mobile menu',
  },

  // ── Hero ────────────────────────────────────────────────────────────────────
  hero: {
    badge: 'Available now · Try free, no card required',
    titlePart1: 'Reply to every customer in',
    titleHighlight: 'under 8 seconds',
    titlePart2: 'without hiring a support agent.',
    description: 'ZIbot instantly replies to your WhatsApp customers in their own dialect, around the clock.',
    startTrial: 'Start Free Trial',
    subscribe: 'Get Started',
    stats: {
      avgResponse: { label: 'Avg. Response', value: '2.3 s' },
      accuracy:    { label: 'Accuracy',      value: '98%' },
      uptime:      { label: 'Uptime',        value: '24/7' },
    },
  },

  // ── Features ─────────────────────────────────────────────────────────────────
  features: {
    badge: 'Features',
    title: 'Everything you need — nothing you don\'t.',
    items: [
      {
        title: 'Real AI Intelligence',
        description: 'Understands customer intent and responds accurately, learning from every conversation.',
      },
      {
        title: 'Available 24/7 Non-Stop',
        description: 'No vacations, no absences. Your customers get a reply any time of day.',
      },
      {
        title: 'Understands Arabic Dialects',
        description: 'Egyptian, Gulf, Levantine, Maghrebi — it replies in the customer\'s own dialect.',
      },
      {
        title: 'Instant Reply in Seconds',
        description: 'Average response time is 2.3 s. Your customers don\'t wait.',
      },
      {
        title: 'Secure & Privacy-Respecting',
        description: 'Your data is encrypted and protected. We never share it with third parties.',
      },
      {
        title: 'Your Brand Voice',
        description: 'We train it on your style and products so it speaks as part of your team.',
      },
    ],
  },

  // ── Pricing ──────────────────────────────────────────────────────────────────
  pricing: {
    badge: 'Pricing',
    title: 'Choose the right plan for your business',
    subtitle:
      'Start with a free trial, or choose a monthly or long-term VIP plan. No commitments, no hidden fees.',
    perMonth: '/ month',
    popular: 'Most Popular',
    durationLabel: 'Service Duration',
    freeTrial: {
      badge: 'Completely Free',
      title: 'Try ZIbot before subscribing',
      description:
        'Try 3 free messages on WhatsApp and see the quality of replies for yourself. No payment card, no commitment.',
      button: 'Start Free Trial',
      note: '3 free messages · Instant activation by barcode',
    },
    plans: [
      {
        name: 'Starter',
        tagline: 'For new and small stores',
        price: '5',
        duration: '10 Days',
        durationNote: 'of continuous replies',
        popular: false,
        cta: 'Start Now',
        features: [
          'Automated WhatsApp replies',
          'Up to 500 conversations/month',
          'Replies in Modern Standard Arabic & dialects',
          'Quick setup within 24 hours',
          'Technical support via WhatsApp',
        ],
      },
      {
        name: 'Growth',
        tagline: 'Most popular choice',
        price: '15',
        duration: '20 Days',
        durationNote: 'of continuous replies',
        popular: true,
        cta: 'Choose Growth',
        features: [
          'All Starter features',
          'Up to 2,000 conversations/month',
          'Custom assistant personality',
          'Training on your products & prices',
          'Weekly conversation reports',
          'Priority technical support',
        ],
      },
      {
        name: 'Professional',
        tagline: 'For large and growing stores',
        price: '20',
        duration: '30 Days',
        durationNote: 'of continuous replies',
        popular: false,
        cta: 'Go Professional',
        features: [
          'All Growth features',
          'Unlimited conversations',
          'Advanced catalog training',
          'Daily detailed reports',
          'Dedicated technical support',
          'Integration with your order system',
        ],
      },
    ],
    vip: {
      badge: 'Long-Term VIP Plans',
      title: 'Pay once, enjoy for months',
      subtitle:
        'For businesses seeking a long-term investment with the best possible value.',
      bestValue: 'Best Value',
      once: 'one-time',
      continuousService: 'of continuous service',
      subscribePrefix: 'Subscribe to',
      plans: [
        {
          name: 'VIP',
          price: '50',
          duration: '2.5 Months',
          description:
            'A long-term subscription that gives you complete peace of mind and significant cost savings, with all professional features.',
        },
        {
          name: 'VIP PRO',
          price: '80',
          duration: '4 Continuous Months',
          description:
            'The absolute best value. Ideal for serious businesses that want a long-term investment with ZIbot.',
        },
      ],
    },
    footer:
      'All prices in USD. To activate any subscription, please contact us directly via WhatsApp.',
  },

  // ── FAQ ───────────────────────────────────────────────────────────────────────
  faq: {
    badge: 'FAQ',
    title: 'Everything you want to know',
    subtitle: 'If you don\'t find your answer here, contact us via WhatsApp and we\'ll reply directly.',
    items: [
      {
        q: 'How do I subscribe to the service?',
        a: 'To subscribe, contact us directly via WhatsApp at +20 103 208 5810. We\'ll explain the plans and activate your chosen subscription in less than 24 hours.',
      },
      {
        q: 'What\'s the difference between monthly and VIP plans?',
        a: 'Monthly plans ($5, $15, $20) give you 10 to 30 days of service. VIP plans are long-term subscriptions — pay once and enjoy 2.5 or 4 continuous months at the best possible value.',
      },
      {
        q: 'Does the AI assistant understand Arabic dialects?',
        a: 'Yes, ZIbot is trained to understand Modern Standard Arabic and many common dialects such as Egyptian, Gulf, Levantine, and Maghrebi, and replies in the customer\'s own style.',
      },
      {
        q: 'Is the platform available on WhatsApp only?',
        a: 'Currently we provide the service fully via WhatsApp. We\'re adding Facebook Messenger and Telegram support soon, and working on integrating more platforms.',
      },
      {
        q: 'How long does assistant setup take?',
        a: 'Setup usually takes less than 24 hours from the date your subscription is activated. During this time we train the assistant on your products, prices, and brand style.',
      },
      {
        q: 'Can I cancel my subscription at any time?',
        a: 'Yes, monthly subscriptions can be cancelled or not renewed at any time without any commitment. VIP plans continue until the paid period ends.',
      },
      {
        q: 'What happens if I encounter a technical issue?',
        a: 'We have a technical support team available throughout the week to answer your questions and help resolve any issue via WhatsApp. Higher-tier plan customers get priority support.',
      },
      {
        q: 'Is my data and my customers\' data secure?',
        a: 'Absolutely. All data is encrypted and protected to the highest security standards, and we never share it with any third party. We are fully committed to your customers\' privacy.',
      },
    ],
  },

  // ── CTA ───────────────────────────────────────────────────────────────────────
  cta: {
    badge: 'Start Today',
    title: 'Your customer is waiting for a reply now.\nDon\'t let them go to a competitor.',
    subtitle:
      'Activate ZIbot in less than 24 hours and start replying to your customers automatically. Free trial, no payment card.',
    button: 'Start Free Trial Now',
    guarantees: [
      'Activation in under 24 hours',
      '3 free messages trial, no card',
      'Cancel anytime, no commitment',
    ],
  },

  // ── Footer ────────────────────────────────────────────────────────────────────
  footer: {
    tagline:
      'ZIbot is an AI assistant that automatically and instantly replies to your business\'s WhatsApp customers, starting from just $5/month.',
    whatsappLabel: 'WhatsApp',
    copyright: '© {year} ZIbot. All rights reserved.',
    privacy: 'Privacy Policy',
    terms: 'Terms & Conditions',
    columns: [
      {
        title: 'Product',
        links: [
          { label: 'Features', href: '/#features' },
          { label: 'How It Works', href: '/#features' },
          { label: 'Pricing', href: '/#pricing' },
          { label: 'FAQ', href: '/#faq' },
        ],
      },
      {
        title: 'Platforms',
        links: [
          { label: 'WhatsApp — Available', href: '#' },
          { label: 'Messenger — Coming Soon', href: '#' },
          { label: 'Telegram — Coming Soon', href: '#' },
        ],
      },
      {
        title: 'Contact',
        links: [
          { label: 'WhatsApp', href: '__WHATSAPP__', external: true },
          { label: 'Support', href: '__WHATSAPP__', external: true },
          { label: 'Subscribe Now', href: '/#pricing' },
        ],
      },
    ],
  },

  // ── Settings dialog ──────────────────────────────────────────────────────────
  settings: {
    badge: 'Settings',
    title: 'Customize ZIbot',
    description: 'Adjust the app\'s appearance and language to your preference.',
    appearanceLabel: 'Appearance',
    languageLabel: 'Language',
    supportLabel: 'Support',
    supportButton: 'Contact Support via WhatsApp',
    themes: { light: 'Light', dark: 'Dark', system: 'System' },
    languages: {
      ar: { name: 'العربية', description: 'Arabic interface with dialect support in replies' },
      en: { name: 'English', description: 'Full English interface' },
    },
  },

  // ── User menu ─────────────────────────────────────────────────────────────────
  userMenu: {
    openMenu: 'Menu',
    openMenuSr: 'Open menu',
    themeLight: 'Light mode',
    themeDark: 'Dark mode',
    settingsLabel: 'Settings',
    viewAccount: 'View Account',
    signIn: 'Sign In',
    signOut: 'Sign Out',
  },

  // ── Theme toggle ──────────────────────────────────────────────────────────────
  themeToggle: {
    enableLight: 'Enable light mode',
    enableDark: 'Enable dark mode',
    titleLight: 'Light mode',
    titleDark: 'Dark mode',
    srToggle: 'Toggle theme',
  },

  // ── Free trial dialog ─────────────────────────────────────────────────────────
  freeTrial: {
    badge: 'Free Trial',
    title: 'Scan the barcode to activate your trial',
    description: '3 free messages to try ZIbot on WhatsApp. No payment card, no commitment.',
    howToScan: 'How do I scan the barcode in WhatsApp?',
    directContact: 'Or contact us directly to activate the trial',
  },

  // ── WhatsApp steps dialog ─────────────────────────────────────────────────────
  whatsappSteps: {
    stepsLabel: 'Steps',
    stepLabel: 'Step',
    stepOf: 'Step {current} / {total}',
    stepBadge: 'Step {n}',
    prev: 'Previous',
    next: 'Next',
    steps: [
      {
        title: 'Open WhatsApp',
        description: 'Open the WhatsApp app on your phone and tap the three-dot icon in the top corner.',
      },
      {
        title: 'Select "Linked Devices"',
        description: 'From the dropdown menu, tap on "Linked Devices".',
      },
      {
        title: 'Tap "Link a Device"',
        description: 'Tap the green "Link a Device" button.',
      },
      {
        title: 'Scan the Barcode',
        description: 'Point your phone camera at the barcode shown on screen and wait for the link to complete.',
      },
    ],
  },

  // ── WhatsApp float button ─────────────────────────────────────────────────────
  whatsappFloat: {
    ariaLabel: 'Contact us via WhatsApp',
    label: 'WhatsApp',
  },

  // ── 404 page ──────────────────────────────────────────────────────────────────
  notFound: {
    number: '404',
    title: 'Page Not Found',
    description:
      'It looks like the page you\'re looking for has moved or never existed. Don\'t worry, you can go back to the home page.',
    backHome: 'Back to Home',
    contactUs: 'Contact Us',
  },
}
