import type { Dict } from './ru';

export const en: Dict = {
  meta: {
    title: 'Learn Serbian in both alphabets — РЕЧ · REČ',
    description:
      'Learn Serbian with the РЕЧ app: every word is shown in Cyrillic and Latin side by side. Leave your email for early access.',
  },
  skipToContent: 'Skip to content',
  nav: {
    label: 'Main navigation',
    how: 'How it works',
    faq: 'Questions',
    cta: 'Early access',
    otherLang: 'Русская версия',
  },
  footer: {
    label: 'Documents and support',
    privacy: 'Privacy policy',
    terms: 'Terms of use',
    cookies: 'Cookies',
    consent: 'Data processing consent',
    support: 'Support',
    note: 'REČ is an app for learning Serbian.',
  },
  notFound: {
    title: 'This page doesn’t exist',
    text: 'The link may be out of date, or the address has a typo.',
    home: 'Go to the home page',
  },
  faq: {
    title: 'Questions and answers',
    items: [
      {
        q: 'Do I need to know Serbian to start?',
        a: 'No. The course starts with the first letters and simple words.',
      },
      {
        q: 'Why learn both alphabets at once?',
        a: 'Shop signs, menus, and documents in Serbia can be written in either Cyrillic or Latin. If you know both, you won’t have to relearn on the spot.',
      },
      {
        q: 'When will the app be out?',
        a: 'It isn’t in the app stores yet. Leave your email in the form above and we’ll write when early access opens.',
      },
      {
        q: 'How much will it cost?',
        a: 'Not decided yet. We’ll share the terms with early-access users before any payment.',
      },
      {
        q: 'What data do you collect?',
        a: 'Only the email you enter in the form, and your confirmation of consent to process it. Details are in the privacy policy.',
      },
    ],
  },
  waitlist: {
    title: 'Early access',
    lead: 'Leave your email and we’ll write when the app opens. Nothing else is needed.',
    emailLabel: 'Email',
    consent: 'I agree to my email being processed for early access.',
    consentLink: 'Consent text',
    submit: 'Get early access',
    submitting: 'Sending…',
    success: 'Thanks! We’ll email you when early access opens.',
    errors: {
      emailEmpty: 'Enter your email.',
      emailInvalid: 'Check the email: it needs an @ and a domain, like name@example.com.',
      consent: 'We can’t take the request without consent. Tick the box.',
      server: 'Couldn’t save the request. Try again.',
    },
  },
  legal: {
    notice: 'This is a courtesy translation. The Russian text is the legally binding one.',
    titles: {
      privacy: 'Privacy policy',
      terms: 'Terms of use',
      cookies: 'Cookies',
      consent: 'Data processing consent',
      support: 'Support',
    },
    descriptions: {
      privacy: 'What personal data РЕЧ collects, why, where it is stored, and how to delete your account.',
      terms: 'Rules for using the РЕЧ app: accounts, free access, and rights to the content.',
      cookies: 'The РЕЧ website uses no analytics, advertising pixels or tracking cookies.',
      consent: 'The text of the personal data consent and how to withdraw it.',
      support: 'How to reach the РЕЧ team about the course, your data, and early access.',
    },
  },
  hero: {
    title: 'Learning Serbian in two alphabets',
    lead: 'REČ shows every word in Cyrillic and Latin side by side, the way Belgrade street signs do. In a couple of weeks you can read the menu, the shop signs, and the messages from your landlord.',
    cta: 'Get early access',
    next: 'Another word',
  },
  how: {
    title: 'How it works',
    lead: 'Three modes, and each one shows the word in both alphabets.',
    items: [
      {
        title: 'Short lessons',
        text: 'Pick the translation of a word, or fill the gap in a phrase. The answer appears in Cyrillic and Latin at once, so your eye gets used to both.',
      },
      {
        title: 'A dictionary with grammar',
        text: 'Every word in the course in one searchable place. Each entry lists the part of speech, gender, and other forms, so you don’t need a separate reference.',
      },
      {
        title: 'Flashcards for review',
        text: 'Answer “I know it” or “still learning.” Words you’re unsure of come back more often, and the ones you know come back less.',
      },
    ],
  },
};
