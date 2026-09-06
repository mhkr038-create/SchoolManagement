import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  InputAdornment,
  TablePagination,
  Grid,
  Divider,
  IconButton,
  Stack,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  School as SchoolIcon,
  FilterList as FilterIcon,
  UploadFile as UploadFileIcon,
  FileDownload as DownloadIcon,
  CheckCircle as SuccessIcon,
  TableChart as TableChartIcon
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/api/apiClient';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAuthStore } from '../../app/store/useAuthStore';

export const StudentsListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission, user, school, availableSchools } = useAuthStore();

  const isSuperAdmin = user?.userType === 'SUPER_ADMIN' || user?.roles?.some((r: any) => (r.name || r) === 'SUPER_ADMIN');
  const hasMultipleBranches = isSuperAdmin || (availableSchools && availableSchools.length > 1);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>(isSuperAdmin ? 'ALL' : (school?.id || 'ALL'));

  // Add Student Dialog State
  const [openModal, setOpenModal] = useState(false);
  const [admitSchoolId, setAdmitSchoolId] = useState<string>(
    school?.id || (availableSchools && availableSchools[0]?.id) || ''
  );
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('MALE');
  const [dateOfBirth, setDateOfBirth] = useState('2020-01-01');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [studentPhone, setStudentPhone] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentRelationship, setParentRelationship] = useState('FATHER');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [rollNumber, setRollNumber] = useState<number | ''>('');

  // Fetch Students
  const { data: studentsResponse, isLoading, error } = useQuery({
    queryKey: ['students', page + 1, rowsPerPage, search, classFilter, sectionFilter, statusFilter, selectedBranchFilter],
    queryFn: async () => {
      const res: any = await apiClient.get('/students', {
        params: {
          page: page + 1,
          limit: rowsPerPage,
          search: search || undefined,
          classId: classFilter || undefined,
          sectionId: sectionFilter || undefined,
          status: statusFilter || undefined,
          schoolId: selectedBranchFilter !== 'ALL' ? selectedBranchFilter : 'ALL'
        }
      });
      return res;
    }
  });

  // Fetch Classes for Filters & Modal
  const { data: classesResponse } = useQuery({
    queryKey: ['classes', selectedBranchFilter, admitSchoolId, openModal],
    queryFn: async () => {
      const branchParam = openModal
        ? (admitSchoolId || undefined)
        : (selectedBranchFilter !== 'ALL' ? selectedBranchFilter : undefined);
      const res: any = await apiClient.get('/academics/classes', {
        params: { schoolId: branchParam }
      });
      return res;
    }
  });

  // Fetch Auto-generated Admission No Preview
  const { data: admissionNoData } = useQuery({
    queryKey: ['next-admission-no', admitSchoolId],
    queryFn: async () => {
      const res: any = await apiClient.get('/students/admission-number/generate', {
        params: { schoolId: admitSchoolId || undefined }
      });
      return res;
    },
    enabled: openModal
  });

  const classes = Array.isArray(classesResponse)
    ? classesResponse
    : Array.isArray(classesResponse?.data)
    ? classesResponse.data
    : [];
  const students = Array.isArray(studentsResponse)
    ? studentsResponse
    : Array.isArray(studentsResponse?.data)
    ? studentsResponse.data
    : [];
  const totalItems =
    studentsResponse?.meta?.totalItems ??
    (Array.isArray(studentsResponse) ? studentsResponse.length : (studentsResponse?.data?.length ?? 0));

  // Compute available sections for modal
  const activeClassObj = classes.find((c: any) => c.id === selectedClassId);
  const availableSections = activeClassObj?.sections || [];

  // Create Student Mutation
  const createStudentMutation = useMutation({
    mutationFn: (payload: any) => apiClient.post('/students', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setOpenModal(false);
      resetForm();
    },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Failed to create student')
  });

  // Import Dialog State
  const [openImportModal, setOpenImportModal] = useState(false);
  const [importTargetSchoolId, setImportTargetSchoolId] = useState<string>(
    school?.id || (availableSchools && availableSchools.length > 0 ? availableSchools[0].id : '')
  );
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [parsedStudents, setParsedStudents] = useState<any[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [defaultImportClass, setDefaultImportClass] = useState<string>('');
  const [defaultImportSection, setDefaultImportSection] = useState<string>('A');
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
  const [rawUploadedRows, setRawUploadedRows] = useState<any[]>([]);

  const bulkImportMutation = useMutation({
    mutationFn: (payload: { students: any[]; targetSchoolId?: string }) =>
      apiClient.post('/students/bulk-import', payload),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setImportSuccess(res.message || `Successfully imported ${parsedStudents.length} students.`);
      setParsedStudents([]);
      setRawUploadedRows([]);
      setDetectedColumns([]);
      setUploadedFileName('');
    },
    onError: (err: any) => {
      setImportError(err.response?.data?.message || 'Failed to import student records.');
    }
  });

  const mapRowsToStudents = (rows: any[], targetClass: string, targetSec: string) => {
    const ALIASES: Record<string, string[]> = {
      firstName: ['firstname', 'first name', 'first_name', 'fname'],
      lastName: ['lastname', 'last name', 'last_name', 'lname', 'surname'],
      fullName: ['student name', 'studentname', 'name', 'full name', 'fullname', 'candidate name', 'student', 'student_name'],
      rollNumber: ['roll no', 'roll number', 'roll_no', 'rollnum', 'roll', 'r.no', 'rno', 'roll_number', 'srno', 'sno', 'serial no'],
      className: ['class', 'class name', 'classname', 'grade', 'standard', 'std', 'class_name'],
      sectionName: ['section', 'sec', 'section name', 'sectionname', 'sec name', 'section_name'],
      gender: ['gender', 'sex'],
      dateOfBirth: ['date of birth', 'dob', 'birth date', 'birthdate', 'date_of_birth', 'd.o.b', 'dateofbirth'],
      bloodGroup: ['blood group', 'bloodgroup', 'blood', 'bg', 'blood_group'],
      phone: ['phone', 'mobile', 'contact', 'phone number', 'phonenumber', 'mobile no', 'cell', 'student phone', 'student mobile'],
      email: ['email', 'email id', 'emailid', 'email address', 'emailaddress'],
      parentName: ['parent name', 'parentname', 'father name', 'fathername', 'father', 'mother name', 'mothername', 'guardian name', 'guardian', 'parent', 'father_name', 'guardian_name'],
      parentPhone: ['parent phone', 'parent mobile', 'father phone', 'father mobile', 'guardian phone', 'guardian contact', 'parentphone', 'parent contact', 'mobile2'],
      parentRelationship: ['parent relationship', 'relationship', 'relation'],
      branch: ['branch', 'campus', 'school', 'branch code', 'school code', 'branch name', 'school name', 'campus name', 'branchcode', 'schoolcode']
    };

    const findRowValue = (row: Record<string, any>, candidateKeys: string[]): string => {
      const keys = Object.keys(row);
      for (const cand of candidateKeys) {
        const cleanCand = cand.toLowerCase().replace(/[^a-z0-9]/g, '');
        const matchedKey = keys.find((k) => k.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanCand);
        if (matchedKey && row[matchedKey] !== undefined && String(row[matchedKey]).trim() !== '') {
          return String(row[matchedKey]).trim();
        }
      }
      return '';
    };

    const normalizeDate = (raw: any): string => {
      if (!raw) return '2020-01-01';
      if (typeof raw === 'number') {
        const dateObj = new Date(Math.round((raw - 25569) * 86400 * 1000));
        return !isNaN(dateObj.getTime()) ? dateObj.toISOString().split('T')[0] : '2020-01-01';
      }
      const str = String(raw).trim();
      if (!str) return '2020-01-01';
      // DD/MM/YYYY or DD-MM-YYYY
      const ddmmyyyy = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
      if (ddmmyyyy) {
        const day = ddmmyyyy[1].padStart(2, '0');
        const month = ddmmyyyy[2].padStart(2, '0');
        const year = ddmmyyyy[3];
        return `${year}-${month}-${day}`;
      }
      // YYYY-MM-DD
      const yyyymmdd = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
      if (yyyymmdd) {
        const year = yyyymmdd[1];
        const month = yyyymmdd[2].padStart(2, '0');
        const day = yyyymmdd[3].padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      const parsed = new Date(str);
      return !isNaN(parsed.getTime()) ? parsed.toISOString().split('T')[0] : '2020-01-01';
    };

    const normalizeGender = (raw: string): string => {
      if (!raw) return 'MALE';
      const u = raw.toUpperCase().trim();
      if (u.startsWith('F') || u === 'GIRL' || u === 'WOMAN') return 'FEMALE';
      if (u.startsWith('O')) return 'OTHER';
      return 'MALE';
    };

    const mapped: any[] = [];

    for (const row of rows) {
      let fName = findRowValue(row, ALIASES.firstName);
      let lName = findRowValue(row, ALIASES.lastName);

      if (!fName) {
        const full = findRowValue(row, ALIASES.fullName);
        if (full) {
          const parts = full.split(/\s+/);
          fName = parts[0];
          lName = parts.slice(1).join(' ');
        } else {
          // Fallback: look at first non-empty property in the row
          const firstProp = Object.values(row).find((v) => v !== undefined && String(v).trim() !== '');
          if (firstProp) {
            const parts = String(firstProp).trim().split(/\s+/);
            fName = parts[0];
            lName = parts.slice(1).join(' ');
          }
        }
      }

      if (!fName || fName.trim() === '') continue;

      const rawRoll = findRowValue(row, ALIASES.rollNumber);
      const parsedRoll = rawRoll ? parseInt(rawRoll.replace(/[^\d]/g, ''), 10) : undefined;

      const rowClass = findRowValue(row, ALIASES.className) || targetClass || '';
      const rowSec = findRowValue(row, ALIASES.sectionName) || targetSec || 'A';

      mapped.push({
        firstName: fName.trim(),
        lastName: (lName || '').trim(),
        gender: normalizeGender(findRowValue(row, ALIASES.gender)),
        dateOfBirth: normalizeDate(findRowValue(row, ALIASES.dateOfBirth)),
        bloodGroup: findRowValue(row, ALIASES.bloodGroup) || 'O+',
        phone: findRowValue(row, ALIASES.phone),
        email: findRowValue(row, ALIASES.email),
        parentName: findRowValue(row, ALIASES.parentName),
        parentRelationship: (findRowValue(row, ALIASES.parentRelationship) || 'FATHER').toUpperCase(),
        parentPhone: findRowValue(row, ALIASES.parentPhone) || findRowValue(row, ALIASES.phone),
        className: rowClass,
        sectionName: rowSec,
        rollNumber: parsedRoll && !isNaN(parsedRoll) ? parsedRoll : undefined,
        branch: findRowValue(row, ALIASES.branch)
      });
    }

    return mapped;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(null);
    setUploadedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result;
        const workbook = XLSX.read(buffer, { type: 'array', cellDates: false, raw: false });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          setImportError('No sheets or data found in file');
          return;
        }
        const worksheet = workbook.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });

        if (!rawJson || rawJson.length === 0) {
          setImportError('Spreadsheet contains no data rows');
          return;
        }

        const headers = Object.keys(rawJson[0]);
        setDetectedColumns(headers);
        setRawUploadedRows(rawJson);

        const students = mapRowsToStudents(rawJson, defaultImportClass, defaultImportSection);
        if (students.length === 0) {
          setImportError('No valid student records could be recognized. Please check column headers.');
        } else {
          setParsedStudents(students);
        }
      } catch (err: any) {
        setImportError('Error parsing spreadsheet file: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDefaultClassChange = (newClass: string) => {
    setDefaultImportClass(newClass);
    if (rawUploadedRows.length > 0) {
      const updated = mapRowsToStudents(rawUploadedRows, newClass, defaultImportSection);
      setParsedStudents(updated);
    }
  };

  const handleDefaultSectionChange = (newSec: string) => {
    setDefaultImportSection(newSec);
    if (rawUploadedRows.length > 0) {
      const updated = mapRowsToStudents(rawUploadedRows, defaultImportClass, newSec);
      setParsedStudents(updated);
    }
  };

  const downloadSampleExcel = () => {
    const sampleData = [
      {
        'Roll No': 1,
        'Student Name': 'Rohan Verma',
        'Gender': 'Male',
        'DOB (DD/MM/YYYY)': '14/05/2019',
        'Class': 'Class 1',
        'Section': 'A',
        'Father Name': 'Sunil Verma',
        'Mobile': '+91-98765-43001',
        'Blood Group': 'B+',
        'Email': 'rohan@example.com',
        'Branch': 'REMPS-MAIN'
      },
      {
        'Roll No': 2,
        'Student Name': 'Sanya Kapoor',
        'Gender': 'Female',
        'DOB (DD/MM/YYYY)': '20/08/2019',
        'Class': 'Class 1',
        'Section': 'A',
        'Father Name': 'Anita Kapoor',
        'Mobile': '+91-98765-43002',
        'Blood Group': 'O+',
        'Email': 'sanya@example.com',
        'Branch': 'REMPS-CITY'
      },
      {
        'Roll No': 3,
        'Student Name': 'Aditya Sharma',
        'Gender': 'Male',
        'DOB (DD/MM/YYYY)': '11/02/2019',
        'Class': 'Class 1',
        'Section': 'B',
        'Father Name': 'Rajesh Sharma',
        'Mobile': '+91-98765-43003',
        'Blood Group': 'A+',
        'Email': 'aditya@example.com',
        'Branch': 'REMPS-MAIN'
      }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sampleData);
    XLSX.utils.book_append_sheet(wb, ws, 'Student_List');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rainbow_school_student_import_template.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadSampleCsv = () => {
    const csvContent =
      'Roll No,Student Name,Gender,DOB (DD/MM/YYYY),Class,Section,Father Name,Mobile,Blood Group,Email,Branch\n' +
      '1,Rohan Verma,Male,14/05/2019,Class 1,A,Sunil Verma,+91-98765-43001,B+,rohan@example.com,REMPS-MAIN\n' +
      '2,Sanya Kapoor,Female,20/08/2019,Class 1,A,Anita Kapoor,+91-98765-43002,O+,sanya@example.com,REMPS-CITY\n' +
      '3,Aditya Sharma,Male,11/02/2019,Class 1,B,Rajesh Sharma,+91-98765-43003,A+,aditya@example.com,REMPS-MAIN\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'rainbow_school_student_import_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setGender('MALE');
    setDateOfBirth('2020-01-01');
    setBloodGroup('O+');
    setStudentPhone('');
    setParentName('');
    setParentPhone('');
    setSelectedClassId('');
    setSelectedSectionId('');
    setRollNumber('');
    setFormError(null);
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !selectedSectionId) {
      setFormError('Please select both class and section for enrollment');
      return;
    }

    createStudentMutation.mutate({
      schoolId: admitSchoolId || school?.id,
      firstName,
      lastName,
      gender,
      dateOfBirth,
      bloodGroup,
      phone: studentPhone || parentPhone,
      guardian: {
        firstName: parentName.split(' ')[0] || 'Parent',
        lastName: parentName.split(' ').slice(1).join(' ') || 'Guardian',
        relationship: parentRelationship,
        phone: parentPhone
      },
      enrollment: {
        classId: selectedClassId,
        sectionId: selectedSectionId,
        rollNumber: rollNumber ? Number(rollNumber) : undefined
      }
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Student Information System (SIS)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage student records, guardian contacts, enrollments, and profiles
          </Typography>
        </Box>
        {hasPermission('students.create') && (
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<UploadFileIcon />}
              onClick={() => {
                setImportError(null);
                setImportSuccess(null);
                setParsedStudents([]);
                setOpenImportModal(true);
              }}
              sx={{ borderRadius: 2, fontWeight: 600 }}
            >
              Import from Excel / CSV
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => { setFormError(null); setOpenModal(true); }}
              sx={{ borderRadius: 2, fontWeight: 600 }}
            >
              Admit New Student
            </Button>
          </Stack>
        )}
      </Box>

      {/* Filter Toolbar */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="Search by name, roll no, or admission no..."
            size="small"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            sx={{ width: { xs: '100%', sm: 300 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              )
            }}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filter Class</InputLabel>
            <Select
              value={classFilter}
              label="Filter Class"
              onChange={(e) => { setClassFilter(e.target.value); setPage(0); }}
            >
              <MenuItem value="">All Classes</MenuItem>
              {classes.map((c: any) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {hasMultipleBranches && (
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel>Campus / Branch</InputLabel>
              <Select
                value={selectedBranchFilter}
                label="Campus / Branch"
                onChange={(e) => { setSelectedBranchFilter(e.target.value); setPage(0); }}
              >
                <MenuItem value="ALL">All Branches (Consolidated)</MenuItem>
                {availableSchools?.map((s: any) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
              <MenuItem value="TRANSFERRED">Transferred</MenuItem>
              <MenuItem value="GRADUATED">Graduated</MenuItem>
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {/* Students Data Table */}
      <Card sx={{ borderRadius: 3 }}>
        {isLoading ? (
          <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress /></Box>
        ) : error ? (
          <Alert severity="error" sx={{ m: 2 }}>Error loading students list.</Alert>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Student</TableCell>
                    {hasMultipleBranches && (
                      <TableCell sx={{ fontWeight: 600 }}>Campus / Branch</TableCell>
                    )}
                    <TableCell sx={{ fontWeight: 600 }}>Admission No</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Class & Section</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Roll No</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Gender</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Guardian / Contact</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={hasMultipleBranches ? 9 : 8} sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
                        No student records found matching filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    students.map((s: any) => {
                      const guardianInfo = s.guardians?.[0]?.guardian;
                      const enrollment = s.currentEnrollment;
                      return (
                        <TableRow key={s.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar sx={{ bgcolor: 'primary.light', width: 38, height: 38, fontSize: '0.9rem', fontWeight: 600 }}>
                                {s.firstName?.[0]}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={600}>
                                  {s.firstName} {s.lastName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  DOB: {new Date(s.dateOfBirth).toLocaleDateString()}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          {hasMultipleBranches && (
                            <TableCell>
                              <Chip
                                label={s.school?.code || s.school?.name || (s.schoolId ? (availableSchools?.find((sch: any) => sch.id === s.schoolId)?.code || 'REMPS') : 'REMPS-MAIN')}
                                size="small"
                                variant="outlined"
                                color={s.school?.code?.includes('CITY') ? 'secondary' : 'primary'}
                                sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                              />
                            </TableCell>
                          )}
                          <TableCell>
                            <Chip label={s.admissionNumber} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                          </TableCell>
                          <TableCell>
                            {enrollment ? (
                              <Chip
                                label={`${enrollment.class?.name || 'Class'} - ${enrollment.section?.name || 'A'}`}
                                size="small"
                                color="primary"
                                sx={{ fontWeight: 600 }}
                              />
                            ) : (
                              <Typography variant="caption" color="text.secondary">Not Enrolled</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {enrollment?.rollNumber !== null && enrollment?.rollNumber !== undefined ? enrollment.rollNumber : '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{s.gender}</Typography>
                          </TableCell>
                          <TableCell>
                            {guardianInfo ? (
                              <Box>
                                <Typography variant="body2" fontWeight={500}>
                                  {guardianInfo.firstName} {guardianInfo.lastName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {guardianInfo.phone}
                                </Typography>
                              </Box>
                            ) : (
                              <Typography variant="caption" color="text.secondary">-</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={s.status} />
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<ViewIcon />}
                              onClick={() => navigate(`/students/${s.id}`)}
                            >
                              360 View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={totalItems}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </>
        )}
      </Card>

      {/* Admit New Student Dialog */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Admit New Student — Rainbow English Medium Primary School
        </DialogTitle>
        <Box component="form" onSubmit={handleCreateStudent}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {formError && <Alert severity="error">{formError}</Alert>}

            {/* Admission No Badge */}
            <Box sx={{ p: 1.5, bgcolor: '#eff6ff', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="primary" fontWeight={600}>
                Assigned Admission Number:
              </Typography>
              <Chip label={admissionNoData?.admissionNumber || admissionNoData?.data?.admissionNumber || 'Auto-Generating...'} color="primary" sx={{ fontWeight: 700 }} />
            </Box>

            {/* Campus / Branch Selection */}
            {hasMultipleBranches && (
              <Box>
                <FormControl size="small" fullWidth required>
                  <InputLabel>Admit to Campus / Branch</InputLabel>
                  <Select
                    value={admitSchoolId}
                    label="Admit to Campus / Branch"
                    onChange={(e) => {
                      setAdmitSchoolId(e.target.value);
                      setSelectedClassId('');
                      setSelectedSectionId('');
                    }}
                  >
                    {availableSchools?.map((s: any) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}

            {/* Student Personal Info */}
            <Typography variant="subtitle2" fontWeight={700} color="text.primary">
              1. Student Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="First Name"
                  size="small"
                  fullWidth
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Last Name"
                  size="small"
                  fullWidth
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl size="small" fullWidth required>
                  <InputLabel>Gender</InputLabel>
                  <Select value={gender} label="Gender" onChange={(e) => setGender(e.target.value)}>
                    <MenuItem value="MALE">Male</MenuItem>
                    <MenuItem value="FEMALE">Female</MenuItem>
                    <MenuItem value="OTHER">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Date of Birth"
                  type="date"
                  size="small"
                  fullWidth
                  required
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Blood Group</InputLabel>
                  <Select value={bloodGroup} label="Blood Group" onChange={(e) => setBloodGroup(e.target.value)}>
                    <MenuItem value="A+">A+</MenuItem>
                    <MenuItem value="A-">A-</MenuItem>
                    <MenuItem value="B+">B+</MenuItem>
                    <MenuItem value="B-">B-</MenuItem>
                    <MenuItem value="O+">O+</MenuItem>
                    <MenuItem value="O-">O-</MenuItem>
                    <MenuItem value="AB+">AB+</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Divider />

            {/* Guardian Info */}
            <Typography variant="subtitle2" fontWeight={700} color="text.primary">
              2. Parent / Guardian Contact
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={5}>
                <TextField
                  label="Parent / Guardian Name"
                  size="small"
                  fullWidth
                  required
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Contact Phone"
                  size="small"
                  fullWidth
                  required
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl size="small" fullWidth required>
                  <InputLabel>Relation</InputLabel>
                  <Select
                    value={parentRelationship}
                    label="Relation"
                    onChange={(e) => setParentRelationship(e.target.value)}
                  >
                    <MenuItem value="FATHER">Father</MenuItem>
                    <MenuItem value="MOTHER">Mother</MenuItem>
                    <MenuItem value="GUARDIAN">Legal Guardian</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Divider />

            {/* Academic Enrollment */}
            <Typography variant="subtitle2" fontWeight={700} color="text.primary">
              3. Class & Section Enrollment
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={5}>
                <FormControl size="small" fullWidth required>
                  <InputLabel>Enroll in Class</InputLabel>
                  <Select
                    value={selectedClassId}
                    label="Enroll in Class"
                    onChange={(e) => {
                      setSelectedClassId(e.target.value);
                      setSelectedSectionId('');
                    }}
                  >
                    {classes.map((c: any) => (
                      <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl size="small" fullWidth required disabled={!selectedClassId}>
                  <InputLabel>Section</InputLabel>
                  <Select
                    value={selectedSectionId}
                    label="Section"
                    onChange={(e) => setSelectedSectionId(e.target.value)}
                  >
                    {availableSections.map((sec: any) => (
                      <MenuItem key={sec.id} value={sec.id}>
                        Section {sec.name} ({sec._count?.studentEnrollments || 0}/{sec.capacity})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  label="Roll Number"
                  type="number"
                  size="small"
                  fullWidth
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setOpenModal(false)} color="inherit">Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createStudentMutation.isPending}
              sx={{ fontWeight: 600 }}
            >
              {createStudentMutation.isPending ? <CircularProgress size={24} /> : 'Complete Admission'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Excel / CSV Bulk Import Dialog */}
      <Dialog
        open={openImportModal}
        onClose={() => setOpenImportModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <UploadFileIcon color="primary" /> Bulk Import Students (Excel / CSV)
        </DialogTitle>
        <DialogContent dividers>
          {importError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setImportError(null)}>
              {importError}
            </Alert>
          )}

          {importSuccess && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setImportSuccess(null)}>
              {importSuccess}
            </Alert>
          )}

          {/* Step 1: Template Download */}
          <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'background.default', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" fontWeight={700}>
                  Step 1: Download Standard Spreadsheet Templates
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Use our formatted templates with recognized headers (Roll No, Student Name, Gender, DOB, Class, Section, Father Name, Mobile).
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  startIcon={<TableChartIcon />}
                  onClick={downloadSampleExcel}
                >
                  Download Excel (.xlsx)
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={downloadSampleCsv}
                >
                  Download CSV (.csv)
                </Button>
              </Stack>
            </Box>
          </Paper>

          {/* Step 2: Upload File & Batch Settings */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              Step 2: Choose Spreadsheet File & Fallback Class Settings
            </Typography>

            {hasMultipleBranches && (
              <Box sx={{ mb: 2 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Target Campus / Branch</InputLabel>
                  <Select
                    value={importTargetSchoolId}
                    label="Target Campus / Branch"
                    onChange={(e) => setImportTargetSchoolId(e.target.value)}
                  >
                    {availableSchools?.map((s: any) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  * If your file includes a "Branch" or "Campus" column (e.g. REMPS-MAIN, REMPS-CITY), students will be automatically routed to that campus.
                </Typography>
              </Box>
            )}

            <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <Grid item xs={12} sm={5}>
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<UploadFileIcon />}
                  fullWidth
                  sx={{ py: 1 }}
                >
                  Choose Excel / CSV File
                  <input
                    type="file"
                    hidden
                    accept=".csv,.xlsx,.xls,.tsv,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={handleFileUpload}
                  />
                </Button>
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Target Class (Fallback)</InputLabel>
                  <Select
                    value={defaultImportClass}
                    label="Target Class (Fallback)"
                    onChange={(e) => handleDefaultClassChange(e.target.value)}
                  >
                    <MenuItem value="">— Use Class From File —</MenuItem>
                    {classes.map((c: any) => (
                      <MenuItem key={c.id} value={c.name}>{c.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={3}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Section (Fallback)</InputLabel>
                  <Select
                    value={defaultImportSection}
                    label="Section (Fallback)"
                    onChange={(e) => handleDefaultSectionChange(e.target.value)}
                  >
                    {['A', 'B', 'C', 'D'].map((s) => (
                      <MenuItem key={s} value={s}>Section {s}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {uploadedFileName && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <Typography variant="caption" color="text.secondary">Selected file:</Typography>
                <Chip label={uploadedFileName} size="small" color="primary" variant="outlined" />
              </Box>
            )}

            {detectedColumns.length > 0 && (
              <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#f8fafc', borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
                <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" gutterBottom>
                  Detected Columns in File ({detectedColumns.length}):
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {detectedColumns.map((col, idx) => (
                    <Chip key={idx} label={col} size="small" sx={{ fontSize: '0.75rem' }} />
                  ))}
                </Box>
              </Box>
            )}
          </Box>

          {/* Step 3: Parsed Preview */}
          {parsedStudents.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={700}>
                  Step 3: Preview Students to Import ({parsedStudents.length} Students Recognized)
                </Typography>
                <Chip
                  label="Ready for Import"
                  color="success"
                  size="small"
                  icon={<SuccessIcon />}
                />
              </Box>

              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300, borderRadius: 2 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Student Name</TableCell>
                      {hasMultipleBranches && <TableCell>Branch</TableCell>}
                      <TableCell>Roll No</TableCell>
                      <TableCell>Class & Section</TableCell>
                      <TableCell>Gender</TableCell>
                      <TableCell>DOB (YYYY-MM-DD)</TableCell>
                      <TableCell>Parent Details</TableCell>
                      <TableCell>Contact</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {parsedStudents.map((st, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {st.firstName} {st.lastName}
                        </TableCell>
                        {hasMultipleBranches && (
                          <TableCell>
                            <Chip
                              label={
                                st.branch ||
                                (availableSchools?.find((s: any) => s.id === importTargetSchoolId)?.code || 'Selected Branch')
                              }
                              size="small"
                              variant="outlined"
                              color={st.branch?.includes('CITY') ? 'secondary' : 'primary'}
                            />
                          </TableCell>
                        )}
                        <TableCell>{st.rollNumber ? `#${st.rollNumber}` : '—'}</TableCell>
                        <TableCell>
                          <Chip
                            label={`${st.className || 'Class'} - ${st.sectionName || 'A'}`}
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                        </TableCell>
                        <TableCell>{st.gender}</TableCell>
                        <TableCell>{st.dateOfBirth}</TableCell>
                        <TableCell>{st.parentName || 'Parent'}</TableCell>
                        <TableCell>{st.parentPhone || st.phone || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenImportModal(false)} color="inherit">
            Close
          </Button>
          <Button
            variant="contained"
            color="primary"
            disabled={parsedStudents.length === 0 || bulkImportMutation.isPending}
            onClick={() =>
              bulkImportMutation.mutate({
                students: parsedStudents,
                targetSchoolId: importTargetSchoolId || undefined
              })
            }
            sx={{ fontWeight: 600 }}
          >
            {bulkImportMutation.isPending ? (
              <CircularProgress size={24} />
            ) : (
              `Import ${parsedStudents.length} Students`
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
