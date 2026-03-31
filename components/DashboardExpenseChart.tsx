import React from 'react';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import IconDisplay from './IconDisplay';
import { useTheme } from '../contexts/ThemeContext';

type ExpenseChartItem = {
  name: string;
  value: number;
  color: string;
  icon: string;
};

interface DashboardExpenseChartProps {
  expenseByCategory: ExpenseChartItem[];
  totalExpense: number;
}

const formatRp = (value: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

const DashboardExpenseChart: React.FC<DashboardExpenseChartProps> = ({ expenseByCategory, totalExpense }) => {
  const { theme } = useTheme();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ height: 240, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={expenseByCategory}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={90}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
              isAnimationActive={false}
            >
              {expenseByCategory.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <RechartsTooltip
              formatter={(value: number) => formatRp(value)}
              contentStyle={{
                borderRadius: 12,
                border: 'none',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                backgroundColor: theme.colors.bgCard,
                color: theme.colors.textPrimary,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <Typography variant="caption" color="text.secondary" textTransform="uppercase" fontWeight={600} letterSpacing={1}>
            Total Keluar
          </Typography>
          <Typography variant="h6" fontWeight={800}>{formatRp(totalExpense)}</Typography>
        </Box>
      </Box>

      <List disablePadding>
        {expenseByCategory.slice(0, 4).map((item, idx, arr) => (
          <React.Fragment key={item.name}>
            <ListItem disableGutters sx={{ py: 1.5 }}>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: item.color, width: 36, height: 36 }}>
                  <IconDisplay name={item.icon} size={18} sx={{ color: '#fff' }} />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={<Typography variant="subtitle2" fontWeight={700}>{item.name}</Typography>}
                secondary={<Typography variant="caption" color="text.secondary">{((item.value / totalExpense) * 100).toFixed(1)}%</Typography>}
              />
              <Typography variant="subtitle2" fontWeight={700}>{formatRp(item.value)}</Typography>
            </ListItem>
            {idx < arr.length - 1 && <Divider component="li" />}
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
};

export default DashboardExpenseChart;
