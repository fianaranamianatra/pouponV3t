// Financial settings service
export interface FinancialSetting {
  cnaps: {
    employeeRate: number;
    employerRate: number;
    ceiling: number;
    isActive: boolean;
  };
  ostie: {
    employeeRate: number;
    employerRate: number;
    ceiling: number;
    isActive: boolean;
  };
  updatedAt: Date;
}

export class FinancialSettingsService {
  static async get(): Promise<FinancialSetting> {
    // Mock settings - in real app, this would come from Firebase
    return {
      cnaps: {
        employeeRate: 1,
        employerRate: 13,
        ceiling: 8000000,
        isActive: true
      },
      ostie: {
        employeeRate: 1,
        employerRate: 5,
        ceiling: 8000000,
        isActive: true
      },
      updatedAt: new Date()
    };
  }

  static async update(settings: Partial<FinancialSetting>): Promise<void> {
    // Mock update - in real app, this would update Firebase
    console.log('Updating financial settings:', settings);
  }
}