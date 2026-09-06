import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Chip,
  Stack,
  Divider,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  School as SchoolIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CheckCircle as CheckIcon,
  Login as LoginIcon,
  AutoStories as BookIcon,
  SportsSoccer as SportsIcon,
  Computer as ComputerIcon,
  Palette as ArtIcon,
  Security as SecurityIcon,
  AssignmentTurnedIn as AttendanceIcon,
  ReceiptLong as FeeIcon,
  ArrowForward as ArrowIcon,
  Apartment as CampusIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCampusTab, setSelectedCampusTab] = useState(0);

  const campuses = [
    {
      id: 'main',
      name: 'Main Campus (Central Campus)',
      code: 'REMPS-MAIN',
      tagline: 'Expansive Campus with Sports Grounds & Science Laboratories',
      address: 'Main Road Campus, Rainbow English Medium Primary School Area',
      phone: '+91-98765-43210',
      email: 'main.campus@rainbowschool.edu',
      grades: 'Nursery to Class 5 (Pre-Primary & Primary)',
      facilities: [
        'Expansive outdoor playground and athletics field',
        'Fully equipped Science & Environmental Studies laboratories',
        'Modern Computer Basics practical laboratory',
        'Dedicated Activity and Art & Craft Studio',
        'Complete Pre-Primary Montessori play area'
      ],
      headmaster: 'Govind Reddy (Senior Coordinator)',
      capacity: '800+ Students'
    },
    {
      id: 'city',
      name: 'City Campus (Urban Center)',
      code: 'REMPS-CITY',
      tagline: 'Modern Smart Classrooms & High-Tech Learning Facilities',
      address: 'City Center Urban Wing, Rainbow English Medium Primary School',
      phone: '+91-98765-66778',
      email: 'city.campus@rainbowschool.edu',
      grades: 'Nursery to Class 5 (Pre-Primary & Primary)',
      facilities: [
        'Multimedia smart classrooms with digital learning boards',
        'High-speed Computer Technology laboratory',
        'Indoor activity arena, performing arts, and martial arts zone',
        'Interactive Library and story-telling amphitheater',
        'Climate-controlled Pre-Primary activity rooms'
      ],
      headmaster: 'Rajesh Kumar (Campus Coordinator)',
      capacity: '700+ Students'
    }
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* Top Header Navigation */}
      <Box
        component="header"
        sx={{
          bgcolor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          position: 'sticky',
          top: 0,
          zIndex: 1100
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar
                sx={{
                  bgcolor: 'primary.main',
                  width: 44,
                  height: 44,
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              >
                <SchoolIcon fontSize="medium" />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={800} color="primary.main" sx={{ lineHeight: 1.2 }}>
                  Rainbow English Medium Primary School
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  Affiliated Primary Institution &bull; Main & City Campuses
                </Typography>
              </Box>
            </Box>

            <Stack direction="row" spacing={2} alignItems="center">
              <Button
                variant="contained"
                color="primary"
                startIcon={<LoginIcon />}
                onClick={() => navigate('/login')}
                sx={{ borderRadius: 2, fontWeight: 700, px: 2.5 }}
              >
                Admin & Staff Login
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: '#ffffff',
          pt: { xs: 6, md: 10 },
          pb: { xs: 6, md: 10 },
          borderBottom: '1px solid #e2e8f0',
          background: 'linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)'
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Chip
                label="Multi-Campus Primary Education Excellence"
                color="success"
                size="small"
                icon={<CampusIcon />}
                sx={{ mb: 2, fontWeight: 700 }}
              />
              <Typography
                variant="h3"
                component="h1"
                fontWeight={800}
                sx={{
                  fontSize: { xs: '2rem', md: '2.75rem' },
                  color: '#0f172a',
                  lineHeight: 1.2,
                  mb: 2.5
                }}
              >
                Nurturing Young Minds Across Our Two Premier Campuses
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem', mb: 4, lineHeight: 1.7 }}>
                Welcome to <strong>Rainbow English Medium Primary School</strong>. Offering world-class
                curriculum, smart digital infrastructure, and foundational learning from Nursery to
                Class 5 across our state-of-the-art <strong>Main Campus</strong> and <strong>City Campus</strong>.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<LoginIcon />}
                  onClick={() => navigate('/login')}
                  sx={{ borderRadius: 2, fontWeight: 700, px: 3, py: 1.5 }}
                >
                  Enter Staff Portal
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  size="large"
                  onClick={() => {
                    document.getElementById('campuses-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  sx={{ borderRadius: 2, fontWeight: 600, px: 3, py: 1.5 }}
                >
                  Explore Campuses & Branches
                </Button>
              </Stack>
            </Grid>

            <Grid item xs={12} md={5}>
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  bgcolor: '#ffffff',
                  border: '1px solid #e2e8f0'
                }}
              >
                <Typography variant="h6" fontWeight={700} gutterBottom color="primary">
                  School Branches Overview
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Select your campus below to view branch details or enter the corresponding management portal.
                </Typography>

                <Stack spacing={2}>
                  {campuses.map((c) => (
                    <Card
                      key={c.id}
                      variant="outlined"
                      sx={{
                        borderRadius: 2,
                        p: 1.5,
                        borderColor: 'primary.light',
                        '&:hover': { bgcolor: '#f8fafc', cursor: 'pointer' }
                      }}
                      onClick={() => navigate('/login')}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={700}>
                            {c.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Code: {c.code} &bull; Capacity: {c.capacity}
                          </Typography>
                        </Box>
                        <ArrowIcon color="primary" fontSize="small" />
                      </Box>
                    </Card>
                  ))}
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Campuses Tabbed Showcase */}
      <Container maxWidth="lg" id="campuses-section" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Typography variant="overline" fontWeight={700} color="primary">
            Branch Showcase
          </Typography>
          <Typography variant="h4" fontWeight={800} color="#0f172a">
            Our Two Campuses
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 650, mx: 'auto', mt: 1 }}>
            Both branches feature dedicated primary academic departments, unified curriculum standards, and independent modern learning amenities.
          </Typography>
        </Box>

        {/* Campus Tabs */}
        <Paper elevation={1} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          <Tabs
            value={selectedCampusTab}
            onChange={(_, val) => setSelectedCampusTab(val)}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
            sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}
          >
            <Tab
              icon={<CampusIcon />}
              iconPosition="start"
              label="Branch 1: Main Campus (Central)"
              sx={{ fontWeight: 700, py: 2 }}
            />
            <Tab
              icon={<CampusIcon />}
              iconPosition="start"
              label="Branch 2: City Campus (Urban Wing)"
              sx={{ fontWeight: 700, py: 2 }}
            />
          </Tabs>

          <Box sx={{ p: { xs: 3, md: 5 } }}>
            {campuses.map((campus, idx) => (
              <Box key={campus.id} role="tabpanel" hidden={selectedCampusTab !== idx}>
                {selectedCampusTab === idx && (
                  <Grid container spacing={4}>
                    <Grid item xs={12} md={7}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1.5 }}>
                        <Chip label={campus.code} color="primary" size="small" sx={{ fontWeight: 700 }} />
                        <Chip label={campus.grades} variant="outlined" size="small" />
                      </Box>
                      <Typography variant="h5" fontWeight={800} gutterBottom color="#0f172a">
                        {campus.name}
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        {campus.tagline}
                      </Typography>

                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                        Campus Facilities & Key Amenities:
                      </Typography>
                      <List dense>
                        {campus.facilities.map((fac, fIdx) => (
                          <ListItem key={fIdx} sx={{ px: 0, py: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 30 }}>
                              <CheckIcon color="success" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={fac} />
                          </ListItem>
                        ))}
                      </List>
                    </Grid>

                    <Grid item xs={12} md={5}>
                      <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: '#f8fafc', p: 2.5 }}>
                        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                          Branch Contact & Leadership
                        </Typography>
                        <Divider sx={{ my: 1.5 }} />

                        <Stack spacing={2}>
                          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                            <LocationIcon color="action" sx={{ mt: 0.2 }} />
                            <Box>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Address
                              </Typography>
                              <Typography variant="body2" fontWeight={600}>
                                {campus.address}
                              </Typography>
                            </Box>
                          </Box>

                          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                            <PhoneIcon color="action" />
                            <Box>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Phone
                              </Typography>
                              <Typography variant="body2" fontWeight={600}>
                                {campus.phone}
                              </Typography>
                            </Box>
                          </Box>

                          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                            <EmailIcon color="action" />
                            <Box>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Email
                              </Typography>
                              <Typography variant="body2" fontWeight={600}>
                                {campus.email}
                              </Typography>
                            </Box>
                          </Box>

                          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                            <SchoolIcon color="action" />
                            <Box>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Campus Head
                              </Typography>
                              <Typography variant="body2" fontWeight={600}>
                                {campus.headmaster}
                              </Typography>
                            </Box>
                          </Box>
                        </Stack>

                        <Button
                          fullWidth
                          variant="contained"
                          color="primary"
                          startIcon={<LoginIcon />}
                          onClick={() => navigate('/login')}
                          sx={{ mt: 3, fontWeight: 700, py: 1 }}
                        >
                          Login to {campus.name.split(' (')[0]}
                        </Button>
                      </Card>
                    </Grid>
                  </Grid>
                )}
              </Box>
            ))}
          </Box>
        </Paper>
      </Container>

      {/* Primary Academic Programs */}
      <Box sx={{ bgcolor: '#ffffff', py: 8, borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="overline" fontWeight={700} color="primary">
              Curriculum & Programs
            </Typography>
            <Typography variant="h4" fontWeight={800} color="#0f172a">
              Academic Excellence in Both Campuses
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined" sx={{ height: '100%', borderRadius: 3, p: 1 }}>
                <CardContent>
                  <Avatar sx={{ bgcolor: 'info.light', color: 'info.dark', mb: 2 }}>
                    <BookIcon />
                  </Avatar>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Pre-Primary Wing
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Nursery, LKG, and UKG programs fostering early numeracy, phonics, motor skills, and sensory exploration.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined" sx={{ height: '100%', borderRadius: 3, p: 1 }}>
                <CardContent>
                  <Avatar sx={{ bgcolor: 'success.light', color: 'success.dark', mb: 2 }}>
                    <SchoolIcon />
                  </Avatar>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Primary Wing (1 to 5)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Core foundational curriculum: English Language, Mathematics, General Science, EVS, and Social Studies.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined" sx={{ height: '100%', borderRadius: 3, p: 1 }}>
                <CardContent>
                  <Avatar sx={{ bgcolor: 'warning.light', color: 'warning.dark', mb: 2 }}>
                    <ComputerIcon />
                  </Avatar>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Computer & Digital
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Hands-on practical computer basics, logical thinking, and introductory technology concepts.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined" sx={{ height: '100%', borderRadius: 3, p: 1 }}>
                <CardContent>
                  <Avatar sx={{ bgcolor: 'secondary.light', color: 'secondary.dark', mb: 2 }}>
                    <SportsIcon />
                  </Avatar>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Sports & Arts
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Holistic physical education, yoga, team sports, creative art & craft, and cultural performances.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Unified ERP Portal Capabilities */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="overline" fontWeight={700} color="primary">
            Enterprise School ERP
          </Typography>
          <Typography variant="h4" fontWeight={800} color="#0f172a">
            Centralized Digital Operations
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Seamless multi-branch administration powered by secure role-based permissions.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.dark' }}>
                <AttendanceIcon />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  Smart Attendance Engine
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Daily classroom roster, fast present marking, lock & freeze protection, and automated parent alerts.
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <Avatar sx={{ bgcolor: 'success.light', color: 'success.dark' }}>
                <SchoolIcon />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  Student 360 & SIS
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Comprehensive student profiles, guardian linkages, pickup authorization flags, and Excel/CSV bulk import.
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <Avatar sx={{ bgcolor: 'secondary.light', color: 'secondary.dark' }}>
                <SecurityIcon />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  Multi-Branch Security
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Row-level data isolation with on-the-fly branch switching for administrators across both campuses.
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Footer */}
      <Box sx={{ bgcolor: '#0f172a', color: '#94a3b8', py: 6 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" color="#ffffff" fontWeight={800} gutterBottom>
                Rainbow English Medium Primary School
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Providing foundational education from Nursery to Class 5 across our Main Campus and City Campus.
              </Typography>
              <Typography variant="caption" display="block">
                School Codes: <strong>REMPS-MAIN</strong> &bull; <strong>REMPS-CITY</strong>
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="subtitle2" color="#ffffff" fontWeight={700} gutterBottom>
                Main Campus
              </Typography>
              <Typography variant="body2">Main Road Campus, Area</Typography>
              <Typography variant="body2">Phone: +91-98765-43210</Typography>
              <Typography variant="body2">main.campus@rainbowschool.edu</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="subtitle2" color="#ffffff" fontWeight={700} gutterBottom>
                City Campus
              </Typography>
              <Typography variant="body2">City Center Urban Wing</Typography>
              <Typography variant="body2">Phone: +91-98765-66778</Typography>
              <Typography variant="body2">city.campus@rainbowschool.edu</Typography>
            </Grid>
          </Grid>
          <Divider sx={{ my: 4, borderColor: '#1e293b' }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="caption">
              &copy; 2026 Rainbow English Medium Primary School. All rights reserved.
            </Typography>
            <Button
              variant="text"
              color="inherit"
              size="small"
              onClick={() => navigate('/login')}
              sx={{ color: '#38bdf8' }}
            >
              Staff Portal Login &rarr;
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};
