// This is a test file to verify TypeScript type resolution
import { Tournament } from './tournament';

// This is just a type assertion test
const testTournament: Tournament = {
  id: 'test',
  name: 'Test Tournament',
  description: 'A test tournament',
  imageUrl: '/test.jpg',
  active: true,
  players: [
    { id: 't1', name: 'Test Player', seed: 1 }
  ]
};

console.log('TypeScript types are working correctly!', testTournament);

export {};
