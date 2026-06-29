import Link from "next/link";

const stats = [
  { label: "Properties Tokenized", value: "100+" },
  { label: "Total Value Locked", value: "$2.4M" },
  { label: "Active Investors", value: "1,200+" },
  { label: "Rent Distributed", value: "$180K" },
];

const features = [
  {
    icon: "🏢",
    title: "Fractional Ownership",
    desc: "Own a piece of real estate from as little as $50. ERC-1155 tokens represent your share.",
  },
  {
    icon: "💰",
    title: "Passive Rent Income",
    desc: "Smart contract automatically distributes rent to all token holders — claim anytime.",
  },
  {
    icon: "🔒",
    title: "KYC Verified",
    desc: "Soulbound identity tokens ensure every investor is verified. No bots, no fraud.",
  },
  {
    icon: "📈",
    title: "Secondary Market",
    desc: "Buy and sell your tokens anytime on the built-in marketplace. Full liquidity.",
  },
  {
    icon: "⛓️",
    title: "100% On-Chain",
    desc: "No middlemen. All logic lives in auditable smart contracts on Ethereum.",
  },
  {
    icon: "🌐",
    title: "IPFS Documents",
    desc: "Property documents and metadata stored on IPFS — permanent and tamper-proof.",
  },
];

export default function LandingPage() {
  return (
    <div className="space-y-24 py-12">
      {/* Hero */}
      <section className="text-center space-y-6 max-w-3xl mx-auto">
        <div className="inline-block px-3 py-1 rounded-full bg-neon-green/10 border border-neon-green/30 text-neon-green text-sm font-medium">
          Real World Assets on Ethereum
        </div>
        <h1 className="text-5xl font-bold text-white leading-tight">
          Own Real Estate.<br />
          <span className="text-neon-green">Earn Rent.</span> On-Chain.
        </h1>
        <p className="text-gray-400 text-xl">
          TokenEstate lets you invest in fractional real estate with USDC, earn passive rental income,
          and trade your shares — all through smart contracts. No banks. No brokers.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/properties"
            className="px-6 py-3 bg-neon-green text-black font-bold rounded-lg hover:opacity-90 transition"
          >
            Browse Properties
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 border border-gray-700 text-white rounded-lg hover:border-gray-500 transition"
          >
            My Dashboard
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
            <p className="text-3xl font-bold text-neon-green">{s.value}</p>
            <p className="text-gray-400 text-sm mt-2">{s.label}</p>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section className="space-y-8">
        <h2 className="text-3xl font-bold text-white text-center">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: "01", title: "Connect Wallet", desc: "Connect MetaMask or any Web3 wallet. Get KYC verified in minutes." },
            { step: "02", title: "Buy Tokens", desc: "Choose a property, pay USDC, receive ERC-1155 fractional tokens instantly." },
            { step: "03", title: "Earn & Trade", desc: "Collect rent automatically. Sell your tokens anytime on the marketplace." },
          ].map((s) => (
            <div key={s.step} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-3">
              <span className="text-neon-green font-mono text-sm">{s.step}</span>
              <h3 className="text-white font-semibold text-lg">{s.title}</h3>
              <p className="text-gray-400 text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="space-y-8">
        <h2 className="text-3xl font-bold text-white text-center">Why TokenEstate</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-3 hover:border-neon-green/40 transition">
              <span className="text-3xl">{f.icon}</span>
              <h3 className="text-white font-semibold">{f.title}</h3>
              <p className="text-gray-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center bg-gray-900 border border-gray-800 rounded-2xl p-12 space-y-6">
        <h2 className="text-3xl font-bold text-white">Ready to Invest?</h2>
        <p className="text-gray-400">Start with as little as $50. No minimum holding period.</p>
        <Link
          href="/properties"
          className="inline-block px-8 py-4 bg-neon-green text-black font-bold rounded-lg hover:opacity-90 transition text-lg"
        >
          View Properties →
        </Link>
      </section>

      {/* Footer */}
      <footer className="text-center text-gray-600 text-sm pb-4">
        <p>TokenEstate — Built on Ethereum Sepolia · Powered by OpenZeppelin, The Graph, IPFS</p>
      </footer>
    </div>
  );
}
