// Bottom navigation definitions for each role (used by the BottomNav component)

export const householdNavItems = (navigation, unread = 0) => [
  { key: 'home', label: 'হোম', icon: 'home', onPress: () => navigation.navigate('HouseholdHome') },
  { key: 'messages', label: 'বার্তা', icon: 'chatbubbles', badge: unread, onPress: () => navigation.navigate('Messages') },
  { key: 'history', label: 'ইতিহাস', icon: 'time', onPress: () => navigation.navigate('History') },
  { key: 'profile', label: 'প্রোফাইল', icon: 'person', onPress: () => navigation.navigate('Profile') },
];

export const collectorNavItems = (navigation, unread = 0) => [
  { key: 'home', label: 'হোম', icon: 'home', onPress: () => navigation.navigate('CollectorHome') },
  { key: 'messages', label: 'বার্তা', icon: 'chatbubbles', badge: unread, onPress: () => navigation.navigate('Messages') },
  { key: 'earnings', label: 'আয়', icon: 'wallet', onPress: () => navigation.navigate('Earnings') },
  { key: 'profile', label: 'প্রোফাইল', icon: 'person', onPress: () => navigation.navigate('Profile') },
];

export const navItemsForRole = (role, navigation, unread) =>
  role === 'collector' ? collectorNavItems(navigation, unread) : householdNavItems(navigation, unread);
