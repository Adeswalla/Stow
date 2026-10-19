import Link from "next/link";
import { ArrowRight, Lock, Scale, Target, Wallet } from "lucide-react";

const products = [
  {
    id: "flexible",
    name: "Flexible savings",
    description: "Keep savings accessible for plans that may change.",
    bestFor: "Everyday reserves and short-notice expenses",
    icon: Wallet,
    href: "/savings/flexible",
    action: "Explore flexible savings",
    features: {
      asset: "USDC",
      access: "Withdraw any time",
      commitment: "No fixed term",
      setup: "Deposit into a flexible balance",
      tracking: "Balance and recent activity",
    },
  },
  {
    id: "locked",
    name: "Locked savings",
    description: "Set funds aside until a date you choose.",
    bestFor: "Money you are comfortable leaving untouched",
    icon: Lock,
    href: "/savings/locked/new",
    action: "Create a locked plan",
    features: {
      asset: "XLM",
      access: "Withdraw after the unlock date",
      commitment: "Choose a future unlock date",
      setup: "Choose an amount and unlock date",
      tracking: "Unlock countdown and plan balance",
    },
  },
  {
    id: "goals",
    name: "Goal savings",
    description: "Give your savings a target and a reason.",
    bestFor: "A specific purchase, trip, or personal milestone",
    icon: Target,
    href: "/savings/goals/new",
    action: "Create a savings goal",
    features: {
      asset: "XLM",
      access: "Claim after the target is reached",
      commitment: "Choose a target, with no set deadline",
      setup: "Name a goal and set a target amount",
      tracking: "Progress toward your target",
    },
  },
] as const;

const comparisonRows = [
  { id: "bestFor", label: "Best for", values: products.map((product) => product.bestFor) },
  { id: "asset", label: "Savings asset", values: products.map((product) => product.features.asset) },
  { id: "access", label: "Access to funds", values: products.map((product) => product.features.access) },
  { id: "commitment", label: "Time commitment", values: products.map((product) => product.features.commitment) },
  { id: "setup", label: "What you set up", values: products.map((product) => product.features.setup) },
  { id: "tracking", label: "Progress tracking", values: products.map((product) => product.features.tracking) },
];

export default function SavingsComparisonPage() {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 max-w-3xl">
          <div className="mb-3 flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-brand/30 bg-brand/10">
              <Scale className="h-5 w-5 text-brand" aria-hidden="true" />
            </div>
            <p className="text-sm font-medium text-brand">Savings products</p>
          </div>
          <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
            Compare your options
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted">
            Choose based on when you might need your money and whether you want
            a date or a target to save toward.
          </p>
        </header>

        <section aria-label="Savings product choices" className="mb-10">
          <div className="grid gap-3 md:grid-cols-3">
            {products.map((product) => {
              const Icon = product.icon;
              return (
                <article
                  key={product.id}
                  className="flex min-w-0 flex-col border-t-2 border-brand/50 bg-card px-5 py-5"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
                    <h2 className="text-lg font-semibold text-foreground">
                      {product.name}
                    </h2>
                  </div>
                  <p className="mt-3 min-h-10 text-sm text-muted">
                    {product.description}
                  </p>
                  <div className="mt-5 border-l-2 border-amber-300/70 pl-3">
                    <p className="text-xs font-medium text-muted">A good fit for</p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {product.bestFor}
                    </p>
                  </div>
                  <Link
                    href={product.href}
                    className="mt-6 inline-flex min-h-11 items-center justify-between gap-2 border-t border-border pt-4 text-sm font-semibold text-brand transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-brand/50"
                  >
                    {product.action}
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </Link>
                </article>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="comparison-title">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase text-brand">Feature matrix</p>
              <h2 id="comparison-title" className="mt-1 text-xl font-semibold text-foreground">
                How they compare
              </h2>
            </div>
            <p className="max-w-md text-sm text-muted">
              The main difference is access: flexible funds stay available,
              locked funds wait for a date, and goal funds wait for a target.
            </p>
          </div>

          <div
            aria-label="Savings product comparison table"
            className="overflow-x-auto rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-brand/50"
            tabIndex={0}
          >
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-card">
                  <th scope="col" className="w-44 border-b border-border px-4 py-4 font-medium text-muted">
                    Feature
                  </th>
                  {products.map((product) => (
                    <th
                      key={product.id}
                      scope="col"
                      className="border-b border-border px-4 py-4 font-semibold text-foreground"
                    >
                      {product.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.id} className="odd:bg-card/40">
                    <th
                      scope="row"
                      className="border-b border-border px-4 py-4 align-top font-medium text-foreground last:border-b-0"
                    >
                      {row.label}
                    </th>
                    {row.values.map((value, index) => (
                      <td
                        key={products[index].id}
                        className="border-b border-border px-4 py-4 align-top leading-relaxed text-muted last:border-b-0"
                      >
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}