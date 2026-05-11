import Link from 'next/link';
import productConfig from '@/config/product.config';

export default function Landing() {
  const { landing, pricing, name } = productConfig;

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <nav className="mb-16 flex items-center justify-between">
        <h1 className="text-xl font-bold">{name}</h1>
        <div className="flex gap-4 text-sm">
          <Link href="/login">Se connecter</Link>
          <Link href="/signup" className="rounded bg-black px-3 py-1.5 text-white">Commencer</Link>
        </div>
      </nav>

      <section className="text-center">
        <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">{landing.heroTitle}</h2>
        <p className="mt-4 text-lg text-gray-600">{landing.heroSubtitle}</p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/signup" className="rounded-md bg-black px-6 py-3 font-medium text-white">{landing.ctaPrimary}</Link>
          {landing.ctaSecondary && (
            <a href="#demo" className="rounded-md border border-gray-300 px-6 py-3 font-medium">{landing.ctaSecondary}</a>
          )}
        </div>
      </section>

      <section className="mt-24 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {landing.features.map((f) => (
          <div key={f.title} className="rounded-lg border border-gray-200 p-5">
            <h3 className="font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-gray-600">{f.description}</p>
          </div>
        ))}
      </section>

      <section className="mt-24" id="pricing">
        <h2 className="text-center text-3xl font-bold">Tarifs</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {pricing.plans.map((plan) => (
            <div key={plan.id} className="rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-2 text-2xl font-bold">{plan.price}</p>
              <ul className="mt-4 space-y-2 text-sm text-gray-700">
                {plan.features.map((feat) => <li key={feat}>• {feat}</li>)}
              </ul>
              <Link href="/signup" className="mt-6 block rounded-md bg-black py-2 text-center text-sm font-medium text-white">
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
