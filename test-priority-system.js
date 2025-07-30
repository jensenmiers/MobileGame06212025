// Test file for game priority system
// Run with: node test-priority-system.js

// Mock the priority functions since we can't import ES modules directly
const gamePriorityMap = {
  'Street Fighter 6': 1,
  'Tekken 8': 2,
  'Fatal Fury: City of the Wolves': 3,
  'Guilty Gear Strive': 4,
  'Under Night In Birth II': 5,
  'Mortal Kombat 1': 6,
  'THE KING OF FIGHTERS XV': 7,
  'Samurai Shodown': 8,
};

function getGamePriority(tournamentName) {
  if (!tournamentName || typeof tournamentName !== 'string') {
    return 999;
  }
  return gamePriorityMap[tournamentName] ?? 999;
}

// Test data - sample tournaments
const testTournaments = [
  { name: 'Dragon Ball FighterZ', active: true, predictions_open: true },
  { name: 'Samurai Shodown', active: true, predictions_open: true },
  { name: 'Street Fighter 6', active: true, predictions_open: true },
  { name: 'THE KING OF FIGHTERS XV', active: true, predictions_open: true },
  { name: 'Tekken 8', active: true, predictions_open: true },
  { name: 'Fatal Fury: City of the Wolves', active: true, predictions_open: true },
  { name: 'Guilty Gear Strive', active: true, predictions_open: true },
  { name: 'Under Night In Birth II', active: true, predictions_open: true },
  { name: 'Mortal Kombat 1', active: true, predictions_open: true },
];

// Test individual priority function
console.log('=== Testing getGamePriority function ===');
testTournaments.forEach(tournament => {
  const priority = getGamePriority(tournament.name);
  console.log(`${tournament.name}: Priority ${priority}`);
});

console.log('\n=== Testing edge cases ===');
console.log(`null input: Priority ${getGamePriority(null)}`);
console.log(`undefined input: Priority ${getGamePriority(undefined)}`);
console.log(`empty string: Priority ${getGamePriority('')}`);
console.log(`unmapped game: Priority ${getGamePriority('Super Smash Bros')}`);

// Test sorting logic
console.log('\n=== Testing tournament sorting ===');
const sortedTournaments = testTournaments.sort((a, b) => {
  // Simplified sorting logic focusing on priority
  if (a.active !== b.active) {
    return a.active ? -1 : 1;
  }
  
  if (a.active && b.active) {
    const aPriority = getGamePriority(a.name);
    const bPriority = getGamePriority(b.name);
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
  }
  
  return a.name.localeCompare(b.name);
});

console.log('\nExpected order:');
console.log('1. Street Fighter 6');
console.log('2. Tekken 8');
console.log('3. Fatal Fury: City of the Wolves');
console.log('4. Guilty Gear Strive');
console.log('5. Under Night In Birth II');
console.log('6. Mortal Kombat 1');
console.log('7. THE KING OF FIGHTERS XV');
console.log('8. Samurai Shodown');
console.log('9. Dragon Ball FighterZ (fallback priority)');

console.log('\nActual sorted order:');
sortedTournaments.forEach((tournament, index) => {
  const priority = getGamePriority(tournament.name);
  console.log(`${index + 1}. ${tournament.name} (Priority: ${priority})`);
});

// Verify expected order
const expectedOrder = [
  'Street Fighter 6',
  'Tekken 8',
  'Fatal Fury: City of the Wolves',
  'Guilty Gear Strive',
  'Under Night In Birth II',
  'Mortal Kombat 1',
  'THE KING OF FIGHTERS XV',
  'Samurai Shodown',
  'Dragon Ball FighterZ'
];

const actualOrder = sortedTournaments.map(t => t.name);
const isCorrectOrder = JSON.stringify(expectedOrder) === JSON.stringify(actualOrder);

console.log(`\n=== Test Result ===`);
console.log(`Order is correct: ${isCorrectOrder ? '✅ PASS' : '❌ FAIL'}`);

if (!isCorrectOrder) {
  console.log('Expected:', expectedOrder);
  console.log('Actual:', actualOrder);
} 