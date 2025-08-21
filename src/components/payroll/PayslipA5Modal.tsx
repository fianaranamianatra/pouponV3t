import React from 'react';
import { Modal } from '../Modal';
import { Printer, X, FileText, User, Calendar, DollarSign, Calculator, Building, Eye } from 'lucide-react';
import { Avatar } from '../Avatar';

interface Employee {
  id?: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  salary: number;
  entryDate?: string;
  contractType?: string;
}

interface PayslipA5ModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
}

export function PayslipA5Modal({ isOpen, onClose, employee }: PayslipA5ModalProps) {
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const matricule = `EMP${employee.id?.substring(0, 4).toUpperCase() || '0001'}`;
  
  // Calculs automatiques
  const salaireBrut = employee.salary;
  const cnaps = Math.round(salaireBrut * 0.01); // 1% salarié
  const ostie = Math.round(salaireBrut * 0.01); // 1% salarié
  const salaireImposable = salaireBrut - cnaps - ostie;
  
  // Calcul IRSA simplifié
  let irsa = 0;
  if (salaireImposable > 350000) {
    if (salaireImposable <= 400000) {
      irsa = Math.round((salaireImposable - 350000) * 0.05);
    } else if (salaireImposable <= 500000) {
      irsa = Math.round(50000 * 0.05 + (salaireImposable - 400000) * 0.10);
    } else if (salaireImposable <= 600000) {
      irsa = Math.round(50000 * 0.05 + 100000 * 0.10 + (salaireImposable - 500000) * 0.15);
    } else {
      irsa = Math.round(50000 * 0.05 + 100000 * 0.10 + 100000 * 0.15 + (salaireImposable - 600000) * 0.20);
    }
  }
  
  const totalDeductions = cnaps + ostie + irsa;
  const salaireNet = salaireBrut - totalDeductions;
  
  // Conversion en lettres (simplifié)
  const convertToWords = (amount: number): string => {
    if (amount < 1000000) {
      return `${Math.floor(amount / 1000)} mille ariary`;
    } else {
      const millions = Math.floor(amount / 1000000);
      const thousands = Math.floor((amount % 1000000) / 1000);
      return `${millions} million${millions > 1 ? 's' : ''} ${thousands > 0 ? thousands + ' mille' : ''} ariary`;
    }
  };

  const handlePrint = () => {
    const printContent = generateA5Payslip();
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Bulletin de Paie A5 - ${employee.firstName} ${employee.lastName}</title>
            <meta charset="UTF-8">
            <style>
              /* CSS optimisé pour format A5 */
              @page {
                size: A5 portrait;
                margin: 10mm;
              }
              
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              body { 
                font-family: 'Arial', sans-serif;
                font-size: 10px;
                line-height: 1.3;
                color: #333;
                background: white;
              }
              
              .payslip-container {
                width: 128mm; /* A5 width minus margins */
                height: 190mm; /* A5 height minus margins */
                margin: 0 auto;
                position: relative;
                background: white;
              }
              
              .watermark {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-45deg);
                font-size: 24px;
                color: rgba(37, 99, 235, 0.1);
                font-weight: bold;
                z-index: 1;
                pointer-events: none;
              }
              
              .content {
                position: relative;
                z-index: 2;
              }
              
              .header {
                background: linear-gradient(135deg, #2563eb, #1d4ed8);
                color: white;
                padding: 8px;
                text-align: center;
                border-radius: 4px;
                margin-bottom: 8px;
              }
              
              .school-name {
                font-size: 14px;
                font-weight: bold;
                margin-bottom: 2px;
              }
              
              .school-subtitle {
                font-size: 8px;
                opacity: 0.9;
              }
              
              .title {
                text-align: center;
                font-size: 12px;
                font-weight: bold;
                margin: 8px 0;
                color: #2563eb;
                text-transform: uppercase;
                letter-spacing: 1px;
              }
              
              .section {
                margin: 6px 0;
                border: 1px solid #e5e7eb;
                border-radius: 3px;
                overflow: hidden;
              }
              
              .section-header {
                background: #f3f4f6;
                padding: 4px 6px;
                font-weight: bold;
                font-size: 9px;
                color: #374151;
                text-transform: uppercase;
              }
              
              .section-content {
                padding: 4px 6px;
              }
              
              .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 4px;
                font-size: 9px;
              }
              
              .info-item {
                display: flex;
                justify-content: space-between;
                padding: 1px 0;
              }
              
              .info-label {
                font-weight: 500;
                color: #6b7280;
              }
              
              .info-value {
                font-weight: 600;
                color: #111827;
              }
              
              .salary-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 9px;
              }
              
              .salary-table th,
              .salary-table td {
                border: 1px solid #d1d5db;
                padding: 3px 4px;
                text-align: left;
              }
              
              .salary-table th {
                background: #f9fafb;
                font-weight: bold;
                font-size: 8px;
                text-transform: uppercase;
              }
              
              .amount {
                text-align: right;
                font-weight: 600;
              }
              
              .total-row {
                background: #f3f4f6;
                font-weight: bold;
              }
              
              .net-salary {
                background: #dcfce7;
                color: #166534;
                font-weight: bold;
                font-size: 10px;
              }
              
              .net-words {
                background: #dbeafe;
                color: #1e40af;
                font-style: italic;
                text-align: center;
                padding: 4px;
                font-size: 8px;
              }
              
              .footer {
                margin-top: 8px;
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
                font-size: 8px;
              }
              
              .signature-box {
                text-align: center;
                border: 1px solid #d1d5db;
                padding: 6px;
                border-radius: 3px;
                height: 40px;
              }
              
              .legal-mentions {
                margin-top: 6px;
                font-size: 7px;
                color: #6b7280;
                text-align: center;
                line-height: 1.2;
              }
              
              @media print {
                body { 
                  margin: 0; 
                  background: white;
                }
                .no-print { 
                  display: none !important; 
                }
                .payslip-container {
                  width: 100%;
                  height: 100%;
                }
              }
            </style>
          </head>
          <body>
            <div class="payslip-container">
              <div class="watermark">CONFIDENTIEL</div>
              <div class="content">
                ${printContent}
              </div>
            </div>
            
            <div class="no-print" style="text-align: center; margin-top: 15px;">
              <button onclick="window.print()" style="padding: 8px 16px; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 8px; font-size: 12px;">
                🖨️ Imprimer A5
              </button>
              <button onclick="window.close()" style="padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
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

  const generateA5Payslip = () => {
    return `
      <div class="header">
        <div class="school-name">🏫 ÉCOLE LES POUPONS</div>
        <div class="school-subtitle">École Privée Agréée - Antananarivo, Madagascar</div>
      </div>
      
      <div class="title">📄 Bulletin de Paie</div>
      
      <div class="section">
        <div class="section-header">👤 Informations Employé</div>
        <div class="section-content">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Nom et Prénom:</span>
              <span class="info-value">${employee.firstName} ${employee.lastName}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Matricule:</span>
              <span class="info-value">${matricule}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Fonction:</span>
              <span class="info-value">${employee.position}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Département:</span>
              <span class="info-value">${employee.department}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="section">
        <div class="section-header">📅 Période de Paie</div>
        <div class="section-content">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Mois:</span>
              <span class="info-value">${currentMonth}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Jours travaillés:</span>
              <span class="info-value">30 jours</span>
            </div>
            <div class="info-item">
              <span class="info-label">Date d'édition:</span>
              <span class="info-value">${currentDate.toLocaleDateString('fr-FR')}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Contrat:</span>
              <span class="info-value">${employee.contractType || 'CDI'}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="section">
        <div class="section-header">💰 Détail de la Rémunération</div>
        <div class="section-content">
          <table class="salary-table">
            <thead>
              <tr>
                <th style="width: 60%;">Libellé</th>
                <th style="width: 20%;">Base</th>
                <th style="width: 20%;">Montant</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>💼 GAINS</strong></td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>Salaire de Base</td>
                <td>30j</td>
                <td class="amount">${salaireBrut.toLocaleString()}</td>
              </tr>
              <tr class="total-row">
                <td><strong>Total Brut</strong></td>
                <td></td>
                <td class="amount"><strong>${salaireBrut.toLocaleString()}</strong></td>
              </tr>
              <tr>
                <td><strong>📉 DÉDUCTIONS</strong></td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>CNAPS (1%)</td>
                <td>1%</td>
                <td class="amount" style="color: #dc2626;">-${cnaps.toLocaleString()}</td>
              </tr>
              <tr>
                <td>OSTIE (1%)</td>
                <td>1%</td>
                <td class="amount" style="color: #dc2626;">-${ostie.toLocaleString()}</td>
              </tr>
              <tr>
                <td>IRSA (Impôt)</td>
                <td>Var.</td>
                <td class="amount" style="color: #dc2626;">-${irsa.toLocaleString()}</td>
              </tr>
              <tr class="total-row">
                <td><strong>Total Déductions</strong></td>
                <td></td>
                <td class="amount" style="color: #dc2626;"><strong>-${totalDeductions.toLocaleString()}</strong></td>
              </tr>
              <tr class="net-salary">
                <td><strong>💵 NET À PAYER</strong></td>
                <td></td>
                <td class="amount"><strong>${salaireNet.toLocaleString()} Ar</strong></td>
              </tr>
            </tbody>
          </table>
          
          <div class="net-words">
            <strong>Soit en lettres:</strong> ${convertToWords(salaireNet)}
          </div>
        </div>
      </div>
      
      <div class="section">
        <div class="section-header">🏢 Charges Patronales (Information)</div>
        <div class="section-content">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">CNAPS Employeur (13%):</span>
              <span class="info-value">+${Math.round(salaireBrut * 0.13).toLocaleString()} Ar</span>
            </div>
            <div class="info-item">
              <span class="info-label">OSTIE Employeur (5%):</span>
              <span class="info-value">+${Math.round(salaireBrut * 0.05).toLocaleString()} Ar</span>
            </div>
            <div class="info-item">
              <span class="info-label"><strong>Coût Total Employeur:</strong></span>
              <span class="info-value"><strong>${(salaireBrut + Math.round(salaireBrut * 0.18)).toLocaleString()} Ar</strong></span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="footer">
        <div class="signature-box">
          <div style="font-weight: bold; margin-bottom: 4px;">Employé</div>
          <div style="margin-top: 20px; border-top: 1px solid #ccc; padding-top: 2px;">Signature</div>
        </div>
        <div class="signature-box">
          <div style="font-weight: bold; margin-bottom: 4px;">Employeur</div>
          <div style="margin-top: 20px; border-top: 1px solid #ccc; padding-top: 2px;">Signature & Cachet</div>
        </div>
      </div>
      
      <div class="legal-mentions">
        Document confidentiel - Bulletin généré automatiquement le ${currentDate.toLocaleDateString('fr-FR')} par le système LES POUPONS<br>
        Conservez ce document pour vos démarches administratives
      </div>
    `;
  };

  const convertToWords = (amount: number): string => {
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
      result += ' ariary';
      
      return result;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bulletin de Paie Format A5"
      size="lg"
    >
      <div className="space-y-6">
        {/* Employee Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Avatar 
              firstName={employee.firstName} 
              lastName={employee.lastName} 
              size="md" 
              showPhoto={true}
            />
            <div>
              <h3 className="font-bold text-blue-900">{employee.firstName} {employee.lastName}</h3>
              <p className="text-blue-700 text-sm">{employee.position}</p>
              <p className="text-blue-600 text-xs">{employee.department} • Matricule: {matricule}</p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-blue-700">Période: {currentMonth}</p>
            <p className="text-xs text-blue-600">Format A5 - Prêt à imprimer</p>
          </div>
        </div>

        {/* Salary Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-green-700">Salaire Brut</p>
            <p className="text-xl font-bold text-green-800">{salaireBrut.toLocaleString()} Ar</p>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <Calculator className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-sm text-red-700">Total Déductions</p>
            <p className="text-xl font-bold text-red-800">-{totalDeductions.toLocaleString()} Ar</p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-blue-700">Salaire Net</p>
            <p className="text-2xl font-bold text-blue-800">{salaireNet.toLocaleString()} Ar</p>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <Calculator className="w-5 h-5 mr-2" />
            Détail des Calculs
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-medium text-gray-800 mb-2">Cotisations Salariales</h5>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>CNAPS (1%):</span>
                  <span className="text-red-600 font-medium">-{cnaps.toLocaleString()} Ar</span>
                </div>
                <div className="flex justify-between">
                  <span>OSTIE (1%):</span>
                  <span className="text-red-600 font-medium">-{ostie.toLocaleString()} Ar</span>
                </div>
                <div className="flex justify-between">
                  <span>IRSA (Impôt):</span>
                  <span className="text-red-600 font-medium">-{irsa.toLocaleString()} Ar</span>
                </div>
              </div>
            </div>
            
            <div>
              <h5 className="font-medium text-gray-800 mb-2">Charges Patronales</h5>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>CNAPS Employeur (13%):</span>
                  <span className="text-orange-600 font-medium">+{Math.round(salaireBrut * 0.13).toLocaleString()} Ar</span>
                </div>
                <div className="flex justify-between">
                  <span>OSTIE Employeur (5%):</span>
                  <span className="text-orange-600 font-medium">+{Math.round(salaireBrut * 0.05).toLocaleString()} Ar</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Coût Total:</span>
                  <span className="text-purple-600">{(salaireBrut + Math.round(salaireBrut * 0.18)).toLocaleString()} Ar</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Net Amount in Words */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-sm text-blue-700 mb-1">Montant net en lettres:</p>
          <p className="font-bold text-blue-900 text-lg">{convertToWords(salaireNet)}</p>
        </div>

        {/* Preview Note */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Eye className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">Aperçu Format A5</h4>
              <p className="text-yellow-700 text-sm mt-1">
                Ce bulletin est optimisé pour l'impression A5 (148×210mm). 
                Le design compact assure une lisibilité parfaite sur ce format réduit.
              </p>
              <ul className="text-yellow-700 text-xs mt-2 space-y-1">
                <li>• Marges: 10mm de tous les côtés</li>
                <li>• Police: Arial 10px pour une lisibilité optimale</li>
                <li>• Watermark "CONFIDENTIEL" en arrière-plan</li>
                <li>• Sections compactes adaptées au format A5</li>
              </ul>
            </div>
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
            onClick={handlePrint}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Printer className="w-4 h-4 mr-2 inline" />
            Imprimer Bulletin A5
          </button>
        </div>
      </div>
    </Modal>
  );
}