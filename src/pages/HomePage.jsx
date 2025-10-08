import { Link } from 'react-router-dom';
import { Database, Edit, Share2, BarChart3 } from 'lucide-react';

const HomePage = () => {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <header className="flex justify-between items-center py-6">
                    <div className="flex items-center space-x-2">
                        <Database className="h-8 w-8 text-primary" />
                        <span className="font-bold text-2xl">DataEntryX</span>
                    </div>
                    <div className="space-x-4">
                        <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-primary">
                            Login
                        </Link>
                        <Link to="/signup" className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90">
                            Get Started
                        </Link>
                    </div>
                </header>

                <main className="text-center py-20 md:py-32">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-4">
                        Build, Share, and Analyze Forms
                    </h1>
                    <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-8">
                        The ultimate open-source solution for creating dynamic forms, collecting data securely, and gaining insights from responses.
                    </p>
                    <Link to="/signup" className="inline-block px-8 py-3 text-lg font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 shadow-lg">
                        Create Your First Form
                    </Link>
                </main>

                <section className="py-16">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                        <div className="p-6 bg-card border rounded-lg">
                            <Edit className="h-10 w-10 mx-auto mb-4 text-primary" />
                            <h3 className="text-xl font-semibold mb-2">Dynamic Form Builder</h3>
                            <p className="text-muted-foreground">Easily create forms with various field types like text, number, checkbox, and dropdowns.</p>
                        </div>
                        <div className="p-6 bg-card border rounded-lg">
                            <Share2 className="h-10 w-10 mx-auto mb-4 text-primary" />
                            <h3 className="text-xl font-semibold mb-2">Share & Collect</h3>
                            <p className="text-muted-foreground">Share your forms via unique URLs or QR codes and collect responses from anyone, anywhere.</p>
                        </div>
                        <div className="p-6 bg-card border rounded-lg">
                            <BarChart3 className="h-10 w-10 mx-auto mb-4 text-primary" />
                            <h3 className="text-xl font-semibold mb-2">Analyze Responses</h3>
                            <p className="text-muted-foreground">View, filter, and export your data. Gain insights with a powerful response dashboard.</p>
                        </div>
                    </div>
                </section>

                <footer className="text-center py-8 mt-16 border-t">
                    <p className="text-muted-foreground">&copy; 2025 DataEntryX. Built with passion by Dualite Alpha.</p>
                </footer>
            </div>
        </div>
    );
};

export default HomePage;
