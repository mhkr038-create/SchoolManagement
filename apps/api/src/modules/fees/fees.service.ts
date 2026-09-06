import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateFeeCategoryDto } from './dto/create-fee-category.dto';
import { CreateFeeStructureDto } from './dto/create-fee-structure.dto';
import { GenerateInvoicesDto } from './dto/generate-invoices.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { FeeStats, ReceiptDetails } from '@school/types';

@Injectable()
export class FeesService {
  constructor(private prisma: PrismaService) {}

  // -------------------------------------------------------------
  // 1. STATS & KPI METRICS
  // -------------------------------------------------------------
  async getFeeStats(schoolId: string, isSuperAdmin = false): Promise<FeeStats> {
    const where: any = {};
    if (schoolId && schoolId !== 'ALL') {
      where.schoolId = schoolId;
    }

    const [aggregate, paidCount, partialCount, unpaidCount, totalCount] = await Promise.all([
      this.prisma.feeInvoice.aggregate({
        where,
        _sum: {
          totalAmount: true,
          paidAmount: true,
          balanceAmount: true
        }
      }),
      this.prisma.feeInvoice.count({ where: { ...where, status: 'PAID' } }),
      this.prisma.feeInvoice.count({ where: { ...where, status: 'PARTIAL' } }),
      this.prisma.feeInvoice.count({ where: { ...where, status: 'UNPAID' } }),
      this.prisma.feeInvoice.count({ where })
    ]);

    const totalInvoiced = Number(aggregate._sum.totalAmount || 0);
    const totalCollected = Number(aggregate._sum.paidAmount || 0);
    const totalOutstanding = Number(aggregate._sum.balanceAmount || 0);
    const collectionRate = totalInvoiced > 0 ? Number(((totalCollected / totalInvoiced) * 100).toFixed(1)) : 0;

    return {
      totalInvoiced,
      totalCollected,
      totalOutstanding,
      totalInvoices: totalCount,
      paidInvoices: paidCount,
      partialInvoices: partialCount,
      unpaidInvoices: unpaidCount,
      collectionRate
    };
  }

  // -------------------------------------------------------------
  // 2. FEE CATEGORIES / HEADS
  // -------------------------------------------------------------
  async listCategories(schoolId: string) {
    const where: any = {};
    if (schoolId && schoolId !== 'ALL') {
      where.schoolId = schoolId;
    }
    return this.prisma.feeCategory.findMany({
      where,
      orderBy: { name: 'asc' }
    });
  }

  async createCategory(schoolId: string, dto: CreateFeeCategoryDto) {
    return this.prisma.feeCategory.create({
      data: {
        schoolId,
        name: dto.name,
        description: dto.description
      }
    });
  }

  async deleteCategory(schoolId: string, id: string) {
    const usedInStructures = await this.prisma.feeStructureItem.count({ where: { feeCategoryId: id } });
    if (usedInStructures > 0) {
      throw new BadRequestException('Cannot delete category: it is used in one or more fee structures');
    }
    const usedInInvoices = await this.prisma.feeInvoiceItem.count({ where: { feeCategoryId: id } });
    if (usedInInvoices > 0) {
      throw new BadRequestException('Cannot delete category: it is referenced in existing invoices');
    }
    return this.prisma.feeCategory.delete({ where: { id } });
  }

  // -------------------------------------------------------------
  // 3. FEE STRUCTURES (TEMPLATES)
  // -------------------------------------------------------------
  async listStructures(schoolId: string, classId?: string, academicYearId?: string) {
    const where: any = {};
    if (schoolId && schoolId !== 'ALL') {
      where.schoolId = schoolId;
    }
    if (classId) where.classId = classId;
    if (academicYearId) where.academicYearId = academicYearId;

    const structures = await this.prisma.feeStructure.findMany({
      where,
      include: {
        class: { select: { id: true, name: true, code: true } },
        academicYear: { select: { id: true, name: true } },
        items: {
          include: {
            feeCategory: { select: { id: true, name: true } }
          }
        },
        _count: { select: { invoices: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return structures.map(s => ({
      ...s,
      totalAmount: Number(s.totalAmount),
      items: s.items.map(item => ({
        ...item,
        amount: Number(item.amount)
      }))
    }));
  }

  async createStructure(schoolId: string, dto: CreateFeeStructureDto) {
    const totalAmount = dto.items.reduce((acc, item) => acc + Number(item.amount), 0);

    return this.prisma.$transaction(async (tx) => {
      const structure = await tx.feeStructure.create({
        data: {
          schoolId,
          academicYearId: dto.academicYearId,
          classId: dto.classId,
          name: dto.name,
          frequency: dto.frequency || 'TERMLY',
          totalAmount
        }
      });

      if (dto.items && dto.items.length > 0) {
        await tx.feeStructureItem.createMany({
          data: dto.items.map(item => ({
            feeStructureId: structure.id,
            feeCategoryId: item.feeCategoryId,
            amount: item.amount,
            dueDate: item.dueDate ? new Date(item.dueDate) : null
          }))
        });
      }

      return tx.feeStructure.findUnique({
        where: { id: structure.id },
        include: {
          class: true,
          academicYear: true,
          items: { include: { feeCategory: true } }
        }
      });
    });
  }

  // -------------------------------------------------------------
  // 4. INVOICES
  // -------------------------------------------------------------
  async listInvoices(
    schoolId: string,
    params: {
      page?: number;
      limit?: number;
      search?: string;
      classId?: string;
      status?: string;
      studentId?: string;
      allBranches?: boolean;
    }
  ) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (!params.allBranches && schoolId && schoolId !== 'ALL') {
      where.schoolId = schoolId;
    }

    if (params.status && params.status !== 'ALL') {
      where.status = params.status;
    }

    if (params.studentId) {
      where.studentId = params.studentId;
    }

    if (params.classId) {
      where.student = {
        enrollments: {
          some: {
            classId: params.classId,
            status: { in: ['ENROLLED', 'ACTIVE'] }
          }
        }
      };
    }

    if (params.search) {
      const q = params.search.trim();
      where.OR = [
        { invoiceNumber: { contains: q, mode: 'insensitive' } },
        { title: { contains: q, mode: 'insensitive' } },
        {
          student: {
            OR: [
              { firstName: { contains: q, mode: 'insensitive' } },
              { lastName: { contains: q, mode: 'insensitive' } },
              { admissionNumber: { contains: q, mode: 'insensitive' } }
            ]
          }
        }
      ];
    }

    const [total, invoices] = await Promise.all([
      this.prisma.feeInvoice.count({ where }),
      this.prisma.feeInvoice.findMany({
        where,
        skip,
        take: limit,
        include: {
          student: {
            select: {
              id: true,
              admissionNumber: true,
              firstName: true,
              lastName: true,
              school: { select: { id: true, name: true, code: true } },
              enrollments: {
                where: { status: { in: ['ENROLLED', 'ACTIVE'] } },
                take: 1,
                include: {
                  class: { select: { id: true, name: true, code: true } },
                  section: { select: { id: true, name: true } }
                }
              }
            }
          },
          feeStructure: { select: { id: true, name: true } },
          items: {
            include: { feeCategory: { select: { id: true, name: true } } }
          },
          allocations: {
            include: {
              payment: {
                select: {
                  id: true,
                  paymentReference: true,
                  amount: true,
                  paymentMethod: true,
                  paymentDate: true,
                  receipt: { select: { id: true, receiptNumber: true, issuedAt: true } }
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const formatted = invoices.map(inv => {
      const activeEnrollment = inv.student?.enrollments?.[0];
      return {
        ...inv,
        subtotal: Number(inv.subtotal),
        discountAmount: Number(inv.discountAmount),
        totalAmount: Number(inv.totalAmount),
        paidAmount: Number(inv.paidAmount),
        balanceAmount: Number(inv.balanceAmount),
        student: inv.student ? {
          id: inv.student.id,
          admissionNumber: inv.student.admissionNumber,
          firstName: inv.student.firstName,
          lastName: inv.student.lastName,
          school: inv.student.school,
          currentClass: activeEnrollment?.class,
          currentSection: activeEnrollment?.section
        } : null,
        items: inv.items.map(i => ({
          ...i,
          amount: Number(i.amount)
        })),
        allocations: inv.allocations.map(a => ({
          ...a,
          amount: Number(a.amount),
          payment: a.payment ? {
            ...a.payment,
            amount: Number(a.payment.amount)
          } : null
        }))
      };
    });

    return {
      items: formatted,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getInvoiceById(schoolId: string, id: string) {
    const where: any = { id };
    if (schoolId && schoolId !== 'ALL') {
      where.schoolId = schoolId;
    }

    const invoice = await this.prisma.feeInvoice.findFirst({
      where,
      include: {
        school: true,
        student: {
          include: {
            enrollments: {
              where: { status: { in: ['ENROLLED', 'ACTIVE'] } },
              take: 1,
              include: { class: true, section: true }
            }
          }
        },
        feeStructure: true,
        items: { include: { feeCategory: true } },
        allocations: {
          include: {
            payment: {
              include: {
                collector: { select: { id: true, firstName: true, lastName: true, email: true } },
                receipt: true
              }
            }
          }
        }
      }
    });

    if (!invoice) throw new NotFoundException('Fee invoice not found');

    const activeEnrollment = invoice.student?.enrollments?.[0];

    return {
      ...invoice,
      subtotal: Number(invoice.subtotal),
      discountAmount: Number(invoice.discountAmount),
      totalAmount: Number(invoice.totalAmount),
      paidAmount: Number(invoice.paidAmount),
      balanceAmount: Number(invoice.balanceAmount),
      student: invoice.student ? {
        id: invoice.student.id,
        admissionNumber: invoice.student.admissionNumber,
        firstName: invoice.student.firstName,
        lastName: invoice.student.lastName,
        school: invoice.school,
        currentClass: activeEnrollment?.class,
        currentSection: activeEnrollment?.section
      } : null,
      items: invoice.items.map(i => ({
        ...i,
        amount: Number(i.amount)
      }))
    };
  }

  async bulkGenerateInvoices(schoolId: string, dto: GenerateInvoicesDto) {
    const structure = await this.prisma.feeStructure.findFirst({
      where: { id: dto.feeStructureId, schoolId },
      include: { items: { include: { feeCategory: true } } }
    });

    if (!structure) {
      throw new NotFoundException('Fee structure template not found for this school');
    }

    if (structure.items.length === 0) {
      throw new BadRequestException('Selected fee structure has no line items');
    }

    const enrollmentWhere: any = {
      schoolId,
      classId: dto.classId,
      academicYearId: dto.academicYearId,
      status: { in: ['ENROLLED', 'ACTIVE'] }
    };

    if (dto.studentIds && dto.studentIds.length > 0) {
      enrollmentWhere.studentId = { in: dto.studentIds };
    }

    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: enrollmentWhere,
      include: {
        student: { select: { id: true, admissionNumber: true, firstName: true, lastName: true } },
        class: { select: { id: true, name: true } }
      }
    });

    if (enrollments.length === 0) {
      throw new BadRequestException('No active students found in this class for the selected academic year');
    }

    const existingInvoices = await this.prisma.feeInvoice.findMany({
      where: {
        schoolId,
        feeStructureId: structure.id,
        studentId: { in: enrollments.map(e => e.studentId) }
      },
      select: { studentId: true }
    });

    const existingStudentIds = new Set(existingInvoices.map(i => i.studentId));
    const targetEnrollments = enrollments.filter(e => !existingStudentIds.has(e.studentId));

    if (targetEnrollments.length === 0) {
      return {
        generatedCount: 0,
        skippedCount: enrollments.length,
        totalStudents: enrollments.length,
        message: 'All students in this class already have invoices generated for this fee structure'
      };
    }

    const currentYear = new Date().getFullYear();
    const existingCount = await this.prisma.feeInvoice.count({
      where: { schoolId }
    });

    let seq = existingCount + 1;
    const title = dto.title || `${structure.name} - ${targetEnrollments[0]?.class?.name || ''}`;
    const totalAmount = Number(structure.totalAmount);
    const dueDate = new Date(dto.dueDate);
    const issueDate = dto.issueDate ? new Date(dto.issueDate) : new Date();

    const createdInvoices = await this.prisma.$transaction(async (tx) => {
      const results = [];
      for (const enr of targetEnrollments) {
        const invoiceNumber = `INV-${currentYear}-${String(seq++).padStart(5, '0')}`;
        const invoice = await tx.feeInvoice.create({
          data: {
            schoolId,
            invoiceNumber,
            studentId: enr.studentId,
            academicYearId: dto.academicYearId,
            feeStructureId: structure.id,
            title,
            subtotal: totalAmount,
            discountAmount: 0,
            totalAmount: totalAmount,
            paidAmount: 0,
            balanceAmount: totalAmount,
            status: 'UNPAID',
            issueDate,
            dueDate
          }
        });

        await tx.feeInvoiceItem.createMany({
          data: structure.items.map(item => ({
            feeInvoiceId: invoice.id,
            feeCategoryId: item.feeCategoryId,
            description: item.feeCategory?.name || 'Fee Item',
            amount: item.amount
          }))
        });

        results.push(invoice);
      }
      return results;
    });

    return {
      generatedCount: createdInvoices.length,
      skippedCount: existingInvoices.length,
      totalStudents: enrollments.length,
      message: `Successfully generated ${createdInvoices.length} student invoice(s)`
    };
  }

  // -------------------------------------------------------------
  // 5. PAYMENT COLLECTION & RECEIPTS
  // -------------------------------------------------------------
  async recordPayment(schoolId: string, collectorUserId: string, dto: RecordPaymentDto) {
    const invoice = await this.prisma.feeInvoice.findFirst({
      where: {
        id: dto.invoiceId,
        ...(schoolId && schoolId !== 'ALL' ? { schoolId } : {})
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } }
      }
    });

    if (!invoice) {
      throw new NotFoundException('Fee invoice not found');
    }

    if (invoice.status === 'PAID') {
      throw new BadRequestException('This invoice is already fully paid');
    }

    const currentBalance = Number(invoice.balanceAmount);
    if (dto.amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    if (dto.amount > currentBalance + 0.01) {
      throw new BadRequestException(
        `Payment amount (₹${dto.amount}) exceeds outstanding balance (₹${currentBalance})`
      );
    }

    const currentYear = new Date().getFullYear();
    const payRef = `PAY-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const receiptNum = `REC-${currentYear}-${Math.floor(10000 + Math.random() * 90000)}`;
    const paymentDate = dto.paymentDate ? new Date(dto.paymentDate) : new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          schoolId: invoice.schoolId,
          paymentReference: payRef,
          studentId: invoice.studentId,
          amount: dto.amount,
          paymentMethod: dto.paymentMethod,
          paymentDate,
          transactionId: dto.transactionId || null,
          collectedBy: collectorUserId,
          notes: dto.notes || null,
          status: 'COMPLETED'
        }
      });

      const allocation = await tx.paymentAllocation.create({
        data: {
          paymentId: payment.id,
          feeInvoiceId: invoice.id,
          amount: dto.amount
        }
      });

      const newPaid = Number(invoice.paidAmount) + dto.amount;
      const newBalance = Math.max(0, Number(invoice.totalAmount) - newPaid);
      const newStatus = newBalance <= 0.01 ? 'PAID' : 'PARTIAL';

      const updatedInvoice = await tx.feeInvoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: newPaid,
          balanceAmount: newBalance,
          status: newStatus
        }
      });

      const receipt = await tx.receipt.create({
        data: {
          schoolId: invoice.schoolId,
          receiptNumber: receiptNum,
          paymentId: payment.id,
          issuedAt: new Date()
        }
      });

      return { payment, allocation, updatedInvoice, receipt };
    });

    return this.getReceiptDetails(schoolId, result.receipt.id);
  }

  async getReceiptDetails(schoolId: string, receiptIdOrPaymentId: string): Promise<ReceiptDetails> {
    const whereClause: any = {
      OR: [
        { id: receiptIdOrPaymentId },
        { receiptNumber: receiptIdOrPaymentId },
        { paymentId: receiptIdOrPaymentId }
      ]
    };

    if (schoolId && schoolId !== 'ALL') {
      whereClause.schoolId = schoolId;
    }

    const receipt = await this.prisma.receipt.findFirst({
      where: whereClause,
      include: {
        school: true,
        payment: {
          include: {
            collector: { select: { firstName: true, lastName: true, email: true } },
            student: {
              include: {
                enrollments: {
                  where: { status: { in: ['ENROLLED', 'ACTIVE'] } },
                  take: 1,
                  include: { class: true, section: true }
                }
              }
            },
            allocations: {
              include: {
                feeInvoice: {
                  include: {
                    items: { include: { feeCategory: true } }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!receipt || !receipt.payment) {
      throw new NotFoundException('Receipt not found');
    }

    const payment = receipt.payment;
    const student = payment.student;
    const activeEnrollment = student?.enrollments?.[0];
    const invoice = payment.allocations?.[0]?.feeInvoice;

    return {
      receiptNumber: receipt.receiptNumber,
      paymentReference: payment.paymentReference,
      paymentDate: payment.paymentDate.toISOString().split('T')[0],
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId,
      amountPaid: Number(payment.amount),
      balanceRemaining: invoice ? Number(invoice.balanceAmount) : 0,
      notes: payment.notes,
      school: {
        id: receipt.school.id,
        name: receipt.school.name,
        code: receipt.school.code,
        address: receipt.school.address,
        phone: receipt.school.phone,
        email: receipt.school.email,
        logoUrl: receipt.school.logoUrl
      },
      student: {
        id: student?.id || '',
        admissionNumber: student?.admissionNumber || '',
        name: `${student?.firstName || ''} ${student?.lastName || ''}`.trim(),
        className: activeEnrollment?.class?.name || 'N/A',
        sectionName: activeEnrollment?.section?.name || ''
      },
      invoice: {
        id: invoice?.id || '',
        invoiceNumber: invoice?.invoiceNumber || '',
        title: invoice?.title || 'Fee Invoice',
        totalAmount: invoice ? Number(invoice.totalAmount) : Number(payment.amount),
        issueDate: invoice?.issueDate ? invoice.issueDate.toISOString().split('T')[0] : '',
        dueDate: invoice?.dueDate ? invoice.dueDate.toISOString().split('T')[0] : ''
      },
      items: (invoice?.items || []).map(item => ({
        description: item.feeCategory?.name || item.description,
        amount: Number(item.amount)
      })),
      collector: {
        name: `${payment.collector.firstName} ${payment.collector.lastName}`.trim(),
        email: payment.collector.email
      }
    };
  }

  async listPayments(schoolId: string, params: { page?: number; limit?: number; studentId?: string; allBranches?: boolean }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (!params.allBranches && schoolId && schoolId !== 'ALL') {
      where.schoolId = schoolId;
    }
    if (params.studentId) where.studentId = params.studentId;

    const [total, payments] = await Promise.all([
      this.prisma.payment.count({ where }),
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        include: {
          student: {
            select: {
              id: true,
              admissionNumber: true,
              firstName: true,
              lastName: true,
              school: { select: { id: true, name: true, code: true } }
            }
          },
          collector: { select: { id: true, firstName: true, lastName: true, email: true } },
          receipt: true,
          allocations: {
            include: { feeInvoice: { select: { id: true, invoiceNumber: true, title: true } } }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    return {
      items: payments.map(p => ({
        ...p,
        amount: Number(p.amount)
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}