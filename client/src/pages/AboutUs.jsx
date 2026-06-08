import {
    Code2,
    Server,
    Terminal,
    Database,
    ShieldCheck,
    Zap,
    Bot,
    Trophy,
} from 'lucide-react';
import {Card, CardContent} from '@/components/ui/card';

export default function AboutUs() {
    return (
        <div className="min-h-screen bg-background py-16 px-4 sm:px-6">
            <div className="max-w-5xl mx-auto space-y-16">
                {/* Header Section */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
                        About <span className="text-primary">CodeCode</span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                        A high-performance, production-grade competitive
                        programming platform inspired by Codeforces. Built from
                        the ground up to handle massive concurrencies, code
                        execution sandboxing, and real-time contest evaluations.
                    </p>
                    <div className="pt-4 flex items-center justify-center gap-2 text-sm font-medium text-foreground">
                        <span>Created by</span>
                        <a
                            href="https://www.linkedin.com/in/pranaw-kumar-710331215/"
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline underline-offset-4 font-bold"
                        >
                            Pranaw Kumar
                        </a>
                    </div>
                </div>

                {/* Features Section */}
                <div>
                    <h2 className="text-2xl font-bold mb-6 text-foreground border-b border-border pb-2">
                        Platform Features
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FeatureCard
                            icon={Trophy}
                            title="Contest & Ratings"
                            desc="Real-time Codeforces-style leaderboards and a comprehensive Elo rating system powered by complex SQL JOINs and automated cron evaluations."
                        />
                        <FeatureCard
                            icon={Zap}
                            title="Asynchronous Queue"
                            desc="Lightning fast submissions via a Redis-backed BullMQ job queue. The web server stays responsive regardless of heavy execution workloads."
                        />
                        <FeatureCard
                            icon={Terminal}
                            title="Docker Online Judge"
                            desc="Fully isolated sandboxed execution environments for 5 different languages with strict memory limits and zero internet access."
                        />
                        <FeatureCard
                            icon={ShieldCheck}
                            title="Robust Security"
                            desc="Stateless JWT HttpOnly cookie authentication, bcrypt hashing, and strict express-rate-limit mechanisms on all sensitive routes."
                        />
                        <FeatureCard
                            icon={Bot}
                            title="AI Powered Assistance"
                            desc="Integrated AI assistant powered by the Gemini API to provide conceptual hints, automatically generate edge-case test cases, and refine problem statements."
                        />
                        <FeatureCard
                            icon={Database}
                            title="ACID Transactions"
                            desc="Critical operations like contest evaluation and rating deltas are wrapped in strict MySQL transactions preventing partial state updates."
                        />
                        <FeatureCard
                            icon={ShieldCheck}
                            title="Advanced Anti-Cheat"
                            desc="Integrated Monaco editor equipped with clipboard event tracking to block external code pastes, alongside automatic lock-outs for user-defined code templates during active contests."
                        />
                        <FeatureCard
                            icon={Server}
                            title="Real-Time Tracking"
                            desc="WebSocket integration automatically tracks and broadcasts the exact number of live online users actively participating on the platform."
                        />
                        <FeatureCard
                            icon={Code2}
                            title="User Boilerplates"
                            desc="Manage custom language templates allowing quick scaffolding when solving complex algorithms, automatically disabled during live competitions."
                        />
                    </div>
                </div>

                {/* Tech Stack Section */}
                <div>
                    <h2 className="text-2xl font-bold mb-6 text-foreground border-b border-border pb-2">
                        The Technology Stack
                    </h2>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Backend */}
                        <Card className="border-border shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <Server className="w-6 h-6 text-blue-500" />
                                    <h3 className="text-xl font-bold">
                                        Backend System
                                    </h3>
                                </div>
                                <ul className="space-y-3">
                                    <TechItem
                                        name="Node.js & Express v5"
                                        desc="Non-blocking event-driven core architecture."
                                    />
                                    <TechItem
                                        name="MySQL 8"
                                        desc="Relational data integrity and complex multi-JOIN queries."
                                    />
                                    <TechItem
                                        name="Redis & BullMQ"
                                        desc="In-memory store and highly durable job queuing."
                                    />
                                    <TechItem
                                        name="Docker"
                                        desc="Isolated compilation and process-limited execution."
                                    />
                                    <TechItem
                                        name="Google Gemini API"
                                        desc="Cloud LLM integration for intelligent contest design features."
                                    />
                                    <TechItem
                                        name="Swagger UI"
                                        desc="Fully interactive API documentation served directly."
                                    />
                                </ul>
                            </CardContent>
                        </Card>

                        {/* Frontend */}
                        <Card className="border-border shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <Code2 className="w-6 h-6 text-indigo-500" />
                                    <h3 className="text-xl font-bold">
                                        Frontend System
                                    </h3>
                                </div>
                                <ul className="space-y-3">
                                    <TechItem
                                        name="React.js"
                                        desc="Component-driven dynamic user interfaces."
                                    />
                                    <TechItem
                                        name="Vite"
                                        desc="Blazing fast modern build tooling and HMR."
                                    />
                                    <TechItem
                                        name="Tailwind CSS"
                                        desc="Utility-first rapidly scalable styling system."
                                    />
                                    <TechItem
                                        name="Shadcn/ui"
                                        desc="Beautifully designed, accessible headless components."
                                    />
                                    <TechItem
                                        name="Lucide React"
                                        desc="Clean, consistent and sharp vector icon library."
                                    />
                                    <TechItem
                                        name="React Router"
                                        desc="Seamless client-side routing and protected boundaries."
                                    />
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FeatureCard({icon: Icon, title, desc}) {
    return (
        <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow group">
            <CardContent className="p-5 flex flex-col gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {desc}
                </p>
            </CardContent>
        </Card>
    );
}

function TechItem({name, desc}) {
    return (
        <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
            <div className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 w-fit">
                {name}
            </div>
            <span className="text-sm text-muted-foreground">{desc}</span>
        </li>
    );
}
