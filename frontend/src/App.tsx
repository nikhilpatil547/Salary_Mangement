import { AppShell, Group, NavLink, Text, ThemeIcon, Title } from '@mantine/core'
import { IconAlertTriangle, IconChartBar, IconCoin, IconUsers } from '@tabler/icons-react'
import { Navigate, NavLink as RouterLink, Route, Routes, useLocation } from 'react-router-dom'
import { EmployeePage } from './pages/EmployeePage'
import { EmployeesPage } from './pages/EmployeesPage'
import { InsightsPage } from './pages/InsightsPage'
import { OutliersPage } from './pages/OutliersPage'

const NAV = [
  { to: '/employees', label: 'Employees', icon: IconUsers },
  { to: '/insights', label: 'Pay insights', icon: IconChartBar },
  { to: '/outliers', label: 'Pay outliers', icon: IconAlertTriangle },
]

export function App() {
  const { pathname } = useLocation()

  return (
    <AppShell header={{ height: 56 }} navbar={{ width: 220, breakpoint: 'sm' }} padding="lg">
      <AppShell.Header px="lg">
        <Group h="100%" gap="sm">
          <ThemeIcon variant="light" size="lg"><IconCoin size={20} /></ThemeIcon>
          <Title order={4}>ACME Salary Management</Title>
          <Text c="dimmed" size="sm" visibleFrom="sm">HR</Text>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="sm">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} component={RouterLink} to={to} label={label}
            leftSection={<Icon size={18} />} active={pathname.startsWith(to)} />
        ))}
      </AppShell.Navbar>
      <AppShell.Main>
        <Routes>
          <Route path="/" element={<Navigate to="/employees" replace />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/employees/:id" element={<EmployeePage />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/outliers" element={<OutliersPage />} />
          <Route path="*" element={<Navigate to="/employees" replace />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  )
}
