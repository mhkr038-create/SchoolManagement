export type InvoiceStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'VOID';
export type PaymentMethod = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'ONLINE';

export interface FeeCategory {
  id: string;
  schoolId: string;
  name: string;
  description?: string | null;
}

export interface FeeStructureItem {
  id: string;
  feeStructureId: string;
  feeCategoryId: string;
  amount: number;
  dueDate?: string | null;
  feeCategory?: FeeCategory;
}

export interface FeeStructure {
  id: string;
  schoolId: string;
  academicYearId: string;
  classId: string;
  name: string;
  frequency: string;
  totalAmount: number;
  createdAt: string;
  class?: {
    id: string;
    name: string;
    code: string;
  };
  academicYear?: {
    id: string;
    name: string;
  };
  items?: FeeStructureItem[];
  _count?: {
    invoices: number;
  };
}

export interface FeeInvoiceItem {
  id: string;
  feeInvoiceId: string;
  feeCategoryId?: string | null;
  description: string;
  amount: number;
  feeCategory?: FeeCategory;
}

export interface PaymentAllocation {
  id: string;
  paymentId: string;
  feeInvoiceId: string;
  amount: number;
  payment?: Payment;
}

export interface Receipt {
  id: string;
  schoolId: string;
  receiptNumber: string;
  paymentId: string;
  pdfUrl?: string | null;
  issuedAt: string;
  payment?: Payment;
}

export interface FeeInvoice {
  id: string;
  schoolId: string;
  invoiceNumber: string;
  studentId: string;
  academicYearId: string;
  feeStructureId?: string | null;
  title: string;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    admissionNumber: string;
    firstName: string;
    lastName: string;
    currentClass?: {
      id: string;
      name: string;
      code: string;
    };
    currentSection?: {
      id: string;
      name: string;
    };
    school?: {
      id: string;
      name: string;
      code: string;
    };
  };
  feeStructure?: FeeStructure;
  items?: FeeInvoiceItem[];
  allocations?: PaymentAllocation[];
}

export interface Payment {
  id: string;
  schoolId: string;
  paymentReference: string;
  studentId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  transactionId?: string | null;
  collectedBy: string;
  notes?: string | null;
  status: string;
  createdAt: string;
  student?: {
    id: string;
    admissionNumber: string;
    firstName: string;
    lastName: string;
  };
  collector?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  receipt?: Receipt;
}

export interface FeeStats {
  totalInvoiced: number;
  totalCollected: number;
  totalOutstanding: number;
  totalInvoices: number;
  paidInvoices: number;
  partialInvoices: number;
  unpaidInvoices: number;
  collectionRate: number;
}

export interface ReceiptDetails {
  receiptNumber: string;
  paymentReference: string;
  paymentDate: string;
  paymentMethod: string;
  transactionId?: string | null;
  amountPaid: number;
  balanceRemaining: number;
  notes?: string | null;
  school: {
    id: string;
    name: string;
    code: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    logoUrl?: string | null;
  };
  student: {
    id: string;
    admissionNumber: string;
    name: string;
    className: string;
    sectionName?: string;
  };
  invoice: {
    id: string;
    invoiceNumber: string;
    title: string;
    totalAmount: number;
    issueDate: string;
    dueDate: string;
  };
  items: {
    description: string;
    amount: number;
  }[];
  collector: {
    name: string;
    email: string;
  };
}
