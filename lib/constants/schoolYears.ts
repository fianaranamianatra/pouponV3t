export const SCHOOL_YEARS = [
  '2025-2026',
  '2024-2025',
  '2023-2024',
  '2022-2023'
] as const;

export type SchoolYear = typeof SCHOOL_YEARS[number];

export const CURRENT_SCHOOL_YEAR: SchoolYear = '2025-2026';

export const getSchoolYearLabel = (year: string): string => {
  return `Année Scolaire ${year}`;
};

export const getSchoolYearMonths = () => {
  return [
    { id: 'septembre', label: 'Septembre', order: 1 },
    { id: 'octobre', label: 'Octobre', order: 2 },
    { id: 'novembre', label: 'Novembre', order: 3 },
    { id: 'decembre', label: 'Décembre', order: 4 },
    { id: 'janvier', label: 'Janvier', order: 5 },
    { id: 'fevrier', label: 'Février', order: 6 },
    { id: 'mars', label: 'Mars', order: 7 },
    { id: 'avril', label: 'Avril', order: 8 },
    { id: 'mai', label: 'Mai', order: 9 },
    { id: 'juin', label: 'Juin', order: 10 }
  ];
};

export const isValidSchoolYear = (year: string): boolean => {
  return SCHOOL_YEARS.includes(year as SchoolYear);
};