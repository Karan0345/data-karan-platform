import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import Header from '../../components/layout/Header';
import { Loader2, AlertTriangle, ArrowLeft, Inbox, Download, Search, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useState, useMemo } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import toast from 'react-hot-toast';

const PAGE_SIZE = 10;

// This will fetch form metadata once, and it won't be refetched on search/pagination changes
const fetchFormMeta = async (formId) => {
    const { data, error } = await supabase
        .from('forms')
        .select('title, description, fields')
        .eq('id', formId)
        .single();
    if (error) throw new Error(`Form metadata fetch error: ${error.message}`);
    return data;
};

// This will fetch the responses and will be refetched
const fetchResponses = async (formId, searchTerm, page) => {
    const { data, error } = await supabase.rpc('get_paginated_form_responses', {
        p_form_id: formId,
        search_term: searchTerm,
        page_number: page,
        page_size: PAGE_SIZE
    });
    if (error) throw new Error(`Responses fetch error: ${error.message}`);
    return data || [];
};

const deleteResponse = async (responseId) => {
    const { error } = await supabase.from('responses').delete().eq('id', responseId);
    if (error) throw new Error(error.message);
};

const ResponsesPage = () => {
    const { formId } = useParams();
    const queryClient = useQueryClient();
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const { data: formMeta, isLoading: isMetaLoading, isError: isMetaError, error: metaError } = useQuery({
        queryKey: ['formMeta', formId],
        queryFn: () => fetchFormMeta(formId),
    });

    const { data: responses, isLoading: areResponsesLoading, isError: areResponsesError, error: responsesError } = useQuery({
        queryKey: ['formResponses', formId, debouncedSearchTerm, currentPage],
        queryFn: () => fetchResponses(formId, debouncedSearchTerm, currentPage),
        enabled: !!formMeta, // Only run this query once formMeta is available
        keepPreviousData: true,
    });
    
    const deleteMutation = useMutation({
        mutationFn: deleteResponse,
        onSuccess: () => {
            toast.success('Response deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['formResponses', formId] });
            queryClient.invalidateQueries({ queryKey: ['forms'] }); // Invalidate dashboard to update response count
        },
        onError: (error) => {
            toast.error(`Failed to delete response: ${error.message}`);
        }
    });

    const handleDelete = (responseId) => {
        if (window.confirm('Are you sure you want to delete this response?')) {
            deleteMutation.mutate(responseId);
        }
    };

    const getExportData = async () => {
        toast.loading('Preparing export data...');
        const { data: allResponses, error } = await supabase.rpc('get_paginated_form_responses', {
            p_form_id: formId,
            search_term: '',
            page_number: 1,
            page_size: 10000 // A large number to get all responses
        });
        toast.dismiss();

        if (error || !allResponses || allResponses.length === 0) {
            toast.error("No data to export or failed to fetch data.");
            return null;
        }

        const data = allResponses.map(response => {
            const row = {};
            row['Submitted At'] = new Date(response.created_at).toLocaleString('en-GB');
            formMeta.fields.forEach(field => {
                const responseField = response.data.find(d => d.label === field.label);
                row[field.label] = responseField ? responseField.value : '';
            });
            return row;
        });
        return data;
    }

    const handleExportCSV = async () => {
        const data = await getExportData();
        if (!data) return;

        const headers = ['Submitted At', ...formMeta.fields.map(field => field.label)];
        const csv = Papa.unparse({ fields: headers, data });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${formMeta.title.replace(/\s+/g, '_')}_responses.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportXLSX = async () => {
        const data = await getExportData();
        if (!data) return;

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Responses");
        XLSX.writeFile(workbook, `${formMeta.title.replace(/\s+/g, '_')}_responses.xlsx`);
    };

    const tableHeaders = useMemo(() => formMeta?.fields?.map(field => field.label) || [], [formMeta]);
    const totalCount = responses?.[0]?.total_count || 0;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    
    const isLoading = isMetaLoading || areResponsesLoading;
    const isError = isMetaError || areResponsesError;
    const error = metaError || responsesError;
    const hasResponses = !isLoading && !isError && responses && responses.length > 0;

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {isLoading && (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    </div>
                )}

                {isError && (
                    <div className="text-center py-20 px-4">
                        <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
                        <h3 className="mt-2 text-lg font-medium text-foreground">Failed to load data</h3>
                        <p className="mt-1 text-sm text-destructive">{error.message}</p>
                        <Link to="/dashboard" className="mt-6 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90">
                            Back to Dashboard
                        </Link>
                    </div>
                )}

                {!isLoading && !isError && formMeta && (
                     <>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                            <div>
                                <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2">
                                    <ArrowLeft className="h-4 w-4" />
                                    Back to Dashboard
                                </Link>
                                <h1 className="text-3xl font-bold text-foreground">{formMeta.title}</h1>
                                <p className="mt-1 text-muted-foreground">Viewing {totalCount} submitted responses.</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <button onClick={handleExportCSV} disabled={totalCount === 0} className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-foreground bg-primary/90 hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50">
                                    <Download className="mr-2 h-4 w-4" />
                                    Export CSV
                                </button>
                                <button onClick={handleExportXLSX} disabled={totalCount === 0} className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50">
                                    <Download className="mr-2 h-4 w-4" />
                                    Export XLSX
                                </button>
                            </div>
                        </div>
                        <div className="bg-card border rounded-lg shadow-sm">
                            <div className="p-4 border-b">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <input 
                                        type="text"
                                        placeholder="Search responses..."
                                        value={searchTerm}
                                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                        className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-md"
                                    />
                                </div>
                            </div>
                            {!hasResponses ? (
                                <div className="text-center py-20">
                                    <Inbox className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <h3 className="mt-2 text-lg font-medium text-foreground">{debouncedSearchTerm ? 'No matching responses' : 'No responses yet'}</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">{debouncedSearchTerm ? 'Try a different search term.' : 'Share your form to start collecting data.'}</p>
                                </div>
                            ) : (
                                <>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-border">
                                        <thead className="bg-muted/50">
                                            <tr>
                                                {tableHeaders.map(header => (
                                                    <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{header}</th>
                                                ))}
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Submitted At</th>
                                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {responses.map(response => (
                                                <tr key={response.id}>
                                                    {tableHeaders.map(header => {
                                                        const responseField = response.data.find(d => d.label === header);
                                                        const value = responseField ? String(responseField.value) : 'N/A';
                                                        return <td key={header} className="px-6 py-4 whitespace-nowrap text-sm text-foreground max-w-xs truncate">{value}</td>;
                                                    })}
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                        {new Date(response.created_at).toLocaleString('en-GB')}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <button onClick={() => handleDelete(response.id)} disabled={deleteMutation.isPending && deleteMutation.variables === response.id} className="p-2 text-muted-foreground hover:text-destructive disabled:opacity-50" title="Delete Response"><Trash2 className="h-4 w-4" /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {totalPages > 1 && (
                                    <div className="p-4 border-t flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">
                                            Page {currentPage} of {totalPages} ({totalCount} results)
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="inline-flex items-center justify-center px-3 py-1 border text-sm font-medium rounded-md disabled:opacity-50">
                                                <ChevronLeft className="h-4 w-4 mr-1" />
                                                Previous
                                            </button>
                                            <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="inline-flex items-center justify-center px-3 py-1 border text-sm font-medium rounded-md disabled:opacity-50">
                                                Next
                                                <ChevronRight className="h-4 w-4 ml-1" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                                </>
                            )}
                        </div>
                     </>
                )}
            </main>
        </div>
    );
};

export default ResponsesPage;
