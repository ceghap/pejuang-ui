import { useState } from 'react';
import { 
  CheckCircle2, 
  Copy, 
  MessageCircle, 
  ClipboardCheck
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function CommissionSuccessDialog({ isOpen, onClose, data }) {
  const [copied, setCopied] = useState(false);

  if (!data) return null;

  const {
    uplineName,
    uplinePhone,
    customerName,
    orderRef,
    amount,
    payoutDate
  } = data;

  // Format the text for the Introducer
  const messageText = `PEJUANG 313
COMMISSION PAYMENT RECEIPT

TO: ${uplineName.toUpperCase()}
DATE: ${payoutDate}

MATTER: INTRODUCER COMMISSION
ORDER REF: ${orderRef.toUpperCase()}
DOWNLINE NAME: ${customerName.toUpperCase()}

TOTAL AMOUNT PAID: RM ${amount.toLocaleString()}

Thank you for your efforts in advancing the Pejuang 313 mission. Wishing you continued success!`.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    let phone = uplinePhone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '6' + phone;
    
    const encodedText = encodeURIComponent(messageText);
    window.open(`https://wa.me/${phone}?text=${encodedText}`, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-blue-600" />
          </div>
          <DialogTitle className="text-center text-xl">Payout Successful!</DialogTitle>
          <DialogDescription className="text-center">
            Commission has been marked as paid. Share this receipt with the introducer.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 rounded-lg p-4 font-mono text-[11px] whitespace-pre-wrap border border-border relative group">
          {messageText}
          <Button 
            variant="ghost" 
            size="sm" 
            className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleCopy}
          >
            {copied ? <ClipboardCheck className="w-4 h-4 text-blue-600" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>

        <DialogFooter className="flex sm:justify-between gap-2 mt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Close
          </Button>
          <Button onClick={handleWhatsApp} className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white">
            <MessageCircle className="w-4 h-4 mr-2" /> Share to WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
