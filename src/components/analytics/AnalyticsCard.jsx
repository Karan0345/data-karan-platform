import { Skeleton } from '../ui/Skeleton';

const AnalyticsCard = ({ title, value, icon: Icon, isLoading }) => {
    if (isLoading) {
        return (
            <div className="bg-card p-6 rounded-lg border shadow-sm">
                <Skeleton className="h-6 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="absolute top-6 right-6 h-8 w-8" />
            </div>
        );
    }

    return (
        <div className="bg-card p-6 rounded-lg border shadow-sm relative overflow-hidden">
            <div className="absolute top-6 right-6 text-muted-foreground/20">
                <Icon className="h-12 w-12" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
            <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
        </div>
    );
};

export default AnalyticsCard;
