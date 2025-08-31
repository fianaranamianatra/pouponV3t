import React from 'react';
import { Modal } from '../Modal';
import { Printer, Download, Receipt, Calendar, User, DollarSign, CreditCard, FileText, School } from 'lucide-react';
import { Avatar } from '../Avatar';

interface Payment {
  id?: string;
  studentName: string;
  class: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  period: string;
  status: string;
  reference: string;
  notes?: string;
}

interface Student {
  firstName: string;
  lastName: string;
  class: string;
  parentName: string;
  phone: string;
}

interface PaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment;
  student: Student;
}

export function PaymentReceiptModal({ isOpen, onClose, payment, student }: PaymentReceiptModalProps) {
  const handlePrint = () => {
    const receiptContent = generateReceiptContent();
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const htmlContent = `
        <html>
          <head>
            <title>Reçu de Paiement - ${payment.reference}</title>
            <style>
              body { 
                font-family: 'Arial', sans-serif; 
                margin: 20px; 
                line-height: 1.5;
                color: #333;
              }
              .receipt-container {
                max-width: 600px;
                margin: 0 auto;
                border: 2px solid #2563eb;
                border-radius: 8px;
                overflow: hidden;
              }
              .header { 
                background: linear-gradient(135deg, #2563eb, #1d4ed8);
                color: white;
                padding: 20px;
                text-align: center;
              }
              .school-name { 
                font-size: 20px; 
                font-weight: bold; 
                margin-bottom: 5px;
              }
              .receipt-title {
                font-size: 16px;
                margin-top: 10px;
                opacity: 0.9;
              }
              .content {
                padding: 20px;
              }
              .section {
                margin: 15px 0;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 6px;
                border-left: 4px solid #2563eb;
              }
              .section-title {
                font-weight: bold;
                color: #2563eb;
                margin-bottom: 10px;
                font-size: 14px;
              }
              .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
              }
              .info-item {
                display: flex;
                justify-content: space-between;
                margin: 5px 0;
                font-size: 13px;
              }
              .info-label {
                font-weight: 500;
                color: #6b7280;
              }
              .info-value {
                font-weight: 600;
                color: #111827;
              }
              .amount-section {
                background: #dcfce7;
                border: 2px solid #16a34a;
                border-radius: 8px;
                padding: 20px;
                text-align: center;
                margin: 20px 0;
              }
              .amount {
                font-size: 24px;
                font-weight: bold;
                color: #16a34a;
                margin: 10px 0;
              }
              .footer {
                background: #f3f4f6;
                padding: 15px;
                text-align: center;
                font-size: 11px;
                color: #6b7280;
                border-top: 1px solid #e5e7eb;
              }
              .signature-section {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 40px;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
              }
              .signature-box {
                text-align: center;
                padding: 20px 0;
              }
              .signature-line {
                border-top: 1px solid #333;
                margin-top: 40px;
                padding-top: 5px;
                font-size: 12px;
              }
              @media print {
                body { margin: 10px; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="receipt-container">
              ${receiptContent}
            </div>
            <div class="no-print" style="text-align: center; margin-top: 20px;">
              <button onclick="window.print()" style="padding: 8px 16px; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">
                🖨️ Imprimer
              </button>
              <button onclick="window.close()" style="padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 4px; cursor: pointer;">
                ✖️ Fermer
              </button>
            </div>
          </body>
        </html>
      `;
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }
  };

  const generateReceiptContent = () => {
    const currentDate = new Date().toLocaleDateString('fr-FR');
    
    return `
      <div class="header">
        <div class="school-name">🏫 ÉCOLE LES POUPONS</div>
        <div>École Privée Agréée - Antananarivo, Madagascar</div>
        <div class="receipt-title">🧾 REÇU DE PAIEMENT D'ÉCOLAGE</div>
      </div>
      
      <div class="content">
        <div class="section">
          <div class="section-title">👤 INFORMATIONS ÉLÈVE</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Nom et Prénom:</span>
              <span class="info-value">${student.firstName} ${student.lastName}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Classe:</span>
              <span class="info-value">${student.class}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Parent/Tuteur:</span>
              <span class="info-value">${student.parentName}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Contact:</span>
              <span class="info-value">${student.phone}</span>
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">💳 DÉTAILS DU PAIEMENT</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Référence:</span>
              <span class="info-value">${payment.reference}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Date de paiement:</span>
              <span class="info-value">${new Date(payment.paymentDate).toLocaleDateString('fr-FR')}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Période:</span>
              <span class="info-value">${payment.period}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Mode de paiement:</span>
              <span class="info-value">${payment.paymentMethod}</span>
            </div>
          </div>
        </div>
        
        <div class="amount-section">
          <div style="font-size: 16px; color: #16a34a; margin-bottom: 10px;">💰 MONTANT PAYÉ</div>
          <div class="amount">${payment.amount.toLocaleString()} ARIARY</div>
          <div style="font-size: 12px; color: #059669;">
            Soit: ${convertAmountToWords(payment.amount)}
          </div>
        </div>
        
        ${payment.notes ? `
        <div class="section">
          <div class="section-title">📝 NOTES</div>
          <p style="font-size: 13px; color: #374151;">${payment.notes}</p>
        </div>
        ` : ''}
        
        <div class="signature-section">
          <div class="signature-box">
            <div style="font-weight: bold; color: #374151;">Parent/Tuteur</div>
            <div class="signature-line">Signature</div>
          </div>
          <div class="signature-box">
            <div style="font-weight: bold; color: #374151;">École LES POUPONS</div>
            <div class="signature-line">Signature et Cachet</div>
          </div>
        </div>
      </div>
      
      <div class="footer">
        <p><strong>Reçu généré le:</strong> ${currentDate}</p>
        <p>Ce reçu fait foi de paiement. Conservez-le précieusement pour vos démarches.</p>
        <p><strong>Contact École:</strong> +261 20 22 123 45 | contact@lespoupons.mg</p>
      </div>
    `;
  };

  const convertAmountToWords = (amount: number): string => {
    if (amount < 1000000) {
      const thousands = Math.floor(amount / 1000);
      const remainder = amount % 1000;
      if (remainder === 0) {
        return `${thousands} mille ariary exactement`;
      } else {
        return `${thousands} mille ${remainder} ariary`;
      }
    } else {
      const millions = Math.floor(amount / 1000000);
      const thousands = Math.floor((amount % 1000000) / 1000);
      const remainder = amount % 1000;
      
      let result = `${millions} million${millions > 1 ? 's' : ''}`;
      if (thousands > 0) result += ` ${thousands} mille`;
      if (remainder > 0) result += ` ${remainder}`;
      result += ' ariary exactement';
      
      return result;
    }
  };

  const handleDownload = () => {
    alert('Téléchargement du reçu en PDF en cours...');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reçu de Paiement"
      size="lg"
    >
      <div className="space-y-6">
        {/* Receipt Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Receipt className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Reçu de Paiement d'Écolage</h3>
                <p className="text-blue-100">Référence: {payment.reference}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{payment.amount.toLocaleString()} Ar</p>
              <p className="text-blue-100 text-sm">{new Date(payment.paymentDate).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
        </div>

        {/* Student Information */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-4">
            <Avatar 
              firstName={student.firstName} 
              lastName={student.lastName} 
              size="md" 
              showPhoto={true}
            />
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{student.firstName} {student.lastName}</h4>
              <p className="text-gray-600 text-sm">Classe: {student.class}</p>
              <p className="text-gray-500 text-sm">Parent: {student.parentName}</p>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              Détails du Paiement
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Période:</span>
                <span className="font-medium">{payment.period}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Montant:</span>
                <span className="font-bold text-green-600">{payment.amount.toLocaleString()} Ar</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Mode de paiement:</span>
                <span className="font-medium">{payment.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">{new Date(payment.paymentDate).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Informations Administratives
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Référence:</span>
                <span className="font-medium font-mono">{payment.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Statut:</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  payment.status === 'paid' ? 'bg-green-100 text-green-800' :
                  payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {payment.status === 'paid' ? 'Payé' : 
                   payment.status === 'pending' ? 'En attente' : 'En retard'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Émis le:</span>
                <span className="font-medium">{new Date().toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Amount in Words */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-800 mb-2">Montant en Lettres</h4>
          <p className="text-green-700 font-medium">
            {convertAmountToWords(payment.amount)}
          </p>
        </div>

        {/* Notes */}
        {payment.notes && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Notes</h4>
            <p className="text-blue-700 text-sm">{payment.notes}</p>
          </div>
        )}

        {/* Legal Notice */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-gray-600 text-xs text-center">
            Ce reçu fait foi de paiement et doit être conservé pour toute démarche administrative.
            En cas de perte, une copie peut être demandée auprès de l'administration de l'école.
          </p>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Fermer
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 px-4 py-2 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors"
          >
            <Download className="w-4 h-4 mr-2 inline" />
            Télécharger PDF
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Printer className="w-4 h-4 mr-2 inline" />
            Imprimer Reçu
          </button>
        </div>
      </div>
    </Modal>
  );
}

function convertAmountToWords(amount: number): string {
  if (amount < 1000000) {
    const thousands = Math.floor(amount / 1000);
    const remainder = amount % 1000;
    if (remainder === 0) {
      return `${thousands} mille ariary exactement`;
    } else {
      return `${thousands} mille ${remainder} ariary`;
    }
  } else {
    const millions = Math.floor(amount / 1000000);
    const thousands = Math.floor((amount % 1000000) / 1000);
    const remainder = amount % 1000;
    
    let result = `${millions} million${millions > 1 ? 's' : ''}`;
    if (thousands > 0) result += ` ${thousands} mille`;
    if (remainder > 0) result += ` ${remainder}`;
    result += ' ariary exactement';
    
    return result;
  }
}