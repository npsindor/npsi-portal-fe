import { Link, useLocation } from 'react-router-dom';
import { Home } from 'lucide-react';
import { useLang } from '@/lib/i18n';

const COPY = {
    en: { title: 'Page not found', body: 'The page you are looking for does not exist or has been moved.', home: 'Go to the home page' },
    hi: { title: 'पेज नहीं मिला', body: 'आप जिस पेज को खोज रहे हैं वह मौजूद नहीं है या हटा दिया गया है।', home: 'होम पेज पर जाएँ' },
};

export default function PageNotFound() {
    const location = useLocation();
    const { lang } = useLang();
    const t = COPY[lang] || COPY.en;

    return (
        <main className="min-h-screen flex items-center justify-center p-6 bg-background">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="space-y-2">
                    <p className="text-7xl font-light text-muted-foreground/50" aria-hidden="true">404</p>
                    <div className="h-0.5 w-16 bg-border mx-auto"></div>
                </div>
                <div className="space-y-3">
                    <h1 className="text-2xl font-medium text-foreground">{t.title}</h1>
                    <p className="text-muted-foreground leading-relaxed">{t.body}</p>
                    <p className="break-all text-xs text-muted-foreground">{location.pathname}</p>
                </div>
                <div className="pt-4">
                    <Link
                        to="/"
                        className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                        <Home className="h-4 w-4" aria-hidden="true" />
                        {t.home}
                    </Link>
                </div>
            </div>
        </main>
    );
}
