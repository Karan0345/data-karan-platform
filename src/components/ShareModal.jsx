import { Copy, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { useTheme } from '../hooks/useTheme';

const ShareModal = ({ form, onClose }) => {
    const { theme } = useTheme();
    if (!form) return null;

    const formUrl = `${window.location.origin}/form/${form.id}`;

    const handleCopy = () => {
        const fallbackCopy = () => {
            const textArea = document.createElement("textarea");
            textArea.value = formUrl;
            textArea.style.position = "absolute";
            textArea.style.left = "-9999px";
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                toast.success('URL copied to clipboard!');
            } catch (err) {
                toast.error('Failed to copy URL.');
            }
            document.body.removeChild(textArea);
        };

        if (navigator.clipboard) {
            navigator.clipboard.writeText(formUrl).then(() => {
                toast.success('URL copied to clipboard!');
            }).catch(() => {
                // Fallback to execCommand if clipboard API fails (e.g., in insecure context)
                fallbackCopy();
            });
        } else {
            // Fallback for browsers that don't support Clipboard API
            fallbackCopy();
        }
    };

    // Dynamically set QR code colors based on theme
    const qrBgColor = theme === 'dark' ? '#020817' : '#f1f5f9'; // Corresponds to dark:bg-gray-900 and bg-muted
    const qrFgColor = theme === 'dark' ? '#f8fafc' : '#020817'; // Corresponds to dark:text-slate-50 and text-slate-900

    return (
        <div 
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" 
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-card rounded-lg shadow-xl p-6 sm:p-8 max-w-md w-full relative" 
                onClick={(e) => e.stopPropagation()}
            >
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground rounded-full focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label="Close"
                >
                    <X className="h-6 w-6" />
                </button>
                
                <h2 className="text-2xl font-bold text-foreground mb-2">Share Your Form</h2>
                <p className="text-muted-foreground mb-6">Anyone with the link or QR code can view and submit this form.</p>

                <div className="space-y-6">
                    <div className="flex flex-col items-center justify-center bg-muted p-6 rounded-lg">
                        <QRCodeSVG value={formUrl} size={160} bgColor={qrBgColor} fgColor={qrFgColor} />
                    </div>

                    <div>
                        <label htmlFor="formUrl" className="text-sm font-medium text-foreground">Form URL</label>
                        <div className="flex items-center mt-1">
                            <input 
                                id="formUrl"
                                type="text" 
                                readOnly 
                                value={formUrl} 
                                className="w-full px-3 py-2 bg-background border border-input rounded-l-md text-sm"
                            />
                            <button 
                                onClick={handleCopy}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-r-md hover:bg-primary/90 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card"
                            >
                                <Copy className="h-4 w-4" />
                                <span>Copy</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
