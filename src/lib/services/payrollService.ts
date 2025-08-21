// Payroll calculation service
export interface PayrollCalculation {
  grossSalary: number;
  cnaps: {
    isActive: boolean;
    rate: {
      employee: number;
      employer: number;
    };
    employeeContribution: number;
    employerContribution: number;
    total: number;
  };
  ostie: {
    isActive: boolean;
    rate: {
      employee: number;
      employer: number;
    };
    employeeContribution: number;
    employerContribution: number;
    total: number;
  };
  totalEmployeeContributions: number;
  totalEmployerContributions: number;
  netSalary: number;
  totalEmployerCost: number;
}

export interface PayrollSummary {
  employeeId: string;
  employeeName: string;
  position: string;
  department: string;
  calculation: PayrollCalculation;
  status: 'draft' | 'approved' | 'paid';
}

export class PayrollService {
  static async calculatePayroll(employeeId: string, grossSalary: number): Promise<PayrollCalculation> {
    // Mock calculation - in real app, this would use actual settings
    const cnapsSalarieRate = 1;
    const cnapsEmployeurRate = 13;
    const ostieSalarieRate = 1;
    const ostieEmployeurRate = 5;
    
    const cnapsEmployeeContribution = Math.round(grossSalary * cnapsSalarieRate / 100);
    const cnapsEmployerContribution = Math.round(grossSalary * cnapsEmployeurRate / 100);
    const ostieEmployeeContribution = Math.round(grossSalary * ostieSalarieRate / 100);
    const ostieEmployerContribution = Math.round(grossSalary * ostieEmployeurRate / 100);
    
    const totalEmployeeContributions = cnapsEmployeeContribution + ostieEmployeeContribution;
    const totalEmployerContributions = cnapsEmployerContribution + ostieEmployerContribution;
    const netSalary = grossSalary - totalEmployeeContributions;
    const totalEmployerCost = grossSalary + totalEmployerContributions;

    return {
      grossSalary,
      cnaps: {
        isActive: true,
        rate: {
          employee: cnapsSalarieRate,
          employer: cnapsEmployeurRate
        },
        employeeContribution: cnapsEmployeeContribution,
        employerContribution: cnapsEmployerContribution,
        total: cnapsEmployeeContribution + cnapsEmployerContribution
      },
      ostie: {
        isActive: true,
        rate: {
          employee: ostieSalarieRate,
          employer: ostieEmployeurRate
        },
        employeeContribution: ostieEmployeeContribution,
        employerContribution: ostieEmployerContribution,
        total: ostieEmployeeContribution + ostieEmployerContribution
      },
      totalEmployeeContributions,
      totalEmployerContributions,
      netSalary,
      totalEmployerCost
    };
  }

  static async calculateBulkPayroll(employees: Array<{
    id: string;
    name: string;
    position: string;
    department: string;
    salary: number;
  }>): Promise<PayrollSummary[]> {
    const results: PayrollSummary[] = [];
    
    for (const employee of employees) {
      const calculation = await this.calculatePayroll(employee.id, employee.salary);
      results.push({
        employeeId: employee.id,
        employeeName: employee.name,
        position: employee.position,
        department: employee.department,
        calculation,
        status: 'draft'
      });
    }
    
    return results;
  }

  static formatPayslip(summary: PayrollSummary): string {
    const date = new Date().toLocaleDateString('fr-FR');
    
    return `
ÉCOLE LES POUPONS
Bulletin de Paie - ${date}

========================================
EMPLOYÉ: ${summary.employeeName}
POSTE: ${summary.position}
DÉPARTEMENT: ${summary.department}
========================================

SALAIRE BRUT:           ${summary.calculation.grossSalary.toLocaleString()} Ar

COTISATIONS SALARIALES:
- CNAPS (${summary.calculation.cnaps.rate.employee}%):        -${summary.calculation.cnaps.employeeContribution.toLocaleString()} Ar
- OSTIE (${summary.calculation.ostie.rate.employee}%):        -${summary.calculation.ostie.employeeContribution.toLocaleString()} Ar
                        ─────────────────
TOTAL COTISATIONS:      -${summary.calculation.totalEmployeeContributions.toLocaleString()} Ar

SALAIRE NET:            ${summary.calculation.netSalary.toLocaleString()} Ar

========================================
CHARGES PATRONALES:
- CNAPS (${summary.calculation.cnaps.rate.employer}%):       +${summary.calculation.cnaps.employerContribution.toLocaleString()} Ar
- OSTIE (${summary.calculation.ostie.rate.employer}%):        +${summary.calculation.ostie.employerContribution.toLocaleString()} Ar
                        ─────────────────
TOTAL CHARGES:          +${summary.calculation.totalEmployerContributions.toLocaleString()} Ar

COÛT TOTAL EMPLOYEUR:   ${summary.calculation.totalEmployerCost.toLocaleString()} Ar
========================================

Généré le ${date}
    `.trim();
  }
}