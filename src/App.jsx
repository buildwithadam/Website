import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Check, ChevronLeft, ChevronRight, Code2, Github, Globe, Leaf, Linkedin, Mail, MapPin, Server, Sparkles, Wrench, Zap } from "lucide-react";

/*
░       ░░░  ░░░░  ░░        ░░  ░░░░░░░░       ░░░░░░░░░  ░░░░  ░░        ░░        ░░  ░░░░  ░░░░░░░░░      ░░░       ░░░░      ░░░  ░░░░  ░
▒  ▒▒▒▒  ▒▒  ▒▒▒▒  ▒▒▒▒▒  ▒▒▒▒▒  ▒▒▒▒▒▒▒▒  ▒▒▒▒  ▒▒▒▒▒▒▒▒  ▒  ▒  ▒▒▒▒▒  ▒▒▒▒▒▒▒▒  ▒▒▒▒▒  ▒▒▒▒  ▒▒▒▒▒▒▒▒  ▒▒▒▒  ▒▒  ▒▒▒▒  ▒▒  ▒▒▒▒  ▒▒   ▒▒   ▒
▓       ▓▓▓  ▓▓▓▓  ▓▓▓▓▓  ▓▓▓▓▓  ▓▓▓▓▓▓▓▓  ▓▓▓▓  ▓▓▓▓▓▓▓▓        ▓▓▓▓▓  ▓▓▓▓▓▓▓▓  ▓▓▓▓▓        ▓▓▓▓▓▓▓▓  ▓▓▓▓  ▓▓  ▓▓▓▓  ▓▓  ▓▓▓▓  ▓▓        ▓
█  ████  ██  ████  █████  █████  ████████  ████  ████████   ██   █████  ████████  █████  ████  ████████        ██  ████  ██        ██  █  █  █
█       ████      ███        ██        ██       █████████  ████  ██        █████  █████  ████  ████████  ████  ██       ███  ████  ██  ████  █
*/

const NAV = [
    { id: "home", label: "Home" },
    { id: "services", label: "Services" },
    { id: "seo", label: "SEO" },
    { id: "cannabis", label: "Cannabis" },
    { id: "work", label: "Work" },
    { id: "testimonials", label: "Testimonials" },
    { id: "about", label: "About" },
    //{ id: "contact", label: "Start" },
];

const techBadges = [
    "Java", "Node.js", "PHP", "Python", "React", "MySQL", "REST", "GraphQL", "WordPress",
    "Playwright", "Puppeteer", "Bash", "Google Analytics 4", "Google Search Console", "Google Business Profile",
    "Bing Webmaster Tools", "Looker Studio", "Klaviyo", "SpringBig", "AlpineIQ", "OneSignal",
    "Blaze POS", "Blaze Ecom", "Weedmaps", "Leafly", "OnFleet", "Metrc", "Notion", "Discord Bots", "AI Assistants"
];

const services = [
    {
        key: "dev",
        title: "Development and integrations",
        icon: <Code2 className="w-5 h-5" />,
        bullets: [
            "Bug fixes and small features in Java, Node.js, PHP, and Python",
            "API and webhook integrations with REST or GraphQL",
            "POS to website bridges with validation and rollback steps",
            "WordPress plugin or theme hotfixes and performance",
            "Platforms: Blaze POS, Blaze Ecom, Weedmaps, Leafly, OnFleet, Notion",
        ],
    },
    {
        key: "automation",
        title: "Automation and data",
        icon: <Bot className="w-5 h-5" />,
        bullets: [
            "Browser and process automation using Playwright or Puppeteer",
            "CSV, JSON, and XML transformers and CLI tools",
            "ETL into Sheets, Notion, or databases with checks and logs",
            "Discord bots for alerts and simple workflows",
            "AI chat bots for product info and support deflection",
        ],
    },
    {
        key: "dbperf",
        title: "Database and performance",
        icon: <Server className="w-5 h-5" />,
        bullets: [
            "MySQL schema optimization and indexing",
            "Caching, bundle trims, asset strategy, and monitoring",
            "Error diagnosis and lightweight reliability work",
        ],
    },
    {
        key: "seo",
        title: "Technical SEO and growth",
        icon: <Globe className="w-5 h-5" />,
        bullets: [
            "Crawl and indexation audits for Google and Bing",
            "Sitemaps, robots.txt, canonicals, redirects, and pagination",
            "Core Web Vitals and site speed improvements",
            "Local SEO across California with GBP and Bing Places",
            "Platforms: GA4, Search Console, Bing Webmaster, Looker Studio",
        ],
    },
];

const portfolio = [
    { title: "Realtime Sales Sync to Sheets", tags: ["Python", "REST", "Sheets"], impact: "Saved about 55 minutes per day in reporting", summary: "Python job that polls a third party API, deduplicates rows, and updates a live dashboard with logging" },
    { title: "Payment Flow Repair for WordPress", tags: ["PHP", "WooCommerce", "Hooks"], impact: "Checkout recovered same day", summary: "Patched a gateway conflict, added retry logic, and instrumented basic error reporting" },
    { title: "CSV Standardizer CLI in Java", tags: ["Java", "CLI", "Data"], impact: "Reduced import failures and support tickets", summary: "Normalized columns and dates, removed duplicates, and exported clean records for CRM ingest" },
    { title: "Responsive Cleanup for Nonprofit Website", tags: ["CSS", "Grid", "Images"], impact: "Better mobile readability and lower bounce rate", summary: "Refactored grid and image handling to improve layout on phones and tablets" },
    { title: "Legacy Stack Integration with Closed APIs", tags: ["Node.js", "Integrations", "Ops"], impact: "Removed weekly spreadsheet merges", summary: "Bridged undocumented endpoints across marketing and catalog systems into a single dashboard" },
    { title: "Weedmaps Menu Sync and Pricing Guard", tags: ["Node.js", "Weedmaps", "Scheduler"], impact: "Eliminated mismatched menu items and price drift", summary: "Scheduled sync validates menu, pricing, and inventory and posts diffs to Slack with rollback commands" },
    { title: "Blaze Ecom Safe Enhancements", tags: ["JS", "Blaze Ecom", "CSS"], impact: "Better UX without platform risk", summary: "Injected JS and CSS enhancements through allowed hooks and used closed API patterns for safe extensions" },
    { title: "OnFleet Delivery Tracking Widgets", tags: ["OnFleet", "Widgets", "UX"], impact: "Reduced support pings and fewer WISMO calls", summary: "Lightweight widgets that surface ETA and driver states in customer portals" },
    { title: "AlpineIQ to Klaviyo Bridge", tags: ["Python", "ETL", "Klaviyo"], impact: "Lifted campaign ROI with real time segments", summary: "Synced customer segments and purchase events to Klaviyo with privacy safe hashing and retries" },
    { title: "Core Web Vitals Fix for Sacramento Retailer", tags: ["Performance", "CWV", "SEO"], impact: "LCP reduced by 38 percent and CLS stabilized", summary: "Preloaded key images, deferred third party scripts, and added critical CSS for top pages" },
    { title: "Google and Bing Places Automation", tags: ["Local SEO", "UTM", "Reporting"], impact: "Clear attribution across Sacramento and NorCal", summary: "Automated weekly GSC and Bing exports into a Sacramento overview sheet with consistent UTM templates" },
    { title: "Metrc Reconciliation Helper", tags: ["Python", "Metrc", "Compliance"], impact: "Cut reconciliation time for inventory", summary: "Matched POS inventory to Metrc manifests and flagged exceptions with a simple CLI and CSV outputs" },
    { title: "AI Chat Bot for Product Help", tags: ["AI", "Chat", "Docs"], impact: "Deflected repetitive support tickets", summary: "Web based bot that answers product and menu questions from curated docs and FAQs" },
];

const testimonials = [
    { company: "Skyline Champion Homes", author: "Renee F.", role: "HR Divisional Manager", quote: "Adam brings people together and keeps projects moving. He supports the team and gets results." },
    { company: "AAEP", author: "Amity B.", role: "Communications and Technology Coordinator", quote: "He was proactive and dependable during our provider transition. Honest and easy to work with." },
    { company: "Thorntons LLC", author: "Priya S.", role: "Marketing Ops", quote: "Clear fixes and fast delivery. He left us with steps we could maintain." },
    { company: "Dean Dorton", author: "Alex M.", role: "Marketing Director", quote: "Clean code, clear docs, and delivery right when we needed it." },
    { company: "Payment Alliance International", author: "Brian T.", role: "Ecommerce and PCI", quote: "Adam guided our ecommerce rollout and PCI readiness. He tightened integrations and left us with simple playbooks." },
];

const clients = [
    "Humble Root",
    "Media Marketers",
    "Thorntons LLC",
    "Dean Dorton",
    "Payment Alliance International",
    "Hagyard Equine Medical Institute",
    "American Association of Equine Practitioners",
];

const packages = [
    { name: "Quick Fix", price: "starting at $200", time: "scoped bug or task", items: ["Single issue or micro feature", "Brief report with next steps", "Same day when possible"] },
    { name: "Build Sprint", price: "starting at $700", time: "half to full day", items: ["Feature, integration, or SEO pass", "README and validation steps", "Check ins by Slack or email"] },
    { name: "Marketing Consulting", price: "by quote", time: "retainer", items: ["Analytics and channel reviews", "Technical and local SEO roadmap", "Campaign ideas and experiments"] },
    { name: "Custom Scope", price: "by quote", time: "project", items: ["Clear milestones", "Visible progress demos", "Optional ongoing support"] },
];

function cx(...s) { return s.filter(Boolean).join(" "); }

// Global styles and animation shells
const GlobalStyles = () => (
    <style>{`
    :root{
        --g-glass: hsla(100, 90%, 55%, 0.32);
        --g-edge: hsla(100, 88%, 62%, 0.55);
        --g-soft: hsla(100, 85%, 70%, 0.18);
        +  color-scheme: dark; /* render native form popovers (like <select> menus) in dark */
    }
    .glass {
        position: relative;
        overflow: hidden;
        backdrop-filter: blur(22px);
        background: rgba(10,10,10,.62);
        isolation: isolate; 
    }
    .glass::before {
        content: "";
        position: absolute;
        inset: -200%;
        background:
            radial-gradient(120px 120px at 20% 15%, var(--g-soft), transparent 55%),
            radial-gradient(120px 120px at 80% 85%, var(--g-soft), transparent 55%);
        filter: blur(10px);
        pointer-events: none;
        z-index: -1;
    }

    .glass-outline { box-shadow: inset 0 0 0 1px var(--g-edge), 0 0 0 1px rgba(255,255,255,0.06); }

    /* Only Packages uses spin */
    .shell-spin { position: relative; }
    .shell-spin::before { content:""; position:absolute; inset:0; border-radius:16px;
    background: conic-gradient(from 0deg, var(--g-edge), rgba(34,211,238,.35), rgba(232,121,249,.35), var(--g-edge));
    filter: blur(8px); opacity:.9; animation: shellspin 22s linear infinite; pointer-events: none; z-index: -1; }
    @keyframes shellspin { to { transform: rotate(360deg); } }

    /* Everywhere else uses fade */
    .shell-fade { position: relative; }
    .shell-fade::before { content:""; position:absolute; inset:0; border-radius:16px;
    background: conic-gradient(from 0deg, var(--g-edge), rgba(34,211,238,.35), rgba(232,121,249,.35), var(--g-edge));
    filter: blur(8px); opacity:.85; animation: shellfade 8s ease-in-out infinite alternate; pointer-events: none; z-index: -1; }
    @keyframes shellfade { 0% { filter: hue-rotate(0deg) blur(8px); opacity:.6 } 100% { filter: hue-rotate(25deg) blur(10px); opacity:.9 } }

    /* subtle header sweep */
    .header-sweep { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent); }

    .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
    .no-scrollbar::-webkit-scrollbar { display: none; }

    a.link { position: relative; }
    a.link::after { content: ""; position: absolute; left: 0; right: 0; bottom: -2px; height: 1px;
    background: linear-gradient(90deg, var(--g-edge), rgba(34,211,238,0.6), rgba(232,121,249,0.6));
    transform: scaleX(0); transform-origin: left; transition: transform .3s ease; }
    a.link:hover::after { transform: scaleX(1); }
`}</style>
);

const BrandBadge = () => (
    <div className="inline-flex items-center gap-2 rounded-2xl px-3 py-1 border border-lime-300/40 bg-[color:var(--g-glass)] backdrop-blur-xl shadow-[0_0_60px_rgba(163,230,53,0.25)]">
        <div className="relative">
            <div className="absolute inset-0 blur-md rounded-full" style={{ background: "var(--g-edge)" }} />
            <Leaf className="relative w-4 h-4" style={{ color: "var(--g-edge)" }} />
        </div>
        <span className="font-semibold tracking-tight">buildwithadam.dev</span>
    </div>
);

const GradientBG = () => (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden -z-10 pointer-events-none">
        <motion.div initial={{ opacity: 0.25 }} animate={{ opacity: 0.4 }} transition={{ duration: 1.2 }} className="absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full blur-3xl bg-lime-400/45" />
        <motion.div initial={{ opacity: 0.15 }} animate={{ opacity: 0.3 }} transition={{ delay: 0.2, duration: 1.2 }} className="absolute -bottom-40 left-1/3 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full blur-3xl bg-cyan-400/35" />
        <motion.div initial={{ opacity: 0.15 }} animate={{ opacity: 0.3 }} transition={{ delay: 0.35, duration: 1.2 }} className="absolute top-1/3 right-[-10%] h-[24rem] w-[24rem] rounded-full blur-3xl bg-fuchsia-500/35" />
    </div>
);

function Navbar({ onJump }) {
    const safeJump = (id) => typeof onJump === "function" && onJump(id);
    return (
        <div className="sticky top-0 z-40 backdrop-blur-xl bg-neutral-950/70 border-b border-white/10 overflow-hidden isolate">
            <motion.div
                aria-hidden
                initial={{ x: "-20%" }}
                animate={{ x: "20%" }}
                transition={{ duration: 18, repeat: Infinity, repeatType: "reverse" }}
                className="absolute inset-x-0 top-0 h-14 pointer-events-none header-sweep z-0"
            />
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="flex items-center justify-between h-14">
                    <button onClick={() => safeJump("home")} aria-label="Home">
                        <BrandBadge />
                    </button>
                    <nav className="hidden md:flex items-center gap-6 text-sm">
                        {NAV.map(n => (
                            <button key={n.id} onClick={() => safeJump(n.id)} className="text-neutral-300 hover:text-white transition-colors">
                                {n.label}
                            </button>
                        ))}
                        <a href="#contact" className="relative z-10 rounded-xl px-3 py-2 text-xs font-medium border border-lime-300/40 bg-[color:var(--g-glass)] hover:bg-lime-400/35 backdrop-blur-xl shadow-[0_0_30px_rgba(163,230,53,0.3)]">Start</a>
                    </nav>
                </div>
            </div>
        </div>
    );
}

function Hero({ onJump }) {
    return (
        <section id="home" className="relative">
            <GradientBG />
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
                <div className="grid lg:grid-cols-2 gap-10 items-center">
                    <div>
                        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">On demand engineering and technical SEO, delivered fast</h1>
                        <p className="mt-4 text-lg text-neutral-300">
                            I am Adam Parker, a California based developer and cannabis tech specialist. I build integrations, automation, and SEO improvements that you can measure. Most projects ship within hours, not days.
                        </p>
                        <div className="mt-8 flex flex-wrap items-center gap-3">
                            <button onClick={() => onJump("contact")} className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium bg-lime-400/95 text-neutral-900 shadow-lg hover:bg-lime-300/95 backdrop-blur-xl">
                                <Zap className="w-4 h-4" /> Start your project
                            </button>
                            <button onClick={() => onJump("services")} className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium border border-lime-300/40 hover:bg-lime-400/20 backdrop-blur-xl">
                                <Wrench className="w-4 h-4" /> View services
                            </button>
                        </div>
                        <div className="mt-10 flex flex-wrap gap-2">
                            {techBadges.map(t => (
                                <span key={t} className="text-xs px-2.5 py-1 rounded-full border border-lime-300/40 bg-[color:var(--g-glass)] backdrop-blur-xl">
                                    {t}
                                </span>
                            ))}
                        </div>
                        <div className="mt-8 flex items-center gap-2 text-sm text-neutral-400">
                            <MapPin className="w-4 h-4" /> Built in Sacramento with love <span aria-hidden>♥</span>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="glass glass-outline rounded-2xl border border-white/10 bg-neutral-950/60 backdrop-blur-2xl p-6 shadow-2xl">
                            <div className="flex items-center justify-between text-xs text-neutral-400">
                                <span>gradient-gen.ts</span>
                                <span>live demo</span>
                            </div>
                            <CodePlayground />
                        </div>
                    </div>
                </div>
            </div>
            <HowItWorks onJump={onJump} />
        </section>
    );
}

// Short, useful, a little fun
function CodePlayground() {
    const [stops, setStops] = useState([
        { c: "#a3e635", p: 0 },
        { c: "#22d3ee", p: 50 },
        { c: "#e879f9", p: 100 },
    ]);

    const shuffle = () => {
        const rand = () => Math.floor(Math.random() * 360);
        const toHex = (h, s, l) => {
            const a = s * (Math.min(l, 1 - l));
            const f = (n) => {
                const k = (n + h / 30) % 12; const col = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
                return Math.round(255 * col).toString(16).padStart(2, '0');
            };
            return `#${f(0)}${f(8)}${f(4)}`;
        };
        const pts = [0, Math.floor(Math.random() * 60 + 20), 100];
        setStops([
            { c: toHex(rand(), .75, .6), p: pts[0] },
            { c: toHex(rand(), .75, .6), p: pts[1] },
            { c: toHex(rand(), .75, .6), p: pts[2] },
        ]);
    };

    const css = `background: radial-gradient(120% 120% at 20% 20%, ${stops[0].c} ${stops[0].p}%, transparent 60%),
            radial-gradient(120% 120% at 80% 80%, ${stops[1].c} ${stops[1].p}%, transparent 60%),
            linear-gradient(120deg, ${stops[0].c}, ${stops[1].c}, ${stops[2].c});`;

    const [copied, setCopied] = useState(false);
    const copy = async () => { await navigator.clipboard.writeText(css); setCopied(true); setTimeout(() => setCopied(false), 1200); };

    return (
        <div className="mt-3">
            <div className="rounded-xl bg-neutral-900 p-4">
                <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-start">
                    <div className="rounded-lg border border-white/10 h-40" style={{ background: `radial-gradient(120% 120% at 20% 20%, ${stops[0].c} ${stops[0].p}%, transparent 60%), radial-gradient(120% 120% at 80% 80%, ${stops[1].c} ${stops[1].p}%, transparent 60%), linear-gradient(120deg, ${stops[0].c}, ${stops[1].c}, ${stops[2].c})` }} />
                    <div className="flex flex-col gap-2 relative z-10">
                        <button type="button" onClick={shuffle} className="rounded-lg px-3 py-2 text-xs border border-lime-300/40 bg-[color:var(--g-glass)]">
                            Shuffle
                        </button>
                        <button type="button" onClick={copy} className="rounded-lg px-3 py-2 text-xs border border-lime-300/40">
                            {copied ? "Copied" : "Copy"}
                        </button>
                    </div>

                </div>
                <pre className="mt-3 text-[11px] sm:text-xs w-full max-w-full overflow-x-auto whitespace-pre-wrap break-words bg-black/30 rounded-lg p-3 border border-white/10">
                    {css}
                </pre>
            </div>
            <div className="mt-3 text-xs text-neutral-400">Generate a gradient, copy, and paste into your CSS. Simple and useful.</div>
        </div>
    );
}

function HowItWorks({ onJump }) {
    const steps = [
        { t: "Scope and acceptance", d: "We define the smallest change that solves the problem with clear acceptance, rollback, and test notes." },
        { t: "Implement and review", d: "I ship the fix or feature with a short README, version notes, and a quick loom style walkthrough if helpful." },
        { t: "Validate and measure", d: "You get validation steps plus metrics: speed, indexation, or conversion checks in GA4 and Search Console." },
        { t: "Ready when you are", d: "Send context. I send a quote. Small work can start same day.", cta: true },
    ];
    return (
        <section aria-labelledby="how" className="pb-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <h2 id="how" className="text-3xl font-bold tracking-tight">How it works</h2>
                <div className="mt-4 shell-fade p-[2px] rounded-2xl">
                    <div className="glass glass-outline rounded-2xl border border-white/10 p-5">
                        <div className="grid md:grid-cols-4 gap-4">
                            {steps.map(s => (
                                <div key={s.t} className="rounded-xl border border-white/10 bg-neutral-950/40 p-4">
                                    <div className="font-semibold">{s.t}</div>
                                    <p className="text-sm text-neutral-300 mt-1">{s.d}</p>
                                    {s.cta && <button onClick={() => onJump("contact")} className="mt-3 rounded-xl px-4 py-2 text-sm font-medium border border-lime-300/40 hover:bg-lime-400/20">Start now</button>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function Services() {
    const [active, setActive] = useState(services[0].key);
    return (
        <section id="services" className="py-16 sm:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-bold tracking-tight">Services</h2>
                <p className="mt-2 text-neutral-300">Practical solutions that focus on clear scope, clean code, and visible impact.</p>
                <div className="mt-8 grid lg:grid-cols-3 gap-5">
                    <div className="lg:col-span-1">
                        <div className="flex lg:flex-col gap-2 overflow-x-auto no-scrollbar">
                            {services.map(s => (
                                <button key={s.key} onClick={() => setActive(s.key)} className={cx(
                                    "w-full text-left rounded-xl border px-4 py-3 backdrop-blur-xl transition-colors",
                                    active === s.key ? "bg-lime-400/95 text-neutral-900 border-lime-300/70 shadow" : "border-lime-300/40 hover:bg-lime-400/20"
                                )}>
                                    <div className="flex items-center gap-2 font-medium">{s.icon}<span>{s.title}</span></div>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="lg:col-span-2">
                        <AnimatePresence mode="wait">
                            {services.map(s => (
                                s.key === active && (
                                    <motion.div key={s.key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass glass-outline rounded-2xl border border-white/10 p-6">
                                        <ul className="space-y-3">
                                            {s.bullets.map((b, i) => (
                                                <li key={i} className="flex items-start gap-3"><Check className="w-4 h-4 mt-1" style={{ color: "var(--g-edge)" }} /><span className="text-neutral-200">{b}</span></li>
                                            ))}
                                        </ul>
                                    </motion.div>
                                )
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </section>
    );
}

function SEOBlock() {
    const bullets = [
        "Technical audits and fix lists",
        "Indexation and crawl control",
        "Sitemaps and robots policies",
        "Canonical and redirect strategy",
        "Core Web Vitals and speed",
        "Schema JSON LD for key types",
        "Local SEO with GBP and Bing Places",
        "Keyword sets and content briefs",
        "Internal link maps and title meta rewrites",
    ];
    return (
        <section id="seo" className="py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="shell-fade p-[2px] rounded-2xl">
                    <div className="glass glass-outline rounded-2xl p-6">
                        <h2 className="text-3xl font-bold tracking-tight">SEO services</h2>
                        <p className="mt-2 text-neutral-300">Built for Google and Bing with clean implementation and clear reporting.</p>
                        <ul className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                            {bullets.map(b => (
                                <li key={b} className="flex items-start gap-2"><Check className="w-4 h-4 mt-0.5" style={{ color: "var(--g-edge)" }} />{b}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}

function Clients() {
    return (
        <section className="py-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <p className="uppercase tracking-widest text-xs text-neutral-400">Select clients</p>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    {clients.slice(0, 6).map(c => (
                        <div key={c} className="text-sm text-center px-3 py-2 rounded-xl border border-white/10 bg-neutral-950/60 backdrop-blur-2xl glass">
                            {c}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function Portfolio() {
    const [filter, setFilter] = useState("All");
    const tags = useMemo(() => ["All", ...Array.from(new Set(portfolio.flatMap(p => p.tags)))], []);
    const items = portfolio.filter(p => filter === "All" || p.tags.includes(filter));
    return (
        <section id="work" className="py-16 sm:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between gap-4">
                    <h2 className="text-3xl font-bold tracking-tight">Selected work</h2>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        {tags.map(t => (
                            <button key={t} onClick={() => setFilter(t)} className={cx("px-3 py-1.5 rounded-full text-xs border backdrop-blur-xl transition-colors", filter === t ? "bg-lime-400/95 text-neutral-900 border-lime-300/70 shadow" : "border-lime-300/40 hover:bg-lime-400/20")}>{t}</button>
                        ))}
                    </div>
                </div>
                <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {items.map((p) => (
                        <div key={p.title} className="glass glass-outline rounded-2xl border border-white/10 p-5">
                            <div className="flex items-center gap-2 text-xs text-neutral-400">
                                {p.tags.map(t => (
                                    <span key={t} className="px-2 py-0.5 rounded-full border border-lime-300/40 bg-[color:var(--g-glass)]">{t}</span>
                                ))}
                            </div>
                            <h3 className="mt-3 font-semibold text-lg">{p.title}</h3>
                            <p className="mt-2 text-sm text-neutral-300">{p.summary}</p>
                            <p className="mt-3 text-sm font-medium" style={{ color: "var(--g-edge)" }}>{p.impact}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function Cannabis() {
    const cards = [
        { t: "Menu sync and validation", d: "Keep Weedmaps and Leafly aligned with your POS using diffs, alerts, and rollbacks." },
        { t: "Closed API bridges", d: "When docs are missing, I design safe adapters that are tested and reversible." },
        { t: "Local SEO for delivery", d: "GBP and Bing Places tuning, location pages, and UTM hygiene across Sacramento and California markets." },
        { t: "Compliance helpers", d: "Metrc reconciliation and exception reporting with clear CSV outputs." },
        { t: "Lifecycle marketing data", d: "AlpineIQ and Klaviyo profile syncs with hashed identifiers and retries." },
        { t: "Site speed and Core Web Vitals", d: "Trim render blocking scripts and ship critical CSS for top pages." },
    ];
    return (
        <section id="cannabis" className="py-16 sm:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-3">
                    <Leaf className="w-6 h-6" style={{ color: "var(--g-edge)" }} />
                    <h2 className="text-3xl font-bold tracking-tight">Cannabis tech specialist</h2>
                </div>
                <p className="mt-2 text-neutral-300 max-w-3xl">
                    I help cannabis brands in California move faster with reliable integrations and technical SEO that respects compliance and platform limits. Experience with Blaze POS, Blaze Ecom, Weedmaps, Leafly, AlpineIQ, SpringBig, OnFleet, and Metrc. Based in California and serving Northern and Southern regions.
                </p>
                <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {cards.map(card => (
                        <div key={card.t} className="shell-fade p-[2px] rounded-2xl">
                            <div className="glass glass-outline rounded-2xl p-5">
                                <h3 className="font-semibold">{card.t}</h3>
                                <p className="mt-2 text-sm text-neutral-300">{card.d}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function Pricing() {
    return (
        <section className="py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-bold tracking-tight">Packages and consulting</h2>
                <p className="mt-2 text-neutral-300">Clear options with simple scopes. Most small tasks complete within a day.</p>
                <div className="mt-6 grid lg:grid-cols-4 gap-5">
                    {packages.map(p => (
                        <div key={p.name} className="shell-spin p-[2px] rounded-2xl">
                            <div className="glass glass-outline rounded-2xl p-6">
                                <h3 className="text-xl font-semibold">{p.name}</h3>
                                <p className="mt-1 text-sm">{p.time} {p.price ? `• ${p.price}` : ""}</p>
                                <ul className="mt-4 space-y-2 text-sm">
                                    {p.items.map((it, i) => (
                                        <li key={i} className="flex items-start gap-2"><Check className="w-4 h-4 mt-0.5" style={{ color: "var(--g-edge)" }} /> <span>{it}</span></li>
                                    ))}
                                </ul>
                                <a href="#contact" className="mt-6 inline-flex items-center justify-center w-full rounded-xl px-4 py-2 text-sm font-medium border border-lime-300/40 bg-[color:var(--g-glass)] hover:bg-lime-400/30">Request a quote</a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function Testimonials() {
    const [idx, setIdx] = useState(0);
    const next = () => setIdx(i => (i + 1) % testimonials.length);
    const prev = () => setIdx(i => (i - 1 + testimonials.length) % testimonials.length);
    useEffect(() => { const t = setInterval(next, 7000); return () => clearInterval(t); }, []);
    const t = testimonials[idx];
    return (
        <section id="testimonials" className="py-16 sm:py-24">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-bold tracking-tight text-center">Testimonials</h2>
                <div className="mt-6 relative shell-fade p-[2px] rounded-2xl">
                    <div className="relative rounded-2xl border border-white/10 bg-neutral-950/70 backdrop-blur-2xl p-8">
                        <AnimatePresence mode="wait">
                            <motion.div key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <blockquote className="mt-2 text-lg leading-relaxed text-neutral-100">{t.quote}</blockquote>
                                <div className="mt-6 flex items-center justify-between">
                                    <div>
                                        <div className="font-semibold">{t.author}</div>
                                        <div className="text-sm text-neutral-300">{t.role} • {t.company}</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button aria-label="Previous" onClick={() => prev()} className="p-2 rounded-full border border-white/20 hover:bg-white/10 focus:outline-none focus:ring-2" style={{ outlineColor: "var(--g-edge)" }}><ChevronLeft className="w-4 h-4" /></button>
                                        <button aria-label="Next" onClick={() => next()} className="p-2 rounded-full border border-white/20 hover:bg-white/10 focus:outline-none focus:ring-2" style={{ outlineColor: "var(--g-edge)" }}><ChevronRight className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                    <div className="mt-3 text-center text-xs text-neutral-400">Click arrows or wait for auto rotate</div>
                </div>
            </div>
        </section>
    );
}

function About() {
    return (
        <section id="about" className="py-16 sm:py-24">
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-bold tracking-tight">About Adam</h2>
                <p className="mt-3 text-neutral-300">
                    I am a developer and technical problem solver based in California. My work bridges old systems with new tools. I connect APIs that were not meant to talk to each other, automate hours of manual work, and tune websites so they load faster and rank better. I serve clients across Sacramento, Roseville, Rocklin, Folsom, Elk Grove, Citrus Heights, Rancho Cordova, Carmichael, Fair Oaks, the Bay Area, Los Angeles, and San Diego.
                </p>
                <p className="mt-3 text-neutral-300">
                    I have hands on experience reverse engineering closed APIs when practical and appropriate, with clear notes on limits and accuracy. I create POS to website integrations, localized SEO strategies that help delivery services compete with brick and mortar stores, Discord bots for operations, Notion workflows for teams, and AI assistants for common questions. I also help with sales and digital marketing so you can rely on one partner from plan to ship.
                </p>
                <ul className="mt-6 grid sm:grid-cols-2 gap-3 text-sm">
                    <li className="flex items-start gap-2"><Check className="w-4 h-4 mt-0.5" style={{ color: "var(--g-edge)" }} /> Quick and reliable turnaround</li>
                    <li className="flex items-start gap-2"><Check className="w-4 h-4 mt-0.5" style={{ color: "var(--g-edge)" }} /> Clean solutions with documentation</li>
                    <li className="flex items-start gap-2"><Check className="w-4 h-4 mt-0.5" style={{ color: "var(--g-edge)" }} /> One stop shop for engineering and marketing</li>
                    <li className="flex items-start gap-2"><Check className="w-4 h-4 mt-0.5" style={{ color: "var(--g-edge)" }} /> Focus on results you can measure</li>
                </ul>
            </div>
        </section>
    );
}

function Contact() {
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [type, setType] = useState("");

    const nameRef = useRef(null);
    const emailRef = useRef(null);
    const companyRef = useRef(null);
    const detailsRef = useRef(null);
    const deadlineRef = useRef(null);
    const budgetRef = useRef(null);
    const hpRef = useRef(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSent(false);

        const payload = {
            name: nameRef.current?.value?.trim(),
            email: emailRef.current?.value?.trim(),
            company: companyRef.current?.value?.trim(),
            type,
            deadline: deadlineRef.current?.value?.trim(),
            budget: budgetRef.current?.value?.trim(),
            details: detailsRef.current?.value?.trim(),
            hp: hpRef.current?.value?.trim(),
        };

        if (!payload.name || !payload.email || !payload.type || !payload.details) {
            setError("Please fill out name, email, service, and details.");
            return;
        }

        setLoading(true);
        try {
            try {
                await fetch("/api/subscribe", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: payload.email, name: payload.name }),
                });
            } catch { }

            const r = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!r.ok) {
                const data = await r.json().catch(() => ({}));
                throw new Error(data.error || "Failed to send message.");
            }

            setSent(true);
            e.target.reset?.();
            setType("");
        } catch (err) {
            setError(err.message || "Could not send message.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section id="contact" className="py-16 sm:py-24">
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-bold tracking-tight">Start a project</h2>
                <p className="mt-2 text-neutral-300">Pick a service and share a quick note. I will reply fast with a plan and quote.</p>
                <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
                    <input
                        ref={hpRef}
                        name="website"
                        autoComplete="off"
                        tabIndex={-1}
                        aria-hidden="true"
                        className="hidden"
                    />
                    <div className="grid sm:grid-cols-2 gap-4">
                        <input ref={nameRef} required placeholder="Name" className="w-full rounded-xl border border-lime-300/40 bg-transparent px-4 py-3" />
                        <input ref={emailRef} required type="email" placeholder="Email" className="w-full rounded-xl border border-lime-300/40 bg-transparent px-4 py-3" />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="relative">
                            <select
                                required
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full rounded-xl border border-white/20 bg-neutral-900/80 text-neutral-100 px-4 py-3 pr-9 appearance-none focus:outline-none focus:ring-2 focus:ring-lime-300/50"
                            >
                                <option value="" disabled>Choose a service</option>
                                <option>Development and integrations</option>
                                <option>Automation and data</option>
                                <option>Database and performance</option>
                                <option>Technical SEO</option>
                                <option>Local SEO</option>
                                <option>Marketing consulting</option>
                                <option>Other</option>
                            </select>

                            {/* arrow */}
                            <svg
                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-70"
                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                            >
                                <path d="M6 9l6 6 6-6" />
                            </svg>
                        </div>

                        <input ref={companyRef} placeholder="Company (optional)" className="w-full rounded-xl border border-lime-300/40 bg-transparent px-4 py-3" />
                    </div>
                    <textarea ref={detailsRef} required placeholder={type === 'Other' ? 'Tell me what you need' : 'Short description of the task'} rows={5} className="w-full rounded-xl border border-lime-300/40 bg-transparent px-4 py-3" />
                    <div className="grid sm:grid-cols-2 gap-4">
                        <input ref={deadlineRef} placeholder="Ideal deadline" className="w-full rounded-xl border border-lime-300/40 bg-transparent px-4 py-3" />
                        <input ref={budgetRef} placeholder="Budget range" className="w-full rounded-xl border border-lime-300/40 bg-transparent px-4 py-3" />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium bg-lime-400/95 text-neutral-900 disabled:opacity-60"
                    >
                        <Mail className="w-4 h-4" />
                        {loading ? "Sending..." : "Get a plan and quote"}
                    </button>
                    {sent && (
                        <div className="text-sm mt-2" style={{ color: "var(--g-edge)" }}>
                            Thanks for your message was sent. I’ll reply shortly.
                        </div>
                    )}
                    {error && (
                        <div className="text-sm mt-2 text-red-400">
                            {error}
                        </div>
                    )}
                </form>
                <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
                    <a className="link inline-flex items-center gap-2" href="mailto:hey@buildwithadam.dev"><Mail className="w-4 h-4" /> hey@buildwithadam.dev</a>
                    <span className="opacity-50">•</span>
                    <a className="link inline-flex items-center gap-2" href="https://buildwithadam.dev" target="_blank" rel="noreferrer">buildwithadam.dev</a>
                    <span className="opacity-50">•</span>
                    <a className="link inline-flex items-center gap-2" href="#" target="_blank" rel="noreferrer"><Linkedin className="w-4 h-4" /> LinkedIn</a>
                    <span className="opacity-50">•</span>
                    <a className="link inline-flex items-center gap-2" href="https://github.com/buildwithadam" target="_blank" rel="noreferrer"><Github className="w-4 h-4" /> GitHub</a>
                </div>
            </div>
        </section>
    );
}

function Footer() {
    const year = new Date().getFullYear();
    return (
        <footer className="py-10 border-t border-white/10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm opacity-80">© {year} Adam Parker · buildwithadam.dev · Built in Sacramento with love <span aria-hidden>♥</span></div>
                <div className="text-xs opacity-60">Privacy • Terms • Email</div>
            </div>
        </footer>
    );
}

export default function AdamParkerPortfolio() {
    const refs = useRef({});
    const jump = (id) => refs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-50 overflow-x-hidden">
            <GlobalStyles />
            <div className="sticky top-0 z-40"><Navbar onJump={jump} /></div>

            <main>
                <div ref={(el) => (refs.current["home"] = el)}>
                    <Hero onJump={jump} />
                </div>
                <Clients />
                <div ref={(el) => (refs.current["services"] = el)}>
                    <Services />
                </div>
                <div ref={(el) => (refs.current["seo"] = el)}>
                    <SEOBlock />
                </div>
                <div ref={(el) => (refs.current["cannabis"] = el)}>
                    <Cannabis />
                </div>
                <Pricing />
                <div ref={(el) => (refs.current["work"] = el)}>
                    <Portfolio />
                </div>
                <div ref={(el) => (refs.current["testimonials"] = el)}>
                    <Testimonials />
                </div>
                <div ref={(el) => (refs.current["about"] = el)}>
                    <About />
                </div>
                <div ref={(el) => (refs.current["contact"] = el)}>
                    <Contact />
                </div>
            </main>
            <a
                href="#contact"
                onClick={(e) => { e.preventDefault(); jump("contact"); }}
                className="fixed bottom-6 right-6 z-[70] pointer-events-auto rounded-full px-4 py-3 border border-lime-300/40 bg-[color:var(--g-glass)] text-neutral-900 shadow-xl hover:scale-105 transition-transform focus:outline-none focus-visible:ring-2"
                style={{ outlineColor: "var(--g-edge)" }}
            >
                <span className="inline-flex items-center gap-2"><Sparkles className="w-4 h-4" /> Get a quote</span>
            </a>
            <Footer />
        </div>
    );
}