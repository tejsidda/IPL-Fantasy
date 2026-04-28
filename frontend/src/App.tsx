/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Outlet } from 'react-router-dom';
import { Navbar } from './components/Navbar';

export default function App() {
  return (
    <div className="min-h-screen text-gray-900 bg-surface">
      <Navbar />
      <Outlet />
    </div>
  );
}
