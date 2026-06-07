import React from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {Ghost, Home, ArrowLeft} from 'lucide-react';
import {Button} from '@/components/ui/button';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center px-6 relative overflow-hidden">
            {/* Abstract Background Elements */}
            <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center max-w-md w-full">
                <div className="w-24 h-24 mb-6 rounded-2xl bg-primary/10 flex items-center justify-center text-primary transform rotate-12 hover:rotate-0 transition-all duration-300 shadow-[0_0_40px_rgba(var(--primary),0.2)]">
                    <Ghost className="w-12 h-12" strokeWidth={1.5} />
                </div>

                <h1 className="text-8xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-primary to-blue-600 mb-4 select-none drop-shadow-sm">
                    404
                </h1>

                <h2 className="text-3xl font-bold text-foreground mb-3 tracking-tight">
                    Page Not Found
                </h2>

                <p className="text-muted-foreground mb-10 text-lg leading-relaxed">
                    The page you’re looking for seems to have vanished into the
                    void. It might have been moved or never existed at all.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
                    <Button
                        variant="default"
                        size="lg"
                        className="w-full sm:w-auto gap-2 group shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                        asChild
                    >
                        <Link to="/">
                            <Home className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            Back to Home
                        </Link>
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        className="w-full sm:w-auto gap-2"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
