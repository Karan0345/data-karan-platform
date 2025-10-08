import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

const NotFoundPage = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center px-4">
            <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
            <h1 className="text-6xl font-extrabold text-primary tracking-tighter">404</h1>
            <h2 className="text-2xl font-bold text-foreground mt-2">Page Not Found</h2>
            <p className="mt-4 max-w-sm text-muted-foreground">
                Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
            </p>
            <Link
                to="/"
                className="mt-8 inline-block px-6 py-3 text-base font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 shadow-lg"
            >
                Go back to Homepage
            </Link>
        </div>
    );
};

export default NotFoundPage;
