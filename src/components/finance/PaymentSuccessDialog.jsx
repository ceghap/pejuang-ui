import { useState } from 'react';
import { 
  CheckCircle2, 
  Copy, 
  MessageCircle, 
  X,
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

export function PaymentSuccessDialog({ isOpen, onClose, data }) {
  const [copied, setCopied] = useState(false);

  if (!data) return null;

  const {
    memberId,
    customerName,
    items,
    totalPrice,
    package: tier,
    depositInfo,
    installmentRate,
    totalMonths,
    installmentsPaid,
    remainingBalance
  } = data;

  // Format the text exactly like the manual WhatsApp receipt
  const messageText = `PEJUANG 313
No. Siri: ${memberId}

NAMA PESERTA: ${customerName.toUpperCase()}

PERKARA: 
${items.map((item, i) => `${i + 1}) ${item.toUpperCase()}`).join('\n')}

JUMLAH: RM ${totalPrice.toLocaleString()}
PAKEJ: ${tier.toUpperCase()}

KAEDAH PEMBAYARAN:
${depositInfo}
BAKI ANSURAN RM ${(totalPrice - parseFloat(depositInfo.match(/RM ([\d,.]+)/)?.[1]?.replace(/,/g, '') || 0)).toLocaleString()}
RM ${installmentRate.toLocaleString()} X ${totalMonths} BLN 

${installmentsPaid.map(ins => `${ins.label}: RM ${ins.amount.toLocaleString()} (${ins.date})\nBAKI: RM ${ins.balance.toLocaleString()}`).join('\n\n')}
`.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    // Format phone: remove non-digits, ensure it starts with 6 for Malaysia if it starts with 0
    let phone = data.phoneNumber.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '6' + phone;
    
    const encodedText = encodeURIComponent(messageText);
    window.open(`https://wa.me/${phone}?text=${encodedText}`, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto bg-emerald-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <DialogTitle className="text-center text-xl">Payment Successful!</DialogTitle>
          <DialogDescription className="text-center">
            The payment has been recorded. You can now share the receipt details with the member.
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
            {copied ? <ClipboardCheck className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
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
