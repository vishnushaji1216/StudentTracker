import { ComponentLoader } from 'adminjs';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Recreate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const componentLoader = new ComponentLoader();

const Components = {
  // 2. Use path.join AND explicitly add '.jsx'
  // This removes ambiguity for the bundler
  Dashboard: componentLoader.add('Dashboard', path.join(__dirname, 'dashboard.jsx')),
};

export { componentLoader, Components };