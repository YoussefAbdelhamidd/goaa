import React from 'react';

const INVOICE_URL = '/BillingInvoice17112026.pdf';

interface InvoiceThankYouProps {
  onClose: () => void;
}

const InvoiceThankYou: React.FC<InvoiceThankYouProps> = ({ onClose }) => {
  return (
    <div className="modal-overlay invoice-thankyou-overlay">
      <div className="modal-content invoice-thankyou-modal" role="dialog" aria-modal="true">
        <span className="invoice-thankyou-badge">Google Invoice</span>
        <h3>Thank you for paying</h3>
        <p className="invoice-thankyou-en" dir="ltr">
          Thank you for paying the Google invoice. Your payment has been received.
          You can view or download the invoice below.
        </p>
        <div className="invoice-thankyou-divider" aria-hidden="true" />
        <h3 dir="rtl">شكرًا لسداد الفاتورة</h3>
        <p className="invoice-thankyou-ar" dir="rtl">
          شكرًا لسداد فاتورة Google. تم استلام دفعتك بنجاح. يمكنك عرض أو تحميل
          الفاتورة من الأسفل.
        </p>

        <div className="invoice-thankyou-preview">
          <iframe
            title="Google Billing Invoice"
            src={`${INVOICE_URL}#toolbar=0`}
            className="invoice-thankyou-frame"
          />
        </div>

        <div className="modal-buttons invoice-thankyou-actions">
          <a
            className="cancel-btn invoice-download-btn"
            href={INVOICE_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            View / عرضيل الفاتورة
          </a>
          <button type="button" className="confirm-btn" onClick={onClose}>
            OK / حسناً
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceThankYou;
