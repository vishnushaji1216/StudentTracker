import AdminJS from 'adminjs';
import AdminJSExpress from '@adminjs/express';
import * as AdminJSMongoose from '@adminjs/mongoose';

// Import the Component Loader we created
import { componentLoader, Components } from './admin/component-loader.js';

// Import Models
import Student from './models/student.model.js';
import Teacher from './models/teacher.model.js';
import Fee from './models/fee.model.js';
import Syllabus from './models/syllabus.model.js';
import Assignment from './models/assignment.model.js';

AdminJS.registerAdapter(AdminJSMongoose);

export const setupAdmin = (app) => {
  const admin = new AdminJS({
    resources: [
      {
        resource: Student,
        options: {
          navigation: { name: 'School Database', icon: 'User' },
          listProperties: ['name', 'rollNo', 'className', 'mobile', 'isFeeLocked'],
          filterProperties: ['name', 'className', 'mobile', 'isFeeLocked'],
          editProperties: ['name', 'rollNo', 'className', 'mobile', 'password', 'isFeeLocked', 'stats'],
        }
      },
      {
        resource: Teacher,
        options: {
          navigation: { name: 'School Database', icon: 'Briefcase' },
          listProperties: ['name', 'teacherCode', 'classTeachership'],
        }
      },
      {
        resource: Fee,
        options: {
          navigation: { name: 'Finance', icon: 'DollarSign' },
          listProperties: ['student', 'title', 'totalAmount', 'remainingAmount', 'status', 'dueDate'],
          filterProperties: ['status', 'className', 'dueDate'],
          editProperties: ['student', 'className', 'title', 'totalAmount', 'paidAmount', 'dueDate', 'remarks'],
        }
      },
      { resource: Syllabus, options: { navigation: 'Academic' } },
      { resource: Assignment, options: { navigation: 'Academic' } },
    ],
    
    // --- 1. CONNECT THE COMPONENT LOADER ---
    componentLoader,

    // --- 2. CONFIGURE THE CUSTOM DASHBOARD ---
    dashboard: {
      component: Components.Dashboard, // The React file we created
      
      // The Handler: Fetches data from DB to show on the Dashboard
      handler: async () => {
        const studentsCount = await Student.countDocuments();
        const teachersCount = await Teacher.countDocuments();
        
        // Calculate Fee Stats
        const fees = await Fee.find();
        const totalFeePending = fees.reduce((sum, fee) => sum + (fee.remainingAmount || 0), 0);
        const totalFeeCollected = fees.reduce((sum, fee) => sum + (fee.paidAmount || 0), 0);

        return {
          studentsCount,
          teachersCount,
          totalFeePending,
          totalFeeCollected
        };
      },
    },

    branding: {
      companyName: 'StudentTracker Admin',
      withMadeWithLove: false,
    },
    rootPath: '/admin',
  });

  const adminRouter = AdminJSExpress.buildRouter(admin);
  app.use(admin.options.rootPath, adminRouter);

  console.log(`✅ AdminJS initialized at http://localhost:5000${admin.options.rootPath}`);
};