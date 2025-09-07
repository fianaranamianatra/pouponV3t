// Firebase collection type definitions

export interface Student {
  id?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  class: string;
  address: string;
  phone: string;
  parentName: string;
  parentEmail?: string;
  status: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Teacher {
  id?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  subject: string;
  classes?: string[];
  experience: number;
  status: 'CDI' | 'CDD' | 'FRAM';
  dateOfBirth?: string;
  entryDate?: string;
  retirementDate?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Class {
  id?: string;
  name: string;
  level: string;
  teacher: string;
  studentCount: number;
  maxCapacity: number;
  room: string;
  status: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Subject {
  id?: string;
  name: string;
  code: string;
  description: string;
  hoursPerWeek: number;
  teachers: string[];
  classes: string[];
  color: string;
  status: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Fee {
  id?: string;
  studentName: string;
  class: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  period: string;
  status: 'paid' | 'pending' | 'overdue';
  reference: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Report {
  id?: string;
  title: string;
  description: string;
  type: 'academic' | 'attendance' | 'financial' | 'behavioral';
  generated: string;
  size: string;
  format: 'PDF' | 'Excel' | 'Word';
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Employee {
  id?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  position: string;
  department: string;
  level: number;
  parentId?: string;
  salary: number;
  hireDate: string;
  status: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}
