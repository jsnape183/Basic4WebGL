import React from 'react';
import LandingNav from '../components/Landing/LandingNav';
import LandingHero from '../components/Landing/LandingHero';
import LandingWhatYouCanMake from '../components/Landing/LandingWhatYouCanMake';
import LandingCta from '../components/Landing/LandingCta';
import LandingFooter from '../components/Landing/LandingFooter';

const LandingPage: React.FC = () => (
  <div style={{ background: '#0a0818', minHeight: '100vh', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
    <LandingNav />
    <LandingHero />
    <LandingWhatYouCanMake />
    <LandingCta />
    <LandingFooter />
  </div>
);

export default LandingPage;
