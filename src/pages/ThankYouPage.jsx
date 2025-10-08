import { Link } from 'react-router-dom';
import { CheckCircle, Database } from 'lucide-react';

const ThankYouPage = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 text-center px-4">
            <div className="max-w-md w-full bg-card p-8 md:p-12 rounded-lg shadow-lg border">
                <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
                <h1 className="text-3xl font-bold text-foreground">Thank You!</h1>
                <p className="mt-4 text-lg text-muted-foreground">
                    Your response has been successfully submitted.
                </p>
                <div className="mt-10">
                    <Link
                        to="/"
                        className="inline-flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
                    >
                        <Database className="h-4 w-4" />
                        Powered by DataEntryX
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ThankYouPage;
