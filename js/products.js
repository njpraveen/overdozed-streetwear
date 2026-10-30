/* ==========================================================================
   OVERDOZED — product catalogue
   Every image comes from the @overdozed__tees Instagram grid (assets/img).
   Prices are placeholders: edit them here and the whole site updates.
   ========================================================================== */
(function () {
  const IMG = (f) => `assets/img/${f}.jpg`;

  // [id, name, line, category, shirt colour, image file, price (INR), isNew]
  const raw = [
    ['parashurama',     'Parashurama',          'Bringer of justice. Axe over shoulder, no apologies.', 'Warriors', 'White', '01-parashurama',          999, true],
    ['maa-kali',        'Maa Kali',             'Fear, fully dressed.',                                  'Shakti',   'Black', '02-maa-kali',             999, true],
    ['hanuman',         'Hanuman',              'Strength that only bows to devotion.',                  'Devas',    'Black', '03-lord-hanuman',         899, true],
    ['radha-krishna',   'Radha Krishna',        'Love, printed loud.',                                   'Krishna',  'White', '04-radha-krishna',        999, true],
    ['shiva-parvati',   'Shiva Parvati',        'Fire and ice. One union.',                              'Shiva',    'White', '05-design',               999, true],
    ['mandala',         'Mandala',              'Find your centre. Wear it on your back.',               'Art',      'Black', '06-design',               899, true],
    ['mahadev-cosmic',  'Mahadev / Cosmic',     'The force that keeps the universe spinning.',           'Shiva',    'Black', '07-mahadev',              899, true],
    ['murugan',         'Murugan',              'Divine warrior of Tamil soil.',                         'Devas',    'Black', '08-murugan',              899, true],
    ['mahadev-cosmic-2','Mahadev / Cosmic II',  'Same storm. Different sky.',                            'Shiva',    'Black', '09-mahadev',              899],
    ['adiyogi',         'Adiyogi',              'The universe, held in one palm.',                       'Shiva',    'Black', '10-adiyogi-shiva',        899],
    ['kali-red',        'Kali / Red Shakti',    'Blood-red, unbothered.',                                'Shakti',   'Black', '11-maa-kali',             899],
    ['mahadev-classic', 'Mahadev / Classic',    'The original. Still undefeated.',                       'Shiva',    'White', '12-mahadev',              899],
    ['maa-durga',       'Maa Durga',            'Ten arms. Zero hesitation.',                            'Shakti',   'Black', '13-maa-durga',            999],
    ['mahadev-serpent', 'Mahadev / Serpent',    'Lord of serpents. Calm before the strike.',             'Shiva',    'Black', '14-mahadev',              899],
    ['vishnu',          'Lord Vishnu',          'The preserver. Holds it all together.',                 'Devas',    'Black', '15-lord-vishnu',          899],
    ['mahadev-trident', 'Mahadev / Trident',    'Three points. One verdict.',                            'Shiva',    'Black', '16-mahadev',              899],
    ['natya',           'Natya',                'Where art becomes divine.',                             'Art',      'Black', '17-indian-classical-dance', 899],
    ['murugan-vel',     'Murugan / Vel',        'Spear raised. Peacock watching.',                       'Devas',    'White', '18-lord-murugan',         899],
    ['mahadev-trident-2','Mahadev / Trident II','The trident, reloaded.',                                'Shiva',    'Black', '19-mahadev',              899],
    ['nritya',          'Nritya',               'Every movement tells a story.',                         'Art',      'Black', '20-nritya',               899],
    ['mahadev-energy',  'Mahadev / Energy',     'The current under everything.',                         'Shiva',    'White', '21-mahadev',              899],
    ['mahadev-infinite','Mahadev / Infinite',   'Power with no ceiling.',                                'Shiva',    'Black', '22-mahadev',              899],
    ['murugan-warrior', 'Murugan / Warrior',    'Warrior energy, peacock blue.',                         'Devas',    'White', '23-lord-murugan',         899],
    ['krishna-timeless','Krishna / Timeless',   'Divine beyond time.',                                   'Krishna',  'Black', '24-krishna',              899],
    ['karna',           'Karna',                'The warrior who never bowed.',                          'Warriors', 'Black', '25-karna',                999],
    ['radha-krishna-bloom','Radha Krishna / Bloom','Blooming in eternal love.',                          'Krishna',  'Black', '26-radha-krishna',        899],
    ['grace',           'Grace',                'Where grace meets divinity.',                           'Art',      'Black', '27-where-grace-meets-divinity', 899],
    ['krishna-strategist','Krishna / Strategist','Mastermind of the Mahabharata.',                       'Krishna',  'Black', '28-krishna',              999],
    ['radha-krishna-eternal','Radha Krishna / Eternal','A love beyond eternity.',                        'Krishna',  'White', '29-radha-krishna',        999],
    ['radha-krishna-eternal-2','Radha Krishna / Eternal II','Same love. Second verse.',                  'Krishna',  'White', '30-radha-krishna',        999],
    ['hanuman-devotion','Hanuman / Devotion',   'The power of devotion.',                                'Devas',    'Black', '31-hanuman',              999],
    ['shiva-shakti',    'Shiva Shakti',         'Two souls. One divine love.',                           'Shiva',    'Black', '32-shiva-shakti',         999],
    ['abhimanyu',       'Abhimanyu',            'Trapped in the Chakravyuh. Fought alone.',              'Warriors', 'Black', '33-abhimanyu',            999],
    ['shiva-tandav',    'Shiva Tandav',         'The dance of destruction.',                             'Shiva',    'White', '34-shiva-tandav',         999],
    ['shiva-silence',   'Shiva / Silence',      'The silence beyond the universe.',                      'Shiva',    'White', '35-shiva',                999],
    ['mahabharata',     'Mahabharata',          'The legend of Krishna, front to back.',                 'Krishna',  'White', '36-mahabharata',          999],
    ['ravana',          'Ravana',               'Ten heads. One legend.',                                'Warriors', 'Black', '37-ten-heads-one-legend', 999],
  ];

  const ALL_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

  window.OD_PRODUCTS = raw.map(([id, name, line, category, color, file, price, isNew], i) => ({
    id, name, line, category, color, price, isNew: !!isNew,
    img: IMG(file),
    // Deterministic "low stock" so the size filter has something to do.
    sizes: ALL_SIZES.filter((_, s) => (i + s) % 7 !== 3),
  }));
  window.OD_SIZES = ALL_SIZES;
  window.OD_CATEGORIES = ['Shiva', 'Krishna', 'Shakti', 'Devas', 'Warriors', 'Art'];
  // Next drop: Sat 14 Nov 2026, 7 PM IST. Change to schedule the countdown.
  window.OD_NEXT_DROP = '2026-11-14T19:00:00+05:30';
  window.OD_INSTAGRAM = 'overdozed__tees';
})();
