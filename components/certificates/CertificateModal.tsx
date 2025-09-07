import React, { useState } from 'react';
import { Modal } from '../Modal';
import { FileText, Download, Printer, Calendar, User, School } from 'lucide-react';

interface Student {
  id?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  class: string;
  address: string;
  phone: string;
  parentName: string;
  status: string;
}

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
}

export function CertificateModal({ isOpen, onClose, student }: CertificateModalProps) {
  const [certificateType, setCertificateType] = useState<'scolarite' | 'presence' | 'inscription'>('scolarite');
  const [academicYear, setAcademicYear] = useState('2024-2025');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateCertificate = () => {
    setIsGenerating(true);
    
    const certificateContent = generateCertificateContent();
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const htmlContent = `
        <html>
          <head>
            <title>Certificat de ${certificateType === 'scolarite' ? 'Scolarité' : certificateType === 'presence' ? 'Présence' : 'Inscription'} - ${student.firstName} ${student.lastName}</title>
            <style>
              body { 
                font-family: 'Times New Roman', serif; 
                margin: 40px; 
                line-height: 1.6;
                color: #333;
              }
              .header { 
                text-align: center; 
                margin-bottom: 40px;
                border-bottom: 2px solid #333;
                padding-bottom: 20px;
              }
              .school-name { 
                font-size: 24px; 
                font-weight: bold; 
                color: #1e40af;
                margin-bottom: 10px;
              }
              .school-info { 
                font-size: 14px; 
                color: #666;
              }
              .certificate-title { 
                font-size: 20px; 
                font-weight: bold; 
                text-align: center; 
                margin: 40px 0;
                text-transform: uppercase;
                text-decoration: underline;
              }
              .content { 
                margin: 30px 0; 
                text-align: justify;
                font-size: 16px;
              }
              .student-info { 
                background-color: #f8f9fa;
                padding: 20px;
                border-left: 4px solid #1e40af;
                margin: 20px 0;
              }
              .footer { 
                margin-top: 60px; 
                display: flex; 
                justify-content: space-between;
              }
              .signature { 
                text-align: center; 
                width: 200px;
              }
              .date { 
                text-align: right; 
                margin-bottom: 20px;
                font-style: italic;
              }
              @media print {
                body { margin: 20px; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            ${certificateContent}
            <div class="no-print" style="text-align: center; margin-top: 30px;">
              <button onclick="window.print()" style="padding: 10px 20px; background: #1e40af; color: white; border: none; border-radius: 5px; cursor: pointer;">
                Imprimer
              </button>
              <button onclick="window.close()" style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
                Fermer
              </button>
            </div>
          </body>
        </html>
      `;
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }
    
    setTimeout(() => {
      setIsGenerating(false);
    }, 1000);
  };

  const generateCertificateContent = () => {
    const currentDate = new Date().toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const studentAge = calculateAge(student.dateOfBirth);

    switch (certificateType) {
      case 'scolarite':
        return `
          <div class="header">
            <div class="school-name">ÉCOLE LES POUPONS</div>
            <div class="school-info">
              École Privée Agréée<br>
              Antananarivo, Madagascar<br>
              Tél: +261 20 22 123 45 | Email: contact@lespoupons.mg
            </div>
          </div>
          
          <div class="date">Antananarivo, le ${currentDate}</div>
          
          <div class="certificate-title">Certificat de Scolarité</div>
          
          <div class="content">
            <p>Je soussigné(e), Directeur/Directrice de l'École LES POUPONS, certifie par la présente que :</p>
            
            <div class="student-info">
              <strong>Nom et Prénom :</strong> ${student.lastName.toUpperCase()} ${student.firstName}<br>
              <strong>Date de naissance :</strong> ${new Date(student.dateOfBirth).toLocaleDateString('fr-FR')}<br>
              <strong>Âge :</strong> ${studentAge} ans<br>
              <strong>Classe :</strong> ${student.class}<br>
              <strong>Année scolaire :</strong> ${academicYear}<br>
              <strong>Adresse :</strong> ${student.address}<br>
              <strong>Parent/Tuteur :</strong> ${student.parentName}
            </div>
            
            <p>est régulièrement inscrit(e) et suit assidûment les cours dans notre établissement pour l'année scolaire ${academicYear}.</p>
            
            <p>Ce certificat est délivré pour servir et valoir ce que de droit.</p>
          </div>
          
          <div class="footer">
            <div class="signature">
              <p>Le/La Directeur/Directrice</p>
              <br><br>
              <p>_____________________</p>
              <p style="font-size: 12px;">Signature et cachet</p>
            </div>
          </div>
        `;

      case 'presence':
        return `
          <div class="header">
            <div class="school-name">ÉCOLE LES POUPONS</div>
            <div class="school-info">
              École Privée Agréée<br>
              Antananarivo, Madagascar<br>
              Tél: +261 20 22 123 45 | Email: contact@lespoupons.mg
            </div>
          </div>
          
          <div class="date">Antananarivo, le ${currentDate}</div>
          
          <div class="certificate-title">Certificat de Présence</div>
          
          <div class="content">
            <p>Je soussigné(e), Directeur/Directrice de l'École LES POUPONS, certifie par la présente que :</p>
            
            <div class="student-info">
              <strong>Nom et Prénom :</strong> ${student.lastName.toUpperCase()} ${student.firstName}<br>
              <strong>Date de naissance :</strong> ${new Date(student.dateOfBirth).toLocaleDateString('fr-FR')}<br>
              <strong>Classe :</strong> ${student.class}<br>
              <strong>Année scolaire :</strong> ${academicYear}
            </div>
            
            <p>a été présent(e) et assidu(e) aux cours dispensés dans notre établissement durant l'année scolaire ${academicYear}.</p>
            
            <p>L'élève a suivi régulièrement les enseignements conformément au programme officiel.</p>
            
            <p>Ce certificat est délivré pour servir et valoir ce que de droit.</p>
          </div>
          
          <div class="footer">
            <div class="signature">
              <p>Le/La Directeur/Directrice</p>
              <br><br>
              <p>_____________________</p>
              <p style="font-size: 12px;">Signature et cachet</p>
            </div>
          </div>
        `;

      case 'inscription':
        return `
          <div class="header">
            <div class="school-name">ÉCOLE LES POUPONS</div>
            <div class="school-info">
              École Privée Agréée<br>
              Antananarivo, Madagascar<br>
              Tél: +261 20 22 123 45 | Email: contact@lespoupons.mg
            </div>
          </div>
          
          <div class="date">Antananarivo, le ${currentDate}</div>
          
          <div class="certificate-title">Certificat d'Inscription</div>
          
          <div class="content">
            <p>Je soussigné(e), Directeur/Directrice de l'École LES POUPONS, certifie par la présente que :</p>
            
            <div class="student-info">
              <strong>Nom et Prénom :</strong> ${student.lastName.toUpperCase()} ${student.firstName}<br>
              <strong>Date de naissance :</strong> ${new Date(student.dateOfBirth).toLocaleDateString('fr-FR')}<br>
              <strong>Classe :</strong> ${student.class}<br>
              <strong>Année scolaire :</strong> ${academicYear}<br>
              <strong>Parent/Tuteur :</strong> ${student.parentName}<br>
              <strong>Contact :</strong> ${student.phone}
            </div>
            
            <p>est dûment inscrit(e) dans notre établissement pour l'année scolaire ${academicYear} en classe de ${student.class}.</p>
            
            <p>L'inscription a été effectuée conformément à la réglementation en vigueur et après accomplissement de toutes les formalités requises.</p>
            
            <p>Ce certificat est délivré pour servir et valoir ce que de droit.</p>
          </div>
          
          <div class="footer">
            <div class="signature">
              <p>Le/La Directeur/Directrice</p>
              <br><br>
              <p>_____________________</p>
              <p style="font-size: 12px;">Signature et cachet</p>
            </div>
          </div>
        `;

      default:
        return '';
    }
  };

  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Générer un Certificat"
      size="lg"
    >
      <div className="space-y-6">
        {/* Student Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <User className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="font-bold text-blue-900">{student.firstName} {student.lastName}</h3>
              <p className="text-blue-700 text-sm">Classe: {student.class}</p>
              <p className="text-blue-600 text-xs">Né(e) le: {new Date(student.dateOfBirth).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
        </div>

        {/* Certificate Options */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Type de certificat
            </label>
            <select
              value={certificateType}
              onChange={(e) => setCertificateType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="scolarite">Certificat de Scolarité</option>
              <option value="presence">Certificat de Présence</option>
              <option value="inscription">Certificat d'Inscription</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Année scolaire
            </label>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="2024-2025">2024-2025</option>
              <option value="2023-2024">2023-2024</option>
              <option value="2022-2023">2022-2023</option>
            </select>
          </div>
        </div>

        {/* Certificate Preview Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2 flex items-center">
            <School className="w-4 h-4 mr-2" />
            Aperçu du certificat
          </h4>
          <div className="text-sm text-gray-700 space-y-1">
            <p><strong>Type:</strong> {
              certificateType === 'scolarite' ? 'Certificat de Scolarité' :
              certificateType === 'presence' ? 'Certificat de Présence' :
              'Certificat d\'Inscription'
            }</p>
            <p><strong>Élève:</strong> {student.firstName} {student.lastName}</p>
            <p><strong>Classe:</strong> {student.class}</p>
            <p><strong>Année:</strong> {academicYear}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={generateCertificate}
            disabled={isGenerating}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {isGenerating ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Génération...
              </div>
            ) : (
              <>
                <Printer className="w-4 h-4 mr-2 inline" />
                Générer et Imprimer
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}