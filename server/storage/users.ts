// دوال إدارة المستخدمين (users) لنظام التخزين المؤقت
export function getUserMem(usersMap: Map<number, any>, id: number) {
  return usersMap.get(id);
}

export function getUserByUsernameMem(usersMap: Map<number, any>, username: string) {
  return Array.from(usersMap.values()).find(user => user.username === username);
}

export function createUserMem(usersMap: Map<number, any>, idRef: { value: number }, insertUser: any) {
  const id = idRef.value++;
  const user = {
    id,
    username: insertUser.username,
    password: insertUser.password,
    name: insertUser.name || null,
    email: insertUser.email || null,
    phone: insertUser.phone || null,
    avatarUrl: insertUser.avatarUrl || null,
    freeCards: 5,
    paidCards: 0,
    gamesPlayed: 0,
    lastPlayedAt: null,
    stars: 0,
    level: "مبتدئ",
    levelBadge: "🌟",
    levelColor: "#A9A9A9",
    createdAt: new Date(),
    updatedAt: new Date()
  };
  usersMap.set(id, user);
  return user;
}

export function updateUserMem(usersMap: Map<number, any>, id: number, userData: any) {
  const user = usersMap.get(id);
  if (!user) {
    return undefined;
  }
  const updatedUser = {
    ...user,
    ...userData,
    updatedAt: new Date()
  };
  usersMap.set(id, updatedUser);
  return updatedUser;
}
