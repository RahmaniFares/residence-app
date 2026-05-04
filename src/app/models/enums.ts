export enum EmployeeStatus {
  Active = 0,
  OnLeave = 1,
  Suspended = 2,
  Inactive = 3
}

export const EmployeeStatusLabels: { [key in EmployeeStatus]: string } = {
  [EmployeeStatus.Active]: 'Active',
  [EmployeeStatus.OnLeave]: 'On Leave',
  [EmployeeStatus.Suspended]: 'Suspended',
  [EmployeeStatus.Inactive]: 'Inactive'
};

export const EmployeePositions = [
  'Gardien',
  'Femme de ménage',
  'Maintenance',
  'Directeur',
  'Secrétaire',
  'Autre'
];
