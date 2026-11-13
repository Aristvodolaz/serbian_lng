import { notFound } from 'next/navigation';

// Unknown paths under a language render the not-found page (noindex by default).
export default function CatchAll() {
  notFound();
}
