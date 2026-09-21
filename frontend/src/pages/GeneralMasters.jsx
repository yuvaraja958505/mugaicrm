import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
} from '@mui/material';
import {
  Domain as DomainIcon,
  Build as ServiceIcon,
  Public as CountryIcon,
  Map as StateIcon,
  LocationCity as CityIcon,
  Badge as RoleIcon,
  East as ArrowIcon,
  FolderSpecial as HubIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function GeneralMasters() {
  const navigate = useNavigate();

  const masterCards = [
    {
      title: 'Business Domain',
      path: '/masters/domains',
      description: 'Manage business domains & sectors',
      icon: <DomainIcon sx={{ fontSize: 20 }} />,
      iconBg: '#e0e7ff',
      iconColor: '#3730a3',
      arrowBg: '#f0f4ff',
      arrowColor: '#4338ca',
    },
    {
      title: 'Services',
      path: '/masters/services',
      description: 'Services & offerings catalog',
      icon: <ServiceIcon sx={{ fontSize: 20 }} />,
      iconBg: '#fce7f3',
      iconColor: '#9d174d',
      arrowBg: '#fdf2f8',
      arrowColor: '#be185d',
    },
    {
      title: 'Country',
      path: '/masters/countries',
      description: 'Countries & ISO codes',
      icon: <CountryIcon sx={{ fontSize: 20 }} />,
      iconBg: '#dcfce7',
      iconColor: '#166534',
      arrowBg: '#f0fdf4',
      arrowColor: '#15803d',
    },
    {
      title: 'State',
      path: '/masters/states',
      description: 'States & UT codes',
      icon: <StateIcon sx={{ fontSize: 20 }} />,
      iconBg: '#fef3c7',
      iconColor: '#92400e',
      arrowBg: '#fffbeb',
      arrowColor: '#b45309',
    },
    {
      title: 'City Master',
      path: '/masters/cities',
      description: 'Cities linked to States',
      icon: <CityIcon sx={{ fontSize: 20 }} />,
      iconBg: '#e0f2fe',
      iconColor: '#075985',
      arrowBg: '#f0f9ff',
      arrowColor: '#0369a1',
    },
    {
      title: 'User Roles',
      path: '/masters/roles',
      description: 'System roles & permissions',
      icon: <RoleIcon sx={{ fontSize: 20 }} />,
      iconBg: '#fae8ff',
      iconColor: '#6b21a8',
      arrowBg: '#fdf4ff',
      arrowColor: '#7e22ce',
    },
  ];

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
          General Masters
        </Typography>
      </Box>

      {/* CSS Grid guaranteeing 4 cards in Row 1 and 2 cards in Row 2 */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 2.5,
        }}
      >
        {masterCards.map((card) => (
          <Card
            key={card.title}
            sx={{
              borderRadius: '14px',
              border: '1px solid #f1f5f9',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
              bgcolor: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 8px 24px rgba(12, 31, 84, 0.08)',
                borderColor: '#cbd5e1',
                '& .card-arrow': {
                  bgcolor: card.iconBg,
                  transform: 'translateX(2px)',
                },
              },
            }}
            onClick={() => navigate(card.path)}
          >
            <CardContent sx={{ p: 2.2, '&:last-child': { pb: 2.2 } }}>
              {/* Top Row: Left Icon Box & Right Soft Circular Arrow */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: '10px',
                    bgcolor: card.iconBg,
                    color: card.iconColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {card.icon}
                </Box>

                <Box
                  className="card-arrow"
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    bgcolor: card.arrowBg,
                    color: card.arrowColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <ArrowIcon sx={{ fontSize: 14 }} />
                </Box>
              </Box>

              {/* Bottom Row: Title & Subtitle */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem', lineHeight: 1.2 }}>
                  {card.title}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.73rem', display: 'block', mt: 0.4 }}>
                  {card.description}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
