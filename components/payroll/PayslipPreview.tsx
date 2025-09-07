import React from 'react';
import { Printer, Download, X, User, Calendar, DollarSign, Calculator, Building } from 'lucide-react';
import { Avatar } from '../Avatar';

interface PayslipData {
  employeeName: string;
  position: string;
  department: string;
  paymentMonth: string;
  paymentYear: number;
  calculation: {
    grossSalary: number;
    cnaps: {
      employeeContribution: number;
      employerContribution: number;
    };
    ostie: {
      employeeContribution: number;
      employerContribution: number;
    };
    irsa: number;
    totalDeductions: number;
    netSalary: number;
    allowances: {
      transport: number;
      housing: number;
      meal: number;
      performance: number;
      other: number;
    };
  };
}

interface PayslipPreviewProps {
  data: PayslipData;
  onClose: () => void;
}

export function PayslipPreview({ data, onClose }: PayslipPreviewProps) {
  const currentDate = new Date().toLocaleDateString('fr-FR');
  
  const handlePrint = () => {
    const printContent = generatePrintablePayslip();
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const htmlContent = `
        <html>
          <head>
            <title>Bulletin de Paie - ${data.employeeName}</title>
            <style>
              body { 
                font-family: 'Courier New', monospace; 
                margin: 20px; 
                line-height: 1.4;
                font-size: 12px;
              }
              .payslip-container {
                max-width: 800px;
                margin: 0 auto;
                border: 2px solid #333;
                padding: 20px;
              }
              .header { 
                text-align: center; 
                border-bottom: 2px solid #333;
                padding-bottom: 15px;
                margin-bottom: 20px;
              }
              .school-name { 
                font-size: 18px; 
                font-weight: bold; 
                margin-bottom: 5px;
              }
              .section {
                margin: 15px 0;
                border-bottom: 1px solid #ccc;
                padding-bottom: 10px;
              }
              .section-title {
                font-weight: bold;
                text-decoration: underline;
                margin-bottom: 8px;
              }
              .line-item {
                display: flex;
                justify-content: space-between;
                margin: 3px 0;
              }
              .total-line {
                border-top: 1px solid #333;
                margin-top: 8px;
                padding-top: 5px;
                font-weight: bold;
              }
              .final-total {
                border: 2px solid #333;
                padding: 8px;
                margin-top: 15px;
                text-align: center;
                font-weight: bold;
                font-size: 14px;
              }
              @media print {
                body { margin: 10px; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="payslip-container">
              ${printContent}
            </div>
            <div class="no-print" style="text-align: center; margin-top: 20px;">
              <button onclick="window.print()" style="padding: 8px 16px; background: #1e40af; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">
                Imprimer
              </button>
              <button onclick="window.close()" style="padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Fermer
              </button>
            </div>
          </body>
        </html>
      `;
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }
  };

  const generatePrintablePayslip = () => {
    const totalAllowances = Object.values(data.calculation.allowances).reduce((sum, val) => sum + val, 0);
    
    return `
      <div class="header">
        <div class="school-name">ÉCOLE LES POUPONS</div>
        <div>Bulletin de Paie - ${data.paymentMonth} ${data.paymentYear}</div>
        <div>Généré le ${currentDate}</div>
      </div>
      
      <div class="section">
        <div class="section-title">INFORMATIONS EMPLOYÉ</div>
        <div class="line-item">
          <span>Nom et Prénom:</span>
          <span>${data.employeeName}</span>
        </div>
        <div class="line-item">
          <span>Poste:</span>
          <span>${data.position}</span>
        </div>
        <div class="line-item">
          <span>Département:</span>
          <span>${data.department}</span>
        </div>
        <div class="line-item">
          <span>Période:</span>
          <span>${data.paymentMonth} ${data.paymentYear}</span>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">ÉLÉMENTS DE RÉMUNÉRATION</div>
        <div class="line-item">
          <span>Salaire de Base:</span>
          <span>${(data.calculation.grossSalary - totalAllowances).toLocaleString()} Ar</span>
        </div>
        ${data.calculation.allowances.transport > 0 ? `
        <div class="line-item">
          <span>Indemnité Transport:</span>
          <span>+${data.calculation.allowances.transport.toLocaleString()} Ar</span>
        </div>` : ''}
        ${data.calculation.allowances.housing > 0 ? `
        <div class="line-item">
          <span>Indemnité Logement:</span>
          <span>+${data.calculation.allowances.housing.toLocaleString()} Ar</span>
        </div>` : ''}
        ${data.calculation.allowances.meal > 0 ? `
        <div class="line-item">
          <span>Indemnité Repas:</span>
          <span>+${data.calculation.allowances.meal.toLocaleString()} Ar</span>
        </div>` : ''}
        ${data.calculation.allowances.performance > 0 ? `
        <div class="line-item">
          <span>Prime Performance:</span>
          <span>+${data.calculation.allowances.performance.toLocaleString()} Ar</span>
        </div>` : ''}
        ${data.calculation.allowances.other > 0 ? `
        <div class="line-item">
          <span>Autres Indemnités:</span>
          <span>+${data.calculation.allowances.other.toLocaleString()} Ar</span>
        </div>` : ''}
        <div class="line-item total-line">
          <span>SALAIRE BRUT TOTAL:</span>
          <span>${data.calculation.grossSalary.toLocaleString()} Ar</span>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">COTISATIONS SALARIALES</div>
        <div class="line-item">
          <span>CNAPS (1%):</span>
          <span>-${data.calculation.cnaps.employeeContribution.toLocaleString()} Ar</span>
        </div>
        <div class="line-item">
          <span>OSTIE (1%):</span>
          <span>-${data.calculation.ostie.employeeContribution.toLocaleString()} Ar</span>
        </div>
        <div class="line-item">
          <span>Salaire Imposable:</span>
          <span>${(data.calculation.grossSalary - data.calculation.cnaps.employeeContribution - data.calculation.ostie.employeeContribution).toLocaleString()} Ar</span>
        </div>
        <div class="line-item">
          <span>IRSA (Impôt sur Revenus):</span>
          <span>-${data.calculation.irsa.toLocaleString()} Ar</span>
        </div>
        <div class="line-item total-line">
          <span>TOTAL DÉDUCTIONS:</span>
          <span>-${data.calculation.totalDeductions.toLocaleString()} Ar</span>
        </div>
      </div>
      
      <div class="final-total">
        SALAIRE NET À PAYER: ${data.calculation.netSalary.toLocaleString()} Ar
      </div>
      
      <div class="section">
        <div class="section-title">CHARGES PATRONALES</div>
        <div class="line-item">
          <span>CNAPS Employeur (13%):</span>
          <span>+${data.calculation.cnaps.employerContribution.toLocaleString()} Ar</span>
        </div>
        <div class="line-item">
          <span>OSTIE Employeur (5%):</span>
          <span>+${data.calculation.ostie.employerContribution.toLocaleString()} Ar</span>
        </div>
        <div class="line-item total-line">
          <span>COÛT TOTAL EMPLOYEUR:</span>
          <span>${(data.calculation.grossSalary + data.calculation.cnaps.employerContribution + data.calculation.ostie.employerContribution).toLocaleString()} Ar</span>
        </div>
      </div>
    `;
  };

  const handleDownload = () => {
    alert('Téléchargement du bulletin de paie en cours...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar 
            firstName={data.employeeName.split(' ')[0] || ''} 
            lastName={data.employeeName.split(' ')[1] || ''} 
            size="md" 
            showPhoto={true}
          />
          <div>
            <h3 className="font-bold text-gray-900">{data.employeeName}</h3>
            <p className="text-gray-600 text-sm">{data.position} - {data.department}</p>
            <p className="text-gray-500 text-xs">{data.paymentMonth} {data.paymentYear}</p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={handlePrint}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Imprimer"
          >
            <Printer className="w-5 h-5" />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Télécharger"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Payslip Content */}
      <div className="bg-white border-2 border-gray-300 rounded-lg p-6 font-mono text-sm">
        <div className="text-center border-b-2 border-gray-300 pb-4 mb-6">
          <h2 className="text-lg font-bold">ÉCOLE LES POUPONS</h2>
          <p className="text-gray-600">Bulletin de Paie - {data.paymentMonth} {data.paymentYear}</p>
          <p className="text-gray-500 text-xs">Généré le {currentDate}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Employee Info & Gross Salary */}
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <h4 className="font-bold text-blue-800 mb-2">INFORMATIONS EMPLOYÉ</h4>
              <div className="space-y-1 text-xs">
                <p><strong>Nom:</strong> {data.employeeName}</p>
                <p><strong>Poste:</strong> {data.position}</p>
                <p><strong>Département:</strong> {data.department}</p>
                <p><strong>Période:</strong> {data.paymentMonth} {data.paymentYear}</p>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded p-3">
              <h4 className="font-bold text-green-800 mb-2">ÉLÉMENTS DE RÉMUNÉRATION</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Salaire de Base:</span>
                  <span>{(data.calculation.grossSalary - Object.values(data.calculation.allowances).reduce((sum, val) => sum + val, 0)).toLocaleString()} Ar</span>
                </div>
                {data.calculation.allowances.transport > 0 && (
                  <div className="flex justify-between">
                    <span>Indemnité Transport:</span>
                    <span>+{data.calculation.allowances.transport.toLocaleString()} Ar</span>
                  </div>
                )}
                {data.calculation.allowances.housing > 0 && (
                  <div className="flex justify-between">
                    <span>Indemnité Logement:</span>
                    <span>+{data.calculation.allowances.housing.toLocaleString()} Ar</span>
                  </div>
                )}
                {data.calculation.allowances.meal > 0 && (
                  <div className="flex justify-between">
                    <span>Indemnité Repas:</span>
                    <span>+{data.calculation.allowances.meal.toLocaleString()} Ar</span>
                  </div>
                )}
                {data.calculation.allowances.performance > 0 && (
                  <div className="flex justify-between">
                    <span>Prime Performance:</span>
                    <span>+{data.calculation.allowances.performance.toLocaleString()} Ar</span>
                  </div>
                )}
                {data.calculation.allowances.other > 0 && (
                  <div className="flex justify-between">
                    <span>Autres Indemnités:</span>
                    <span>+{data.calculation.allowances.other.toLocaleString()} Ar</span>
                  </div>
                )}
                <div className="flex justify-between font-bold border-t border-green-300 pt-2 mt-2">
                  <span>SALAIRE BRUT TOTAL:</span>
                  <span>{data.calculation.grossSalary.toLocaleString()} Ar</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Deductions & Net Salary */}
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <h4 className="font-bold text-red-800 mb-2">COTISATIONS SALARIALES</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>CNAPS (1%):</span>
                  <span>-{data.calculation.cnaps.employeeContribution.toLocaleString()} Ar</span>
                </div>
                <div className="flex justify-between">
                  <span>OSTIE (1%):</span>
                  <span>-{data.calculation.ostie.employeeContribution.toLocaleString()} Ar</span>
                </div>
                <div className="flex justify-between">
                  <span>Salaire Imposable:</span>
                  <span>{(data.calculation.grossSalary - data.calculation.cnaps.employeeContribution - data.calculation.ostie.employeeContribution).toLocaleString()} Ar</span>
                </div>
                <div className="flex justify-between">
                  <span>IRSA (Impôt):</span>
                  <span>-{data.calculation.irsa.toLocaleString()} Ar</span>
                </div>
                <div className="flex justify-between font-bold border-t border-red-300 pt-2 mt-2">
                  <span>TOTAL DÉDUCTIONS:</span>
                  <span>-{data.calculation.totalDeductions.toLocaleString()} Ar</span>
                </div>
              </div>
            </div>

            <div className="bg-green-100 border-2 border-green-300 rounded p-4">
              <div className="text-center">
                <h4 className="font-bold text-green-800 mb-2">SALAIRE NET À PAYER</h4>
                <p className="text-2xl font-bold text-green-600">
                  {data.calculation.netSalary.toLocaleString()} Ar
                </p>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded p-3">
              <h4 className="font-bold text-orange-800 mb-2">CHARGES PATRONALES</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>CNAPS Employeur (13%):</span>
                  <span>+{data.calculation.cnaps.employerContribution.toLocaleString()} Ar</span>
                </div>
                <div className="flex justify-between">
                  <span>OSTIE Employeur (5%):</span>
                  <span>+{data.calculation.ostie.employerContribution.toLocaleString()} Ar</span>
                </div>
                <div className="flex justify-between font-bold border-t border-orange-300 pt-2 mt-2">
                  <span>COÛT TOTAL EMPLOYEUR:</span>
                  <span>{(data.calculation.grossSalary + data.calculation.cnaps.employerContribution + data.calculation.ostie.employerContribution).toLocaleString()} Ar</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t-2 border-gray-300 text-center text-xs text-gray-500">
          <p>Ce bulletin de paie est généré automatiquement par le système de gestion LES POUPONS</p>
          <p>Pour toute question, veuillez contacter le service administratif</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-3 pt-4 border-t border-gray-200">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <X className="w-4 h-4 mr-2 inline" />
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
          Imprimer
        </button>
      </div>
    </div>
  );
}