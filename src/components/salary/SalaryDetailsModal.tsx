import React from 'react';
import { User, Calendar, DollarSign, Calculator, FileText, Building, Printer, Download, Edit, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { Avatar } from '../Avatar';
import { IRSACalculator } from '../IRSACalculator';

interface SalaryRecord {
  id?: string;
  employeeId: string;
  employeeName: string;
  employeeType: 'teacher' | 'staff';
  position: string;
  department: string;
  paymentMonth: number;
  paymentYear: number;
  baseSalary: number;
  allowances: {
    transport?: number;
    housing?: number;
    meal?: number;
    performance?: number;
    other?: number;
  };
  totalGross: number;
  cnaps: number;
  ostie: number;
  irsa: number;
  totalDeductions: number;
  netSalary: number;
  effectiveDate: string;
  status: 'active' | 'inactive' | 'pending';
  notes?: string;
}

interface SalaryDetailsModalProps {
  salary: SalaryRecord;
  employee?: any;
  onEdit: () => void;
  onClose: () => void;
}

const monthNames = [
  '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export function SalaryDetailsModal({ salary, employee, onEdit, onClose }: SalaryDetailsModalProps) {
  const totalAllowances = Object.values(salary.allowances).reduce((sum, val) => sum + (val || 0), 0);
  const taxableIncome = salary.totalGross - salary.cnaps - salary.ostie;
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handlePrintPayslip = () => {
    const payslipContent = generatePayslipContent();
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const htmlContent = `
        <html>
          <head>
            <title>Bulletin de Paie - ${salary.employeeName}</title>
            <style>
              body { 
                font-family: 'Arial', sans-serif; 
                margin: 20px; 
                line-height: 1.5;
                color: #333;
              }
              .payslip-container {
                max-width: 800px;
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
              .section {
                margin: 15px;
                padding: 15px;
                border: 1px solid #e5e7eb;
                border-radius: 6px;
              }
              .section-title {
                font-weight: bold;
                color: #374151;
                margin-bottom: 10px;
                padding-bottom: 5px;
                border-bottom: 1px solid #d1d5db;
              }
              .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
                font-size: 14px;
              }
              .salary-table {
                width: 100%;
                border-collapse: collapse;
                margin: 10px 0;
              }
              .salary-table th,
              .salary-table td {
                border: 1px solid #d1d5db;
                padding: 8px;
                text-align: left;
              }
              .salary-table th {
                background: #f9fafb;
                font-weight: bold;
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
              }
              .footer {
                margin: 20px;
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 40px;
              }
              .signature-box {
                text-align: center;
                border: 1px solid #d1d5db;
                padding: 20px;
                border-radius: 6px;
              }
              @media print {
                body { margin: 10px; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="payslip-container">
              ${payslipContent}
            </div>
            <div class="no-print" style="text-align: center; margin-top: 20px;">
              <button onclick="window.print()" style="padding: 8px 16px; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Imprimer
              </button>
              <button onclick="window.close()" style="padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">
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

  const generatePayslipContent = () => {
    const currentDate = new Date().toLocaleDateString('fr-FR');
    
    return `
      <div class="header">
        <div class="school-name">ÉCOLE LES POUPONS</div>
        <div>Bulletin de Paie - ${monthNames[salary.paymentMonth]} ${salary.paymentYear}</div>
        <div>Généré le ${currentDate}</div>
      </div>
      
      <div class="section">
        <div class="section-title">INFORMATIONS EMPLOYÉ</div>
        <div class="info-grid">
          <div>Nom et Prénom: <strong>${salary.employeeName}</strong></div>
          <div>Poste: <strong>${salary.position}</strong></div>
          <div>Département: <strong>${salary.department}</strong></div>
          <div>Période: <strong>${monthNames[salary.paymentMonth]} ${salary.paymentYear}</strong></div>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">DÉTAIL DE LA RÉMUNÉRATION</div>
        <table class="salary-table">
          <thead>
            <tr>
              <th>Libellé</th>
              <th>Montant</th>
            </tr>
          </thead>
          <tbody>
            <tr><td colspan="2"><strong>GAINS</strong></td></tr>
            <tr>
              <td>Salaire de Base</td>
              <td class="amount">${salary.baseSalary.toLocaleString()} Ar</td>
            </tr>
            ${salary.allowances.transport ? `
            <tr>
              <td>Indemnité Transport</td>
              <td class="amount">${salary.allowances.transport.toLocaleString()} Ar</td>
            </tr>` : ''}
            ${salary.allowances.housing ? `
            <tr>
              <td>Indemnité Logement</td>
              <td class="amount">${salary.allowances.housing.toLocaleString()} Ar</td>
            </tr>` : ''}
            ${salary.allowances.meal ? `
            <tr>
              <td>Indemnité Repas</td>
              <td class="amount">${salary.allowances.meal.toLocaleString()} Ar</td>
            </tr>` : ''}
            ${salary.allowances.performance ? `
            <tr>
              <td>Prime Performance</td>
              <td class="amount">${salary.allowances.performance.toLocaleString()} Ar</td>
            </tr>` : ''}
            ${salary.allowances.other ? `
            <tr>
              <td>Autres Indemnités</td>
              <td class="amount">${salary.allowances.other.toLocaleString()} Ar</td>
            </tr>` : ''}
            <tr class="total-row">
              <td><strong>Total Brut</strong></td>
              <td class="amount"><strong>${salary.totalGross.toLocaleString()} Ar</strong></td>
            </tr>
            <tr><td colspan="2"><strong>DÉDUCTIONS</strong></td></tr>
            <tr>
              <td>CNAPS (1%)</td>
              <td class="amount" style="color: #dc2626;">-${salary.cnaps.toLocaleString()} Ar</td>
            </tr>
            <tr>
              <td>OSTIE (1%)</td>
              <td class="amount" style="color: #dc2626;">-${salary.ostie.toLocaleString()} Ar</td>
            </tr>
            <tr>
              <td>IRSA (Impôt)</td>
              <td class="amount" style="color: #dc2626;">-${salary.irsa.toLocaleString()} Ar</td>
            </tr>
            <tr class="total-row">
              <td><strong>Total Déductions</strong></td>
              <td class="amount" style="color: #dc2626;"><strong>-${salary.totalDeductions.toLocaleString()} Ar</strong></td>
            </tr>
            <tr class="net-salary">
              <td><strong>NET À PAYER</strong></td>
              <td class="amount"><strong>${salary.netSalary.toLocaleString()} Ar</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="footer">
        <div class="signature-box">
          <div><strong>Employé</strong></div>
          <br><br>
          <div>_____________________</div>
          <div style="font-size: 12px;">Signature</div>
        </div>
        <div class="signature-box">
          <div><strong>Employeur</strong></div>
          <br><br>
          <div>_____________________</div>
          <div style="font-size: 12px;">Signature et Cachet</div>
        </div>
      </div>
    `;
  };

  const handleDownload = () => {
    alert('Téléchargement du bulletin de paie en cours...');
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec informations employé */}
      <div className={`bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg ${isMobile ? 'p-4' : 'p-6'}`}>
        <div className="flex items-center space-x-4">
          <Avatar 
            firstName={salary.employeeName.split(' ')[0] || ''} 
            lastName={salary.employeeName.split(' ')[1] || ''} 
            size={isMobile ? "md" : "lg"}
            showPhoto={true}
          />
          <div className="flex-1">
            <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900`}>{salary.employeeName}</h3>
            <p className={`${isMobile ? 'text-sm' : ''} text-gray-600`}>{salary.position} - {salary.department}</p>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>
              Période: {monthNames[salary.paymentMonth]} {salary.paymentYear}
            </p>
            <div className="flex items-center space-x-2 mt-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-green-600 font-medium">Calcul automatisé validé</span>
            </div>
          </div>
          <div className="text-right">
            <p className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-green-600`}>{salary.netSalary.toLocaleString()} Ar</p>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>Salaire Net Final</p>
          </div>
        </div>
      </div>

      {/* Détails du calcul */}
      <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 lg:grid-cols-2 gap-6'}`}>
        {/* Structure Salariale */}
        <div className={`bg-white border border-gray-200 rounded-lg ${isMobile ? 'p-4' : 'p-6'}`}>
          <h4 className={`font-bold text-gray-900 ${isMobile ? 'text-sm mb-3' : 'mb-4'} flex items-center`}>
            <Wallet className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} mr-2`} />
            Structure Salariale
          </h4>
          
          <div className="space-y-3">
            <div className={`flex justify-between items-center ${isMobile ? 'py-1.5' : 'py-2'} border-b border-gray-100`}>
              <span className="text-gray-600">Salaire de base:</span>
              <span className={`font-bold text-gray-900 ${isMobile ? 'text-sm' : ''}`}>{salary.baseSalary.toLocaleString()} Ar</span>
            </div>
            
            {salary.allowances.transport && salary.allowances.transport > 0 && (
              <div className={`flex justify-between items-center ${isMobile ? 'py-1.5' : 'py-2'} border-b border-gray-100`}>
                <span className="text-gray-600">Indemnité transport:</span>
                <span className={`font-medium text-green-600 ${isMobile ? 'text-sm' : ''}`}>+{salary.allowances.transport.toLocaleString()} Ar</span>
              </div>
            )}
            
            {salary.allowances.housing && salary.allowances.housing > 0 && (
              <div className={`flex justify-between items-center ${isMobile ? 'py-1.5' : 'py-2'} border-b border-gray-100`}>
                <span className="text-gray-600">Indemnité logement:</span>
                <span className={`font-medium text-green-600 ${isMobile ? 'text-sm' : ''}`}>+{salary.allowances.housing.toLocaleString()} Ar</span>
              </div>
            )}
            
            {salary.allowances.meal && salary.allowances.meal > 0 && (
              <div className={`flex justify-between items-center ${isMobile ? 'py-1.5' : 'py-2'} border-b border-gray-100`}>
                <span className="text-gray-600">Indemnité repas:</span>
                <span className={`font-medium text-green-600 ${isMobile ? 'text-sm' : ''}`}>+{salary.allowances.meal.toLocaleString()} Ar</span>
              </div>
            )}
            
            {salary.allowances.performance && salary.allowances.performance > 0 && (
              <div className={`flex justify-between items-center ${isMobile ? 'py-1.5' : 'py-2'} border-b border-gray-100`}>
                <span className="text-gray-600">Prime performance:</span>
                <span className={`font-medium text-green-600 ${isMobile ? 'text-sm' : ''}`}>+{salary.allowances.performance.toLocaleString()} Ar</span>
              </div>
            )}
            
            {salary.allowances.other && salary.allowances.other > 0 && (
              <div className={`flex justify-between items-center ${isMobile ? 'py-1.5' : 'py-2'} border-b border-gray-100`}>
                <span className="text-gray-600">Autres indemnités:</span>
                <span className={`font-medium text-green-600 ${isMobile ? 'text-sm' : ''}`}>+{salary.allowances.other.toLocaleString()} Ar</span>
              </div>
            )}
            
            <div className={`flex justify-between items-center ${isMobile ? 'py-2' : 'py-3'} bg-green-50 border border-green-200 rounded-lg px-3 mt-3`}>
              <span className="font-bold text-green-800">SALAIRE BRUT TOTAL:</span>
              <span className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-green-600`}>{salary.totalGross.toLocaleString()} Ar</span>
            </div>
          </div>
        </div>

        {/* Déductions et Calculs */}
        <div className={`bg-white border border-gray-200 rounded-lg ${isMobile ? 'p-4' : 'p-6'}`}>
          <h4 className={`font-bold text-gray-900 ${isMobile ? 'text-sm mb-3' : 'mb-4'} flex items-center`}>
            <Calculator className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} mr-2`} />
            Déductions et Calculs
          </h4>
          
          <div className="space-y-4">
            {/* Cotisations Sociales */}
            <div className={`bg-red-50 border border-red-200 rounded-lg ${isMobile ? 'p-3' : 'p-4'}`}>
              <h5 className={`font-medium text-red-800 ${isMobile ? 'text-sm mb-2' : 'mb-2'}`}>Cotisations Sociales</h5>
              <div className={`space-y-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                <div className="flex justify-between">
                  <span>CNAPS (1%):</span>
                  <span className="font-medium text-red-600">-{salary.cnaps.toLocaleString()} Ar</span>
                </div>
                <div className="flex justify-between">
                  <span>OSTIE (1%):</span>
                  <span className="font-medium text-red-600">-{salary.ostie.toLocaleString()} Ar</span>
                </div>
                <div className="flex justify-between border-t border-red-300 pt-2">
                  <span>Salaire imposable:</span>
                  <span className="font-medium">{taxableIncome.toLocaleString()} Ar</span>
                </div>
              </div>
            </div>

            {/* IRSA */}
            <div className={`bg-purple-50 border border-purple-200 rounded-lg ${isMobile ? 'p-3' : 'p-4'}`}>
              <h5 className={`font-medium text-purple-800 ${isMobile ? 'text-sm mb-2' : 'mb-2'}`}>Impôt IRSA</h5>
              <div className="flex justify-between">
                <span>IRSA calculé:</span>
                <span className="font-bold text-red-600">-{salary.irsa.toLocaleString()} Ar</span>
              </div>
            </div>

            {/* Total Déductions */}
            <div className={`bg-gray-100 border border-gray-300 rounded-lg ${isMobile ? 'p-3' : 'p-4'}`}>
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-800">TOTAL DÉDUCTIONS:</span>
                <span className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-red-600`}>-{salary.totalDeductions.toLocaleString()} Ar</span>
              </div>
            </div>

            {/* Salaire Net */}
            <div className={`bg-green-100 border-2 border-green-400 rounded-lg ${isMobile ? 'p-3' : 'p-4'}`}>
              <div className="text-center">
                <h5 className={`font-bold text-green-800 ${isMobile ? 'text-sm mb-2' : 'mb-2'}`}>SALAIRE NET À PAYER</h5>
                <p className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-green-600`}>
                  {salary.netSalary.toLocaleString()} Ar
                </p>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-green-700 mt-1`}>
                  Taux net: {salary.totalGross > 0 ? ((salary.netSalary / salary.totalGross) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calculateur IRSA Détaillé */}
      <div className={`${isMobile ? 'hidden' : 'block'}`}>
        <h4 className={`font-bold text-gray-900 ${isMobile ? 'text-sm mb-2' : 'mb-3'} flex items-center`}>
          <Calculator className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} mr-2`} />
          Détail du Calcul IRSA
        </h4>
        <IRSACalculator salaireImposable={taxableIncome} />
      </div>

      {/* Informations Complémentaires */}
      <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-2 gap-6'}`}>
        <div className={`bg-gray-50 border border-gray-200 rounded-lg ${isMobile ? 'p-3' : 'p-4'}`}>
          <h4 className={`font-medium text-gray-900 ${isMobile ? 'text-sm mb-2' : 'mb-3'}`}>Informations Administratives</h4>
          <div className={`space-y-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            <div className="flex justify-between">
              <span className="text-gray-600">Date d'effet:</span>
              <span className="font-medium">{new Date(salary.effectiveDate).toLocaleDateString('fr-FR')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Type d'employé:</span>
              <span className="font-medium">{salary.employeeType === 'teacher' ? 'Enseignant' : 'Personnel'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Statut:</span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                salary.status === 'active' ? 'bg-green-100 text-green-800' :
                salary.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {salary.status === 'active' ? 'Actif' : 
                 salary.status === 'pending' ? 'En attente' : 'Inactif'}
              </span>
            </div>
          </div>
        </div>

        <div className={`bg-gray-50 border border-gray-200 rounded-lg ${isMobile ? 'p-3' : 'p-4'}`}>
          <h4 className={`font-medium text-gray-900 ${isMobile ? 'text-sm mb-2' : 'mb-3'}`}>Charges Patronales (Information)</h4>
          <div className={`space-y-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            <div className="flex justify-between">
              <span className="text-gray-600">CNAPS Employeur (13%):</span>
              <span className="font-medium text-orange-600">+{Math.round(salary.totalGross * 0.13).toLocaleString()} Ar</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">OSTIE Employeur (5%):</span>
              <span className="font-medium text-orange-600">+{Math.round(salary.totalGross * 0.05).toLocaleString()} Ar</span>
            </div>
            <div className="flex justify-between border-t border-gray-300 pt-2">
              <span className="font-medium text-gray-700">Coût Total Employeur:</span>
              <span className="font-bold text-purple-600">
                {(salary.totalGross + Math.round(salary.totalGross * 0.18)).toLocaleString()} Ar
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {salary.notes && (
        <div className={`bg-blue-50 border border-blue-200 rounded-lg ${isMobile ? 'p-3' : 'p-4'}`}>
          <h4 className={`font-medium text-blue-800 ${isMobile ? 'text-sm mb-2' : 'mb-2'}`}>Notes</h4>
          <p className={`text-blue-700 ${isMobile ? 'text-xs' : 'text-sm'}`}>{salary.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className={`flex ${isMobile ? 'flex-col gap-3 pt-4' : 'space-x-3 pt-6'} border-t border-gray-200`}>
        <button
          onClick={onClose}
          className={`${isMobile ? 'w-full px-4 py-3 text-base' : 'flex-1 px-4 py-2'} border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors`}
        >
          Fermer
        </button>
        <button
          onClick={handleDownload}
          className={`${isMobile ? 'w-full px-4 py-3 text-base' : 'flex-1 px-4 py-2'} border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors`}
        >
          <Download className={`${isMobile ? 'w-5 h-5 mr-2' : 'w-4 h-4 mr-2'} inline`} />
          Télécharger PDF
        </button>
        <button
          onClick={handlePrintPayslip}
          className={`${isMobile ? 'w-full px-4 py-3 text-base' : 'flex-1 px-4 py-2'} bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors`}
        >
          <Printer className={`${isMobile ? 'w-5 h-5 mr-2' : 'w-4 h-4 mr-2'} inline`} />
          Imprimer Bulletin
        </button>
        <button
          onClick={onEdit}
          className={`${isMobile ? 'w-full px-4 py-3 text-base' : 'flex-1 px-4 py-2'} bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors`}
        >
          <Edit className={`${isMobile ? 'w-5 h-5 mr-2' : 'w-4 h-4 mr-2'} inline`} />
          Modifier
        </button>
      </div>
    </div>
  );
}