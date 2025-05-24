"use client"

import { useRef } from "react"
import Link from "next/link"
import { motion, useScroll, useTransform } from "framer-motion"
import { ArrowRight, BarChart3, Bot, ChevronRight, Code, Coins, LineChart, Lock, Sparkles, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  })

  const backgroundOpacity = useTransform(scrollYProgress, [0, 0.5], [0.1, 0.3])
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"])

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* Animated background */}
      <motion.div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.15) 0%, rgba(0, 0, 0, 0) 70%)",
          opacity: backgroundOpacity,
          y: backgroundY,
        }}
      />

      {/* Floating elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-emerald-500/10"
            style={{
              width: Math.random() * 200 + 50,
              height: Math.random() * 200 + 50,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: Math.random() * 20 + 10,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-6 md:p-8">
        <div className="flex items-center gap-2 text-xl font-bold text-emerald-400">
          <Coins className="h-6 w-6" />
          <span>DeFi Copilot</span>
        </div>
        <nav className="hidden md:block">
          <ul className="flex gap-8">
            <li>
              <a href="#features" className="text-sm hover:text-emerald-400 transition-colors">
                Features
              </a>
            </li>
            <li>
              <a href="#how-it-works" className="text-sm hover:text-emerald-400 transition-colors">
                How it works
              </a>
            </li>
            <li>
              <a href="#testimonials" className="text-sm hover:text-emerald-400 transition-colors">
                Testimonials
              </a>
            </li>
          </ul>
        </nav>
        <Link href="/dashboard">
          <Button variant="outline" className="border-emerald-500 text-emerald-400 hover:bg-emerald-500/10">
            Launch App
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center px-4 pt-20 md:pt-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <div className="mb-6 inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm">
            <Sparkles className="mr-2 h-4 w-4 text-emerald-400" />
            <span>Revolutionizing DeFi with AI</span>
          </div>
          <h1 className="mb-6 text-4xl font-bold md:text-6xl lg:text-7xl">
            Your Intelligent <span className="text-emerald-400">DeFi Assistant</span>
          </h1>
          <p className="mb-8 text-lg text-gray-400 md:text-xl">
            Navigate the complex world of decentralized finance with an AI-powered copilot that simplifies research,
            analysis, and decision-making.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-black font-medium">
                Try DeFi Copilot
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-gray-700 hover:bg-gray-800">
              Watch Demo
            </Button>
          </div>
        </motion.div>

        {/* Hero Image */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-16 w-full max-w-5xl"
        >
          <div className="relative mx-auto aspect-video w-full overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-blue-500/20"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full max-w-2xl px-8">
                <div className="mb-4 flex items-center gap-2 text-emerald-400">
                  <Bot className="h-5 w-5" />
                  <div className="text-lg font-medium">DeFi Copilot</div>
                </div>
                <div className="mb-3 rounded-lg bg-gray-800/80 p-4 text-sm text-gray-300">
                  What's the current APY for staking ETH on Lido, and how does it compare to Rocket Pool?
                </div>
                <div className="flex gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <div
                    className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 mt-32 px-4 md:px-8 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">Powerful DeFi Tools</h2>
            <p className="mx-auto max-w-2xl text-gray-400">
              Access comprehensive analytics, real-time data, and AI-powered insights to optimize your DeFi strategy.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: <BarChart3 className="h-6 w-6 text-emerald-400" />,
                title: "Market Analysis",
                description: "Get real-time market analysis and insights for informed decision-making.",
              },
              {
                icon: <Zap className="h-6 w-6 text-emerald-400" />,
                title: "Yield Optimization",
                description: "Discover the highest-yielding opportunities across DeFi protocols.",
              },
              {
                icon: <Lock className="h-6 w-6 text-emerald-400" />,
                title: "Risk Assessment",
                description: "Evaluate protocol risks and security with our comprehensive analysis.",
              },
              {
                icon: <LineChart className="h-6 w-6 text-emerald-400" />,
                title: "Portfolio Tracking",
                description: "Monitor your investments and performance across multiple chains.",
              },
              {
                icon: <Code className="h-6 w-6 text-emerald-400" />,
                title: "Smart Contract Analysis",
                description: "Review smart contracts for potential vulnerabilities and risks.",
              },
              {
                icon: <Bot className="h-6 w-6 text-emerald-400" />,
                title: "AI Assistant",
                description: "Ask questions and get expert-level answers about any DeFi topic.",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group rounded-xl border border-gray-800 bg-gray-900/50 p-6 transition-all hover:border-emerald-500/50 hover:bg-gray-800/50"
              >
                <div className="mb-4 rounded-full bg-emerald-500/10 p-3 w-fit">{feature.icon}</div>
                <h3 className="mb-2 text-xl font-medium">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mx-auto max-w-4xl rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-gray-900 to-black p-8 md:p-12 text-center"
        >
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Ready to Transform Your DeFi Experience?</h2>
          <p className="mb-8 text-gray-400">
            Join thousands of users who are already leveraging AI to navigate the DeFi landscape more effectively.
          </p>
          <Link href="/dashboard">
            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-black font-medium">
              Launch Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-800 px-6 py-12 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2 text-xl font-bold text-emerald-400">
              <Coins className="h-6 w-6" />
              <span>DeFi Copilot</span>
            </div>
            <div className="text-sm text-gray-500">© {new Date().getFullYear()} DeFi Copilot. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
