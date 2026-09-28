import { EVENT_STATUS as E, REGISTRATION_STATUS as R } from '../utils/constants';
export function seedData() {
  const future = (days, hour = 10) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  };
  const user = { id: 'u1', name: 'Alex Morgan', email: 'admin@eventhub.demo', role: 'ADMIN' };
  const specs = [
    [
      'Design Forward 2026',
      'A day of fresh perspectives, thoughtful design and conversations with creative minds.',
      'The Glasshouse, Casablanca',
      5,
      80,
      E.PUBLISHED,
    ],
    [
      'The Creative Meetup',
      'Meet the people shaping our local creative community. Share ideas, stories and a good cup of coffee.',
      'Studio 14, Rabat',
      9,
      40,
      E.PUBLISHED,
    ],
    [
      'Build with React',
      'An interactive workshop for curious developers. Build, learn and connect with the React community.',
      'Innovation Hub, Casablanca',
      14,
      60,
      E.PUBLISHED,
    ],
    [
      'Founders & Friends',
      'An evening of honest conversations about building something that matters.',
      'Le Rooftop, Marrakech',
      18,
      35,
      E.PUBLISHED,
    ],
    [
      'Product Thinking Lab',
      'Explore a practical approach to discovering and solving meaningful product problems.',
      'Online · Google Meet',
      23,
      50,
      E.DRAFT,
    ],
    [
      'Community Open House',
      'Discover our community and the people behind it.',
      'Central House, Rabat',
      30,
      100,
      E.DRAFT,
    ],
  ];
  const events = specs.map(([title, description, location, days, maxParticipants, status], i) => ({
    id: `e${i + 1}`,
    title,
    description,
    location,
    eventDate: future(days),
    maxParticipants,
    status,
    createdBy: user,
    createdAt: new Date().toISOString(),
  }));
  const names = [
    'Sofia Bennani',
    'Adam El Amrani',
    'Lina Martin',
    'Omar Idrissi',
    'Emma Laurent',
    'Youssef Alami',
    'Nora Dupont',
    'Amine Berrada',
    'Sarah Wilson',
    'Mehdi Tazi',
    'Jade Moreau',
    'Rayan Mansouri',
  ];
  const participants = names.map((fullName, i) => ({
    id: `p${i + 1}`,
    fullName,
    email: fullName.toLowerCase().replaceAll(' ', '.') + '@example.com',
    phone: `+212 6 12 34 56 ${String(i + 10)}`,
    createdAt: new Date().toISOString(),
  }));
  const registrations = [];
  [11, 8, 7, 5].forEach((count, i) => {
    for (let j = 0; j < count; j++)
      registrations.push({
        id: `r${registrations.length + 1}`,
        eventId: `e${i + 1}`,
        participantId: `p${j + 1}`,
        status: j % 4 === 0 ? R.PENDING : R.CONFIRMED,
        createdAt: new Date().toISOString(),
      });
  });
  return { user, events, participants, registrations };
}
