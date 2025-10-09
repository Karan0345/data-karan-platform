import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { FileText, MessageSquareText, DivideCircle, AlertTriangle } from 'lucide-react';
import { Skeleton } from '../shared/Skeleton';

const fetchAnalyticsSummary = async () => {
    const { data, error } = await supabase.rpc('get_analytics_summary');
    if (error) throw new Error(error.message);
    return data[0]; // RPC returns an array with one object
};

const Card = ({ title, value, icon: Icon, description }) => (
    <div className="bg-card border rounded-lg p-6 flex flex-col justify-between">
        <div className="flex justify-between items-start">
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
            <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="mt-4">
            <p className="text-3xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
        </div>
    </div>
);

const CardSkeleton = () => (
    <div className="bg-card border rounded-lg p-6">
        <div className="flex justify-between items-start">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-5 rounded-full" />
        </div>
        <div className="mt-4">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32 mt-2" />
        </div>
    </div>
);

const AnalyticsCards = () => {
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['analyticsSummary'],
        queryFn: fetchAnalyticsSummary,
    });

    if (isLoading) {
        return (
            <div className="grid gap-6 md:grid-cols-3">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="bg-destructive/10 border border-destructive text-destructive text-sm rounded-lg p-4 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5"/>
                <div>
                    <p className="font-bold">Failed to load analytics</p>
                    <p>{error.message}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="grid gap-6 md:grid-cols-3">
            <Card 
                title="Total Forms" 
                value={data?.total_forms ?? 0}
                icon={FileText}
                description="Total number of forms created"
            />
            <Card 
                title="Total Responses" 
                value={data?.total_responses ?? 0}
                icon={MessageSquareText}
                description="Total submissions across all forms"
            />
            <Card 
                title="Avg. Responses / Form" 
                value={Number(data?.avg_responses_per_form ?? 0).toFixed(1)}
                icon={DivideCircle}
                description="Average submissions per form"
            />
        </div>
    );
};

export default AnalyticsCards;
