import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(
  uid: string,
  email: string,
  fullName: string = '',
  role: string = 'student',
  contactNumber: string = ''
) {
  try {
    const existing = await db.select().from(users).where(eq(users.id, uid));
    if (existing.length > 0) {
      return existing[0];
    }

    const result = await db
      .insert(users)
      .values({
        id: uid,
        email,
        fullName: fullName || email.split('@')[0] || 'Student',
        role: role || 'student',
        contactNumber,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email,
          ...(fullName ? { fullName } : {}),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed in getOrCreateUser:', error);
    throw new Error('Database operation failed. Please try again.', { cause: error });
  }
}

export async function getUserById(uid: string) {
  try {
    const result = await db.select().from(users).where(eq(users.id, uid));
    return result[0] || null;
  } catch (error) {
    console.error('Database query failed in getUserById:', error);
    throw new Error('Failed to fetch user.', { cause: error });
  }
}

export async function updateUserProfile(
  uid: string,
  data: { fullName?: string; contactNumber?: string; role?: string }
) {
  try {
    const result = await db
      .update(users)
      .set(data)
      .where(eq(users.id, uid))
      .returning();
    return result[0] || null;
  } catch (error) {
    console.error('Database query failed in updateUserProfile:', error);
    throw new Error('Failed to update profile.', { cause: error });
  }
}
