import { Router } from 'express';

const router = Router();

/** Support resources including dedicated India mental health helplines & global resources */
const SUPPORT_RESOURCES = [
  {
    id: 'in-1',
    region: 'india',
    name: 'Tele-MANAS (Govt of India)',
    phone: '14416 / 1800-891-4416',
    website: 'https://telemanas.mohfw.gov.in',
    emergency: true,
    description: 'Toll-free 24/7 mental health helpline by Ministry of Health & Family Welfare. Multi-language support.',
  },
  {
    id: 'in-2',
    region: 'india',
    name: 'Vandrevala Foundation',
    phone: '+91 9999 666 555',
    website: 'https://www.vandrevalafoundation.com',
    emergency: true,
    description: 'Free, confidential 24/7 crisis intervention and mental health counseling across India in English, Hindi & regional languages.',
  },
  {
    id: 'in-3',
    region: 'india',
    name: 'KIRAN Mental Health Helpline',
    phone: '1800-599-0019',
    website: 'https://disabilityaffairs.gov.in',
    emergency: true,
    description: '24/7 National helpline by Ministry of Social Justice and Empowerment for psychological support and crisis management.',
  },
  {
    id: 'in-4',
    region: 'india',
    name: 'Emergency Services (India)',
    phone: '112',
    website: 'https://112.gov.in',
    emergency: true,
    description: 'All-in-one national emergency number in India for Police, Ambulance, and Fire.',
  },
  {
    id: 'in-5',
    region: 'india',
    name: 'AASRA Crisis Line',
    phone: '+91 9820466726',
    website: 'http://www.aasra.info',
    emergency: false,
    description: '24/7 helpline providing confidential, non-judgmental emotional support for those in distress.',
  },
  {
    id: 'us-1',
    region: 'us',
    name: 'National Suicide Prevention Lifeline (US)',
    phone: '988',
    website: 'https://988lifeline.org',
    emergency: true,
    description: 'Free and confidential emotional support, 24/7 in the United States.',
  },
  {
    id: 'us-2',
    region: 'us',
    name: 'Crisis Text Line',
    phone: 'Text HOME to 741741',
    website: 'https://www.crisistextline.org',
    emergency: false,
    description: 'Free 24/7 text-based crisis support.',
  },
  {
    id: 'global-1',
    region: 'global',
    name: 'International Association for Suicide Prevention (IASP)',
    website: 'https://www.iasp.info/resources/Crisis_Centres/',
    emergency: false,
    description: 'Comprehensive global directory of crisis centers and mental health support services.',
  },
  {
    id: 'global-2',
    region: 'global',
    name: 'Psychology Today Directory',
    website: 'https://www.psychologytoday.com/us/therapists',
    emergency: false,
    description: 'Searchable directory of licensed therapists, counselors, and psychiatrists.',
  },
];

// GET /api/support
router.get('/', (_req, res) => {
  res.json(SUPPORT_RESOURCES);
});

export default router;
