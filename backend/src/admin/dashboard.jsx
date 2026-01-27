import React from 'react';
import { Box, H2, Text, Button, Icon } from '@adminjs/design-system';
import styled from 'styled-components';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// --- Styled Components for Layout ---
const Container = styled(Box)`
  padding: 20px;
`;

const CardGrid = styled(Box)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatCard = styled(Box)`
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
  border-left: 5px solid ${props => props.color || '#4f46e5'};
`;

const GraphCard = styled(Box)`
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
  height: 400px;
  margin-bottom: 30px;
`;

const ButtonGrid = styled(Box)`
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
`;

// --- MAIN COMPONENT ---
const Dashboard = (props) => {
  const { studentsCount, teachersCount, totalFeePending, totalFeeCollected } = props.data;

  // Data for the Graph
  const graphData = [
    { name: 'Collected', amount: totalFeeCollected, fill: '#10b981' },
    { name: 'Pending', amount: totalFeePending, fill: '#f59e0b' },
  ];

  return (
    <Container>
      <Box mb="xl">
        <H2>🏫 School Overview</H2>
        <Text>Welcome back, Admin. Here is what's happening today.</Text>
      </Box>

      {/* 1. STATS CARDS */}
      <CardGrid>
        <StatCard color="#4f46e5">
          <Text variant="sm">Total Students</Text>
          <H2>{studentsCount}</H2>
        </StatCard>
        <StatCard color="#ec4899">
          <Text variant="sm">Total Teachers</Text>
          <H2>{teachersCount}</H2>
        </StatCard>
        <StatCard color="#f59e0b">
          <Text variant="sm">Fees Pending</Text>
          <H2>₹{totalFeePending.toLocaleString()}</H2>
        </StatCard>
      </CardGrid>

      {/* 2. FEE GRAPH */}
      <GraphCard>
        <H2>Fee Collection Status</H2>
        <ResponsiveContainer width="100%" height="80%">
          <BarChart data={graphData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="amount" radius={[5, 5, 0, 0]} barSize={60} />
          </BarChart>
        </ResponsiveContainer>
      </GraphCard>

      {/* 3. QUICK LINKS */}
      <Box>
        <H2>Quick Actions</H2>
        <ButtonGrid>
          <Button 
            variant="primary" 
            size="lg" 
            onClick={() => window.location.href='/admin/resources/Student'}
          >
            <Icon icon="User" /> Manage Students
          </Button>
          
          <Button 
            variant="primary" 
            size="lg" 
            onClick={() => window.location.href='/admin/resources/Fee'}
          >
            <Icon icon="DollarSign" /> Manage Fees
          </Button>

          <Button 
            variant="outlined" 
            size="lg" 
            onClick={() => window.location.href='/admin/resources/Assignment'}
          >
            <Icon icon="Book" /> Check Assignments
          </Button>
        </ButtonGrid>
      </Box>
    </Container>
  );
};

export default Dashboard;