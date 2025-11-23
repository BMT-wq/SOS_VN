import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import '@/App.css';
import { Toaster } from '@/components/ui/sonner';

// User Pages
import HomePage from '@/pages/HomePage';
import SOSFormPage from '@/pages/SOSFormPage';
import TrackRescuePage from '@/pages/TrackRescuePage';
import MapViewPage from '@/pages/MapViewPage';

// Rescue Team Pages
import RescueLoginPage from '@/pages/rescue/RescueLoginPage';
import RescueDashboardPage from '@/pages/rescue/RescueDashboardPage';
import RescueSignalsPage from '@/pages/rescue/RescueSignalsPage';
import RescueSignalDetailPage from '@/pages/rescue/RescueSignalDetailPage';

export default function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* User Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/sos" element={<SOSFormPage />} />
          <Route path="/track/:signalId" element={<TrackRescuePage />} />
          <Route path="/map" element={<MapViewPage />} />
          
          {/* Rescue Team Routes */}
          <Route path="/rescue/login" element={<RescueLoginPage />} />
          <Route path="/rescue/dashboard" element={<RescueDashboardPage />} />
          <Route path="/rescue/signals" element={<RescueSignalsPage />} />
          <Route path="/rescue/signals/:signalId" element={<RescueSignalDetailPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" />
    </>
  );
}