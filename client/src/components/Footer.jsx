import { Code2, Github } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="border-t border-border bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary">
                        <Code2 className="w-3.5 h-3.5 text-primary-foreground" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">CodeCode</span>
                    <span className="text-sm text-muted-foreground">
                        — Compete. Grow. Conquer.
                    </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
                    <Link to="/contests" className="hover:text-foreground transition-colors">Contests</Link>
                    <Link to="/design-contest" className="hover:text-foreground transition-colors">Design Contest</Link>
                    <a
                        href="https://github.com"
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-foreground transition-colors"
                        aria-label="GitHub"
                    >
                        <Github className="w-4 h-4" />
                    </a>
                </div>

                <p className="text-xs text-muted-foreground">
                    © {new Date().getFullYear()} CodeCode. All rights reserved.
                </p>
            </div>
        </footer>
    );
}
