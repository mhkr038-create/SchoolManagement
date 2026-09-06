import React from 'react';
import { Chip, ChipProps } from '@mui/material';

interface StatusBadgeProps {
  status: string;
  size?: ChipProps['size'];
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'small' }) => {
  let color: ChipProps['color'] = 'default';
  const normalized = (status || '').toUpperCase();

  switch (normalized) {
    case 'ACTIVE':
    case 'PAID':
    case 'PRESENT':
    case 'COMPLETED':
      color = 'success';
      break;
    case 'PENDING':
    case 'PARTIAL':
    case 'LATE':
      color = 'warning';
      break;
    case 'INACTIVE':
    case 'UNPAID':
    case 'ABSENT':
    case 'SUSPENDED':
    case 'FAILED':
      color = 'error';
      break;
    case 'SUPER_ADMIN':
    case 'SCHOOL_ADMIN':
      color = 'primary';
      break;
    default:
      color = 'default';
  }

  return (
    <Chip
      label={status}
      color={color}
      size={size}
      variant="outlined"
      sx={{ fontWeight: 600, fontSize: '0.75rem' }}
    />
  );
};
