import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import ReactECharts from 'echarts-for-react';
import { useTheme } from '../../hooks/useTheme';
import { AlertTriangle } from 'lucide-react';
import { Skeleton } from '../shared/Skeleton';

const fetchSubmissionCounts = async () => {
    const { data, error } = await supabase.rpc('get_daily_submission_counts', { days_limit: 30 });
    if (error) throw new Error(error.message);
    return data;
};

const ChartSkeleton = () => (
    <div className="bg-card border rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-72 w-full" />
    </div>
);

const SubmissionsChart = () => {
    const { theme } = useTheme();
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['submissionCounts'],
        queryFn: fetchSubmissionCounts,
    });

    if (isLoading) {
        return <ChartSkeleton />;
    }

    if (isError) {
        return (
            <div className="bg-destructive/10 border border-destructive text-destructive text-sm rounded-lg p-4 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5"/>
                <div>
                    <p className="font-bold">Failed to load chart data</p>
                    <p>{error.message}</p>
                </div>
            </div>
        );
    }
    
    const chartData = (data || []).map(d => ({
        date: new Date(d.submission_date).toLocaleDateString('en-CA'), // YYYY-MM-DD for sorting
        count: d.count
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    const dates = chartData.map(d => new Date(d.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }));
    const counts = chartData.map(d => d.count);

    const option = {
        tooltip: {
            trigger: 'axis',
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
            borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
            textStyle: {
                color: theme === 'dark' ? '#f9fafb' : '#111827',
            },
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: dates,
            axisLine: {
                lineStyle: {
                    color: theme === 'dark' ? '#4b5563' : '#d1d5db',
                }
            },
            axisLabel: {
                color: theme === 'dark' ? '#9ca3af' : '#6b7281',
            }
        },
        yAxis: {
            type: 'value',
            splitLine: {
                lineStyle: {
                    color: theme === 'dark' ? '#374151' : '#e5e7eb',
                }
            },
            axisLabel: {
                color: theme === 'dark' ? '#9ca3af' : '#6b7281',
            }
        },
        series: [
            {
                name: 'Submissions',
                type: 'line',
                stack: 'Total',
                smooth: true,
                data: counts,
                itemStyle: {
                    color: '#3b82f6' // primary blue
                },
                lineStyle: {
                    width: 3,
                },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [{
                            offset: 0, color: 'rgba(59, 130, 246, 0.4)' // primary blue with opacity
                        }, {
                            offset: 1, color: 'rgba(59, 130, 246, 0)'
                        }]
                    }
                }
            }
        ]
    };

    return (
        <div className="bg-card border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Submissions Over Last 30 Days</h3>
            <div style={{ height: '300px' }}>
                <ReactECharts option={option} style={{ height: '100%', width: '100%' }} notMerge={true} lazyUpdate={true} />
            </div>
        </div>
    );
};

export default SubmissionsChart;
